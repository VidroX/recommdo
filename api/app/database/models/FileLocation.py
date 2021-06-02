from abc import ABC

from odmantic import Model


class FileLocation(Model, ABC):
    name: str
    location: str
    file_type: str

    class Config:
        collection = "file_locations"
