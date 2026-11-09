from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class DatabaseStatus:
    provider: str
    connected: bool
    uri_configured: bool
    details: str


class DatabaseManager:
    @staticmethod
    def status() -> DatabaseStatus:
        from app.config import get_settings
        from app.repository import MongoRepository

        settings = get_settings()
        configured = bool(settings.mongo_uri and settings.mongo_uri.strip())
        if configured and MongoRepository.is_available():
            return DatabaseStatus(
                provider='MongoDB Atlas / Motor',
                connected=True,
                uri_configured=True,
                details='MongoDB URI detected and reachable; Atlas-backed collections are active.',
            )

        if configured:
            return DatabaseStatus(
                provider='MongoDB Atlas / Motor',
                connected=False,
                uri_configured=True,
                details='MongoDB URI is configured but the server is unreachable. Falling back to local JSON persistence.',
            )

        return DatabaseStatus(
            provider='Local JSON persistence',
            connected=True,
            uri_configured=True,
            details=f'Using local JSON file at {settings.local_data_path} for durable local development.',
        )
