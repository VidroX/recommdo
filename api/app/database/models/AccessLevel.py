from abc import ABC

from odmantic import Model


class AccessLevel(Model, ABC):
    level: int
    is_staff: bool
    name: str
    description: str

    class Config:
        collection = "access_levels"
