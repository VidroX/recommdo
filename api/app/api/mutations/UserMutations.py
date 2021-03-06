import graphene
from email_validator import validate_email, EmailNotValidError
from graphql import GraphQLError

from app.api.decorators.AuthDecorators import gql_jwt, only_admin
from app.api.models.UserModel import UserModel
from app.api.mutations.types.AccessLevelInput import AccessLevelInput
from app.api.mutations.types.TokenData import TokenData
from app.api.status_codes import STATUS_CODE
from app.api.utils.AuthUtils import create_normal_user, create_user
from app.database.database import db
from app.database.models.AccessLevel import AccessLevel
from app.database.models.User import User

from passlib.hash import argon2


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

        user = await db.engine.find_one(User, User.email == email)

        if user is None:
            raise GraphQLError(STATUS_CODE[100], extensions={'code': 100})

        if not argon2.using(rounds=4, type="id").verify(password, user.password):
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


class Register(graphene.Mutation):
    class Arguments:
        email = graphene.String(required=True)
        password = graphene.String(required=True)
        first_name = graphene.String(required=True)
        last_name = graphene.String(required=True)
        middle_name = graphene.String(required=False, default_value="")
        access_level = AccessLevelInput(required=False)

    user = graphene.Field(UserModel)
    tokens = graphene.Field(TokenData)

    @staticmethod
    @only_admin
    async def mutate(root, info, email=None, password=None, first_name=None, last_name=None, middle_name="",
                     access_level=None, **kwargs):
        if email is None or password is None or first_name is None or last_name is None:
            raise GraphQLError(STATUS_CODE[50], extensions={'code': 50})

        user = await db.engine.find_one(User, User.email == email)

        if user is not None:
            raise GraphQLError(STATUS_CODE[101], extensions={'code': 101})

        try:
            valid = validate_email(email)

            valid_email = valid.email
        except EmailNotValidError:
            raise GraphQLError(STATUS_CODE[103], extensions={'code': 103})

        if len(password) < 6:
            raise GraphQLError(STATUS_CODE[102], extensions={'code': 102})

        jwt = kwargs['jwt']

        user_subject = jwt.get_jwt_subject() or None
        token_claims = jwt.get_raw_jwt() or None

        if user_subject is None or token_claims is None:
            created_user = await create_normal_user(
                email=valid_email,
                first_name=first_name,
                last_name=last_name,
                middle_name=middle_name,
                password=argon2.hash(password)
            )
        elif user_subject is not None and token_claims is not None and token_claims["access_level"]["is_staff"]:
            level = AccessLevel(
                level=access_level.level,
                name=access_level.name,
                description=access_level.description,
                is_staff=access_level.is_staff
            )
            created_user = await create_user(
                email=valid_email,
                first_name=first_name,
                last_name=last_name,
                middle_name=middle_name,
                password=argon2.hash(password),
                access_level=level
            )
        else:
            raise GraphQLError(STATUS_CODE[51], extensions={'code': 51})

        if created_user is None:
            raise GraphQLError(STATUS_CODE[104], extensions={'code': 104})

        claims = {
            "email": created_user.email,
            "access_level": {
                "level": created_user.access_level.level,
                "is_staff": created_user.access_level.is_staff
            }
        }

        token_data = TokenData()
        token_data.access_token = jwt.create_access_token(subject=str(created_user.id), user_claims=claims)
        token_data.refresh_token = jwt.create_refresh_token(subject=str(created_user.id), user_claims=claims)

        return Register(user=created_user, tokens=token_data)
