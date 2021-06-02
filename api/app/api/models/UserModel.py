import graphene

from app.api.models.AccessLevelModel import AccessLevelModel


class UserModel(graphene.ObjectType):
    id = graphene.ID(required=True)
    email = graphene.String(required=True)
    first_name = graphene.String(required=True)
    last_name = graphene.String(required=True)
    middle_name = graphene.String(required=False, default_value="")
    access_level = graphene.Field(AccessLevelModel, required=True)
    deleted = graphene.Boolean(required=True, default_value=False)
