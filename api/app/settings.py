import os
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()

# Debug variables
DEBUG = os.getenv("DEBUG")

# Database-specific variables
DATABASE_HOST = os.getenv("DATABASE_HOST")
DATABASE_PORT = os.getenv("DATABASE_PORT")
DATABASE_USERNAME = os.getenv("DATABASE_USERNAME")
DATABASE_PASSWORD = os.getenv("DATABASE_PASSWORD")
DATABASE_NAME = os.getenv("DATABASE_NAME")

# App-specific variables
APP_NAME = os.getenv("APP_NAME")
APP_DESCRIPTION = os.getenv("APP_DESCRIPTION")
APP_VERSION = os.getenv("APP_VERSION")

# CORS
CORS_ORIGINS = [
    "http://host.docker.internal",
    "http://host.docker.internal:8080",
    "http://host.docker.internal:3000",
    "http://localhost",
    "http://localhost:8080",
    "http://localhost:3000",
    "http://127.0.0.1",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:3000",
]

# Uploaded files
UPLOAD_FILE_PATH = '/uploads/'


class JWTSettings(BaseModel):
    authjwt_secret_key: str = os.getenv("JWT_SECRET")
