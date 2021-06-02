from abc import ABC
from typing import Optional

from odmantic import Model, Reference

from app.database.models.AccessLevel import AccessLevel


class User(Model, ABC):
    first_name: str
    last_name: str
    middle_name: Optional[str] = ""
    email: str
    password: str
    deleted: bool = False
    access_level: AccessLevel = Reference()

    class Config:
        collection = "users"
