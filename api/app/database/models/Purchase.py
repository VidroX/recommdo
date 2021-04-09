from abc import ABC
from typing import Optional

from odmantic import Model, Reference

from app.database.models.Metadata import Metadata
from app.database.models.Project import Project


class Purchase(Model, ABC):
    user_id: int
    purchase_id: int
    metadata: Optional[Metadata] = Reference()
    project: Project = Reference()

    class Config:
        collection = "purchases"
