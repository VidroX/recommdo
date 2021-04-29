from celery import Celery

from app import settings

broker_url = 'redis://:' + settings.REDIS_PASSWORD + '@redis:6379/0'
celery_app = Celery('recommdo', broker=broker_url, include=['app.celery.celery_worker'])
celery_app.conf.task_routes = {
    "app.celery.celery_worker.import_big_dataset": {'queue': 'celery'},
    "app.celery.celery_worker.import_big_dataset": {'queue': 'celery'}
}

celery_app.conf.update(task_track_started=True)
