from fastapi import FastAPI, Depends
from fastapi_jwt_auth import AuthJWT
from starlette.datastructures import URL
from graphql.execution.executors.asyncio import AsyncioExecutor
from fastapi.middleware.cors import CORSMiddleware
from starlette.requests import Request

from app import settings
from app.CustomGraphqlApp import CustomGraphqlApp
from app.api.schema import schema
from app.utils import preflight_setup, connection_end
from app.settings import JWTSettings

app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_background_tasks_to_response(request: Request, call_next):
    request.state.background = None
    response = await call_next(request)
    if request.state.background:
        response.background = request.state.background
    return response


@AuthJWT.load_config
def get_config():
    return JWTSettings()


app.add_event_handler("startup", preflight_setup)
app.add_event_handler("shutdown", connection_end)

graphql_app = CustomGraphqlApp(schema=schema, executor_class=AsyncioExecutor)


@app.get('/')
async def graphiql(request: Request):
    request._url = URL('/gql')
    return await graphql_app.handle_graphiql(request=request)


@app.post('/gql')
async def graphql(request: Request, jwt: AuthJWT = Depends()):
    request.state.jwt = jwt
    return await graphql_app.handle_graphql(request=request)
