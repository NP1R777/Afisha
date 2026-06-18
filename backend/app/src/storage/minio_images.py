from __future__ import annotations

import hashlib
import io
import json
from dataclasses import dataclass
from urllib.parse import urlparse

import requests
from minio import Minio

from core.settings import AppSettings


ALLOWED_IMAGE_MIME_TYPES: dict[str, str] = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}


_READY_BUCKETS: set[tuple[str, str]] = set()


@dataclass
class ImageUploadResult:
    final_url: str | None
    uploaded: bool
    fallback_used: bool
    error: str | None = None


def is_minio_configured(settings: AppSettings) -> bool:
    return bool(
        settings.minio_endpoint
        and settings.minio_access_key
        and settings.minio_secret_key
        and settings.minio_bucket
        and settings.minio_public_base_url
    )


def is_minio_public_url(url: str | None, settings: AppSettings) -> bool:
    value = (url or "").strip()
    base = (settings.minio_public_base_url or "").strip().rstrip("/")
    return bool(value and base and value.startswith(f"{base}/"))


def upload_image_from_url(
    *,
    settings: AppSettings,
    image_url: str | None,
    object_prefix: str = "events",
) -> ImageUploadResult:
    source_url = (image_url or "").strip()
    if not source_url:
        return ImageUploadResult(
            final_url=None,
            uploaded=False,
            fallback_used=True,
            error="empty image URL",
        )

    if not is_minio_configured(settings):
        return ImageUploadResult(
            final_url=source_url,
            uploaded=False,
            fallback_used=True,
            error="minio not configured",
        )

    if is_minio_public_url(source_url, settings):
        return ImageUploadResult(
            final_url=source_url,
            uploaded=False,
            fallback_used=False,
            error=None,
        )

    max_size_bytes = max(1, settings.minio_max_image_size_mb) * 1024 * 1024
    timeout = max(1, settings.minio_request_timeout_sec)
    downloaded = _download_image_bytes(
        image_url=source_url,
        timeout=timeout,
        max_size_bytes=max_size_bytes,
    )
    if downloaded is None:
        return ImageUploadResult(
            final_url=source_url,
            uploaded=False,
            fallback_used=True,
            error="image download failed or invalid mime/size",
        )

    image_bytes, content_type = downloaded
    extension = ALLOWED_IMAGE_MIME_TYPES[content_type]
    digest = hashlib.sha256(image_bytes).hexdigest()
    object_name = f"{object_prefix.strip('/')}/{digest}.{extension}"

    try:
        client = _create_minio_client(settings)
        _ensure_bucket_public(client=client, settings=settings)
        client.put_object(
            settings.minio_bucket,
            object_name,
            data=io.BytesIO(image_bytes),
            length=len(image_bytes),
            content_type=content_type,
        )
    except Exception as exc:
        return ImageUploadResult(
            final_url=source_url,
            uploaded=False,
            fallback_used=True,
            error=str(exc)[:300],
        )

    return ImageUploadResult(
        final_url=_build_public_url(settings=settings, object_name=object_name),
        uploaded=True,
        fallback_used=False,
        error=None,
    )


def _download_image_bytes(
    *,
    image_url: str,
    timeout: int,
    max_size_bytes: int,
) -> tuple[bytes, str] | None:
    try:
        response = requests.get(image_url, timeout=timeout, stream=True)
        response.raise_for_status()
    except requests.RequestException:
        return None

    content_type = (response.headers.get("Content-Type") or "").split(";")[0].strip().lower()
    if content_type == "image/jpg":
        content_type = "image/jpeg"
    if content_type not in ALLOWED_IMAGE_MIME_TYPES:
        return None

    content = bytearray()
    for chunk in response.iter_content(chunk_size=65536):
        if not chunk:
            continue
        content.extend(chunk)
        if len(content) > max_size_bytes:
            return None

    if not content:
        return None

    return bytes(content), content_type


def _normalize_endpoint_and_secure(settings: AppSettings) -> tuple[str, bool]:
    endpoint_raw = (settings.minio_endpoint or "").strip()
    secure = bool(settings.minio_secure)
    if "://" not in endpoint_raw:
        return endpoint_raw, secure

    parsed = urlparse(endpoint_raw)
    endpoint = parsed.netloc or parsed.path
    if parsed.scheme:
        secure = parsed.scheme == "https"
    return endpoint, secure


def _create_minio_client(settings: AppSettings) -> Minio:
    endpoint, secure = _normalize_endpoint_and_secure(settings)
    return Minio(
        endpoint=endpoint,
        access_key=settings.minio_access_key,
        secret_key=settings.minio_secret_key,
        secure=secure,
    )


def _ensure_bucket_public(*, client: Minio, settings: AppSettings) -> None:
    endpoint, _ = _normalize_endpoint_and_secure(settings)
    bucket_name = settings.minio_bucket
    cache_key = (endpoint, bucket_name)
    if cache_key in _READY_BUCKETS:
        return

    if not client.bucket_exists(bucket_name):
        client.make_bucket(bucket_name)

    public_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {"AWS": ["*"]},
                "Action": ["s3:GetObject"],
                "Resource": [f"arn:aws:s3:::{bucket_name}/*"],
            }
        ],
    }
    client.set_bucket_policy(bucket_name, json.dumps(public_policy))
    _READY_BUCKETS.add(cache_key)


def _build_public_url(*, settings: AppSettings, object_name: str) -> str:
    base = (settings.minio_public_base_url or "").rstrip("/")
    return f"{base}/{settings.minio_bucket}/{object_name}"
