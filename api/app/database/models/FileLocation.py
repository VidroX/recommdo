from abc import ABC

from odmantic import Model


class FileLocation(Model, ABC):
    name: str
    location: str

    class Config:
        collection = "file_locations"
