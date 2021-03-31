from fastapi_jwt_auth import AuthJWT
from fastapi_jwt_auth.exceptions import MissingTokenError, InvalidHeaderError, RevokedTokenError
from graphql import GraphQLError, ResolveInfo

from app.api.status_codes import STATUS_CODE


def get_jwt_instance(*args, **kwargs):
    jwt = None

    for arg in args:
        if isinstance(arg, ResolveInfo):
            jwt_request = arg.context['request'].state.jwt
            if isinstance(jwt_request, AuthJWT):
                jwt = jwt_request

    if jwt is None:
        raise GraphQLError(STATUS_CODE[1], extensions={'code': 1})

    return jwt


def gql_jwt_required(func):
    def gql_jwt_required_decorator(*args, **kwargs):
        jwt = get_jwt_instance(*args, **kwargs)

        try:
            jwt.jwt_required()
        except MissingTokenError:
            raise GraphQLError(STATUS_CODE[0], extensions={'code': 0})
        except InvalidHeaderError:
            raise GraphQLError(STATUS_CODE[2], extensions={'code': 2})
        except RevokedTokenError:
            raise GraphQLError(STATUS_CODE[5], extensions={'code': 5})

        kwargs['jwt'] = jwt

        return func(*args, **kwargs)
    return gql_jwt_required_decorator


def gql_full_jwt_required(func):
    def gql_full_jwt_required_decorator(*args, **kwargs):
        jwt = get_jwt_instance(*args, **kwargs)

        try:
            jwt.jwt_required()
        except MissingTokenError:
            raise GraphQLError(STATUS_CODE[0], extensions={'code': 0})
        except InvalidHeaderError:
            raise GraphQLError(STATUS_CODE[2], extensions={'code': 2})
        except RevokedTokenError:
            raise GraphQLError(STATUS_CODE[5], extensions={'code': 5})

        user_subject = jwt.get_jwt_subject() or None
        token_claims = jwt.get_raw_jwt() or None

        if user_subject is None or token_claims is None:
            raise GraphQLError(STATUS_CODE[0], extensions={'code': 0})

        kwargs['jwt'] = jwt
        kwargs['jwt_subject'] = user_subject
        kwargs['jwt_claims'] = token_claims

        return func(*args, **kwargs)
    return gql_full_jwt_required_decorator


def gql_refresh_jwt_required(func):
    def gql_refresh_jwt_required_decorator(*args, **kwargs):
        jwt = get_jwt_instance(*args, **kwargs)

        try:
            jwt.jwt_refresh_token_required()
        except MissingTokenError:
            raise GraphQLError(STATUS_CODE[3], extensions={'code': 3})
        except InvalidHeaderError:
            raise GraphQLError(STATUS_CODE[4], extensions={'code': 4})
        except RevokedTokenError:
            raise GraphQLError(STATUS_CODE[5], extensions={'code': 5})

        kwargs['jwt'] = jwt

        return func(*args, **kwargs)
    return gql_refresh_jwt_required_decorator


def only_admin(func):
    def gql_only_admin_decorator(*args, **kwargs):
        jwt = get_jwt_instance(*args, **kwargs)

        try:
            jwt.jwt_required()
        except MissingTokenError:
            raise GraphQLError(STATUS_CODE[0], extensions={'code': 0})
        except InvalidHeaderError:
            raise GraphQLError(STATUS_CODE[2], extensions={'code': 2})
        except RevokedTokenError:
            raise GraphQLError(STATUS_CODE[5], extensions={'code': 5})

        subject = jwt.get_jwt_subject() or None
        token_claims = jwt.get_raw_jwt() or None

        if not subject or not token_claims or not token_claims["access_level"]["is_staff"]:
            raise GraphQLError(STATUS_CODE[105], extensions={'code': 105})

        kwargs['jwt'] = jwt

        return func(*args, **kwargs)
    return gql_only_admin_decorator


def gql_jwt_optional(func):
    def gql_jwt_optional_decorator(*args, **kwargs):
        jwt = get_jwt_instance(*args, **kwargs)

        try:
            jwt.jwt_optional()
        except InvalidHeaderError:
            raise GraphQLError(STATUS_CODE[2], extensions={'code': 2})
        except RevokedTokenError:
            raise GraphQLError(STATUS_CODE[5], extensions={'code': 5})

        kwargs['jwt'] = jwt

        return func(*args, **kwargs)
    return gql_jwt_optional_decorator


def gql_jwt(func):
    def gql_jwt_decorator(*args, **kwargs):
        jwt = get_jwt_instance(*args, **kwargs)

        kwargs['jwt'] = jwt

        return func(*args, **kwargs)
    return gql_jwt_decorator
