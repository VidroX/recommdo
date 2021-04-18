import graphene

from app.api.models.FileLocationModel import FileLocationModel


class ProjectModel(graphene.ObjectType):
    id = graphene.ID(required=True)
    name = graphene.String(required=True)
    analyzed = graphene.Boolean(required=True, default_value=True)
    files = graphene.List(FileLocationModel, required=False)
