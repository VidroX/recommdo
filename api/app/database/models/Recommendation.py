from abc import ABC

from odmantic import Model, Reference

from app.database.models.Project import Project


class Recommendation(Model, ABC):
    user_id: int
    project: Project = Reference()
    item_id: int
    score: float
    user_item_weight: int

    class Config:
        collection = "recommendations"
