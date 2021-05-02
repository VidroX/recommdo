import graphene

from app.api.models.RecommendationModel import RecommendationModel


class RecommendationsPaginationModel(graphene.ObjectType):
    current_page = graphene.Int(required=False)
    page_amount = graphene.Int(required=False)
    shown_entries = graphene.Int(required=False)
    total_entries = graphene.Int(required=False)
    recommendations = graphene.List(RecommendationModel, required=True)
