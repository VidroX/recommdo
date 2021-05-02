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
from app.database.models.Project import Project
from app.database.models.Purchase import Purchase
from app.database.models.Recommendation import Recommendation


def filter_file(files, file_type="metadata"):
    def iterator_func(x):
        if file_type == x.file_type:
            return True
        return False
    return filter(iterator_func, files)


def get_engine():
    client = AsyncIOMotorClient(
        host=settings.DATABASE_HOST,
        port=int(settings.DATABASE_PORT),
        username=settings.DATABASE_USERNAME,
        password=settings.DATABASE_PASSWORD,
        maxPoolSize=10,
        minPoolSize=10,
        io_loop=asyncio.get_event_loop()
    )

    return AIOEngine(motor_client=client, database=settings.DATABASE_NAME)


async def import_and_analyze_purchases_async(
        project,
        dataset,
        project_metadata,
        change_import_bool=True,
        change_analysis_bool=True
):
    print('Import DataSet Task Started')
    engine = get_engine()

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

    if len(purchases) >= 8:
        split_dataset = np.array_split(np.array(purchases), 8)
    elif len(purchases) >= 2:
        split_dataset = np.array_split(np.array(purchases), 2)
    else:
        split_dataset = np.array_split(np.array(purchases), 1)

    gather_list = []
    for data in split_dataset:
        gather_list.append(engine.save_all(data.tolist()))
    await asyncio.gather(*gather_list)

    if change_analysis_bool:
        project_template.analyzed = True
    if change_import_bool:
        project_template.imported = True
    if change_import_bool or change_analysis_bool:
        await engine.save(project_template)

    print('Import DataSet Task Ended')

    await analyze_purchases_async(project, project_metadata, engine, change_import_bool, change_analysis_bool)


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


def get_user_item_weight(score: float) -> int:
    user_item_weight = 1

    if score >= 0.019:
        user_item_weight = 2
    if score >= 0.07:
        user_item_weight = 3
    if score >= 0.49:
        user_item_weight = 4
    if score >= 1:
        user_item_weight = 5

    return user_item_weight


async def get_all_recommendations(project, model, user_items, user_indexes, item_indexes, sparse_user_items, pm):
    users_frame = user_items[pm['subscriptions_user_id_header'] + '_code'].drop_duplicates().reset_index()
    users = users_frame[pm['subscriptions_user_id_header'] + '_code'].to_numpy()

    all_recommendations = []
    for user in users:
        recommendations = model.recommend(user, sparse_user_items, filter_already_liked_items=False, N=10)
        for recommendation in recommendations:
            real_user = user_indexes[user].item()
            real_item = item_indexes[recommendation[0]].item()
            score = recommendation[1]
            all_recommendations.append(
                Recommendation(
                    user_id=real_user,
                    project=project,
                    item_id=real_item,
                    score=score,
                    user_item_weight=get_user_item_weight(score)
                )
            )

    return all_recommendations


async def analyze_purchases_async(
        project,
        project_metadata_info,
        db_engine=None,
        change_import_bool=True,
        change_analysis_bool=True
):
    print('DataSet Analysis Task Started')
    if db_engine is None:
        engine = get_engine()
    else:
        engine = db_engine

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

    subscriptions_file = pd.read_csv(subscriptions_file_info.location)

    no_duplicates = subscriptions_file.pivot_table(
        index=[
            project_metadata_info['subscriptions_user_id_header'],
            project_metadata_info['subscriptions_meta_id_header']
        ],
        aggfunc='size'
    ).reset_index().rename(columns={0: 'weight'})

    no_duplicates['normalized_weight'] = \
        no_duplicates['weight'].apply(lambda x: set_normalized_weight(x))

    os.environ['MKL_NUM_THREADS'] = '1'
    os.environ['OPENBLAS_NUM_THREADS'] = '1'

    no_duplicates[project_metadata_info['subscriptions_user_id_header'] + '_code'], users_mapping_index =\
        pd.Series(no_duplicates[project_metadata_info['subscriptions_user_id_header']]).factorize()
    no_duplicates[project_metadata_info['subscriptions_meta_id_header'] + '_code'], items_mapping_index = \
        pd.Series(no_duplicates[project_metadata_info['subscriptions_meta_id_header']]).factorize()

    sparse_item_user = sparse.csr_matrix(
        (
            no_duplicates['normalized_weight'].astype(float),
            (
                no_duplicates[project_metadata_info['subscriptions_meta_id_header'] + '_code'],
                no_duplicates[project_metadata_info['subscriptions_user_id_header'] + '_code'],
            ),
        )
    )
    sparse_user_item = sparse_item_user.T.tocsr()

    model = implicit.als.AlternatingLeastSquares(
        factors=140,
        regularization=0.1,
        iterations=40,
        calculate_training_loss=False
    )

    alpha_val = 40
    data_conf = (sparse_item_user * alpha_val).astype('double')

    model.fit(data_conf, show_progress=False)

    recommendations = await get_all_recommendations(
        project_template,
        model,
        no_duplicates,
        users_mapping_index,
        items_mapping_index,
        sparse_user_item,
        project_metadata_info
    )

    if len(recommendations) >= 8:
        split_dataset = np.array_split(np.array(recommendations), 8)
    elif len(recommendations) >= 2:
        split_dataset = np.array_split(np.array(recommendations), 2)
    else:
        split_dataset = np.array_split(np.array(recommendations), 1)

    gather_list = []
    for data in split_dataset:
        gather_list.append(engine.save_all(data.tolist()))
    await asyncio.gather(*gather_list)

    if change_analysis_bool:
        project_template.analyzed = True
    if change_import_bool:
        project_template.imported = True
    if change_import_bool or change_analysis_bool:
        await engine.save(project_template)
    print('DataSet Analysis Task Ended')


@celery_app.task(acks_late=True, max_retries=3, retry=True)
def import_and_analyze_purchases(
        project,
        dataset,
        project_metadata,
        change_import_bool=True,
        change_analysis_bool=True
):
    asyncio.run(
        import_and_analyze_purchases_async(
            project,
            dataset,
            project_metadata,
            change_import_bool,
            change_analysis_bool
        ))


@celery_app.task(acks_late=True, max_retries=3, task_reject_on_worker_lost=True, retry=True)
def analyze_purchases(project, project_metadata_info, change_analysis_bool=True):
    asyncio.run(analyze_purchases_async(project, project_metadata_info, None, False, change_analysis_bool))
