from typing import Any

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.ai import AIProviderService
from app.auth import create_access_token, get_current_user, require_admin, require_editor
from app.celery_app import broker_status, celery_app
from app.config import get_settings
from app.db import DatabaseManager
from app.schemas import ApprovalItem, AuthRequest, AuthResponse, ContentProfile, JobStatus, Project, User
from app.services import InMemoryStore
from app.tasks import research_topic

settings = get_settings()
app = FastAPI(title=settings.app_name, version='1.0.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.get('/health')
def health() -> dict[str, str]:
    return {'status': 'ok', 'service': settings.app_name}


@app.get(f'{settings.api_prefix}/system-status')
def system_status() -> dict[str, Any]:
    db_status = DatabaseManager.status()
    queue_status = broker_status()
    ai_status = AIProviderService(
        provider=settings.ai_provider,
        model=settings.ai_model,
        api_key=settings.openai_api_key,
    ).status()
    return {
        'database': {
            'provider': db_status.provider,
            'connected': db_status.connected,
            'uri_configured': db_status.uri_configured,
            'details': db_status.details,
        },
        'queue': {
            'broker_url': settings.celery_broker_url,
            'reachable': queue_status['reachable'],
            'details': queue_status['details'],
        },
        'auth': {'jwt_enabled': bool(settings.jwt_secret and settings.jwt_secret != 'dev-secret')},
        'ai': {
            'provider': ai_status.provider,
            'configured': ai_status.configured,
            'enabled': ai_status.enabled,
            'model': ai_status.model,
            'details': ai_status.details,
        },
    }


@app.get(f'{settings.api_prefix}/ai/status')
def ai_status() -> dict[str, Any]:
    ai_status = AIProviderService(
        provider=settings.ai_provider,
        model=settings.ai_model,
        api_key=settings.openai_api_key,
    ).status()
    return {
        'provider': ai_status.provider,
        'configured': ai_status.configured,
        'enabled': ai_status.enabled,
        'model': ai_status.model,
        'details': ai_status.details,
    }


@app.post(f'{settings.api_prefix}/auth/login', response_model=AuthResponse)
def login(payload: AuthRequest) -> AuthResponse:
    user = InMemoryStore.authenticate_user(payload.email, payload.password)
    if user is None:
        raise HTTPException(status_code=401, detail='Invalid credentials')
    token = create_access_token(user.id)
    return AuthResponse(access_token=token, user=user)


@app.get(f'{settings.api_prefix}/me')
def current_user(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    user_record = next((item for item in InMemoryStore.users if item.id == user['user_id']), None)
    if user_record is None:
        raise HTTPException(status_code=404, detail='User not found')
    return {'user': user_record.model_dump()}


@app.get(f'{settings.api_prefix}/content-profiles', dependencies=[Depends(require_editor)])
def list_content_profiles() -> list[ContentProfile]:
    return InMemoryStore.list_profiles()


@app.get(f'{settings.api_prefix}/content-profiles/{{profile_id}}', dependencies=[Depends(require_editor)])
def get_content_profile(profile_id: str) -> ContentProfile:
    profile = InMemoryStore.get_profile(profile_id)
    if profile is not None:
        return profile
    raise HTTPException(status_code=404, detail='Profile not found')


@app.post(f'{settings.api_prefix}/content-profiles', dependencies=[Depends(require_admin)])
def create_content_profile(payload: dict[str, Any]) -> ContentProfile:
    try:
        return InMemoryStore.create_profile(payload)
    except Exception as exc:  # pragma: no cover - fail fast on invalid input
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.put(f'{settings.api_prefix}/content-profiles/{{profile_id}}', dependencies=[Depends(require_admin)])
def update_content_profile(profile_id: str, payload: dict[str, Any]) -> ContentProfile:
    try:
        return InMemoryStore.update_profile(profile_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - fail fast on invalid input
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post(f'{settings.api_prefix}/content-profiles/{{profile_id}}/duplicate', dependencies=[Depends(require_admin)])
def duplicate_content_profile(profile_id: str) -> ContentProfile:
    try:
        return InMemoryStore.duplicate_profile(profile_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.delete(f'{settings.api_prefix}/content-profiles/{{profile_id}}', dependencies=[Depends(require_admin)])
def delete_content_profile(profile_id: str) -> dict[str, str]:
    try:
        InMemoryStore.delete_profile(profile_id)
        return {'status': 'deleted', 'id': profile_id}
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.get(f'{settings.api_prefix}/projects', dependencies=[Depends(require_editor)])
def list_projects() -> list[Project]:
    return InMemoryStore.list_projects()


@app.get(f'{settings.api_prefix}/projects/{{project_id}}', dependencies=[Depends(require_editor)])
def get_project(project_id: str) -> Project:
    project = InMemoryStore.get_project(project_id)
    if project is not None:
        return project
    raise HTTPException(status_code=404, detail='Project not found')


@app.post(f'{settings.api_prefix}/projects', dependencies=[Depends(require_admin)])
def create_project(payload: dict[str, Any]) -> Project:
    try:
        return InMemoryStore.create_project(payload)
    except Exception as exc:  # pragma: no cover - fail fast on invalid input
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post(f'{settings.api_prefix}/projects/{{project_id}}/advance', dependencies=[Depends(require_admin)])
def advance_project(project_id: str) -> Project:
    try:
        return InMemoryStore.advance_project(project_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.post(f'{settings.api_prefix}/projects/{{project_id}}/ai-brief', dependencies=[Depends(require_editor)])
def generate_project_brief(project_id: str) -> dict[str, Any]:
    provider = AIProviderService(
        provider=settings.ai_provider,
        model=settings.ai_model,
        api_key=settings.openai_api_key,
    )
    for project in InMemoryStore.list_projects():
        if project.id == project_id:
            brief = provider.generate_brief(project.title, project.profile, project.language)
            project.notes = brief if project.notes is None else f'{project.notes}\n\n{brief}'
            return {
                'project_id': project_id,
                'brief': brief,
                'provider': provider.status().provider,
            }
    raise HTTPException(status_code=404, detail='Project not found')


@app.get(f'{settings.api_prefix}/approvals', dependencies=[Depends(require_editor)])
def list_approvals() -> list[ApprovalItem]:
    return InMemoryStore.list_approvals()


@app.get(f'{settings.api_prefix}/jobs', dependencies=[Depends(require_editor)])
def list_jobs() -> list[JobStatus]:
    return InMemoryStore.list_jobs()


@app.post(f'{settings.api_prefix}/jobs', dependencies=[Depends(require_admin)])
def create_job(payload: dict[str, Any]) -> JobStatus:
    try:
        return InMemoryStore.create_job(payload)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post(f'{settings.api_prefix}/jobs/{{job_id}}/trigger', dependencies=[Depends(require_admin)])
def trigger_job(job_id: str) -> dict[str, str]:
    for job in InMemoryStore.list_jobs():
        if job.id == job_id:
            if broker_status()['reachable']:
                try:
                    result = celery_app.send_task('atlas_studio.research_topic', args=[job.task])
                    if getattr(result, 'state', None) == 'SUCCESS':
                        return {'job_id': job_id, 'task_id': str(result.id), 'status': 'completed', 'detail': 'Executed eagerly in local mode'}
                    return {'job_id': job_id, 'task_id': str(result.id), 'status': 'queued'}
                except Exception:  # pragma: no cover - broker may be disconnected in local dev
                    pass

            try:
                result = research_topic.apply(args=[job.task])
                return {'job_id': job_id, 'task_id': 'eager-local', 'status': 'completed', 'detail': str(result.result)}
            except Exception as local_exc:
                return {
                    'job_id': job_id,
                    'task_id': 'offline',
                    'status': 'queued',
                    'detail': f'Local fallback failed: {local_exc}',
                }
    raise HTTPException(status_code=404, detail='Job not found')


@app.get(f'{settings.api_prefix}/summary', dependencies=[Depends(require_editor)])
def summary() -> dict[str, Any]:
    return InMemoryStore.get_summary()


@app.get(f'{settings.api_prefix}/data/export', dependencies=[Depends(require_admin)])
def export_data() -> dict[str, Any]:
    return InMemoryStore.snapshot()


@app.post(f'{settings.api_prefix}/data/reset', dependencies=[Depends(require_admin)])
def reset_data() -> dict[str, Any]:
    return {
        'status': 'reset',
        'summary': InMemoryStore.reset_to_seed(),
    }
