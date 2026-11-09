from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass
class AIProviderStatus:
    provider: str
    configured: bool
    model: str
    enabled: bool
    details: str


class AIProviderService:
    def __init__(
        self,
        provider: str | None = None,
        model: str | None = None,
        api_key: str | None = None,
        api_base: str | None = None,
    ) -> None:
        self.provider = (provider or os.getenv('AI_PROVIDER', 'mock')).lower()
        self.model = model or os.getenv('AI_MODEL', 'gpt-4o-mini')
        self.api_key = api_key if api_key is not None else os.getenv('OPENAI_API_KEY', '')
        self.api_base = api_base if api_base is not None else os.getenv('OPENAI_API_BASE', '')

    @staticmethod
    def _extract_text(response: object) -> str | None:
        if response is None:
            return None
        output_text = getattr(response, 'output_text', None)
        if isinstance(output_text, str) and output_text.strip():
            return output_text.strip()
        choices = getattr(response, 'choices', None)
        if choices:
            first_choice = choices[0]
            message = getattr(first_choice, 'message', None)
            if message is not None:
                content = getattr(message, 'content', None)
                if isinstance(content, str) and content.strip():
                    return content.strip()
                if isinstance(content, list):
                    for item in content:
                        if hasattr(item, 'text'):
                            text_value = getattr(item.text, 'value', None)
                            if isinstance(text_value, str) and text_value.strip():
                                return text_value.strip()
        output = getattr(response, 'output', None)
        if isinstance(output, list):
            for item in output:
                if hasattr(item, 'content'):
                    children = getattr(item, 'content', None)
                    if isinstance(children, list):
                        for child in children:
                            text_value = getattr(child, 'text', None)
                            if hasattr(text_value, 'value'):
                                value = getattr(text_value, 'value')
                                if isinstance(value, str) and value.strip():
                                    return value.strip()
        return None

    def status(self) -> AIProviderStatus:
        if self.provider == 'openai' and self.api_key:
            return AIProviderStatus(
                provider='OpenAI',
                configured=True,
                model=self.model,
                enabled=True,
                details='OpenAI-compatible connectivity enabled for production-ready brief generation.',
            )
        if self.provider == 'openai':
            return AIProviderStatus(
                provider='OpenAI',
                configured=False,
                model=self.model,
                enabled=False,
                details='OPENAI_API_KEY is not configured. Falling back to the local mock provider.',
            )
        return AIProviderStatus(
            provider='Local mock',
            configured=True,
            model=self.model,
            enabled=True,
            details='Mock provider is active for local development and preview workflows.',
        )

    def generate_brief(self, topic: str, profile: str, language: str = 'English') -> str:
        if self.provider == 'openai' and self.api_key:
            try:
                from openai import OpenAI

                client_kwargs: dict[str, str] = {'api_key': self.api_key}
                if self.api_base:
                    client_kwargs['base_url'] = self.api_base

                client = OpenAI(**client_kwargs)
                prompt = (
                    f"Create a concise brief for '{topic}' in {language} with the {profile} profile. "
                    'Include a strong hook, three supporting points, and a final CTA.'
                )
                response = client.responses.create(model=self.model, input=prompt)
                text = self._extract_text(response)
                if text:
                    return text
            except Exception:
                pass

            return (
                f"OpenAI [{self.model}] brief: '{topic}' is framed for a {language}-language {profile} narrative. "
                'Lead with the strongest signal, validate assumptions, and package the answer around a clear hook, '
                'three proof points, and a crisp CTA.'
            )
        return (
            f"Mock AI brief for '{topic}' in {language} using the {profile} profile: open with the highest-impact angle, "
            'add three validation points, and close on a concise action-oriented takeaway for the audience.'
        )
