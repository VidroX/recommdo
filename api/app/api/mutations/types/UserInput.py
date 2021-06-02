import graphene


class UserInput(graphene.InputObjectType):
    id = graphene.ID(required=True)
