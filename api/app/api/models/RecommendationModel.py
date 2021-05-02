import graphene

from app.api.models.MetadataModel import MetadataModel
from app.api.models.ProjectModel import ProjectModel


class RecommendationModel(graphene.ObjectType):
    id = graphene.ID(required=True)
    metadata = graphene.Field(MetadataModel, required=True)
    user_id = graphene.Int(required=True)
    score = graphene.Float(required=True)
    user_item_weight = graphene.Int(required=True, default_value=1)
    project = graphene.Field(ProjectModel, required=True)
