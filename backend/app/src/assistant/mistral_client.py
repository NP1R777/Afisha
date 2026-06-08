from __future__ import annotations

import json
import re
from typing import Any, Iterable

import requests

from core.settings import AppSettings


class MistralClientError(RuntimeError):
    pass


def _require_api_key(settings: AppSettings) -> str:
    if not settings.mistral_api_key:
        raise MistralClientError("MISTRAL_API_KEY не задан.")
    return settings.mistral_api_key


def _headers(settings: AppSettings) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {_require_api_key(settings)}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


def _extract_json_object(raw_text: str) -> dict[str, Any]:
    cleaned = raw_text.strip()

    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", cleaned, flags=re.DOTALL)
    if match:
        parsed = json.loads(match.group(0))
        if isinstance(parsed, dict):
            return parsed

    raise MistralClientError("Не удалось распарсить JSON из ответа Mistral.")


def create_chat_completion(
    settings: AppSettings,
    *,
    messages: list[dict[str, str]],
    model: str | None = None,
    temperature: float = 0.2,
    max_tokens: int = 700,
) -> str:
    payload = {
        "model": model or settings.mistral_chat_model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    response = requests.post(
        f"{settings.mistral_api_base_url.rstrip('/')}/chat/completions",
        headers=_headers(settings),
        json=payload,
        timeout=60,
    )
    response.raise_for_status()
    body = response.json()
    choices = body.get("choices") or []
    if not choices:
        raise MistralClientError("Пустой ответ chat/completions от Mistral.")

    message = choices[0].get("message") or {}
    content = message.get("content")
    if not content:
        raise MistralClientError("В ответе chat/completions отсутствует content.")

    if isinstance(content, list):
        chunks = []
        for item in content:
            if isinstance(item, dict) and item.get("type") == "text":
                chunks.append(item.get("text", ""))
        return "\n".join(chunks).strip()
    return str(content).strip()


def create_chat_json(
    settings: AppSettings,
    *,
    messages: list[dict[str, str]],
    model: str | None = None,
    temperature: float = 0.0,
    max_tokens: int = 500,
) -> dict[str, Any]:
    raw_text = create_chat_completion(
        settings,
        messages=messages,
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return _extract_json_object(raw_text)


def create_embeddings(
    settings: AppSettings,
    *,
    texts: Iterable[str],
    model: str | None = None,
) -> list[list[float]]:
    input_texts = [text.strip() for text in texts if text and text.strip()]
    if not input_texts:
        return []

    payload = {
        "model": model or settings.mistral_embedding_model,
        "input": input_texts,
    }
    response = requests.post(
        f"{settings.mistral_api_base_url.rstrip('/')}/embeddings",
        headers=_headers(settings),
        json=payload,
        timeout=90,
    )
    response.raise_for_status()
    body = response.json()
    data = body.get("data") or []
    if len(data) != len(input_texts):
        raise MistralClientError("Некорректное количество эмбеддингов в ответе Mistral.")

    vectors: list[list[float]] = []
    for item in data:
        embedding = item.get("embedding")
        if not isinstance(embedding, list):
            raise MistralClientError("Ответ эмбеддингов Mistral не содержит валидный вектор.")
        vectors.append([float(value) for value in embedding])
    return vectors
