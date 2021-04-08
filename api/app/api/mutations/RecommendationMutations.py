import graphene
from graphene_file_upload.scalars import Upload
from graphql import GraphQLError

from app.api.decorators.AuthDecorators import only_admin
from app.api.models.ProjectModel import ProjectModel
from app.api.mutations.types.ProjectMetadataInput import ProjectMetadataInput


class CreateProject(graphene.Mutation):
    class Arguments:
        files = graphene.List(Upload, required=False)
        project_name = graphene.String(required=True)
        project_metadata = ProjectMetadataInput(required=False)

    project = graphene.Field(ProjectModel)

    @staticmethod
    @only_admin
    async def mutate(root, info, files=None, project_name=None, project_metadata=None, **kwargs):
        for file in files:
            print(file)

        return CreateProject()
