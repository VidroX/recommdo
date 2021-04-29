import graphene

from app.api.models.FileLocationModel import FileLocationModel
from app.api.models.UserModel import UserModel


class ProjectModel(graphene.ObjectType):
    id = graphene.ID(required=True)
    name = graphene.String(required=True)
    analyzed = graphene.Boolean(required=True, default_value=False)
    imported = graphene.Boolean(required=True, default_value=False)
    files = graphene.List(FileLocationModel, required=True)
    allowed_users = graphene.List(UserModel, required=True)
