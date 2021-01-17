import logging

from app import settings

if settings.DEBUG:
    logger = logging.getLogger('uvicorn.error')
else:
    logger = logging.getLogger('gunicorn.error')
