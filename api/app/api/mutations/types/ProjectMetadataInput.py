import graphene


class ProjectMetadataInput(graphene.InputObjectType):
    meta_file_name = graphene.String(required=False)
    meta_id_header = graphene.String(required=False)
    meta_name_header = graphene.String(required=False)
    purchase_file_name = graphene.String(required=False)
    purchase_meta_id_header = graphene.String(required=False)
    purchase_user_id_header = graphene.String(required=False)
