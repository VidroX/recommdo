import graphene

from graphene.relay import Node

from app.api.decorators.AuthDecorators import gql_jwt_required
from app.api.models.UserModel import UserModel
from app.api.mutations.UserMutations import Login, Register, Refresh
from app.database.database import db
from app.database.models.User import User


class ApiQuery(graphene.ObjectType):
    node = Node.Field()
    users = graphene.List(UserModel)

    @staticmethod
    @gql_jwt_required
    async def resolve_users(self, info, **kwargs):
        return await db.engine.find(User)


class ApiMutation(graphene.ObjectType):
    login = Login.Field()
    register = Register.Field()
    refresh = Refresh.Field()


schema = graphene.Schema(query=ApiQuery, mutation=ApiMutation, types=[UserModel])
