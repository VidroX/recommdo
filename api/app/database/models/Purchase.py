from abc import ABC
from typing import Optional

from odmantic import Model, Reference

from app.database.models.Project import Project


class Purchase(Model, ABC):
    user_id: int
    purchase_id: int
    weight: Optional[int] = 1
    project: Project = Reference()

    class Config:
        collection = "purchases"
