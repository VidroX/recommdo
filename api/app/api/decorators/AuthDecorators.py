from fastapi_jwt_auth import AuthJWT
from fastapi_jwt_auth.exceptions import MissingTokenError, InvalidHeaderError
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

        kwargs['jwt'] = jwt

        return func(*args, **kwargs)
    return gql_jwt_required_decorator


def gql_jwt_optional(func):
    def gql_jwt_optional_decorator(*args, **kwargs):
        jwt = get_jwt_instance(*args, **kwargs)

        try:
            jwt.jwt_optional()
        except InvalidHeaderError:
            raise GraphQLError(STATUS_CODE[2], extensions={'code': 2})

        kwargs['jwt'] = jwt

        return func(*args, **kwargs)
    return gql_jwt_optional_decorator
