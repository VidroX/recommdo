from abc import ABC
from typing import Optional

from odmantic import Model


class Metadata(Model, ABC):
    meta_id: int
    name: Optional[str]

    class Config:
        collection = "metadata"
