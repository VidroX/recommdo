import graphene

from app.api.models.PurchaseModel import PurchaseModel


class PurchasesPaginationModel(graphene.ObjectType):
    current_page = graphene.Int(required=False)
    page_amount = graphene.Int(required=False)
    shown_entries = graphene.Int(required=False)
    total_entries = graphene.Int(required=False)
    purchases = graphene.List(PurchaseModel, required=True)
