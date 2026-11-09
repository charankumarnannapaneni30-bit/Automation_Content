from __future__ import annotations

from celery import shared_task


@shared_task(name='atlas_studio.research_topic')
def research_topic(topic: str, language: str = 'English') -> str:
    return f'Researched {topic} in {language} and prepared a source brief.'


@shared_task(name='atlas_studio.generate_script')
def generate_script(topic: str, profile: str = 'Current Affairs') -> str:
    return f'Generated script for {topic} using {profile} template.'


@shared_task(name='atlas_studio.render_video')
def render_video(project_id: str) -> str:
    return f'Video render finished for {project_id}.'
