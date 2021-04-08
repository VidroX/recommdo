from typing import List, Optional
from bson import ObjectId
from abc import ABC
from odmantic import Model


class Project(Model, ABC):
    name: str
    files: Optional[List[ObjectId]] = []

    class Config:
        collection = "projects"
