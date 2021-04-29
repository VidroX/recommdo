import asyncio
import os

import implicit
import numpy as np
import pandas as pd

from graphql import GraphQLError
from motor.motor_asyncio import AsyncIOMotorClient
from odmantic import AIOEngine
from bson.json_util import loads
from scipy import sparse

from app import settings
from app.api.status_codes import STATUS_CODE
from app.celery.celery_app import celery_app
from app.database.models.Metadata import Metadata
from app.database.models.Project import Project
from app.database.models.Purchase import Purchase, PurchaseHistory

def filter_file(files, file_type="metadata"):
    def iterator_func(x):
        if file_type == x.file_type:
            return True
        return False
    return filter(iterator_func, files)


async def import_purchases_async(project, dataset, change_analysis_bool=False):
    print('Import DataSet Task Started')
    client = AsyncIOMotorClient(
        host=settings.DATABASE_HOST,
        port=int(settings.DATABASE_PORT),
        username=settings.DATABASE_USERNAME,
        password=settings.DATABASE_PASSWORD,
        maxPoolSize=10,
        minPoolSize=10,
        io_loop=asyncio.get_event_loop()
    )
    engine = AIOEngine(motor_client=client, database=settings.DATABASE_NAME)

    project_template = Project.parse_doc(loads(project))

    purchases = []
    for (index, unq) in enumerate(dataset[0][0]):
        purchases.append(
            Purchase(
                user_id=int(unq[0]),
                purchase_id=unq[1],
                weight=int(dataset[0][1][index]),
                project=project_template
            )
        )

    detailed_purchases = []
    for history in dataset[1]:
        detailed_purchases.append(
            PurchaseHistory(
                user_id=history[0],
                purchase_id=history[1],
                project=project_template,
                start_at=history[2],
                end_at=history[3]
            )
        )

    if len(purchases) >= 8:
        split_dataset = np.array_split(np.array(purchases), 8)
    elif len(purchases) >= 2:
        split_dataset = np.array_split(np.array(purchases), 2)
    else:
        split_dataset = np.array_split(np.array(purchases), 1)

    if len(detailed_purchases) >= 8:
        split_dataset_detailed = np.array_split(np.array(detailed_purchases), 8)
    elif len(detailed_purchases) >= 2:
        split_dataset_detailed = np.array_split(np.array(detailed_purchases), 2)
    else:
        split_dataset_detailed = np.array_split(np.array(detailed_purchases), 1)

    gather_list = []
    for data in split_dataset:
        gather_list.append(engine.save_all(data.tolist()))
    await asyncio.gather(*gather_list)

    gather_list_detailed = []
    for data in split_dataset_detailed:
        gather_list_detailed.append(engine.save_all(data.tolist()))
    await asyncio.gather(*gather_list_detailed)

    if change_analysis_bool:
        project_template.imported = True
        await engine.save(project_template)
    print('Import DataSet Task Ended')


def set_normalized_weight(x) -> float:
    normalized_weight = 1

    if x > 1:
        normalized_weight = 2
    if x >= 5:
        normalized_weight = 3
    if x >= 10:
        normalized_weight = 4
    if x >= 20:
        normalized_weight = 5

    return normalized_weight


def get_category_id_by_user_id(df, pm, user_id) -> int:
    return df.loc[df[pm['subscriptions_user_id_header']] == user_id][pm['subscriptions_user_id_header'] + '_code'].iloc[0]


def convert_recommendations_to_real_ids(df, pm, recommendations):
    real_recommendations = []

    field_name = pm['subscriptions_meta_id_header'] + '_code'

    for recommendation in recommendations:
        real_recommendations.append([
            df.loc[
                df[field_name] == recommendation[0]
            ][pm['subscriptions_meta_id_header']].iloc[0],
            recommendation[1]
        ])

    return real_recommendations


def convert_sim_users_to_real_ids(df, pm, sim_users):
    real_users = []

    field_name = pm['subscriptions_user_id_header'] + '_code'

    for user in sim_users:
        real_users.append([
            df.loc[
                df[field_name] == user[0]
            ][pm['subscriptions_user_id_header']].iloc[0],
            user[1]
        ])

    return real_users


async def analyze_purchases_async(project, project_metadata_info, change_analysis_bool=True):
    client = AsyncIOMotorClient(
        host=settings.DATABASE_HOST,
        port=int(settings.DATABASE_PORT),
        username=settings.DATABASE_USERNAME,
        password=settings.DATABASE_PASSWORD,
        maxPoolSize=10,
        minPoolSize=10,
        io_loop=asyncio.get_event_loop()
    )
    engine = AIOEngine(motor_client=client, database=settings.DATABASE_NAME)

    project_template = Project.parse_doc(loads(project))

    try:
        metadata_file_info = list(filter_file(project_template.files, "metadata"))[0]
        subscriptions_file_info = list(filter_file(project_template.files, "subscriptions"))[0]
    except IndexError:
        metadata_file_info = None
        subscriptions_file_info = None

    if metadata_file_info is None:
        raise GraphQLError(STATUS_CODE[205], extensions={'code': 205})
    elif subscriptions_file_info is None:
        raise GraphQLError(STATUS_CODE[206], extensions={'code': 206})

    metadata_file = pd.read_csv(metadata_file_info.location).rename(
        columns={'id': project_metadata_info['subscriptions_meta_id_header']}
    )
    subscriptions_file = pd.read_csv(subscriptions_file_info.location)

    no_duplicates = subscriptions_file.pivot_table(
        index=[
            project_metadata_info['subscriptions_user_id_header'],
            project_metadata_info['subscriptions_meta_id_header']
        ],
        aggfunc='size'
    ).reset_index().rename(columns={0: 'weight'})

    no_duplicates_with_names = pd.merge(
        no_duplicates[[
            project_metadata_info['subscriptions_user_id_header'],
            project_metadata_info['subscriptions_meta_id_header'],
            'weight'
        ]],
        metadata_file[[
            project_metadata_info['subscriptions_meta_id_header'],
            project_metadata_info['meta_name_header']
        ]],
        how='inner',
        on=project_metadata_info['subscriptions_meta_id_header']
    )

    no_duplicates_with_names['normalized_weight'] = \
        no_duplicates_with_names['weight'].apply(lambda x: set_normalized_weight(x))

    os.environ['MKL_NUM_THREADS'] = '1'
    os.environ['OPENBLAS_NUM_THREADS'] = '1'

    no_duplicates_with_names[project_metadata_info['subscriptions_user_id_header'] + '_code'] = no_duplicates_with_names[project_metadata_info['subscriptions_user_id_header']].astype("category").cat.codes
    no_duplicates_with_names[project_metadata_info['subscriptions_meta_id_header'] + '_code'] = no_duplicates_with_names[project_metadata_info['subscriptions_meta_id_header']].astype("category").cat.codes

    sparse_item_user = sparse.csr_matrix((
        no_duplicates_with_names['weight'].astype(float),
        (
            no_duplicates_with_names[project_metadata_info['subscriptions_meta_id_header'] + '_code'],
            no_duplicates_with_names[project_metadata_info['subscriptions_user_id_header'] + '_code']
        )
    ))
    sparse_user_item = sparse.csr_matrix((
        no_duplicates_with_names['weight'].astype(float),
        (
            no_duplicates_with_names[project_metadata_info['subscriptions_user_id_header'] + '_code'],
            no_duplicates_with_names[project_metadata_info['subscriptions_meta_id_header'] + '_code']
        )
    ))

    model = implicit.als.AlternatingLeastSquares(factors=20, regularization=0.1, iterations=20)

    alpha_val = 40
    data_conf = (sparse_item_user * alpha_val).astype('double')

    model.fit(data_conf)

    user_id = get_category_id_by_user_id(no_duplicates_with_names, project_metadata_info, 111)
    recommended = model.recommend(user_id, sparse_user_item, filter_already_liked_items=False)
    sim_users = model.similar_users(user_id)
    print(convert_sim_users_to_real_ids(no_duplicates_with_names, project_metadata_info, sim_users))
    print(convert_recommendations_to_real_ids(no_duplicates_with_names, project_metadata_info, recommended))

    # if change_analysis_bool:
    #     project_template.analyzed = True
    #     await engine.save(project_template)


@celery_app.task
def import_purchases(project, dataset, change_analysis_bool=True):
    asyncio.run(import_purchases_async(project, dataset, change_analysis_bool))


@celery_app.task
def analyze_purchases(project, project_metadata_info, change_analysis_bool=True):
    asyncio.run(analyze_purchases_async(project, project_metadata_info, change_analysis_bool))
