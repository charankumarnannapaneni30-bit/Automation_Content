from celery import Celery

from app.config import get_settings
from app.tasks import research_topic  # noqa: F401  # import to register Celery task metadata

settings = get_settings()

celery_app = Celery(
    'atlas_studio',
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=['app.tasks'],
)

celery_app.conf.update(
    task_track_started=True,
    timezone='UTC',
    enable_utc=True,
    task_always_eager=settings.celery_task_always_eager,
    broker_connection_retry_on_startup=True,
    task_store_eager_result=True,
)


def broker_status() -> dict[str, bool | str]:
    try:
        ping = celery_app.control.ping(timeout=2)
        return {
            'reachable': bool(ping),
            'details': 'Redis/Celery broker reachable.' if ping else 'Broker responded without workers.',
        }
    except Exception as exc:  # pragma: no cover - broker may be offline in local development
        return {'reachable': False, 'details': f'Broker unavailable: {exc}'}
