import math

import graphene

from graphene import relay
from graphql import GraphQLError
from odmantic import ObjectId, query

from app.api.decorators.AuthDecorators import gql_full_jwt_required
from app.api.models.FileLocationModel import FileLocationModel
from app.api.models.MetadataModel import MetadataModel
from app.api.models.ProjectModel import ProjectModel
from app.api.models.PurchaseModel import PurchaseModel, PurchaseHistoryModel
from app.api.models.PurchasesPaginationModel import PurchasesPaginationModel
from app.api.models.RecommendationModel import RecommendationModel
from app.api.models.UserModel import UserModel
from app.api.mutations.ProjectMutations import CreateProject, GetUserRecommendations
from app.api.mutations.UserMutations import Login, Register, Refresh
from app.api.status_codes import STATUS_CODE
from app.database.database import db
from app.database.models.Metadata import Metadata
from app.database.models.Project import Project
from app.database.models.Purchase import Purchase
from app.database.models.User import User


async def query_with_arguments(model, query_params=None, claims=None, **kwargs):
    is_admin = claims['access_level']['is_staff'] if claims is not None else False
    find_first = kwargs.get('find_first', False)
    admin_skip_query = kwargs.get('admin_skip_query', True)

    if is_admin:
        if admin_skip_query or query_params is None:
            return await db.engine.find(model) if not find_first else \
                await db.engine.find_one(model)
        else:
            return await db.engine.find(model, query_params) if not find_first else\
                await db.engine.find_one(model, query_params)
    else:
        if query_params is None:
            raise GraphQLError(STATUS_CODE[52], extensions={'code': 52})

        return await db.engine.find(model, query_params) if not find_first else\
            await db.engine.find_one(model, query_params)


class ApiQuery(graphene.ObjectType):
    node = relay.Node.Field()
    users = graphene.List(UserModel)
    user = graphene.Field(UserModel)
    projects = graphene.List(ProjectModel)
    project = graphene.Field(ProjectModel, project_id=graphene.String(required=True))
    project_purchases = graphene.Field(
        PurchasesPaginationModel,
        project_id=graphene.String(required=True),
        page=graphene.Int(required=False, default_value=1),
        search=graphene.Float(required=False),
        order_by=graphene.String(required=False)
    )
    user_purchases = graphene.List(
        PurchaseModel,
        project_id=graphene.String(required=True),
        user_id=graphene.Int(required=True)
    )

    @staticmethod
    @gql_full_jwt_required
    async def resolve_users(self, info, **kwargs):
        claims = kwargs['jwt_claims']

        return await query_with_arguments(User, User.id == ObjectId(claims['user_id']), claims)

    @staticmethod
    @gql_full_jwt_required
    async def resolve_user(self, info, **kwargs):
        claims = kwargs['jwt_claims']

        return await query_with_arguments(User, User.id == ObjectId(claims['user_id']), claims, find_first=True)

    @staticmethod
    @gql_full_jwt_required
    async def resolve_projects(self, info, **kwargs):
        claims = kwargs['jwt_claims']
        is_admin = claims['access_level']['is_staff'] if claims is not None else False

        allowed_projects = []
        projects = await db.engine.find(Project)

        for project in projects:
            if (ObjectId(claims['user_id']) in project.allowed_users) or is_admin:
                new_project = ProjectModel(
                    id=project.id,
                    name=project.name,
                    analyzed=project.analyzed,
                    imported=project.imported,
                    files=project.files,
                    allowed_users=await db.engine.find(User, User.id.in_(project.allowed_users))
                )
                allowed_projects.append(new_project)

        return allowed_projects

    @staticmethod
    @gql_full_jwt_required
    async def resolve_project(self, info, **kwargs):
        claims = kwargs['jwt_claims']
        is_admin = claims['access_level']['is_staff'] if claims is not None else False
        project_id = kwargs.get('project_id', None)

        if project_id is None:
            raise GraphQLError(STATUS_CODE[50], extensions={'code': 50})

        project = await db.engine.find_one(Project, Project.id == ObjectId(project_id))

        if project is None:
            raise GraphQLError(STATUS_CODE[201], extensions={'code': 201})

        if ObjectId(claims['user_id']) not in project.allowed_users and not is_admin:
            raise GraphQLError(STATUS_CODE[51], extensions={'code': 51})

        new_project = ProjectModel(
            id=project.id,
            name=project.name,
            analyzed=project.analyzed,
            imported=project.imported,
            files=project.files,
            allowed_users=await db.engine.find(User, User.id.in_(project.allowed_users))
        )

        return new_project

    @staticmethod
    @gql_full_jwt_required
    async def resolve_project_purchases(self, info, **kwargs):
        claims = kwargs['jwt_claims']
        is_admin = claims['access_level']['is_staff'] if claims is not None else False
        project_id = kwargs.get('project_id', None)
        page = kwargs.get('page', 1)
        search = kwargs.get('search', None)
        order_by = kwargs.get('order_by', '-userId')

        sort_direction = 'DESC' if order_by[0] == '-' else 'ASC'
        sort_by = order_by if sort_direction == 'ASC' else order_by[1:]

        if page >= 1:
            page = page - 1

        if project_id is None:
            raise GraphQLError(STATUS_CODE[50], extensions={'code': 50})

        if not ObjectId.is_valid(project_id):
            raise GraphQLError(STATUS_CODE[53], extensions={'code': 53})

        project = await db.engine.find_one(Project, Project.id == ObjectId(project_id))

        if project is None:
            raise GraphQLError(STATUS_CODE[201], extensions={'code': 201})

        if not is_admin and not (ObjectId(claims['user_id']) in project.allowed_users):
            raise GraphQLError(STATUS_CODE[51], extensions={'code': 51})

        if search is not None:
            if isinstance(search, int) or isinstance(search, float):
                total_entries = await db.engine.count(
                    Purchase,
                    (Purchase.project == project.id) &
                    ((Purchase.purchase_id == search) | (Purchase.user_id == search))
                )
            else:
                total_entries = 0
        else:
            total_entries = await db.engine.count(Purchase, Purchase.project == project.id)

        max_page = math.ceil(total_entries / 10)
        shown_entries = total_entries - (total_entries - (page + 1) * 10)

        if ((page + 1) > max_page or page < 0) and search is None:
            raise GraphQLError(STATUS_CODE[54], extensions={'code': 54})

        sort_param = query.desc(Purchase.user_id)

        if sort_by == 'userId':
            if sort_direction == 'ASC':
                sort_param = query.asc(Purchase.user_id)
            else:
                sort_param = query.desc(Purchase.user_id)
        elif sort_by == 'purchaseId':
            if sort_direction == 'ASC':
                sort_param = query.asc(Purchase.purchase_id)
            else:
                sort_param = query.desc(Purchase.purchase_id)
        elif sort_by == 'weight':
            if sort_direction == 'ASC':
                sort_param = query.asc(Purchase.weight)
            else:
                sort_param = query.desc(Purchase.weight)

        if search is not None:
            if isinstance(search, int) or isinstance(search, float):
                purchases = await db.engine.find(
                    Purchase,
                    (Purchase.project == project.id) &
                    ((Purchase.purchase_id == search) | (Purchase.user_id == search)),
                    skip=page * 10,
                    limit=10,
                    sort=sort_param
                )
            else:
                purchases = []
        else:
            purchases = await db.engine.find(
                Purchase,
                Purchase.project == project.id,
                skip=page * 10,
                limit=10,
                sort=sort_param
            )

        purchases_with_users = []

        for purchase in purchases:
            project = purchase.project

            if project is None:
                raise GraphQLError(STATUS_CODE[203], extensions={'code': 203})

            project_with_users = ProjectModel(
                id=project.id,
                name=project.name,
                analyzed=project.analyzed,
                imported=project.imported,
                files=project.files,
                allowed_users=await db.engine.find(User, User.id.in_(project.allowed_users))
            )
            new_purchase = PurchaseModel(
                id=purchase.id,
                user_id=purchase.user_id,
                metadata=await db.engine.find_one(Metadata, Metadata.meta_id == purchase.purchase_id),
                weight=purchase.weight,
                project=project_with_users,
            )

            purchases_with_users.append(new_purchase)

        return PurchasesPaginationModel(
            purchases=purchases_with_users,
            current_page=page + 1,
            page_amount=max_page,
            total_entries=total_entries,
            shown_entries=shown_entries
        )

    @staticmethod
    @gql_full_jwt_required
    async def resolve_user_purchases(self, info, **kwargs):
        claims = kwargs['jwt_claims']
        is_admin = claims['access_level']['is_staff'] if claims is not None else False
        project_id = kwargs.get('project_id', None)
        user_id = kwargs.get('user_id', None)

        if project_id is None or user_id is None:
            raise GraphQLError(STATUS_CODE[50], extensions={'code': 50})

        if not ObjectId.is_valid(project_id):
            raise GraphQLError(STATUS_CODE[53], extensions={'code': 53})

        project = await db.engine.find_one(Project, Project.id == ObjectId(project_id))

        if project is None:
            raise GraphQLError(STATUS_CODE[201], extensions={'code': 201})

        if not is_admin and not (ObjectId(claims['user_id']) in project.allowed_users):
            raise GraphQLError(STATUS_CODE[51], extensions={'code': 51})

        purchases = await db.engine.find(Purchase, (Purchase.project == project.id) & (Purchase.user_id == user_id))

        if len(purchases) < 1:
            raise GraphQLError(STATUS_CODE[204], extensions={'code': 204})

        purchases_with_users = []

        for purchase in purchases:
            project = purchase.project

            if project is None:
                raise GraphQLError(STATUS_CODE[203], extensions={'code': 203})

            project_with_users = ProjectModel(
                id=project.id,
                name=project.name,
                analyzed=project.analyzed,
                imported=project.imported,
                files=project.files,
                allowed_users=await db.engine.find(User, User.id.in_(project.allowed_users))
            )
            new_purchase = PurchaseModel(
                id=purchase.id,
                user_id=purchase.user_id,
                metadata=await db.engine.find_one(Metadata, Metadata.meta_id == purchase.purchase_id),
                weight=purchase.weight,
                project=project_with_users,
            )

            purchases_with_users.append(new_purchase)

        return purchases_with_users


class ApiMutation(graphene.ObjectType):
    login = Login.Field()
    register = Register.Field()
    refresh = Refresh.Field()
    create_project = CreateProject.Field()
    user_recommendations = GetUserRecommendations.Field()


schema = graphene.Schema(query=ApiQuery, mutation=ApiMutation, types=[
    UserModel,
    FileLocationModel,
    MetadataModel,
    PurchaseModel,
    ProjectModel,
    PurchaseHistoryModel,
    RecommendationModel,
])
