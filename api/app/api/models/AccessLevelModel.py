import graphene


class AccessLevelModel(graphene.ObjectType):
    level = graphene.Int(required=True)
    is_staff = graphene.Boolean(required=True)
    name = graphene.String(required=True)
    description = graphene.String(required=True)
