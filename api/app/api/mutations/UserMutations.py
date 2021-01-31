import graphene
from argon2.exceptions import InvalidHash
from graphql import GraphQLError
from graphql.error import GraphQLLocatedError
from graphql_relay import to_global_id

from app.api.decorators.AuthDecorators import gql_jwt
from app.api.models.UserModel import UserModel
from app.api.mutations.types.TokenData import TokenData
from app.api.status_codes import STATUS_CODE
from app.database.database import db
from app.database.models.User import User

from argon2 import PasswordHasher


class Login(graphene.Mutation):
    class Arguments:
        email = graphene.String(required=True)
        password = graphene.String(required=True)

    user = graphene.Field(UserModel)
    tokens = graphene.Field(TokenData)

    @staticmethod
    @gql_jwt
    async def mutate(root, info, email=None, password=None, **kwargs):
        if email is None or password is None:
            raise GraphQLError(STATUS_CODE[50], extensions={'code': 50})

        try:
            user = await db.engine.find_one(User, User.email == email)

            if user is None:
                raise GraphQLError(STATUS_CODE[100], extensions={'code': 100})

            ph = PasswordHasher()

            if not ph.verify(user.password, password):
                raise GraphQLError(STATUS_CODE[100], extensions={'code': 100})

            jwt = kwargs['jwt']

            claims = {
                "email": user.email,
                "access_level": {
                    "level": user.access_level.level,
                    "is_staff": user.access_level.is_staff
                }
            }

            token_data = TokenData()
            token_data.access_token = jwt.create_access_token(subject=str(user.id), user_claims=claims)
            token_data.refresh_token = jwt.create_refresh_token(subject=str(user.id), user_claims=claims)

            return Login(user=user, tokens=token_data)
        except InvalidHash:
            raise GraphQLError(STATUS_CODE[100], extensions={'code': 100})
        except GraphQLLocatedError:
            raise GraphQLError(STATUS_CODE[50], extensions={'code': 50})
