from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import get_settings
from app.services import InMemoryStore

security = HTTPBearer(auto_error=False)


def create_access_token(subject: str, expires_in_minutes: int = 60 * 12) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload = {
        'sub': subject,
        'iat': int(now.timestamp()),
        'exp': int((now + timedelta(minutes=expires_in_minutes)).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict[str, Any]:
    if credentials is None or credentials.credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Missing bearer token')

    settings = get_settings()
    try:
        payload = jwt.decode(credentials.credentials, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError as exc:  # pragma: no cover - invalid token handling
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token') from exc

    if 'sub' not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Token missing subject')

    user = next((item for item in InMemoryStore.users if item.id == payload['sub']), None)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Unknown user in token')

    return {'user_id': payload['sub'], 'role': user.role}


def require_editor(current: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    if current.get('role') not in {'editor', 'admin'}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Editor access required')
    return current


def require_admin(current: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    if current.get('role') != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Admin access required')
    return current
