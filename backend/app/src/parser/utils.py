import re
from datetime import datetime
from typing import Optional
from urllib.parse import urljoin


MONTHS_RU = {
    "января": "01",
    "февраля": "02",
    "марта": "03",
    "апреля": "04",
    "мая": "05",
    "июня": "06",
    "июля": "07",
    "августа": "08",
    "сентября": "09",
    "октября": "10",
    "ноября": "11",
    "декабря": "12",
}


def clean_text(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    text = re.sub(r"\s+", " ", value).strip()
    return text or None


def normalize_event_date(value: Optional[str], *, default_year: Optional[int] = None) -> Optional[str]:
    text = clean_text(value)
    if not text:
        return None

    direct = re.search(r"\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b", text)
    if direct:
        day = int(direct.group(1))
        month = int(direct.group(2))
        year = int(direct.group(3))
        try:
            return datetime(year, month, day).strftime("%d.%m.%Y")
        except ValueError:
            return None

    ru_month = re.search(
        r"\b(\d{1,2})\s+("
        + "|".join(MONTHS_RU.keys())
        + r")\s*(\d{4})?\b",
        text.lower(),
    )
    if ru_month:
        day = int(ru_month.group(1))
        month_name = ru_month.group(2)
        year = int(ru_month.group(3) or default_year or datetime.now().year)
        month = int(MONTHS_RU[month_name])
        try:
            return datetime(year, month, day).strftime("%d.%m.%Y")
        except ValueError:
            return None

    return None


def extract_first_time(value: Optional[str]) -> Optional[str]:
    text = clean_text(value)
    if not text:
        return None
    match = re.search(r"\b([01]?\d|2[0-3]):([0-5]\d)\b", text)
    if not match:
        return None
    return f"{int(match.group(1)):02d}:{match.group(2)}"


def normalize_duration(value: Optional[str]) -> Optional[str]:
    normalized_time = extract_first_time(value)
    if normalized_time:
        return normalized_time
    text = clean_text(value)
    if not text:
        return None
    if len(text) > 20:
        return None
    return text


def normalize_price(value: Optional[str]) -> Optional[str]:
    text = clean_text(value)
    if not text:
        return None
    lowered = text.lower()
    if "бесплат" in lowered:
        return "0"
    match = re.search(r"(от\s*)?(\d[\d\s]*)\s*(₽|руб\.?|рублей)", text, flags=re.IGNORECASE)
    if not match:
        return None
    prefix = "от " if match.group(1) else ""
    amount = re.sub(r"\s+", "", match.group(2))
    return f"{prefix}{amount} ₽"


def normalize_age_limit(value: Optional[str]) -> Optional[str]:
    text = clean_text(value)
    if not text:
        return None
    match = re.search(r"\b(0|6|12|14|16|18)\+\b", text)
    if match:
        return f"{match.group(1)}+"
    return None


def absolute_url(base_url: str, maybe_relative: Optional[str]) -> Optional[str]:
    href = clean_text(maybe_relative)
    if not href:
        return None
    return urljoin(base_url, href)
