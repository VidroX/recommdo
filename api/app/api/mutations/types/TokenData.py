import graphene


class TokenData(graphene.ObjectType):
    access_token = graphene.String(required=False)
    refresh_token = graphene.String(required=False)
