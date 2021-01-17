from motor.motor_asyncio import AsyncIOMotorClient
from odmantic import AIOEngine

from app import settings
from app.database.database import db
from app.logger import logger


async def connect_to_database():
    logger.info("Connecting to database...")
    client = AsyncIOMotorClient(
        host=settings.DATABASE_HOST,
        port=int(settings.DATABASE_PORT),
        username=settings.DATABASE_USERNAME,
        password=settings.DATABASE_PASSWORD,
        maxPoolSize=10,
        minPoolSize=10
    )
    engine = AIOEngine(motor_client=client, database=settings.DATABASE_NAME)
    db.engine = engine
    db.database = engine.database
    logger.info("Successfully connected to the database!")


async def close_database_connection():
    logger.info("Closing database connection...")
    db.engine.client.close()
    db.engine = None
    db.database = None
    logger.info("Successfully closed database connection!")
