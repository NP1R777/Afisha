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


@dataclass(frozen=True)
class ParserRuntimeConfig:
    vmuzey_proxy: Optional[str] = None
    vmuzey_cookies: Optional[str] = None
    vmuzey_user_agent: Optional[str] = None


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
    "museum_norilsk_vmuzey": SourceConfig(
        key="museum_norilsk_vmuzey",
        name="Музей Норильска (ВМузей)",
        url="https://vmuzey.com/museum/mvk-muzey-norilska",
        organization="Музей Норильска",
        city="Норильск",
    ),
    "gallery_norilsk_vmuzey": SourceConfig(
        key="gallery_norilsk_vmuzey",
        name="Художественная галерея (ВМузей)",
        url="https://vmuzey.com/museum/hudozhestvennaya-galereya-4",
        organization="Художественная галерея",
        city="Норильск",
    ),
    "talnah_museum_vmuzey": SourceConfig(
        key="talnah_museum_vmuzey",
        name="Талнахский филиал МВК «Музей Норильска» (ВМузей)",
        url="https://vmuzey.com/museum/talnahskiy-filial-muzeya-norilska",
        organization="Талнахский филиал Музея Норильска",
        city="Талнах",
    ),
    "norilsk_art_college_vk": SourceConfig(
        key="norilsk_art_college_vk",
        name="Норильский колледж искусств (VK)",
        url="https://vk.ru/club187615124",
        organization="Норильский колледж искусств",
        city="Норильск",
    ),
    "talnah_dshi_news": SourceConfig(
        key="talnah_dshi_news",
        name="Талнахская детская школа искусств (Новости)",
        url="https://talnah-dshi.ru/news",
        organization="Талнахская детская школа искусств",
        city="Талнах",
    ),
    "nordshi_afisha": SourceConfig(
        key="nordshi_afisha",
        name="Норильская детская школа искусств (Афиша)",
        url="https://nordshi.ru/",
        organization="Норильская детская школа искусств",
        city="Норильск",
    ),
}


PRIORITY_SOURCE_KEYS = ["northdrama", "gck", "norilsk_official"]
RESERVE_SOURCE_KEYS = ["sg_afisha"]
OTHER_SOURCE_KEYS = [
    "cinema_arthall",
    "cinema_rodina",
    "arena_norilsk",
    "museum_norilsk_vmuzey",
    "gallery_norilsk_vmuzey",
    "talnah_museum_vmuzey",
    "norilsk_art_college_vk",
    "talnah_dshi_news",
    "nordshi_afisha",
]


class SourceParseError(RuntimeError):
    pass


def _is_vk_source(config: SourceConfig) -> bool:
    source = config.url.lower()
    return "vk.com/" in source or "vk.ru/" in source or config.key.endswith("_vk")


def _build_session(
    *,
    user_agent: Optional[str] = None,
    proxy_url: Optional[str] = None,
    cookies_raw: Optional[str] = None,
) -> requests.Session:
    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": user_agent
            or (
                "Mozilla/5.0 (X11; Linux x86_64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            )
        }
    )
    if proxy_url:
        session.proxies.update({"http": proxy_url, "https": proxy_url})
    if cookies_raw:
        session.cookies.update(_parse_cookie_string(cookies_raw))
    return session


def _parse_cookie_string(cookies_raw: str) -> dict[str, str]:
    cookies: dict[str, str] = {}
    for chunk in cookies_raw.split(";"):
        pair = chunk.strip()
        if not pair or "=" not in pair:
            continue
        key, value = pair.split("=", 1)
        cookies[key.strip()] = value.strip()
    return cookies


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


def parse_source(
    config: SourceConfig,
    *,
    max_events: int = 100,
    runtime_config: Optional[ParserRuntimeConfig] = None,
) -> list[ParsedEventCreate]:
    runtime_config = runtime_config or ParserRuntimeConfig()

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
    elif config.key in {"museum_norilsk_vmuzey", "gallery_norilsk_vmuzey", "talnah_museum_vmuzey"}:
        events = _parse_vmuzey_museum(
            config,
            max_events=max_events,
            runtime_config=runtime_config,
        )
    elif _is_vk_source(config):
        events = _parse_vk_community(
            config,
            max_events=max_events,
            runtime_config=runtime_config,
        )
    elif config.key == "talnah_dshi_news":
        events = _parse_talnah_dshi_news(config, max_events=max_events)
    elif config.key == "nordshi_afisha":
        events = _parse_nordshi_afisha(config, max_events=max_events)
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


def _parse_vmuzey_museum(
    config: SourceConfig,
    *,
    max_events: int,
    runtime_config: ParserRuntimeConfig,
) -> list[ParsedEventCreate]:
    session = _build_session(
        user_agent=runtime_config.vmuzey_user_agent,
        proxy_url=runtime_config.vmuzey_proxy,
        cookies_raw=runtime_config.vmuzey_cookies,
    )
    response = session.get(config.url, timeout=30, verify=config.verify_ssl)
    response.raise_for_status()

    if _is_protection_page(response.text):
        raise SourceParseError(
            f"Источник {config.key} заблокирован anti-bot защитой. "
            "Нужен доступ без challenge."
        )

    soup = BeautifulSoup(response.text, "html.parser")
    event_links: list[str] = []
    for link in soup.select("a[href*='/event/']"):
        href = absolute_url(config.url, link.get("href"))
        if not href or href in event_links:
            continue
        event_links.append(href)
        if len(event_links) >= max_events:
            break

    events: list[ParsedEventCreate] = []
    for event_url in event_links:
        try:
            detail_response = session.get(event_url, timeout=30, verify=config.verify_ssl)
            detail_response.raise_for_status()
        except requests.RequestException:
            continue

        if _is_protection_page(detail_response.text):
            continue

        detail_soup = BeautifulSoup(detail_response.text, "html.parser")
        detail_text = _fetch_page_summary_from_soup(detail_soup)
        title = _extract_main_title(detail_soup) or _extract_title_from_page_title(
            detail_soup.title.get_text(" ", strip=True) if detail_soup.title else None
        )
        payload = _event_payload(
            config,
            name=title,
            description=detail_text,
            date_event=detail_text,
            duration=detail_text,
            price=detail_text,
            address=_extract_address_from_text(detail_text),
            age_limit=detail_text,
            external_url=event_url,
        )
        if payload:
            events.append(payload)
        if len(events) >= max_events:
            return events

    return events


def _parse_vk_community(
    config: SourceConfig,
    *,
    max_events: int,
    runtime_config: ParserRuntimeConfig,
) -> list[ParsedEventCreate]:
    _ = runtime_config
    hard_limit = min(max_events, 20)
    vk_user_agents = [
        None,
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    ]

    for user_agent in vk_user_agents:
        session = _build_session(user_agent=user_agent)
        session.headers.update({"Accept-Language": "ru-RU,ru;q=0.9"})

        for candidate_url in _build_vk_candidate_urls(config.url):
            try:
                response = session.get(candidate_url, timeout=30, verify=config.verify_ssl)
                response.raise_for_status()
            except requests.RequestException:
                continue

            events = _extract_vk_events_from_page(
                config=config,
                html=response.text,
                source_url=candidate_url,
                max_events=hard_limit,
            )
            if events:
                return events

    raise SourceParseError(
        "Для источника VK не удалось получить посты из HTML-разметки. "
        "Вероятно, страница отдает динамический shell/anti-bot контент."
    )


def _build_vk_candidate_urls(base_url: str) -> list[str]:
    candidates: list[str] = []
    cleaned = base_url.strip().rstrip("/")
    if cleaned:
        candidates.append(cleaned)
        candidates.append(cleaned.replace("vk.ru", "vk.com"))

    match = re.search(r"/(club|public)(\d+)$", cleaned)
    if match:
        group_prefix = match.group(1)
        group_id = match.group(2)
        candidates.extend(
            [
                f"https://vk.com/{group_prefix}{group_id}",
                f"https://vk.com/wall-{group_id}",
                f"https://m.vk.com/{group_prefix}{group_id}",
                f"https://m.vk.com/wall-{group_id}",
            ]
        )

    unique: list[str] = []
    for item in candidates:
        normalized = item.strip()
        if normalized and normalized not in unique:
            unique.append(normalized)
    return unique


def _extract_vk_events_from_page(
    *,
    config: SourceConfig,
    html: str,
    source_url: str,
    max_events: int,
) -> list[ParsedEventCreate]:
    soup = BeautifulSoup(html, "html.parser")
    events = _extract_vk_events_from_blocks(
        config=config,
        soup=soup,
        source_url=source_url,
        max_events=max_events,
    )
    if events:
        return events
    return _extract_vk_events_from_plain_text(
        config=config,
        page_text=clean_text(soup.get_text("\n", strip=True)),
        source_url=source_url,
        max_events=max_events,
    )


def _extract_vk_events_from_blocks(
    *,
    config: SourceConfig,
    soup: BeautifulSoup,
    source_url: str,
    max_events: int,
) -> list[ParsedEventCreate]:
    block_selectors = [
        "div[data-post-id]",
        "div[data-post]",
        "article[data-post-id]",
        ".wall_item",
        ".post",
    ]

    blocks = []
    for selector in block_selectors:
        blocks.extend(soup.select(selector))

    events: list[ParsedEventCreate] = []
    seen_texts: set[str] = set()
    for block in blocks:
        text = clean_text(block.get_text(" ", strip=True))
        if not text or text in seen_texts:
            continue
        seen_texts.add(text)
        if not _is_vk_event_like(text):
            continue

        post_url = None
        post_link = block.select_one("a[href*='wall-']")
        if post_link:
            post_url = absolute_url(source_url, post_link.get("href"))

        payload_item = _event_payload(
            config,
            name=_extract_vk_title_from_text(text),
            description=text,
            date_event=text,
            duration=text,
            price=text,
            address=_extract_address_from_text(text),
            age_limit=text,
            external_url=post_url or _extract_first_url_from_text(text) or source_url,
        )
        if payload_item:
            events.append(payload_item)
        if len(events) >= max_events:
            break
    return events


def _extract_vk_events_from_plain_text(
    *,
    config: SourceConfig,
    page_text: Optional[str],
    source_url: str,
    max_events: int,
) -> list[ParsedEventCreate]:
    if not page_text:
        return []

    chunks = re.split(
        r"(?:\bзапись\s+закреплена\b|\bзапись\s+сообщества\b)",
        page_text,
        flags=re.IGNORECASE,
    )
    if len(chunks) <= 1:
        return []

    events: list[ParsedEventCreate] = []
    for chunk in chunks[1: max_events + 1]:
        text = clean_text(chunk)
        if not text or not _is_vk_event_like(text):
            continue

        payload_item = _event_payload(
            config,
            name=_extract_vk_title_from_text(text),
            description=text,
            date_event=text,
            duration=text,
            price=text,
            address=_extract_address_from_text(text),
            age_limit=text,
            external_url=_extract_first_url_from_text(text) or source_url,
        )
        if payload_item:
            events.append(payload_item)
        if len(events) >= max_events:
            break
    return events


def _parse_talnah_dshi_news(config: SourceConfig, *, max_events: int) -> list[ParsedEventCreate]:
    session = _build_session()
    response = session.get(config.url, timeout=30, verify=config.verify_ssl)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")

    cards = soup.select("a.list-group-item.list-group-item-action[href^='/item/']")
    events: list[ParsedEventCreate] = []
    for card in cards:
        detail_url = absolute_url(config.url, card.get("href"))
        if not detail_url:
            continue
        detail = _parse_dshi_detail_page(session, detail_url, verify_ssl=config.verify_ssl)
        if not detail:
            continue

        payload_item = _event_payload(
            config,
            name=detail["title"],
            description=detail["text"],
            date_event=detail["text"] or detail["date"],
            duration=detail["text"],
            price=detail["text"],
            address=_extract_address_from_text(detail["text"]),
            age_limit=detail["text"],
            external_url=detail_url,
        )
        if payload_item:
            events.append(payload_item)
        if len(events) >= max_events:
            break

    return events


def _parse_nordshi_afisha(config: SourceConfig, *, max_events: int) -> list[ParsedEventCreate]:
    session = _build_session()
    section_urls = [
        "https://nordshi.ru/item/1332263",  # Афиша -> Концерты
        "https://nordshi.ru/item/1332334",  # Афиша -> События
    ]

    detail_urls: list[str] = []
    for section_url in section_urls:
        try:
            response = session.get(section_url, timeout=30, verify=config.verify_ssl)
            response.raise_for_status()
        except requests.RequestException:
            continue

        section_soup = BeautifulSoup(response.text, "html.parser")
        for card in section_soup.select("a.list-group-item.list-group-item-action[href^='/item/']"):
            detail_url = absolute_url(section_url, card.get("href"))
            if not detail_url or detail_url in detail_urls:
                continue
            detail_urls.append(detail_url)
            if len(detail_urls) >= max_events:
                break
        if len(detail_urls) >= max_events:
            break

    events: list[ParsedEventCreate] = []
    for detail_url in detail_urls:
        detail = _parse_dshi_detail_page(session, detail_url, verify_ssl=config.verify_ssl)
        if not detail:
            continue

        payload_item = _event_payload(
            config,
            name=detail["title"],
            description=detail["text"],
            date_event=detail["text"] or detail["date"],
            duration=detail["text"],
            price=detail["text"],
            address=_extract_address_from_text(detail["text"]),
            age_limit=detail["text"],
            external_url=detail_url,
        )
        if payload_item:
            if not payload_item.date_event:
                payload_item.date_event = detail["date"]
            events.append(payload_item)
        if len(events) >= max_events:
            break

    return events


def _parse_dshi_detail_page(
    session: requests.Session,
    detail_url: str,
    *,
    verify_ssl: bool,
) -> Optional[dict[str, Optional[str]]]:
    try:
        response = session.get(detail_url, timeout=30, verify=verify_ssl)
        response.raise_for_status()
    except requests.RequestException:
        return None

    soup = BeautifulSoup(response.text, "html.parser")
    title = _extract_main_title(soup) or _extract_title_from_page_title(
        soup.title.get_text(" ", strip=True) if soup.title else None
    )
    if not title:
        return None

    detail_text = _extract_dshi_article_text(soup) or _fetch_page_summary_from_soup(soup)
    if not detail_text:
        return None

    published_date = clean_text(
        soup.select_one(".text-muted").get_text(" ", strip=True)
        if soup.select_one(".text-muted")
        else None
    )

    return {
        "title": title,
        "text": detail_text,
        "date": published_date,
    }


def _extract_dshi_article_text(soup: BeautifulSoup) -> Optional[str]:
    selectors = [
        ".templater-content-block .my-2",
        ".templater-content-block .col-12",
        ".templater-content-block p",
        ".el-card__body",
    ]
    for selector in selectors:
        for node in soup.select(selector):
            text = clean_text(node.get_text(" ", strip=True))
            if not text:
                continue
            if "СВЕДЕНИЯ ОБ ОБРАЗОВАТЕЛЬНОЙ ОРГАНИЗАЦИИ" in text and len(text) > 1000:
                continue
            if len(text) < 40:
                continue
            return text
    return None


def _extract_main_title(soup: BeautifulSoup) -> Optional[str]:
    for selector in ("h1", ".event-title", ".article-title", "h3"):
        for node in soup.select(selector):
            text = clean_text(node.get_text(" ", strip=True))
            if text:
                return text
    return None


def _extract_title_from_text_block(text: str) -> str:
    candidate = clean_text(text)
    if not candidate:
        return "Событие"
    first_sentence = re.split(r"[.!?\\n]", candidate)[0]
    first_sentence = clean_text(first_sentence)
    if first_sentence and len(first_sentence) >= 8:
        return first_sentence[:180]
    return candidate[:180]


def _extract_vk_title_from_text(text: str) -> str:
    candidate = clean_text(text)
    if not candidate:
        return "Событие"

    candidate = re.sub(
        r"^\s*[A-ZА-ЯЁa-zа-яё0-9 .\"«»()_-]{2,80}\s+запись\s+(закреплена|сообщества)\b",
        "",
        candidate,
        flags=re.IGNORECASE,
    )
    candidate = re.sub(
        r"\b(?:сегодня|вчера|\d{1,2}\s+[а-яё]+)\s+в\s+\d{1,2}:\d{2}\b",
        "",
        candidate,
        flags=re.IGNORECASE,
    )
    candidate = re.sub(r"\bгосорганизация\b", "", candidate, flags=re.IGNORECASE)
    return _extract_title_from_text_block(candidate)


def _extract_first_url_from_text(text: Optional[str]) -> Optional[str]:
    if not text:
        return None
    match = re.search(r"https?://\\S+", text)
    if not match:
        return None
    return match.group(0).rstrip(").,]")


def _is_vk_event_like(text: str) -> bool:
    normalized = clean_text(text)
    if not normalized:
        return False
    lowered = normalized.lower()

    excluded_pattern = re.compile(
        r"с\s+прискорбием|светлая\s+память|уш[её]л\s+из\s+жизни|"
        r"соболезн|день\s+полярника|безопасност[ьи]|антикоррупц|"
        r"финансов(ый|ой)\s+урок|всероссийск(ая|ий)\s+онлайн-акц",
        flags=re.IGNORECASE,
    )
    if excluded_pattern.search(lowered):
        return False

    ticket_pattern = re.compile(
        r"приобрест[ьи]\s+билет|билеты?\s+можно\s+по\s+ссылке|"
        r"пушкинская\s+карта|купить\s+билет|касс[ае]",
        flags=re.IGNORECASE,
    )
    if ticket_pattern.search(lowered):
        return True

    event_pattern = re.compile(
        r"концерт|спектак|мероприят|мастер-?класс|выставк|творческ(ий|ая)\s+вечер|"
        r"фестивал|программа\s+концерта|отчетн(ый|ая)\s+концерт",
        flags=re.IGNORECASE,
    )
    invite_pattern = re.compile(
        r"приглашаем|жд[её]м\s+вас|состоитс[яь]|пройдет|пройд[её]т|"
        r"начал[оа]\s+в\s+\d{1,2}:\d{2}",
        flags=re.IGNORECASE,
    )
    has_event = bool(event_pattern.search(lowered))
    has_invite = bool(invite_pattern.search(lowered))
    has_date_or_time = bool(_contains_date_or_time(lowered))

    score = sum([has_event, has_invite, has_date_or_time])
    return score >= 2


def _contains_date_or_time(text: str) -> bool:
    return bool(
        re.search(r"\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b", text)
        or re.search(r"\b\d{1,2}:\d{2}\b", text)
        or re.search(
            r"\b\d{1,2}\s+(января|февраля|марта|апреля|мая|июня|июля|"
            r"августа|сентября|октября|ноября|декабря)\b",
            text,
            flags=re.IGNORECASE,
        )
    )


def _is_protection_page(text: str) -> bool:
    lowered = text.lower()
    return (
        "user verification" in lowered
        or "fake bot" in lowered
        or "проверяем, что вы не робот" in lowered
    )


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
    return _fetch_page_summary_from_soup(soup)


def _fetch_page_summary_from_soup(soup: BeautifulSoup) -> Optional[str]:
    for selector in (
        ".news-detail",
        ".entry-content",
        ".entry",
        ".event-content",
        ".event-description",
        ".templater-content-block .my-2",
        ".templater-content-block .col-12",
        ".el-card__body",
        ".cms-block-content",
        ".content",
        "article",
    ):
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
