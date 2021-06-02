from abc import ABC
from typing import Optional

from odmantic import Model, Reference

from app.database.models.Project import Project


class Metadata(Model, ABC):
    meta_id: int
    name: Optional[str]
    project: Project = Reference()

    class Config:
        collection = "metadata"
