import json
from pathlib import Path
from typing import Any

from app.config import get_settings
from app.repository import MongoRepository
from app.schemas import ApprovalItem, ContentProfile, JobStatus, KPI, Project, User


profiles_seed: list[ContentProfile] = [
    ContentProfile(
        id='current-affairs',
        name='Current Affairs',
        category='News & Commentary',
        description='Tracks recent events with sourcing, fact checking, and polished explainer narratives.',
        status='enabled',
        languages=['English', 'French', 'Spanish'],
        formats=['16:9', '9:16'],
        destinations=['YouTube', 'LinkedIn', 'X'],
        workflow_steps=['Research', 'Fact check', 'Script', 'Voiceover', 'Render', 'Approval'],
        default_duration_minutes=5,
    ),
    ContentProfile(
        id='breaking-news',
        name='Breaking News',
        category='Realtime Coverage',
        description='Fast-turn content system optimized for high-velocity publication windows.',
        status='enabled',
        languages=['English', 'Arabic', 'Portuguese'],
        formats=['16:9'],
        destinations=['YouTube', 'Instagram', 'TikTok'],
        workflow_steps=['Auto-discovery', 'Summarize', 'Script', 'Publish'],
        default_duration_minutes=3,
    ),
    ContentProfile(
        id='product-explainer',
        name='Product Explainer',
        category='Marketing',
        description='Story-driven product demos and feature walkthroughs.',
        status='draft',
        languages=['English', 'Japanese'],
        formats=['16:9', '1:1'],
        destinations=['YouTube', 'LinkedIn', 'Webinars'],
        workflow_steps=['Brief', 'Research', 'Storyboard', 'Voiceover', 'Export'],
        default_duration_minutes=7,
    ),
]

projects_seed: list[Project] = [
    Project(
        id='PRJ-1041',
        title='AI chip exports reshape enterprise strategy',
        profile='Current Affairs',
        status='Ready for review',
        owner='Maya Patel',
        progress=82,
        duration='4:20',
        language='English',
        workflow_steps=['Research', 'Fact check', 'Script', 'Voiceover', 'Render', 'Approval'],
        current_stage_index=4,
        notes='Queued for stakeholder sign-off before publishing.',
    ),
    Project(
        id='PRJ-1009',
        title='Construction robotics in emerging markets',
        profile='Research Story',
        status='In production',
        owner='Omar Hassan',
        progress=58,
        duration='6:10',
        language='Arabic',
        workflow_steps=['Brief', 'Research', 'Storyboard', 'Voiceover', 'Export'],
        current_stage_index=2,
        notes='Regional market data collection is still in progress.',
    ),
]

approval_seed: list[ApprovalItem] = [
    ApprovalItem(id='APR-23', title='Global EV battery boom', stage='Script review', reviewer='Rina Gomez', urgency='High'),
    ApprovalItem(id='APR-24', title='Climate grid resilience plan', stage='Voiceover QA', reviewer='Jules Martin', urgency='Medium'),
]

users_seed: list[User] = [
    User(id='admin-1', email='admin@atlasstudio.local', name='Admin User', role='admin'),
    User(id='editor-1', email='editor@atlasstudio.local', name='Content Editor', role='editor'),
]

kpis_seed: list[KPI] = [
    KPI(label='Active workspaces', value='148', change='+18%'),
    KPI(label='Published this week', value='46', change='+13%'),
    KPI(label='Avg. approval time', value='2.4h', change='-21%'),
    KPI(label='Automation success', value='96.8%', change='+3.4%'),
]

jobs_seed: list[JobStatus] = [
    JobStatus(
        id='job-101',
        project_id='PRJ-1041',
        task='Research synthesis',
        status='running',
        progress=72,
        created_at='2026-11-09T12:00:00Z',
        updated_at='2026-11-09T12:04:00Z',
        result='Aggregating sources and validating claims',
    ),
    JobStatus(
        id='job-102',
        project_id='PRJ-1009',
        task='Voiceover generation',
        status='queued',
        progress=18,
        created_at='2026-11-09T12:08:00Z',
        updated_at='2026-11-09T12:08:00Z',
        result='Awaiting TTS engine availability',
    ),
]


class InMemoryStore:
    profiles: list[ContentProfile] = profiles_seed.copy()
    projects: list[Project] = projects_seed.copy()
    approvals: list[ApprovalItem] = approval_seed.copy()
    users: list[User] = users_seed.copy()
    kpis: list[KPI] = kpis_seed.copy()
    jobs: list[JobStatus] = jobs_seed.copy()

    @staticmethod
    def uses_mongo() -> bool:
        try:
            return MongoRepository.is_available()
        except Exception:
            return False

    @classmethod
    def sync_from_mongo_if_needed(cls) -> None:
        if not cls.uses_mongo():
            return
        snapshot = MongoRepository.snapshot()
        if snapshot.get('profiles'):
            cls.profiles = [ContentProfile(**item) for item in snapshot['profiles']]
        if snapshot.get('projects'):
            cls.projects = [Project(**item) for item in snapshot['projects']]
        if snapshot.get('approvals'):
            cls.approvals = [ApprovalItem(**item) for item in snapshot['approvals']]
        if snapshot.get('jobs'):
            cls.jobs = [JobStatus(**item) for item in snapshot['jobs']]

    @staticmethod
    def _data_path() -> Path:
        settings = get_settings()
        data_path = Path(settings.local_data_path)
        if data_path.is_absolute():
            return data_path
        return Path(__file__).resolve().parents[1] / data_path

    @classmethod
    def _persist(cls) -> None:
        data_file = cls._data_path()
        data_file.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            'profiles': [profile.model_dump(mode='json') for profile in cls.profiles],
            'projects': [project.model_dump(mode='json') for project in cls.projects],
            'approvals': [approval.model_dump(mode='json') for approval in cls.approvals],
            'users': [user.model_dump(mode='json') for user in cls.users],
            'kpis': [kpi.model_dump(mode='json') for kpi in cls.kpis],
            'jobs': [job.model_dump(mode='json') for job in cls.jobs],
        }
        data_file.write_text(json.dumps(payload, indent=2), encoding='utf-8')

    @classmethod
    def _load(cls) -> None:
        data_file = cls._data_path()
        if not data_file.exists():
            return
        try:
            payload = json.loads(data_file.read_text(encoding='utf-8'))
        except (OSError, json.JSONDecodeError):
            return
        if not isinstance(payload, dict):
            return
        if isinstance(payload.get('profiles'), list):
            cls.profiles = [ContentProfile(**item) for item in payload['profiles']]
        if isinstance(payload.get('projects'), list):
            cls.projects = [Project(**item) for item in payload['projects']]
        if isinstance(payload.get('approvals'), list):
            cls.approvals = [ApprovalItem(**item) for item in payload['approvals']]
        if isinstance(payload.get('users'), list):
            cls.users = [User(**item) for item in payload['users']]
        if isinstance(payload.get('kpis'), list):
            cls.kpis = [KPI(**item) for item in payload['kpis']]
        if isinstance(payload.get('jobs'), list):
            cls.jobs = [JobStatus(**item) for item in payload['jobs']]

    @classmethod
    def list_profiles(cls) -> list[ContentProfile]:
        if cls.uses_mongo():
            try:
                return MongoRepository.list_profiles()
            except Exception:
                pass
        return cls.profiles

    @classmethod
    def get_profile(cls, profile_id: str) -> ContentProfile | None:
        for profile in cls.list_profiles():
            if profile.id == profile_id:
                return profile
        return None

    @classmethod
    def list_projects(cls) -> list[Project]:
        if cls.uses_mongo():
            try:
                return MongoRepository.list_projects()
            except Exception:
                pass
        return cls.projects

    @classmethod
    def get_project(cls, project_id: str) -> Project | None:
        if cls.uses_mongo():
            try:
                return MongoRepository.get_project(project_id)
            except Exception:
                pass
        for project in cls.projects:
            if project.id == project_id:
                return project
        return None

    @classmethod
    def list_approvals(cls) -> list[ApprovalItem]:
        if cls.uses_mongo():
            try:
                return MongoRepository.list_approvals()
            except Exception:
                pass
        return cls.approvals

    @classmethod
    def list_jobs(cls) -> list[JobStatus]:
        if cls.uses_mongo():
            try:
                return MongoRepository.list_jobs()
            except Exception:
                pass
        return cls.jobs

    @classmethod
    def create_profile(cls, payload: dict[str, Any]) -> ContentProfile:
        if cls.uses_mongo():
            try:
                return MongoRepository.create_profile(payload)
            except Exception:
                pass
        profile = ContentProfile(**payload)
        cls.profiles.append(profile)
        cls._persist()
        return profile

    @classmethod
    def update_profile(cls, profile_id: str, payload: dict[str, Any]) -> ContentProfile:
        if cls.uses_mongo():
            try:
                return MongoRepository.update_profile(profile_id, payload)
            except Exception:
                pass
        for index, profile in enumerate(cls.profiles):
            if profile.id == profile_id:
                updated = profile.model_copy(update=payload)
                cls.profiles[index] = updated
                cls._persist()
                return updated
        raise ValueError(f'Profile {profile_id} not found')

    @classmethod
    def duplicate_profile(cls, profile_id: str) -> ContentProfile:
        if cls.uses_mongo():
            try:
                return MongoRepository.duplicate_profile(profile_id)
            except Exception:
                pass
        for profile in cls.profiles:
            if profile.id == profile_id:
                clone = profile.model_copy()
                clone.id = f'{profile.id}-copy'
                clone.name = f'{profile.name} Copy'
                cls.profiles.append(clone)
                cls._persist()
                return clone
        raise ValueError(f'Profile {profile_id} not found')

    @classmethod
    def delete_profile(cls, profile_id: str) -> None:
        if cls.uses_mongo():
            try:
                MongoRepository.delete_profile(profile_id)
                return
            except Exception:
                pass
        original_count = len(cls.profiles)
        cls.profiles = [profile for profile in cls.profiles if profile.id != profile_id]
        if len(cls.profiles) == original_count:
            raise ValueError(f'Profile {profile_id} not found')
        cls._persist()

    @classmethod
    def get_profile_for_project(cls, profile_name: str | None) -> ContentProfile | None:
        if not profile_name:
            return None
        normalized = profile_name.strip().lower()
        for profile in cls.profiles:
            if profile.id.lower() == normalized or profile.name.lower() == normalized:
                return profile
        return None

    @classmethod
    def default_workflow_for_profile(cls, profile_name: str | None) -> list[str]:
        profile = cls.get_profile_for_project(profile_name)
        if profile is not None and profile.workflow_steps:
            return profile.workflow_steps
        return ['Research', 'Script', 'Voice', 'Render', 'Approval']

    @classmethod
    def create_project(cls, payload: dict[str, Any]) -> Project:
        if cls.uses_mongo():
            try:
                return MongoRepository.create_project(payload)
            except Exception:
                pass
        normalized = dict(payload)
        if not normalized.get('workflow_steps'):
            normalized['workflow_steps'] = cls.default_workflow_for_profile(normalized.get('profile'))
        if 'current_stage_index' not in normalized or normalized['current_stage_index'] is None:
            normalized['current_stage_index'] = 0
        if 'id' not in normalized or not normalized['id']:
            normalized['id'] = f"PRJ-{len(cls.projects) + 1000}"
        if 'duration' not in normalized or not normalized['duration']:
            profile = cls.get_profile_for_project(normalized.get('profile'))
            normalized['duration'] = f"{(profile.default_duration_minutes if profile else 5):02d}:00" if profile else '5:00'
        normalized['progress'] = min(100, max(0, normalized.get('progress', 15)))
        project = Project(**normalized)
        cls.projects.append(project)
        cls._persist()
        return project

    @classmethod
    def advance_project(cls, project_id: str) -> Project:
        if cls.uses_mongo():
            try:
                return MongoRepository.advance_project(project_id)
            except Exception:
                pass
        for index, project in enumerate(cls.projects):
            if project.id == project_id:
                total_steps = max(1, len(project.workflow_steps))
                next_index = min(project.current_stage_index + 1, total_steps - 1)
                project.current_stage_index = next_index
                project.progress = min(100, int(((next_index + 1) / total_steps) * 100))
                project.status = 'Ready for review' if next_index >= total_steps - 1 else 'In production'
                cls.projects[index] = project
                cls._persist()
                return project
        raise ValueError(f'Project {project_id} not found')

    @classmethod
    def create_job(cls, payload: dict[str, Any]) -> JobStatus:
        if cls.uses_mongo():
            try:
                return MongoRepository.create_job(payload)
            except Exception:
                pass
        job = JobStatus(**payload)
        cls.jobs.append(job)
        cls._persist()
        return job

    @classmethod
    def update_job(cls, job_id: str, payload: dict[str, Any]) -> JobStatus:
        if cls.uses_mongo():
            try:
                mongo = MongoRepository.create_job({**payload, 'id': job_id})
                return mongo
            except Exception:
                pass
        for index, job in enumerate(cls.jobs):
            if job.id == job_id:
                updated = job.model_copy(update=payload)
                cls.jobs[index] = updated
                cls._persist()
                return updated
        raise ValueError(f'Job {job_id} not found')

    @classmethod
    def authenticate_user(cls, email: str, password: str) -> User | None:
        if email == 'admin@atlasstudio.local' and password == 'admin123':
            return next(user for user in cls.users if user.email == email)
        if email == 'editor@atlasstudio.local' and password == 'editor123':
            return next(user for user in cls.users if user.email == email)
        return None

    @classmethod
    def get_summary(cls) -> dict[str, Any]:
        return {
            'profiles_count': len(cls.profiles),
            'projects_count': len(cls.projects),
            'approval_count': len(cls.approvals),
            'enabled_profiles': sum(1 for profile in cls.profiles if profile.status == 'enabled'),
            'jobs_count': len(cls.jobs),
            'kpis': [item.model_dump() for item in cls.kpis],
        }

    @classmethod
    def snapshot(cls) -> dict[str, Any]:
        return {
            'profiles': [profile.model_dump(mode='json') for profile in cls.profiles],
            'projects': [project.model_dump(mode='json') for project in cls.projects],
            'approvals': [approval.model_dump(mode='json') for approval in cls.approvals],
            'users': [user.model_dump(mode='json') for user in cls.users],
            'kpis': [kpi.model_dump(mode='json') for kpi in cls.kpis],
            'jobs': [job.model_dump(mode='json') for job in cls.jobs],
        }

    @classmethod
    def reset_to_seed(cls) -> dict[str, Any]:
        cls.profiles = profiles_seed.copy()
        cls.projects = projects_seed.copy()
        cls.approvals = approval_seed.copy()
        cls.users = users_seed.copy()
        cls.kpis = kpis_seed.copy()
        cls.jobs = jobs_seed.copy()
        cls._persist()
        return cls.get_summary()


InMemoryStore._load()
