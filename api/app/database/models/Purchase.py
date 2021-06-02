from abc import ABC
from typing import Optional

from odmantic import Model, Reference

from app.database.models.Project import Project


class PurchaseHistory(Model, ABC):
    user_id: int
    project: Project = Reference()
    purchase_id: int
    start_at: str
    end_at: str

    class Config:
        collection = "detailed_purchases"


class Purchase(Model, ABC):
    user_id: int
    weight: Optional[int] = 1
    project: Project = Reference()
    purchase_id: int

    class Config:
        collection = "weighted_purchases"
