from __future__ import annotations

import asyncio
from typing import Any, Type, TypeVar

try:
    from motor.motor_asyncio import AsyncIOMotorClient
except Exception:  # pragma: no cover - optional dependency for local dev fallback
    AsyncIOMotorClient = None  # type: ignore[assignment]

from app.config import get_settings
from app.schemas import ApprovalItem, ContentProfile, JobStatus, KPI, Project, User

T = TypeVar('T')


class MongoRepository:
    _client: AsyncIOMotorClient | None = None

    @classmethod
    def client(cls) -> AsyncIOMotorClient | None:
        if AsyncIOMotorClient is None:
            return None
        settings = get_settings()
        if not settings.mongo_uri or not settings.mongo_uri.strip():
            return None
        if cls._client is None:
            cls._client = AsyncIOMotorClient(settings.mongo_uri, serverSelectionTimeoutMS=2000)
        return cls._client

    @classmethod
    def is_available(cls) -> bool:
        client = cls.client()
        if client is None:
            return False
        try:
            return asyncio.run(cls._ping())
        except RuntimeError:
            loop = asyncio.new_event_loop()
            try:
                return loop.run_until_complete(cls._ping())
            finally:
                loop.close()
        except Exception:
            return False

    @classmethod
    async def _ping(cls) -> bool:
        client = cls.client()
        if client is None:
            return False
        try:
            await client.admin.command('ping')
            return True
        except Exception:
            return False

    @classmethod
    def _database(cls):
        client = cls.client()
        if client is None:
            raise RuntimeError('MongoDB is not configured')
        settings = get_settings()
        db_name = settings.mongo_db_name or 'atlas_studio'
        return client[db_name]

    @staticmethod
    def _strip_id(document: dict[str, Any]) -> dict[str, Any]:
        if '_id' in document:
            document = dict(document)
            del document['_id']
        return document

    @classmethod
    def _run(cls, coroutine):
        try:
            return asyncio.run(coroutine)
        except RuntimeError:
            loop = asyncio.new_event_loop()
            try:
                return loop.run_until_complete(coroutine)
            finally:
                loop.close()

    @classmethod
    def list_profiles(cls) -> list[ContentProfile]:
        async def _inner() -> list[ContentProfile]:
            records = await cls._database()['profiles'].find({}).to_list(length=None)
            return [ContentProfile(**cls._strip_id(record)) for record in records]

        return cls._run(_inner())

    @classmethod
    def create_profile(cls, payload: dict[str, Any]) -> ContentProfile:
        profile = ContentProfile(**payload)

        async def _inner() -> ContentProfile:
            collection = cls._database()['profiles']
            document = profile.model_dump(mode='json')
            await collection.replace_one({'id': profile.id}, document, upsert=True)
            return profile

        return cls._run(_inner())

    @classmethod
    def update_profile(cls, profile_id: str, payload: dict[str, Any]) -> ContentProfile:
        async def _inner() -> ContentProfile:
            collection = cls._database()['profiles']
            existing = await collection.find_one({'id': profile_id})
            if existing is None:
                raise ValueError(f'Profile {profile_id} not found')
            updated = ContentProfile(**{**cls._strip_id(existing), **payload})
            await collection.replace_one({'id': profile_id}, updated.model_dump(mode='json'))
            return updated

        return cls._run(_inner())

    @classmethod
    def duplicate_profile(cls, profile_id: str) -> ContentProfile:
        async def _inner() -> ContentProfile:
            collection = cls._database()['profiles']
            existing = await collection.find_one({'id': profile_id})
            if existing is None:
                raise ValueError(f'Profile {profile_id} not found')
            profile = ContentProfile(**cls._strip_id(existing))
            clone = profile.model_copy()
            clone.id = f'{profile.id}-copy'
            clone.name = f'{profile.name} Copy'
            await collection.insert_one(clone.model_dump(mode='json'))
            return clone

        return cls._run(_inner())

    @classmethod
    def delete_profile(cls, profile_id: str) -> None:
        async def _inner() -> None:
            result = await cls._database()['profiles'].delete_one({'id': profile_id})
            if result.deleted_count == 0:
                raise ValueError(f'Profile {profile_id} not found')

        cls._run(_inner())

    @classmethod
    def list_projects(cls) -> list[Project]:
        async def _inner() -> list[Project]:
            records = await cls._database()['projects'].find({}).to_list(length=None)
            return [Project(**cls._strip_id(record)) for record in records]

        return cls._run(_inner())

    @classmethod
    def get_project(cls, project_id: str) -> Project | None:
        async def _inner() -> Project | None:
            record = await cls._database()['projects'].find_one({'id': project_id})
            if record is None:
                return None
            return Project(**cls._strip_id(record))

        return cls._run(_inner())

    @classmethod
    def create_project(cls, payload: dict[str, Any]) -> Project:
        project = Project(**payload)

        async def _inner() -> Project:
            collection = cls._database()['projects']
            await collection.replace_one({'id': project.id}, project.model_dump(mode='json'), upsert=True)
            return project

        return cls._run(_inner())

    @classmethod
    def advance_project(cls, project_id: str) -> Project:
        async def _inner() -> Project:
            collection = cls._database()['projects']
            existing = await collection.find_one({'id': project_id})
            if existing is None:
                raise ValueError(f'Project {project_id} not found')
            project = Project(**cls._strip_id(existing))
            total_steps = max(1, len(project.workflow_steps))
            next_index = min(project.current_stage_index + 1, total_steps - 1)
            project.current_stage_index = next_index
            project.progress = min(100, int(((next_index + 1) / total_steps) * 100))
            project.status = 'Ready for review' if next_index >= total_steps - 1 else 'In production'
            await collection.replace_one({'id': project_id}, project.model_dump(mode='json'))
            return project

        return cls._run(_inner())

    @classmethod
    def list_approvals(cls) -> list[ApprovalItem]:
        async def _inner() -> list[ApprovalItem]:
            records = await cls._database()['approvals'].find({}).to_list(length=None)
            return [ApprovalItem(**cls._strip_id(record)) for record in records]

        return cls._run(_inner())

    @classmethod
    def list_jobs(cls) -> list[JobStatus]:
        async def _inner() -> list[JobStatus]:
            records = await cls._database()['jobs'].find({}).to_list(length=None)
            return [JobStatus(**cls._strip_id(record)) for record in records]

        return cls._run(_inner())

    @classmethod
    def create_job(cls, payload: dict[str, Any]) -> JobStatus:
        job = JobStatus(**payload)

        async def _inner() -> JobStatus:
            collection = cls._database()['jobs']
            await collection.replace_one({'id': job.id}, job.model_dump(mode='json'), upsert=True)
            return job

        return cls._run(_inner())

    @classmethod
    def authenticate_user(cls, email: str, password: str) -> User | None:
        if email == 'admin@atlasstudio.local' and password == 'admin123':
            return User(id='admin-1', email=email, name='Admin User', role='admin')
        if email == 'editor@atlasstudio.local' and password == 'editor123':
            return User(id='editor-1', email=email, name='Content Editor', role='editor')
        return None

    @classmethod
    def get_user_by_id(cls, user_id: str) -> User | None:
        if user_id == 'admin-1':
            return User(id='admin-1', email='admin@atlasstudio.local', name='Admin User', role='admin')
        if user_id == 'editor-1':
            return User(id='editor-1', email='editor@atlasstudio.local', name='Content Editor', role='editor')
        return None

    @classmethod
    def get_summary(cls) -> dict[str, Any]:
        return {
            'profiles_count': len(cls.list_profiles()),
            'projects_count': len(cls.list_projects()),
            'approval_count': len(cls.list_approvals()),
            'enabled_profiles': sum(1 for item in cls.list_profiles() if item.status == 'enabled'),
            'jobs_count': len(cls.list_jobs()),
            'kpis': [kpi.model_dump(mode='json') for kpi in []],
        }

    @classmethod
    def snapshot(cls) -> dict[str, Any]:
        return {
            'profiles': [profile.model_dump(mode='json') for profile in cls.list_profiles()],
            'projects': [project.model_dump(mode='json') for project in cls.list_projects()],
            'approvals': [approval.model_dump(mode='json') for approval in cls.list_approvals()],
            'users': [user.model_dump(mode='json') for user in [cls.get_user_by_id('admin-1'), cls.get_user_by_id('editor-1')] if user],
            'kpis': [],
            'jobs': [job.model_dump(mode='json') for job in cls.list_jobs()],
        }

    @classmethod
    def seed_from_snapshot(cls, snapshot: dict[str, Any]) -> None:
        if not snapshot:
            return

        async def _inner() -> None:
            database = cls._database()
            for collection_name, items in {
                'profiles': snapshot.get('profiles', []),
                'projects': snapshot.get('projects', []),
                'approvals': snapshot.get('approvals', []),
                'jobs': snapshot.get('jobs', []),
            }.items():
                if not items:
                    continue
                collection = database[collection_name]
                for item in items:
                    await collection.replace_one({'id': item.get('id')}, item, upsert=True)

        cls._run(_inner())
