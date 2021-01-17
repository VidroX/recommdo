from fastapi import FastAPI

from app import settings
from app.database.utils import connect_to_database, close_database_connection

app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION
)

app.add_event_handler("startup", connect_to_database)
app.add_event_handler("shutdown", close_database_connection)


@app.get('/')
def ping():
    return {'ping': 'pong'}
