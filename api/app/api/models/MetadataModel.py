import graphene

from app.api.models.ProjectModel import ProjectModel


class MetadataModel(graphene.ObjectType):
    id = graphene.ID(required=True)
    meta_id = graphene.Int(required=True)
    name = graphene.String(required=True)
    additional_data = graphene.String(required=False)
    project = graphene.Field(ProjectModel, required=True)
