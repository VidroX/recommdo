from passlib.hash import argon2

from app.database.database import db
from app.database.models.AccessLevel import AccessLevel
from app.database.models.User import User


class InvalidAccessLevel(Exception):
    pass


class AccessLevelExists(Exception):
    pass


DEFAULT_NORMAL_ACCESS_LEVEL = AccessLevel(
    level=1,
    is_staff=False,
    name="User",
    description="User access level"
)

DEFAULT_ADMIN_ACCESS_LEVEL = AccessLevel(
    level=2,
    is_staff=True,
    name="Admin",
    description="Admin access level"
)


async def create_access_level(
        access_level: AccessLevel = DEFAULT_NORMAL_ACCESS_LEVEL,
        check_existence=True,
) -> AccessLevel:
    if access_level is None or access_level.level < 0 or access_level.name is None or\
            access_level.description is None or access_level.is_staff is None:
        raise InvalidAccessLevel()

    if check_existence:
        exists = await db.engine.find_one(
            AccessLevel,
            AccessLevel.level == access_level.level and
            AccessLevel.is_staff == access_level.is_staff or
            AccessLevel.name == access_level.name
        )

        if exists:
            raise AccessLevelExists()

    return await db.engine.save(access_level)


async def create_default_access_levels() -> {}:
    normal_level = await db.engine.find_one(
        AccessLevel,
        AccessLevel.level == DEFAULT_NORMAL_ACCESS_LEVEL.level and
        AccessLevel.is_staff == DEFAULT_NORMAL_ACCESS_LEVEL.is_staff or
        AccessLevel.name == DEFAULT_NORMAL_ACCESS_LEVEL.name
    )

    admin_level = await db.engine.find_one(
        AccessLevel,
        AccessLevel.level == DEFAULT_ADMIN_ACCESS_LEVEL.level and
        AccessLevel.is_staff == DEFAULT_ADMIN_ACCESS_LEVEL.is_staff or
        AccessLevel.name == DEFAULT_ADMIN_ACCESS_LEVEL.name
    )

    if normal_level is not None and admin_level is not None:
        raise AccessLevelExists()

    access_levels = {
        "normal": normal_level if normal_level is not None else await create_access_level(
            access_level=DEFAULT_NORMAL_ACCESS_LEVEL,
            check_existence=False
        ),
        "admin": admin_level if admin_level is not None else await create_access_level(
            access_level=DEFAULT_ADMIN_ACCESS_LEVEL,
            check_existence=False
        )
    }

    return access_levels


async def create_user(
        email,
        first_name,
        last_name,
        password,
        middle_name=None,
        access_level: AccessLevel = DEFAULT_NORMAL_ACCESS_LEVEL,
) -> User:
    level = await db.engine.find_one(
        AccessLevel,
        AccessLevel.level == access_level.level and AccessLevel.is_staff == access_level.is_staff
    )
    if level is None:
        level = await create_access_level(access_level=access_level, check_existence=False)

    user = User(
        email=email,
        first_name=first_name,
        last_name=last_name,
        middle_name=middle_name,
        password=argon2.using(rounds=4).hash(password),
        access_level=level
    )

    created_user = await db.engine.save(user)
    return created_user


async def create_admin_user(email, first_name, last_name, password, middle_name=None) -> User:
    level = DEFAULT_ADMIN_ACCESS_LEVEL
    return await create_user(
        email=email,
        first_name=first_name,
        last_name=last_name,
        middle_name=middle_name,
        password=password,
        access_level=level,
    )


async def create_normal_user(email, first_name, last_name, password, middle_name=None) -> User:
    level = DEFAULT_NORMAL_ACCESS_LEVEL
    return await create_user(
        email=email,
        first_name=first_name,
        last_name=last_name,
        middle_name=middle_name,
        password=password,
        access_level=level,
    )
