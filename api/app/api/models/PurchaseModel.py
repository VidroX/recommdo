import graphene

from app.api.models.MetadataModel import MetadataModel
from app.api.models.ProjectModel import ProjectModel


class PurchaseHistoryModel(graphene.ObjectType):
    id = graphene.ID(required=True)
    user_id = graphene.Int(required=True)
    metadata = graphene.Field(MetadataModel, required=False)
    project = graphene.Field(ProjectModel, required=True)
    start_at = graphene.String(required=True)
    end_at = graphene.String(required=True)


class PurchaseModel(graphene.ObjectType):
    id = graphene.ID(required=True)
    user_id = graphene.Int(required=True)
    metadata = graphene.Field(MetadataModel, required=False)
    weight = graphene.Int(required=False, default_value=1)
    project = graphene.Field(ProjectModel, required=True)
