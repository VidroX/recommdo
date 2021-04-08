import graphene


class FileLocationModel(graphene.ObjectType):
    id = graphene.ID(required=True)
    name = graphene.String(required=True)
    location = graphene.String(required=True)
