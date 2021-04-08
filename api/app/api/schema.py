import graphene

from graphene.relay import Node
from odmantic import ObjectId

from app.api.decorators.AuthDecorators import gql_full_jwt_required
from app.api.models.FileLocationModel import FileLocationModel
from app.api.models.MetadataModel import MetadataModel
from app.api.models.ProjectModel import ProjectModel
from app.api.models.PurchaseModel import PurchaseModel
from app.api.models.UserModel import UserModel
from app.api.mutations.RecommendationMutations import CreateProject
from app.api.mutations.UserMutations import Login, Register, Refresh
from app.database.database import db
from app.database.models.User import User


class ApiQuery(graphene.ObjectType):
    node = Node.Field()
    users = graphene.List(UserModel)
    user = graphene.Field(UserModel)

    @staticmethod
    @gql_full_jwt_required
    async def resolve_users(self, info, **kwargs):
        claims = kwargs['jwt_claims']

        return await db.engine.find(User) if claims['access_level']['is_staff'] else\
            await db.engine.find_one(User, User.id == ObjectId(claims['user_id']))

    @staticmethod
    @gql_full_jwt_required
    async def resolve_user(self, info, **kwargs):
        claims = kwargs['jwt_claims']

        return await db.engine.find_one(User, User.id == ObjectId(claims['user_id']))


class ApiMutation(graphene.ObjectType):
    login = Login.Field()
    register = Register.Field()
    refresh = Refresh.Field()
    create_project = CreateProject.Field()


schema = graphene.Schema(query=ApiQuery, mutation=ApiMutation, types=[
    UserModel,
    FileLocationModel,
    MetadataModel,
    PurchaseModel,
    ProjectModel,
])
