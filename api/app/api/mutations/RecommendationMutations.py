from pathlib import Path

import pandas as pd
import numpy as np
import graphene
from graphene_file_upload.scalars import Upload
from graphql import GraphQLError
from bson.json_util import dumps

from app.api.decorators.AuthDecorators import only_admin
from app.api.models.ProjectModel import ProjectModel
from app.api.mutations.types.ProjectMetadataInput import ProjectMetadataInput
from app.api.status_codes import STATUS_CODE
from app.celery.celery_worker import import_purchases
from app.database.database import db
from app.database.models.FileLocation import FileLocation
from app.database.models.Metadata import Metadata
from app.database.models.Project import Project
from app.settings import UPLOAD_FILE_PATH
from app.api.utils.FileUtils import save_uploaded_file


class CreateProject(graphene.Mutation):
    class Arguments:
        files = graphene.List(Upload, required=False)
        project_name = graphene.String(required=True)
        project_metadata = ProjectMetadataInput(required=False)

    project = graphene.Field(ProjectModel)

    @staticmethod
    @only_admin
    async def mutate(root, info, files=None, project_name=None, project_metadata=None, **kwargs):
        if project_name is None:
            raise GraphQLError(STATUS_CODE[50], extensions={'code': 50})

        project = await db.engine.find_one(Project, Project.name == project_name)

        if project is not None:
            raise GraphQLError(STATUS_CODE[200], extensions={'code': 200})

        project_template = Project(
            name=str(project_name),
            analyzed=(files is None or len(files) <= 0 or project_metadata is None)
        )

        if len(files) > 0 and project_metadata is not None:
            project_files = []
            project_folder = project_name.lower().replace(' ', '_')

            upload_path = Path(str(Path().absolute()) + UPLOAD_FILE_PATH + project_folder + '/')
            upload_path.mkdir(parents=True, exist_ok=True)

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
                            location=str(new_file_path)
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
                                metadata_exists = await db.engine.find_one(
                                    Metadata,
                                    Metadata.meta_id == value[0]
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
                        elif file.filename == project_metadata['purchase_file_name']:
                            values = chunk[[
                                project_metadata['purchase_user_id_header'],
                                project_metadata['purchase_meta_id_header']
                            ]].to_numpy()
                            unq_values, cnt = np.unique(values, axis=0, return_counts=True)
                            dataset = [unq_values.tolist(), cnt.tolist()]

            project_template.files = project_files

            if dataset is not None and len(dataset) > 0:
                import_purchases.apply_async(args=[
                    dumps(project_template.doc()),
                    dataset,
                    True
                ])

        created_project = await db.engine.save(project_template)

        return CreateProject(project=created_project)
