import graphene


class TokenData(graphene.ObjectType):
    access_token = graphene.String()
    refresh_token = graphene.String(required=False)
