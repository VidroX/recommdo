from pathlib import Path

import numpy
import pandas as pd
import numpy as np
import graphene
from graphene_file_upload.scalars import Upload
from graphql import GraphQLError
from bson.json_util import dumps
from odmantic import ObjectId

from app.api.decorators.AuthDecorators import access_level_required, gql_full_jwt_required
from app.api.models.ProjectModel import ProjectModel
from app.api.models.UserModel import UserModel
from app.api.mutations.types.ProjectMetadataInput import ProjectMetadataInput
from app.api.mutations.types.UserInput import UserInput
from app.api.status_codes import STATUS_CODE
from app.api.utils.AuthUtils import DEFAULT_USER_PLUS_ACCESS_LEVEL
from app.celery.celery_worker import analyze_purchases, import_and_analyze_purchases
from app.database.database import db
from app.database.models.FileLocation import FileLocation
from app.database.models.Metadata import Metadata
from app.database.models.Project import Project
from app.database.models.User import User
from app.settings import UPLOAD_FILE_PATH
from app.api.utils.FileUtils import save_uploaded_file


def filter_set(purchases, user_id):
    def iterator_func(x):
        if user_id == x[0]:
            return True
        return False
    return filter(iterator_func, purchases)


class CreateProject(graphene.Mutation):
    class Arguments:
        files = graphene.List(Upload, required=True)
        project_name = graphene.String(required=True)
        project_metadata = ProjectMetadataInput(required=True)

    project = graphene.Field(ProjectModel)

    @staticmethod
    @access_level_required(DEFAULT_USER_PLUS_ACCESS_LEVEL.level, False)
    async def mutate(root, info, files=None, project_name=None, project_metadata=None, **kwargs):
        if project_name is None or (files is None or len(files) < 1) or project_metadata is None:
            raise GraphQLError(STATUS_CODE[50], extensions={'code': 50})

        project = await db.engine.find_one(Project, Project.name == project_name)

        if project is not None:
            raise GraphQLError(STATUS_CODE[200], extensions={'code': 200})

        token_claims = kwargs['jwt_claims']

        project_files = []
        project_folder = project_name.lower().replace(' ', '_')

        upload_path = Path(str(Path().absolute()) + UPLOAD_FILE_PATH + project_folder + '/')
        upload_path.mkdir(parents=True, exist_ok=True)

        project_template = Project(
            name=str(project_name),
            files=project_files
        )

        dataset = []
        for file in files:
            new_file_path = Path(str(upload_path) + '/' + file.filename)

            db_file_location = await db.engine.find_one(
                FileLocation,
                (FileLocation.name == file.filename) & (FileLocation.location == str(new_file_path))
            )

            try:
                await save_uploaded_file(file, new_file_path)
            finally:
                if not db_file_location:
                    project_file = FileLocation(
                        name=file.filename,
                        location=str(new_file_path),
                        file_type='metadata' if file.filename == project_metadata['meta_file_name'] else 'subscriptions',
                    )
                    await db.engine.save(project_file)
                    project_files.append(project_file)
                else:
                    project_files.append(db_file_location)

            chunk_size = 10 ** 6
            with pd.read_csv(str(new_file_path), chunksize=chunk_size, encoding='utf8') as reader:
                for chunk in reader:
                    if file.filename == project_metadata['meta_file_name']:
                        if project_metadata['meta_name_header'] is None:
                            values = chunk[
                                project_metadata['meta_id_header']
                            ].to_numpy()
                        else:
                            values = chunk[[
                                project_metadata['meta_id_header'],
                                project_metadata['meta_name_header']
                            ]].to_numpy()

                        for value in values:
                            if project_metadata['meta_name_header'] is None:
                                metadata_exists = await db.engine.find_one(
                                    Metadata,
                                    (
                                        (Metadata.project == project_template.id) &
                                        (Metadata.meta_id == value[0])
                                    )
                                )
                            else:
                                metadata_exists = await db.engine.find_one(
                                    Metadata,
                                    (
                                        (Metadata.project == project_template.id) &
                                        (Metadata.meta_id == value[0]) &
                                        (Metadata.name == value[1])
                                    )
                                )
                            if metadata_exists is None:
                                if project_metadata['meta_name_header'] is None:
                                    metadata = Metadata(
                                        meta_id=value[0],
                                        project=project_template
                                    )
                                else:
                                    metadata = Metadata(
                                        meta_id=value[0],
                                        name=value[1],
                                        project=project_template
                                    )
                                await db.engine.save(metadata)
                    elif file.filename == project_metadata['subscriptions_file_name']:
                        purchases_with_dates = numpy.sort(
                            chunk[[
                                project_metadata['subscriptions_user_id_header'],
                                project_metadata['subscriptions_meta_id_header'],
                                project_metadata['subscriptions_start_from_header'],
                                project_metadata['subscriptions_end_at_header'],
                            ]].to_numpy(),
                            axis=0
                        )
                        purchases = chunk[[
                            project_metadata['subscriptions_user_id_header'],
                            project_metadata['subscriptions_meta_id_header'],
                        ]].to_numpy()

                        unq_values, cnt = np.unique(purchases, axis=0, return_counts=True)

                        dataset = [[unq_values.tolist(), cnt.tolist()], purchases_with_dates.tolist()]

        project_template.files = project_files

        if not token_claims['access_level']['is_staff']:
            current_user = await db.engine.find_one(User, User.id == ObjectId(token_claims['user_id']))
            if current_user is not None:
                project_template.allowed_users = [current_user.id]

        if dataset is not None and len(dataset) > 0:
            import_and_analyze_purchases.apply_async(args=[
                dumps(project_template.doc()),
                dataset,
                project_metadata,
                True,
                True
            ], max_retries=3, retry=True)

        created_project = await db.engine.save(project_template)
        new_project = ProjectModel(
            id=created_project.id,
            name=created_project.name,
            analyzed=False,
            imported=False,
            files=created_project.files,
            allowed_users=await db.engine.find(User, User.id.in_(created_project.allowed_users))
        )

        return CreateProject(project=new_project)


class ReAnalyze(graphene.Mutation):
    class Arguments:
        project_id = graphene.String(required=True)
        project_metadata = ProjectMetadataInput(required=True)

    message = graphene.String()

    @staticmethod
    @gql_full_jwt_required
    async def mutate(root, info, project_id=None, project_metadata=None, **kwargs):
        if project_id is None:
            raise GraphQLError(STATUS_CODE[50], extensions={'code': 50})

        if not ObjectId.is_valid(project_id):
            raise GraphQLError(STATUS_CODE[53], extensions={'code': 53})

        project = await db.engine.find_one(Project, Project.id == ObjectId(project_id))

        if project is None:
            raise GraphQLError(STATUS_CODE[201], extensions={'code': 201})

        token_claims = kwargs['jwt_claims']
        request_user_id = token_claims['user_id'] if token_claims is not None else None

        if request_user_id is None:
            raise GraphQLError(STATUS_CODE[51], extensions={'code': 51})

        is_admin = token_claims['access_level']['is_staff'] if token_claims is not None else False

        project_allowed_users = await db.engine.find(User, User.id.in_(project.allowed_users))

        if request_user_id not in project_allowed_users and not is_admin:
            raise GraphQLError(STATUS_CODE[51], extensions={'code': 51})

        project.analyzed = False
        await db.engine.save(project)
        await db.raw_engine['recommendations'].delete_many({'project': ObjectId(project_id)})

        analyze_purchases.apply_async(args=[
            dumps(project.doc()),
            project_metadata,
            True
        ], priority=9, max_retries=3, retry=True)

        return ReAnalyze(message='Task Started')


class UpdateProjectAllowedUsers(graphene.Mutation):
    class Arguments:
        project_id = graphene.String(required=True)
        users = graphene.List(graphene.ID, required=True)

    message = graphene.String()

    @staticmethod
    @gql_full_jwt_required
    async def mutate(root, info, project_id=None, users=None, **kwargs):
        if project_id is None or users is None:
            raise GraphQLError(STATUS_CODE[50], extensions={'code': 50})

        if not ObjectId.is_valid(project_id):
            raise GraphQLError(STATUS_CODE[53], extensions={'code': 53})

        project = await db.engine.find_one(Project, Project.id == ObjectId(project_id))

        if project is None:
            raise GraphQLError(STATUS_CODE[201], extensions={'code': 201})

        token_claims = kwargs['jwt_claims']
        request_user_id = token_claims['user_id'] if token_claims is not None else None

        if request_user_id is None:
            raise GraphQLError(STATUS_CODE[51], extensions={'code': 51})

        is_admin = token_claims['access_level']['is_staff'] if token_claims is not None else False

        project_allowed_users = await db.engine.find(User, User.id.in_(project.allowed_users))

        if request_user_id not in project_allowed_users and not is_admin:
            raise GraphQLError(STATUS_CODE[51], extensions={'code': 51})

        requested_users = []
        for user in users:
            db_user = await db.engine.find_one(User, User.id == ObjectId(user))
            if db_user is not None:
                requested_users.append(db_user.id)

        project.allowed_users = requested_users
        await db.engine.save(project)

        return UpdateProjectAllowedUsers(message='Users have been successfully assigned to the project.')
