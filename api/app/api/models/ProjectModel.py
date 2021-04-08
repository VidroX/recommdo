import graphene

from app.api.models.FileLocationModel import FileLocationModel


class ProjectModel(graphene.ObjectType):
    id = graphene.ID(required=True)
    name = graphene.String(required=True)
    files = graphene.List(FileLocationModel, required=False)
