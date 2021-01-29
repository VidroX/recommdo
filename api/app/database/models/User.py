from abc import ABC

from odmantic import Model, Reference

from app.database.models.AccessLevel import AccessLevel


class User(Model, ABC):
    first_name: str
    last_name: str
    middle_name: str
    password: str
    access_level: AccessLevel = Reference()

    class Config:
        collection = "users"
