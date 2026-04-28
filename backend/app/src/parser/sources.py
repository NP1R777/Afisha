import re
from dataclasses import dataclass
from datetime import datetime
from typing import Iterable, Optional

import requests
import urllib3
from bs4 import BeautifulSoup

from src.parser.schemas import ParsedEventCreate
from src.parser.utils import (
    absolute_url,
    clean_text,
    normalize_age_limit,
    normalize_duration,
    normalize_event_date,
    normalize_price,
)


urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


@dataclass(frozen=True)
class SourceConfig:
    key: str
    name: str
    url: str
    organization: str
    city: str = "Норильск"
    reserve: bool = False
    verify_ssl: bool = True


SOURCE_CONFIGS: dict[str, SourceConfig] = {
    "northdrama": SourceConfig(
        key="northdrama",
        name="Заполярный театр драмы",
        url="https://www.northdrama.ru/afisha",
        organization="Заполярный театр драмы",
        city="Норильск",
    ),
    "gck": SourceConfig(
        key="gck",
        name="Городской центр культуры",
        url="http://www.gcknorilsk.ru/",
        organization="Городской центр культуры",
        city="Норильск",
    ),
    "norilsk_official": SourceConfig(
        key="norilsk_official",
        name="Официальный сайт города Норильска",
        url="https://xn--h1aecgfmj1g.xn--p1ai/",
        organization="Администрация города Норильска",
        city="Норильск",
    ),
    "sg_afisha": SourceConfig(
        key="sg_afisha",
        name="Афиша Северного города",
        url="https://afisha.sgnorilsk.ru/",
        organization="Афиша Северного города",
        city="Норильск",
        reserve=True,
    ),
    "cinema_arthall": SourceConfig(
        key="cinema_arthall",
        name="Кинотеатр Арт-Холл",
        url="https://cinemaarthall.ru/",
        organization="Кинотеатр Арт-Холл",
        city="Норильск",
    ),
    "cinema_rodina": SourceConfig(
        key="cinema_rodina",
        name="Кинотеатр Родина",
        url="https://кино-родина.рф/",
        organization="Кинотеатр Родина",
        city="Норильск",
        verify_ssl=False,
    ),
    "arena_norilsk": SourceConfig(
        key="arena_norilsk",
        name="ТРЦ Арена-Норильск",
        url="https://арена-норильск.рф/",
        organization="ТРЦ Арена-Норильск",
        city="Норильск",
    ),
}


PRIORITY_SOURCE_KEYS = ["northdrama", "gck", "norilsk_official"]
RESERVE_SOURCE_KEYS = ["sg_afisha"]
OTHER_SOURCE_KEYS = ["cinema_arthall", "cinema_rodina", "arena_norilsk"]


class SourceParseError(RuntimeError):
    pass


def _build_session() -> requests.Session:
    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": (
                "Mozilla/5.0 (X11; Linux x86_64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            )
        }
    )
    return session


def _event_payload(
    config: SourceConfig,
    *,
    name: Optional[str],
    description: Optional[str] = None,
    date_event: Optional[str] = None,
    duration: Optional[str] = None,
    city: Optional[str] = None,
    price: Optional[str] = None,
    address: Optional[str] = None,
    age_limit: Optional[str] = None,
    external_url: Optional[str] = None,
) -> Optional[ParsedEventCreate]:
    normalized_name = clean_text(name)
    if not normalized_name:
        return None

    return ParsedEventCreate(
        source_key=config.key,
        source_name=config.name,
        name=normalized_name,
        description=clean_text(description),
        date_event=normalize_event_date(date_event),
        duration=normalize_duration(duration),
        city=clean_text(city) or config.city,
        price=normalize_price(price),
        address=clean_text(address),
        organization=config.organization,
        age_limit=normalize_age_limit(age_limit),
        external_url=clean_text(external_url),
    )


def parse_source(config: SourceConfig, *, max_events: int = 100) -> list[ParsedEventCreate]:
    if config.key == "northdrama":
        events = _parse_northdrama(config, max_events=max_events)
    elif config.key == "gck":
        events = _parse_gck(config, max_events=max_events)
    elif config.key == "norilsk_official":
        events = _parse_norilsk_official(config, max_events=max_events)
    elif config.key == "sg_afisha":
        events = _parse_sg_afisha(config, max_events=max_events)
    elif config.key == "cinema_arthall":
        events = _parse_cinema_arthall(config, max_events=max_events)
    elif config.key == "cinema_rodina":
        events = _parse_cinema_rodina(config, max_events=max_events)
    elif config.key == "arena_norilsk":
        events = _parse_arena_norilsk(config, max_events=max_events)
    else:
        raise SourceParseError(f"Неизвестный источник: {config.key}")
    return events[:max_events]


def _parse_northdrama(config: SourceConfig, *, max_events: int) -> list[ParsedEventCreate]:
    session = _build_session()
    response = session.get(config.url, timeout=30, verify=config.verify_ssl)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")

    events: list[ParsedEventCreate] = []
    for day_item in soup.select("li.performances-timelist__item"):
        day = clean_text(day_item.select_one(".performances-timelist__day").get_text(" ", strip=True) if day_item.select_one(".performances-timelist__day") else None)
        month = clean_text(day_item.select_one(".performances-timelist__month").get_text(" ", strip=True) if day_item.select_one(".performances-timelist__month") else None)
        date_raw = f"{day} {month} {datetime.now().year}" if day and month else None

        for event_item in day_item.select("li.performances__item"):
            title_link = event_item.select_one("a.performances__title")
            payload = _event_payload(
                config,
                name=title_link.get_text(" ", strip=True) if title_link else None,
                date_event=date_raw,
                duration=event_item.select_one(".performances__time").get_text(" ", strip=True) if event_item.select_one(".performances__time") else None,
                price=event_item.select_one(".performances__price").get_text(" ", strip=True) if event_item.select_one(".performances__price") else None,
                age_limit=event_item.select_one(".mark").get_text(" ", strip=True) if event_item.select_one(".mark") else None,
                external_url=absolute_url(config.url, title_link.get("href")) if title_link else None,
            )
            if payload:
                events.append(payload)
            if len(events) >= max_events:
                return events
    return events


def _parse_gck(config: SourceConfig, *, max_events: int) -> list[ParsedEventCreate]:
    session = _build_session()
    response = session.get(config.url, timeout=30, verify=config.verify_ssl)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")

    events: list[ParsedEventCreate] = []
    for article in soup.select("article"):
        title_link = article.select_one("h2 a, h3 a")
        entry = article.select_one(".entry, .entry-box")
        meta_date = article.select_one(".meta .date")
        text_blob = clean_text(entry.get_text(" ", strip=True) if entry else article.get_text(" ", strip=True))
        if not title_link:
            continue
        details_text = _fetch_page_summary(
            session,
            absolute_url(config.url, title_link.get("href")),
            verify_ssl=config.verify_ssl,
        )
        content_text = clean_text(details_text) or text_blob

        payload = _event_payload(
            config,
            name=title_link.get_text(" ", strip=True),
            description=content_text,
            date_event=content_text or (meta_date.get_text(" ", strip=True) if meta_date else None),
            duration=content_text,
            address=_extract_address_from_text(content_text),
            age_limit=content_text,
            external_url=absolute_url(config.url, title_link.get("href")),
        )
        if payload:
            if not payload.date_event and meta_date:
                payload.date_event = normalize_event_date(meta_date.get_text(" ", strip=True))
            events.append(payload)
        if len(events) >= max_events:
            return events

    return events


def _parse_norilsk_official(config: SourceConfig, *, max_events: int) -> list[ParsedEventCreate]:
    session = _build_session()
    response = session.get(config.url, timeout=30, verify=config.verify_ssl)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")

    cards = soup.select(".event_item")
    events: list[ParsedEventCreate] = []
    for card in cards:
        title_link = card.select_one(".title a")
        date_text = card.select_one(".descr")
        external_url = absolute_url(config.url, title_link.get("href")) if title_link else None
        details_text = _fetch_page_summary(session, external_url, verify_ssl=config.verify_ssl)
        content_text = clean_text(details_text) or clean_text(card.get_text(" ", strip=True))

        payload = _event_payload(
            config,
            name=title_link.get_text(" ", strip=True) if title_link else None,
            description=content_text,
            date_event=content_text or (date_text.get_text(" ", strip=True) if date_text else None),
            duration=content_text,
            address=_extract_address_from_text(content_text),
            age_limit=content_text,
            external_url=external_url,
        )
        if payload:
            events.append(payload)
        if len(events) >= max_events:
            return events
    return events


def _parse_sg_afisha(config: SourceConfig, *, max_events: int) -> list[ParsedEventCreate]:
    session = _build_session()
    response = session.get(config.url, timeout=30, verify=config.verify_ssl)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")

    events: list[ParsedEventCreate] = []
    processed_links: set[str] = set()

    for title_link in soup.select("h3 a[href*='/events/event/']"):
        href = absolute_url(config.url, title_link.get("href"))
        if not href or href in processed_links or "/on/" in href:
            continue

        processed_links.add(href)
        card = title_link.find_parent(class_=lambda x: x and "jeg_post" in x)
        card_text = clean_text(card.get_text(" ", strip=True) if card else None)
        details_text = _fetch_page_summary(session, href, verify_ssl=config.verify_ssl)
        content_text = clean_text(details_text) or card_text

        payload = _event_payload(
            config,
            name=title_link.get_text(" ", strip=True),
            description=content_text,
            date_event=content_text,
            duration=content_text,
            address=_extract_address_from_text(content_text),
            age_limit=content_text,
            price=content_text,
            external_url=href,
        )
        if payload:
            events.append(payload)
        if len(events) >= max_events:
            return events

    return events


def _parse_cinema_arthall(config: SourceConfig, *, max_events: int) -> list[ParsedEventCreate]:
    session = _build_session()
    response = session.get(config.url, timeout=30, verify=config.verify_ssl)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")

    schedule_links: list[str] = []
    for link in soup.select("a[href*='/schedule/']"):
        href = absolute_url(config.url, link.get("href"))
        if not href or "/schedule/soon" in href or href in schedule_links:
            continue
        schedule_links.append(href)
        if len(schedule_links) >= max_events:
            break

    events: list[ParsedEventCreate] = []
    for schedule_url in schedule_links:
        try:
            page_response = session.get(schedule_url, timeout=30, verify=config.verify_ssl)
            page_response.raise_for_status()
        except requests.RequestException:
            continue

        page_soup = BeautifulSoup(page_response.text, "html.parser")
        title = _extract_title_from_page_title(page_soup.title.get_text(" ", strip=True) if page_soup.title else None)
        if not title:
            continue

        text_blob = clean_text(page_soup.get_text(" ", strip=True))
        payload = _event_payload(
            config,
            name=title,
            description=None,
            duration=text_blob,
            price=text_blob,
            age_limit=text_blob,
            external_url=schedule_url,
        )
        if payload:
            events.append(payload)
        if len(events) >= max_events:
            return events

    return events


def _parse_cinema_rodina(config: SourceConfig, *, max_events: int) -> list[ParsedEventCreate]:
    session = _build_session()
    response = session.get(config.url, timeout=30, verify=config.verify_ssl)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")

    events: list[ParsedEventCreate] = []
    for item in soup.select(".item"):
        title = item.select_one("h2, h3")
        text_blob = clean_text(item.get_text(" ", strip=True))
        payload = _event_payload(
            config,
            name=title.get_text(" ", strip=True) if title else None,
            description=text_blob,
            date_event=text_blob,
            duration=text_blob,
            price=text_blob,
            age_limit=text_blob,
            external_url=config.url,
        )
        if payload:
            events.append(payload)
        if len(events) >= max_events:
            return events
    return events


def _parse_arena_norilsk(config: SourceConfig, *, max_events: int) -> list[ParsedEventCreate]:
    session = _build_session()
    response = session.get(config.url, timeout=30, verify=config.verify_ssl)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")

    events: list[ParsedEventCreate] = []
    for article in soup.select("article.post"):
        title_link = article.select_one("h2 a, h3 a")
        text_blob = clean_text(article.get_text(" ", strip=True))
        external_url = absolute_url(config.url, title_link.get("href")) if title_link else config.url
        details_text = _fetch_page_summary(session, external_url, verify_ssl=config.verify_ssl)
        content_text = clean_text(details_text) or text_blob
        payload = _event_payload(
            config,
            name=title_link.get_text(" ", strip=True) if title_link else None,
            description=content_text,
            date_event=content_text,
            duration=content_text,
            price=content_text,
            address=_extract_address_from_text(content_text),
            age_limit=content_text,
            external_url=external_url,
        )
        if payload:
            events.append(payload)
        if len(events) >= max_events:
            return events
    return events


def _extract_address_from_text(value: Optional[str]) -> Optional[str]:
    text = clean_text(value)
    if not text:
        return None
    patterns = [
        r"(ул\.?\s+[A-Яа-яЁёA-Za-z0-9\-\s]+,\s*[A-Яа-яЁёA-Za-z0-9\-\s]+)",
        r"(улица\s+[A-Яа-яЁёA-Za-z0-9\-\s]+,\s*[A-Яа-яЁёA-Za-z0-9\-\s]+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return clean_text(match.group(1))
    return None


def _fetch_page_summary(
    session: requests.Session,
    url: Optional[str],
    *,
    verify_ssl: bool,
) -> Optional[str]:
    if not url:
        return None
    try:
        response = session.get(url, timeout=30, verify=verify_ssl)
        response.raise_for_status()
    except requests.RequestException:
        return None

    soup = BeautifulSoup(response.text, "html.parser")
    for selector in (".news-detail", ".entry", ".entry-content", ".content", "article"):
        node = soup.select_one(selector)
        if node:
            text = clean_text(node.get_text(" ", strip=True))
            if text:
                return text
    return clean_text(soup.get_text(" ", strip=True))


def _extract_title_from_page_title(value: Optional[str]) -> Optional[str]:
    title = clean_text(value)
    if not title:
        return None

    if "|" in title:
        parts = [clean_text(item) for item in title.split("|")]
        parts = [item for item in parts if item and "синема" not in item.lower()]
        if parts:
            return parts[0]
    return title


def resolve_source_keys(*, source_keys: Optional[Iterable[str]], include_reserve: bool) -> list[str]:
    if source_keys:
        resolved = [key for key in source_keys if key in SOURCE_CONFIGS]
        if resolved:
            return resolved

    result = [*PRIORITY_SOURCE_KEYS, *OTHER_SOURCE_KEYS]
    if include_reserve:
        result.extend(RESERVE_SOURCE_KEYS)
    return result
