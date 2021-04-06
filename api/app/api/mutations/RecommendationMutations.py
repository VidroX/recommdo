import graphene
from graphene_file_upload.scalars import Upload
from graphql import GraphQLError

from app.api.decorators.AuthDecorators import only_admin


class CreateProject(graphene.Mutation):
    class Arguments:
        files = graphene.List(Upload, required=True)

    message = graphene.String()

    @staticmethod
    @only_admin
    async def mutate(root, info, files=None, **kwargs):
        print(files)

        return CreateProject(message="Test")
