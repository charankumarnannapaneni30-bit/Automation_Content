from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = 'Atlas Studio'
    app_env: str = 'development'
    api_prefix: str = '/api'
    mongo_uri: str = ''
    mongo_db_name: str = 'atlas_studio'
    redis_url: str = ''
    celery_broker_url: str = ''
    celery_result_backend: str = ''
    celery_task_always_eager: bool = True
    jwt_secret: str = 'dev-secret'
    jwt_algorithm: str = 'HS256'
    ai_provider: str = 'mock'
    ai_model: str = 'gpt-4o-mini'
    openai_api_key: str = ''
    openai_api_base: str = ''
    openai_organization: str = ''
    local_data_path: str = 'data/atlas_studio_local.json'

    model_config = SettingsConfigDict(env_file='.env', extra='ignore')


@lru_cache
def get_settings() -> Settings:
    return Settings()
