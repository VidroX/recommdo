from typing import List, Optional
from bson import ObjectId
from abc import ABC
from odmantic import Model

from app.database.models.FileLocation import FileLocation


class Project(Model, ABC):
    name: str
    analyzed: bool = True
    files: Optional[List[FileLocation]] = []

    class Config:
        collection = "projects"
