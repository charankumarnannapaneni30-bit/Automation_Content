from typing import Literal
from pydantic import BaseModel, Field


class User(BaseModel):
    id: str
    email: str
    name: str
    role: Literal['admin', 'editor', 'viewer'] = 'editor'


class AuthRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = 'bearer'
    user: User


class ContentProfile(BaseModel):
    id: str
    name: str
    category: str
    description: str
    status: Literal['enabled', 'draft', 'archived'] = 'enabled'
    languages: list[str] = Field(default_factory=list)
    formats: list[str] = Field(default_factory=list)
    destinations: list[str] = Field(default_factory=list)
    workflow_steps: list[str] = Field(default_factory=lambda: ['Research', 'Script', 'Voice', 'Render', 'Approval'])
    default_duration_minutes: int = 5


class Project(BaseModel):
    id: str
    title: str
    profile: str
    status: Literal['Ready for review', 'In production', 'Queued', 'Needs edits']
    owner: str
    progress: int = Field(ge=0, le=100)
    duration: str
    language: str
    created_by: str = 'system'
    workflow_steps: list[str] = Field(default_factory=lambda: ['Research', 'Script', 'Voice', 'Render', 'Approval'])
    current_stage_index: int = 0
    notes: str | None = None


class ApprovalItem(BaseModel):
    id: str
    title: str
    stage: str
    reviewer: str
    urgency: Literal['High', 'Medium', 'Low']


class KPI(BaseModel):
    label: str
    value: str
    change: str


class JobStatus(BaseModel):
    id: str
    project_id: str
    task: str
    status: Literal['queued', 'running', 'completed', 'failed'] = 'queued'
    progress: int = Field(ge=0, le=100)
    created_at: str
    updated_at: str
    result: str | None = None
