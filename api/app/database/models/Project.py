from typing import List
from abc import ABC
from odmantic import Model, ObjectId

from app.database.models.FileLocation import FileLocation


class Project(Model, ABC):
    name: str
    imported: bool = False
    analyzed: bool = False
    files: List[FileLocation]
    allowed_users: List[ObjectId] = []

    class Config:
        collection = "projects"
