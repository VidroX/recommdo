from fastapi import FastAPI, Depends
from fastapi_jwt_auth import AuthJWT
from starlette.datastructures import URL
from starlette.graphql import GraphQLApp
from graphql.execution.executors.asyncio import AsyncioExecutor
from starlette.requests import Request

from app import settings
from app.api.schema import schema
from app.utils import preflight_setup, connection_end
from app.settings import JWTSettings

app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION
)


@AuthJWT.load_config
def get_config():
    return JWTSettings()


app.add_event_handler("startup", preflight_setup)
app.add_event_handler("shutdown", connection_end)

graphql_app = GraphQLApp(schema=schema, executor_class=AsyncioExecutor)


@app.get('/')
async def graphiql(request: Request):
    request._url = URL('/gql')
    return await graphql_app.handle_graphiql(request=request)


@app.post('/gql')
async def graphql(request: Request, jwt: AuthJWT = Depends()):
    request.state.jwt = jwt
    return await graphql_app.handle_graphql(request=request)
