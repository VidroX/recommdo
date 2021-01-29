import graphene

from graphene.relay import Node

from app.api.decorators.AuthDecorators import gql_jwt_optional, gql_jwt_required
from app.api.models.UserModel import UserModel
from app.database.database import db
from app.database.models.User import User
from app.logger import logger


class ApiQuery(graphene.ObjectType):
    node = Node.Field()
    users = graphene.List(UserModel)

    @staticmethod
    @gql_jwt_required
    async def resolve_users(self, info, **kwargs):
        jwt = kwargs['jwt']
        return await db.engine.find(User)


class ApiMutation(graphene.ObjectType):
    pass


schema = graphene.Schema(query=ApiQuery, types=[UserModel])
# schema = graphene.Schema(query=ApiQuery, mutation=ApiMutation, types=[UserModel])
