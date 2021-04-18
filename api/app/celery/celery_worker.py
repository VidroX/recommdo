import asyncio

import numpy as np
from motor.motor_asyncio import AsyncIOMotorClient
from odmantic import AIOEngine
from bson.json_util import loads

from app import settings
from app.celery.celery_app import celery_app
from app.database.models.Project import Project
from app.database.models.Purchase import Purchase


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
    for (index, unq) in enumerate(dataset[0]):
        purchases.append(
            Purchase(
                user_id=unq[0],
                purchase_id=unq[1],
                weight=dataset[1][index],
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
        await engine.save(project_template)
    print('Import DataSet Task Ended')


@celery_app.task
def import_purchases(project, dataset, change_analysis_bool=False):
    asyncio.run(import_purchases_async(project, dataset, change_analysis_bool))
