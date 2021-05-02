import graphene
from email_validator import validate_email, EmailNotValidError
from graphql import GraphQLError

from app.api.decorators.AuthDecorators import gql_jwt, gql_refresh_jwt_required, access_level_required
from app.api.models.UserModel import UserModel
from app.api.mutations.types.TokenData import TokenData
from app.api.status_codes import STATUS_CODE
from app.api.utils.AuthUtils import create_normal_user, create_user, DEFAULT_ADMIN_ACCESS_LEVEL
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

        if not argon2.using(rounds=4).verify(password, user.password):
            raise GraphQLError(STATUS_CODE[100], extensions={'code': 100})

        jwt = kwargs['jwt']

        claims = {
            "user_id": str(user.id),
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
        access_level = graphene.Int(required=False, default_value=1)

    user = graphene.Field(UserModel)
    tokens = graphene.Field(TokenData)

    @staticmethod
    @access_level_required(DEFAULT_ADMIN_ACCESS_LEVEL.level, True)
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
        user_subject = kwargs['jwt_subject']
        token_claims = kwargs['jwt_claims']

        if user_subject is None or token_claims is None:
            created_user = await create_normal_user(
                email=valid_email,
                first_name=first_name,
                last_name=last_name,
                middle_name=middle_name,
                password=password
            )
        elif user_subject is not None and token_claims is not None and token_claims["access_level"]["is_staff"]:
            level = await db.engine.find_one(AccessLevel, AccessLevel.level == access_level)

            if level is None:
                raise GraphQLError(STATUS_CODE[106], extensions={'code': 106})

            created_user = await create_user(
                email=valid_email,
                first_name=first_name,
                last_name=last_name,
                middle_name=middle_name,
                password=password,
                access_level=level
            )
        else:
            raise GraphQLError(STATUS_CODE[51], extensions={'code': 51})

        if created_user is None:
            raise GraphQLError(STATUS_CODE[104], extensions={'code': 104})

        claims = {
            "user_id": str(created_user.id),
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


class Refresh(graphene.Mutation):
    tokens = graphene.Field(TokenData)

    @staticmethod
    @gql_refresh_jwt_required
    async def mutate(root, info, **kwargs):
        jwt = kwargs['jwt']

        if jwt is None:
            raise GraphQLError(STATUS_CODE[50], extensions={'code': 50})

        current_user = jwt.get_jwt_subject() or None

        if current_user is None:
            raise GraphQLError(STATUS_CODE[2], extensions={'code': 2})

        token_claims = jwt.get_raw_jwt() or None

        claims = {
            "user_id": str(token_claims["user_id"]),
            "email": token_claims["email"],
            "access_level": {
                "level": token_claims["access_level"]["level"],
                "is_staff": token_claims["access_level"]["is_staff"]
            }
        }

        token_data = TokenData()
        token_data.access_token = jwt.create_access_token(subject=current_user, user_claims=claims)

        return Refresh(tokens=token_data)
