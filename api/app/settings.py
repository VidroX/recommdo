import os
from dotenv import load_dotenv

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
