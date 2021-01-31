from argon2 import PasswordHasher
from motor.motor_asyncio import AsyncIOMotorClient
from odmantic import AIOEngine

from app import settings
from app.database.database import db
from app.database.models.AccessLevel import AccessLevel
from app.database.models.User import User
from app.logger import logger


async def create_default_user(create_level=False):
    logger.info("Creating default user...")
    ph = PasswordHasher()
    level = AccessLevel(level=2, is_staff=True, name="Admin", description="Admin access level")
    user = User(
        first_name="Super",
        last_name="User",
        middle_name="Admin",
        password=ph.hash("123321"),
        access_level=level
    )
    if create_level:
        await db.engine.save(level)
    await db.engine.save(user)
    logger.info("Default user has been created successfully!")


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
    # await create_default_user(True)
    logger.info("Initial setup completed successfully!")


async def connection_end():
    logger.info("Closing connection...")
    db.engine.client.close()
    db.engine = None
    db.database = None
    logger.info("Connection closed successfully!")
