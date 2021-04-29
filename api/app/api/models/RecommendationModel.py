import graphene

from app.api.models.ProjectModel import ProjectModel


class RecommendationModel(graphene.ObjectType):
    id = graphene.ID(required=True)
    meta_id = graphene.Int(required=True)
    name = graphene.String(required=False)
    project = graphene.Field(ProjectModel, required=True)
