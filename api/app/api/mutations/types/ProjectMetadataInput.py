import graphene


class ProjectMetadataInput(graphene.InputObjectType):
    meta_file_name = graphene.String(required=True)
    meta_id_header = graphene.String(required=True)
    meta_name_header = graphene.String(required=False)
    subscriptions_file_name = graphene.String(required=True)
    subscriptions_meta_id_header = graphene.String(required=True)
    subscriptions_user_id_header = graphene.String(required=True)
    subscriptions_start_from_header = graphene.String(required=True)
    subscriptions_end_at_header = graphene.String(required=True)
