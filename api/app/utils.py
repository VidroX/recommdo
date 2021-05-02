from motor.motor_asyncio import AsyncIOMotorClient
from odmantic import AIOEngine

from app import settings
from app.api.utils.AuthUtils import create_admin_user, AccessLevelExists, create_default_access_levels
from app.database.database import db
from app.database.models.Purchase import Purchase
from app.logger import logger


async def preflight_setup():
    logger.info("Initial setup...")
    client = AsyncIOMotorClient(
        host=settings.DATABASE_HOST,
        port=int(settings.DATABASE_PORT),
        username=settings.DATABASE_USERNAME,
        password=settings.DATABASE_PASSWORD,
        maxPoolSize=10,
        minPoolSize=10
    )
    engine = AIOEngine(motor_client=client, database=settings.DATABASE_NAME)
    db.raw_engine = client[settings.DATABASE_NAME]
    db.engine = engine
    db.database = engine.database
    try:
        await create_default_access_levels()
    except AccessLevelExists:
        logger.info('Default access levels exist, continuing...')
    '''
    await create_admin_user(
        email="testadmin1@example.com",
        first_name="Super",
        last_name="Admin",
        middle_name="User 1",
        password="123321",
    )
    '''
    logger.info("Initial setup completed successfully!")


async def connection_end():
    logger.info("Closing connection...")
    db.engine.client.close()
    db.engine = None
    db.database = None
    logger.info("Connection closed successfully!")
