import graphene

from app.api.models.MetadataModel import MetadataModel
from app.api.models.ProjectModel import ProjectModel


class ProjectInnerStatisticModel(graphene.ObjectType):
    stars = graphene.Int(required=True)
    percentage = graphene.Float(required=True)
    count = graphene.Int(required=True)


class ProjectStatisticsModel(graphene.ObjectType):
    project = graphene.Field(ProjectModel, required=True)
    metadata = graphene.Field(MetadataModel, required=False, default_value=None)
    statistics = graphene.List(ProjectInnerStatisticModel, required=True)
