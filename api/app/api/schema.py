import math

import graphene

from graphene import relay
from graphql import GraphQLError
from odmantic import ObjectId, query

from app.api.decorators.AuthDecorators import gql_full_jwt_required, access_level_required
from app.api.models.AccessLevelModel import AccessLevelModel
from app.api.models.FileLocationModel import FileLocationModel
from app.api.models.MetadataModel import MetadataModel
from app.api.models.ProjectModel import ProjectModel
from app.api.models.ProjectStatisticsModel import ProjectStatisticsModel, ProjectInnerStatisticModel
from app.api.models.PurchaseModel import PurchaseModel
from app.api.models.PurchasesPaginationModel import PurchasesPaginationModel
from app.api.models.RecommendationModel import RecommendationModel
from app.api.models.RecommendationsPaginationModel import RecommendationsPaginationModel
from app.api.models.UserModel import UserModel
from app.api.mutations.ProjectMutations import CreateProject, ReAnalyze, UpdateProjectAllowedUsers, DeleteProject, \
    UpdateProjectName
from app.api.mutations.UserMutations import Login, Register, Refresh, RemoveUser
from app.api.status_codes import STATUS_CODE
from app.api.utils.AuthUtils import DEFAULT_ADMIN_ACCESS_LEVEL
from app.database.database import db
from app.database.models.AccessLevel import AccessLevel
from app.database.models.Metadata import Metadata
from app.database.models.Project import Project
from app.database.models.Purchase import Purchase
from app.database.models.Recommendation import Recommendation
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
    users = graphene.List(UserModel, skip_admins=graphene.Boolean(required=False, default_value=False))
    user = graphene.Field(UserModel, user_id=graphene.ID(required=False, default_value=None))
    user_recommendations = graphene.List(
        RecommendationModel,
        project_id=graphene.String(required=True),
        user_id=graphene.Int(required=True)
    )
    projects = graphene.List(ProjectModel)
    project = graphene.Field(ProjectModel, project_id=graphene.String(required=True))
    project_purchases = graphene.Field(
        PurchasesPaginationModel,
        project_id=graphene.String(required=True),
        page=graphene.Int(required=False, default_value=1),
        search=graphene.Float(required=False),
        order_by=graphene.String(required=False)
    )
    project_recommendations = graphene.Field(
        RecommendationsPaginationModel,
        project_id=graphene.String(required=True),
        item_id=graphene.String(required=True, default_value='all'),
        stars=graphene.Int(required=False, default_value=None),
        page=graphene.Int(required=False, default_value=1),
        search=graphene.Float(required=False),
        order_by=graphene.String(required=False)
    )
    user_purchases = graphene.List(
        PurchaseModel,
        project_id=graphene.String(required=True),
        user_id=graphene.Int(required=True)
    )
    project_statistics = graphene.Field(
        ProjectStatisticsModel,
        project_id=graphene.String(required=True),
        item_id=graphene.Int(required=False, default_value=None),
    )
    all_metadata = graphene.List(MetadataModel, project_id=graphene.String(required=True))
    access_levels = graphene.List(AccessLevelModel)

    @staticmethod
    @gql_full_jwt_required
    async def resolve_users(self, info, **kwargs):
        claims = kwargs['jwt_claims']
        is_admin = claims['access_level']['is_staff'] if claims is not None else False
        skip_admins = kwargs.get('skip_admins', False)

        if skip_admins and is_admin:
            users = []

            all_users = await db.engine.find(User, User.id != ObjectId(claims['user_id']))
            for user in all_users:
                if not user.access_level.is_staff and not user.deleted:
                    users.append(user)

            return users

        return await db.engine.find(User, ((User.id != ObjectId(claims['user_id'])) & (User.deleted == False))) if is_admin \
            else await db.engine.find(User, ((User.id == ObjectId(claims['user_id'])) & (User.deleted == False)))

    @staticmethod
    @gql_full_jwt_required
    async def resolve_user(self, info, **kwargs):
        claims = kwargs['jwt_claims']
        is_admin = claims['access_level']['is_staff'] if claims is not None else False
        requested_user_id = kwargs.get('user_id', None)

        if requested_user_id is not None and not ObjectId.is_valid(requested_user_id):
            raise GraphQLError(STATUS_CODE[53], extensions={'code': 53})

        if requested_user_id is not None and (is_admin or claims['user_id'] == requested_user_id):
            requested_user = await db.engine.find_one(
                User,
                ((User.id == ObjectId(requested_user_id)) & (User.deleted == False))
            )

            if requested_user is None:
                raise GraphQLError(STATUS_CODE[107], extensions={'code': 107})

            return requested_user
        elif requested_user_id is not None and not is_admin:
            raise GraphQLError(STATUS_CODE[51], extensions={'code': 51})

        return await db.engine.find_one(User, ((User.id == ObjectId(claims['user_id'])) & (User.deleted == False)))

    @staticmethod
    @gql_full_jwt_required
    async def resolve_projects(self, info, **kwargs):
        claims = kwargs['jwt_claims']
        is_admin = claims['access_level']['is_staff'] if claims is not None else False

        allowed_projects = []
        projects = await db.engine.find(Project)

        user = await db.engine.find_one(User, User.id == ObjectId(claims['user_id']))

        if user is None or user.deleted:
            raise GraphQLError(STATUS_CODE[107], extensions={'code': 107})

        for project in projects:
            if (ObjectId(claims['user_id']) in project.allowed_users) or is_admin and not project.deleted:
                allowed_users = await db.engine.find(User, User.id.in_(project.allowed_users))
                real_allowed_users = []

                for db_user in allowed_users:
                    if db_user is not None and not db_user.deleted:
                        real_allowed_users.append(db_user)

                new_project = ProjectModel(
                    id=project.id,
                    name=project.name,
                    analyzed=project.analyzed,
                    imported=project.imported,
                    deleted=project.deleted,
                    files=project.files,
                    allowed_users=real_allowed_users
                )
                allowed_projects.append(new_project)

        return allowed_projects

    @staticmethod
    @gql_full_jwt_required
    async def resolve_project(self, info, **kwargs):
        claims = kwargs['jwt_claims']
        is_admin = claims['access_level']['is_staff'] if claims is not None else False
        project_id = kwargs.get('project_id', None)

        user = await db.engine.find_one(User, User.id == ObjectId(claims['user_id']))

        if user is None or user.deleted:
            raise GraphQLError(STATUS_CODE[107], extensions={'code': 107})

        if project_id is None:
            raise GraphQLError(STATUS_CODE[50], extensions={'code': 50})

        project = await db.engine.find_one(Project, Project.id == ObjectId(project_id))

        if project is None or project.deleted:
            raise GraphQLError(STATUS_CODE[201], extensions={'code': 201})

        if ObjectId(claims['user_id']) not in project.allowed_users and not is_admin:
            raise GraphQLError(STATUS_CODE[51], extensions={'code': 51})

        allowed_users = await db.engine.find(User, User.id.in_(project.allowed_users))
        real_allowed_users = []

        for db_user in allowed_users:
            if db_user is not None and not db_user.deleted:
                real_allowed_users.append(db_user)

        new_project = ProjectModel(
            id=project.id,
            name=project.name,
            analyzed=project.analyzed,
            imported=project.imported,
            deleted=project.deleted,
            files=project.files,
            allowed_users=real_allowed_users
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

        user = await db.engine.find_one(User, User.id == ObjectId(claims['user_id']))

        if user is None or user.deleted:
            raise GraphQLError(STATUS_CODE[107], extensions={'code': 107})

        project = await db.engine.find_one(Project, Project.id == ObjectId(project_id))

        if project is None or project.deleted:
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

            if project is None or project.deleted:
                raise GraphQLError(STATUS_CODE[203], extensions={'code': 203})

            allowed_users = await db.engine.find(User, User.id.in_(project.allowed_users))
            real_allowed_users = []

            for db_user in allowed_users:
                if db_user is not None and not db_user.deleted:
                    real_allowed_users.append(db_user)

            project_with_users = ProjectModel(
                id=project.id,
                name=project.name,
                analyzed=project.analyzed,
                imported=project.imported,
                deleted=project.deleted,
                files=project.files,
                allowed_users=real_allowed_users
            )
            new_purchase = PurchaseModel(
                id=purchase.id,
                user_id=purchase.user_id,
                metadata=await db.engine.find_one(
                    Metadata,
                    (
                            (Metadata.project == project_with_users.id) &
                            (Metadata.meta_id == purchase.purchase_id)
                    )
                ),
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
    async def resolve_project_recommendations(self, info, **kwargs):
        claims = kwargs['jwt_claims']
        is_admin = claims['access_level']['is_staff'] if claims is not None else False
        project_id = kwargs.get('project_id', None)
        page = kwargs.get('page', 1)
        search = kwargs.get('search', None)
        order_by = kwargs.get('order_by', '-userId')
        item_id = kwargs.get('item_id', 'all')
        stars = kwargs.get('stars', None)

        sort_direction = 'DESC' if order_by[0] == '-' else 'ASC'
        sort_by = order_by if sort_direction == 'ASC' else order_by[1:]

        if page >= 1:
            page = page - 1

        if project_id is None:
            raise GraphQLError(STATUS_CODE[50], extensions={'code': 50})

        if not ObjectId.is_valid(project_id):
            raise GraphQLError(STATUS_CODE[53], extensions={'code': 53})

        if item_id is None or (item_id != 'all' and not ObjectId.is_valid(item_id)):
            raise GraphQLError(STATUS_CODE[209], extensions={'code': 209})

        project = await db.engine.find_one(Project, Project.id == ObjectId(project_id))

        item = None
        if item_id is not None and item_id != 'all':
            item = await db.engine.find_one(Metadata, Metadata.id == ObjectId(item_id))

        if project is None or project.deleted:
            raise GraphQLError(STATUS_CODE[201], extensions={'code': 201})

        user = await db.engine.find_one(User, User.id == ObjectId(claims['user_id']))

        if user is None or user.deleted:
            raise GraphQLError(STATUS_CODE[107], extensions={'code': 107})

        if item_id != 'all' and item is None:
            raise GraphQLError(STATUS_CODE[207], extensions={'code': 207})

        if stars is not None and (stars < 1 or stars > 5):
            raise GraphQLError(STATUS_CODE[210], extensions={'code': 210})

        if not is_admin and not (ObjectId(claims['user_id']) in project.allowed_users):
            raise GraphQLError(STATUS_CODE[51], extensions={'code': 51})

        if search is not None:
            if isinstance(search, int) or isinstance(search, float):
                if item_id == 'all':
                    if stars is not None:
                        total_entries = await db.engine.count(
                            Recommendation,
                            (Recommendation.project == project.id) &
                            (Recommendation.user_item_weight == stars) &
                            (
                                    (Recommendation.user_id == search) |
                                    (Recommendation.user_item_weight == search) |
                                    (Recommendation.item_id == search)
                            ),
                        )
                    else:
                        total_entries = await db.engine.count(
                            Recommendation,
                            (Recommendation.project == project.id) &
                            (
                                    (Recommendation.user_id == search) |
                                    (Recommendation.user_item_weight == search) |
                                    (Recommendation.item_id == search)
                            ),
                        )
                else:
                    if stars is not None:
                        total_entries = await db.engine.count(
                            Recommendation,
                            (Recommendation.project == project.id) &
                            (Recommendation.user_item_weight == stars) &
                            (Recommendation.item_id == item.meta_id) &
                            (
                                    (Recommendation.user_id == search) |
                                    (Recommendation.user_item_weight == search)
                            ),
                        )
                    else:
                        total_entries = await db.engine.count(
                            Recommendation,
                            (Recommendation.project == project.id) &
                            (Recommendation.item_id == item.meta_id) &
                            (
                                    (Recommendation.user_id == search) |
                                    (Recommendation.user_item_weight == search)
                            ),
                        )
            else:
                total_entries = 0
        else:
            if item_id != 'all':
                if stars is not None:
                    total_entries = await db.engine.count(
                        Recommendation,
                        (Recommendation.project == project.id) &
                        (Recommendation.user_item_weight == stars) &
                        (Recommendation.item_id == item.meta_id)
                    )
                else:
                    total_entries = await db.engine.count(
                        Recommendation,
                        (Recommendation.project == project.id) &
                        (Recommendation.item_id == item.meta_id)
                    )
            else:
                if stars is not None:
                    total_entries = await db.engine.count(
                        Recommendation,
                        (Recommendation.project == project.id) &
                        (Recommendation.user_item_weight == stars)
                    )
                else:
                    total_entries = await db.engine.count(
                        Recommendation,
                        (Recommendation.project == project.id)
                    )

        max_page = math.ceil(total_entries / 10)
        shown_entries = total_entries - (total_entries - (page + 1) * 10)

        if ((page + 1) > max_page or page < 0) and search is None:
            raise GraphQLError(STATUS_CODE[54], extensions={'code': 54})

        sort_param = query.desc(Recommendation.user_id)

        if sort_by == 'userId':
            if sort_direction == 'ASC':
                sort_param = query.asc(Recommendation.user_id)
            else:
                sort_param = query.desc(Recommendation.user_id)
        elif sort_by == 'userItemWeight':
            if sort_direction == 'ASC':
                sort_param = query.asc(Recommendation.user_item_weight)
            else:
                sort_param = query.desc(Recommendation.user_item_weight)
        elif sort_by == 'score':
            if sort_direction == 'ASC':
                sort_param = query.asc(Recommendation.score)
            else:
                sort_param = query.desc(Recommendation.score)
        elif sort_by == 'itemId':
            if sort_direction == 'ASC':
                sort_param = query.asc(Recommendation.item_id)
            else:
                sort_param = query.desc(Recommendation.item_id)

        if search is not None:
            if isinstance(search, int) or isinstance(search, float):
                if item_id == 'all':
                    if stars is not None:
                        recommendations = await db.engine.find(
                            Recommendation,
                            (Purchase.project == project.id) &
                            (Recommendation.user_item_weight == stars) &
                            (
                                    (Recommendation.user_id == search) |
                                    (Recommendation.user_item_weight == search)
                            ),
                            skip=page * 10,
                            limit=10,
                            sort=sort_param
                        )
                    else:
                        recommendations = await db.engine.find(
                            Recommendation,
                            (Purchase.project == project.id) &
                            (
                                    (Recommendation.user_id == search) |
                                    (Recommendation.user_item_weight == search)
                            ),
                            skip=page * 10,
                            limit=10,
                            sort=sort_param
                        )
                else:
                    if stars is not None:
                        recommendations = await db.engine.find(
                            Recommendation,
                            (Recommendation.project == project.id) &
                            (Recommendation.user_item_weight == stars) &
                            (Recommendation.item_id == item.meta_id) &
                            (
                                    (Recommendation.user_id == search) |
                                    (Recommendation.user_item_weight == search) |
                                    (Recommendation.item_id == search)
                            ),
                            skip=page * 10,
                            limit=10,
                            sort=sort_param
                        )
                    else:
                        recommendations = await db.engine.find(
                            Recommendation,
                            (Recommendation.project == project.id) &
                            (Recommendation.item_id == item.meta_id) &
                            (
                                    (Recommendation.user_id == search) |
                                    (Recommendation.user_item_weight == search) |
                                    (Recommendation.item_id == search)
                            ),
                            skip=page * 10,
                            limit=10,
                            sort=sort_param
                        )
            else:
                recommendations = []
        else:
            if item_id == 'all':
                if stars is not None:
                    recommendations = await db.engine.find(
                        Recommendation,
                        (
                                (Recommendation.project == project.id) &
                                (Recommendation.user_item_weight == stars)
                        ),
                        skip=page * 10,
                        limit=10,
                        sort=sort_param
                    )
                else:
                    recommendations = await db.engine.find(
                        Recommendation,
                        (Recommendation.project == project.id),
                        skip=page * 10,
                        limit=10,
                        sort=sort_param
                    )
            else:
                if stars is not None:
                    recommendations = await db.engine.find(
                        Recommendation,
                        (Recommendation.project == project.id) &
                        (Recommendation.user_item_weight == stars) &
                        (Recommendation.item_id == item.meta_id),
                        skip=page * 10,
                        limit=10,
                        sort=sort_param
                    )
                else:
                    recommendations = await db.engine.find(
                        Recommendation,
                        (Recommendation.project == project.id) &
                        (Recommendation.item_id == item.meta_id),
                        skip=page * 10,
                        limit=10,
                        sort=sort_param
                    )

        recommendations_with_users = []

        for recommendation in recommendations:
            project = recommendation.project

            if project is None or project.deleted:
                raise GraphQLError(STATUS_CODE[203], extensions={'code': 203})

            allowed_users = await db.engine.find(User, User.id.in_(project.allowed_users))
            real_allowed_users = []

            for db_user in allowed_users:
                if db_user is not None and not db_user.deleted:
                    real_allowed_users.append(db_user)

            project_with_users = ProjectModel(
                id=project.id,
                name=project.name,
                analyzed=project.analyzed,
                imported=project.imported,
                deleted=project.deleted,
                files=project.files,
                allowed_users=real_allowed_users
            )
            new_recommendation = RecommendationModel(
                id=recommendation.id,
                user_id=recommendation.user_id,
                metadata=await db.engine.find_one(
                    Metadata,
                    (
                            (Metadata.project == project_with_users.id) &
                            (Metadata.meta_id == recommendation.item_id)
                    )
                ),
                user_item_weight=recommendation.user_item_weight,
                score=recommendation.score,
                project=project_with_users,
            )

            recommendations_with_users.append(new_recommendation)

        return RecommendationsPaginationModel(
            recommendations=recommendations_with_users,
            current_page=page + 1,
            page_amount=max_page,
            total_entries=total_entries,
            shown_entries=shown_entries
        )

    @staticmethod
    @gql_full_jwt_required
    async def resolve_user_recommendations(self, info, **kwargs):
        claims = kwargs['jwt_claims']
        is_admin = claims['access_level']['is_staff'] if claims is not None else False
        project_id = kwargs.get('project_id', None)
        user_id = kwargs.get('user_id', None)

        if user_id is None or project_id is None:
            raise GraphQLError(STATUS_CODE[50], extensions={'code': 50})

        if not ObjectId.is_valid(project_id):
            raise GraphQLError(STATUS_CODE[53], extensions={'code': 53})

        project = await db.engine.find_one(Project, Project.id == ObjectId(project_id))

        if project is None or project.deleted:
            raise GraphQLError(STATUS_CODE[201], extensions={'code': 201})

        user = await db.engine.find_one(User, User.id == ObjectId(claims['user_id']))

        if user is None or user.deleted:
            raise GraphQLError(STATUS_CODE[107], extensions={'code': 107})

        request_user_id = claims['user_id'] if claims is not None else None

        if request_user_id is None:
            raise GraphQLError(STATUS_CODE[51], extensions={'code': 51})

        if not is_admin and not (ObjectId(request_user_id) in project.allowed_users):
            raise GraphQLError(STATUS_CODE[51], extensions={'code': 51})

        recommendations = []
        db_recommendations = await db.engine.find(
            Recommendation,
            Recommendation.user_id == user_id,
            sort=query.desc(Recommendation.score)
        )

        for recommendation in db_recommendations:
            allowed_users = await db.engine.find(User, User.id.in_(recommendation.project.allowed_users))
            real_allowed_users = []

            for db_user in allowed_users:
                if db_user is not None and not db_user.deleted:
                    real_allowed_users.append(db_user)

            project_with_allowed_users = ProjectModel(
                id=recommendation.project.id,
                name=recommendation.project.name,
                analyzed=recommendation.project.analyzed,
                imported=recommendation.project.imported,
                deleted=recommendation.project.deleted,
                files=recommendation.project.files,
                allowed_users=real_allowed_users
            )

            recommendations.append(
                RecommendationModel(
                    id=recommendation.id,
                    metadata=await db.engine.find_one(
                        Metadata,
                        (
                            (Metadata.project == project_with_allowed_users.id) &
                            (Metadata.meta_id == recommendation.item_id)
                        )
                    ),
                    user_id=recommendation.user_id,
                    score=recommendation.score,
                    user_item_weight=recommendation.user_item_weight,
                    project=project_with_allowed_users
                )
            )

        return recommendations

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

        if project is None or project.deleted:
            raise GraphQLError(STATUS_CODE[201], extensions={'code': 201})

        user = await db.engine.find_one(User, User.id == ObjectId(claims['user_id']))

        if user is None or user.deleted:
            raise GraphQLError(STATUS_CODE[107], extensions={'code': 107})

        if not is_admin and not (ObjectId(claims['user_id']) in project.allowed_users):
            raise GraphQLError(STATUS_CODE[51], extensions={'code': 51})

        purchases = await db.engine.find(Purchase, (Purchase.project == project.id) & (Purchase.user_id == user_id))

        if len(purchases) < 1:
            raise GraphQLError(STATUS_CODE[204], extensions={'code': 204})

        purchases_with_users = []

        for purchase in purchases:
            project = purchase.project

            if project is None or project.deleted:
                raise GraphQLError(STATUS_CODE[203], extensions={'code': 203})

            allowed_users = await db.engine.find(User, User.id.in_(project.allowed_users))
            real_allowed_users = []

            for db_user in allowed_users:
                if db_user is not None and not db_user.deleted:
                    real_allowed_users.append(db_user)

            project_with_users = ProjectModel(
                id=project.id,
                name=project.name,
                analyzed=project.analyzed,
                imported=project.imported,
                deleted=project.deleted,
                files=project.files,
                allowed_users=real_allowed_users
            )
            new_purchase = PurchaseModel(
                id=purchase.id,
                user_id=purchase.user_id,
                metadata=await db.engine.find_one(
                    Metadata,
                    (
                        (Metadata.project == project_with_users.id) &
                        (Metadata.meta_id == purchase.purchase_id)
                    )
                ),
                weight=purchase.weight,
                project=project_with_users,
            )

            purchases_with_users.append(new_purchase)

        return purchases_with_users

    @staticmethod
    @gql_full_jwt_required
    async def resolve_project_statistics(self, info, **kwargs):
        claims = kwargs['jwt_claims']
        is_admin = claims['access_level']['is_staff'] if claims is not None else False
        project_id = kwargs.get('project_id', None)
        item_id = kwargs.get('item_id', None)

        if project_id is None:
            raise GraphQLError(STATUS_CODE[50], extensions={'code': 50})

        if not ObjectId.is_valid(project_id):
            raise GraphQLError(STATUS_CODE[53], extensions={'code': 53})

        project = await db.engine.find_one(Project, Project.id == ObjectId(project_id))

        item = None
        if item_id is not None:
            item = await db.engine.find_one(
                Metadata,
                (
                    (Metadata.project == ObjectId(project_id)) &
                    (Metadata.meta_id == item_id)
                )
            )

        if project is None or project.deleted:
            raise GraphQLError(STATUS_CODE[201], extensions={'code': 201})

        user = await db.engine.find_one(User, User.id == ObjectId(claims['user_id']))

        if user is None or user.deleted:
            raise GraphQLError(STATUS_CODE[107], extensions={'code': 107})

        if item_id is not None and item is None:
            raise GraphQLError(STATUS_CODE[207], extensions={'code': 207})

        if not is_admin and not (ObjectId(claims['user_id']) in project.allowed_users):
            raise GraphQLError(STATUS_CODE[51], extensions={'code': 51})

        allowed_users = await db.engine.find(User, User.id.in_(project.allowed_users))
        real_allowed_users = []

        for db_user in allowed_users:
            if db_user is not None and not db_user.deleted:
                real_allowed_users.append(db_user)

        project_with_users = ProjectModel(
            id=project.id,
            name=project.name,
            imported=project.imported,
            analyzed=project.analyzed,
            deleted=project.deleted,
            files=project.files,
            allowed_users=real_allowed_users
        )

        if item is not None:
            total_count = await db.engine.count(
                Recommendation,
                (
                        (Recommendation.project == project.id) &
                        (Recommendation.item_id == item.meta_id)
                )
            )
        else:
            total_count = await db.engine.count(
                Recommendation,
                Recommendation.project == project.id
            )

        if total_count <= 0:
            raise GraphQLError(STATUS_CODE[208], extensions={'code': 208})

        statistics = []
        for i in range(5, 0, -1):
            if item is not None:
                count = await db.engine.count(
                    Recommendation,
                    (
                            (Recommendation.project == project.id) &
                            (Recommendation.item_id == item.meta_id) &
                            (Recommendation.user_item_weight == i)
                    )
                )
            else:
                count = await db.engine.count(
                    Recommendation,
                    (
                            (Recommendation.project == project.id) &
                            (Recommendation.user_item_weight == i)
                    )
                )

            statistics.append(
                ProjectInnerStatisticModel(
                    stars=i,
                    count=count,
                    percentage=count / total_count,
                )
            )

        return ProjectStatisticsModel(project=project_with_users, metadata=item, statistics=statistics)

    @staticmethod
    @gql_full_jwt_required
    async def resolve_all_metadata(self, info, **kwargs):
        claims = kwargs['jwt_claims']
        is_admin = claims['access_level']['is_staff'] if claims is not None else False
        project_id = kwargs.get('project_id', None)

        if project_id is None:
            raise GraphQLError(STATUS_CODE[50], extensions={'code': 50})

        if not ObjectId.is_valid(project_id):
            raise GraphQLError(STATUS_CODE[53], extensions={'code': 53})

        project = await db.engine.find_one(Project, Project.id == ObjectId(project_id))

        if project is None or project.deleted:
            raise GraphQLError(STATUS_CODE[201], extensions={'code': 201})

        user = await db.engine.find_one(User, User.id == ObjectId(claims['user_id']))

        if user is None or user.deleted:
            raise GraphQLError(STATUS_CODE[107], extensions={'code': 107})

        if not is_admin and not (ObjectId(claims['user_id']) in project.allowed_users):
            raise GraphQLError(STATUS_CODE[51], extensions={'code': 51})

        all_metadata = await db.engine.find(Metadata, Metadata.project == ObjectId(project_id))

        return all_metadata

    @staticmethod
    @access_level_required(DEFAULT_ADMIN_ACCESS_LEVEL.level, True)
    async def resolve_access_levels(self, info, **kwargs):
        return await db.engine.find(AccessLevel)


class ApiMutation(graphene.ObjectType):
    login = Login.Field()
    register = Register.Field()
    refresh = Refresh.Field()
    create_project = CreateProject.Field()
    analyze_project = ReAnalyze.Field()
    update_project_allowed_users = UpdateProjectAllowedUsers.Field()
    delete_project = DeleteProject.Field()
    update_project_name = UpdateProjectName.Field()
    remove_user = RemoveUser.Field()


schema = graphene.Schema(query=ApiQuery, mutation=ApiMutation, types=[
    UserModel,
    FileLocationModel,
    MetadataModel,
    PurchaseModel,
    ProjectModel,
    RecommendationModel,
    ProjectStatisticsModel,
    ProjectInnerStatisticModel,
])
