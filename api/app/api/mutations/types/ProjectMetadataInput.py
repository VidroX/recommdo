import graphene


class ProjectMetadataInput(graphene.InputObjectType):
    meta_id_header = graphene.String(required=False)
    meta_name_header = graphene.String(required=False)
    purchase_id_header = graphene.String(required=False)
    purchase_user_id_header = graphene.String(required=False)
