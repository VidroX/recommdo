import asyncio

from motor.motor_asyncio import AsyncIOMotorClient
from odmantic import AIOEngine

from app import settings
from app.database.database import db
from app.database.models.AccessLevel import AccessLevel
from app.database.models.User import User
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
    db.engine = engine
    db.database = engine.database
    # level = AccessLevel(level=2, is_staff=True, name="Admin", description="Admin access level")
    # level = await db.engine.find_one(AccessLevel, AccessLevel.level == 2)
    # user = User(first_name="Super", last_name="User 2", middle_name="Admin", password="123321", access_level=level)
    # await db.engine.save(level)
    # await db.engine.save(user)
    logger.info("Initial setup completed successfully!")


async def connection_end():
    logger.info("Closing connection...")
    db.engine.client.close()
    db.engine = None
    db.database = None
    logger.info("Connection closed successfully!")
