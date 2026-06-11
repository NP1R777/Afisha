from __future__ import annotations

import asyncio
import json
import re
from dataclasses import dataclass
from datetime import date, datetime, time
from time import perf_counter
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from core.settings import AppSettings
from database.models import EventGroupsEvent, Events
from src.assistant.mistral_client import (
    MistralClientError,
    create_chat_completion,
    create_chat_json,
    create_embeddings,
)
from src.assistant.schemas import (
    AssistantChatRequest,
    AssistantChatResponse,
    AssistantEventMatch,
    AssistantFiltersOut,
    AssistantReindexResponse,
)
from src.assistant.vector_store import VectorDocument, rebuild_collection, search_collection

CITY_ALIASES = {
    "norilsk": "norilsk",
    "норильск": "norilsk",
    "talnah": "talnah",
    "талнах": "talnah",
    "kayerkan": "kayerkan",
    "кайеркан": "kayerkan",
    "oganeer": "oganeer",
    "оганер": "oganeer",
    "dudinka": "dudinka",
    "дудинка": "dudinka",
}

TIME_PERIODS: dict[str, tuple[int, int]] = {
    "morning": (8 * 60, 12 * 60),
    "day": (12 * 60, 16 * 60),
    "evening": (16 * 60, 21 * 60),
    "night": (21 * 60, 24 * 60),
}

MONTHS = {
    "января": 1,
    "февраля": 2,
    "марта": 3,
    "апреля": 4,
    "мая": 5,
    "июня": 6,
    "июля": 7,
    "августа": 8,
    "сентября": 9,
    "октября": 10,
    "ноября": 11,
    "декабря": 12,
}

CATEGORY_KEYWORDS = {
    "theater": (
        "театр",
        "спектак",
        "драма",
        "постановк",
        "сцена",
        "труппа",
    ),
    "cinema": (
        "кино",
        "фильм",
        "сеанс",
        "кинопоказ",
        "кинозал",
    ),
    "sport": (
        "спорт",
        "матч",
        "турнир",
        "соревн",
        "чемпионат",
        "кубок",
        "футбол",
        "хоккей",
        "волейбол",
        "баскетбол",
    ),
    "concert": ("концерт", "музык", "оркестр", "хор"),
    "exhibition": ("выставк", "экспози", "галере"),
    "master_class": ("мастер-класс", "мастер класс", "воркшоп"),
}

AFISHA_HINTS = (
    "афиша",
    "мероприят",
    "куда сходить",
    "событи",
    "концерт",
    "спектак",
    "билет",
    "кино",
    "выставк",
    "матч",
)


@dataclass
class ParsedUserQuery:
    intent: str
    category: Optional[str]
    city: Optional[str]
    organization: Optional[str]
    requested_date: Optional[date]
    requested_date_is_past: bool
    time_period: Optional[str]
    min_price: Optional[float]
    max_price: Optional[float]
    age_limit: Optional[int]


@dataclass
class EventCandidate:
    event_id: int
    name: str
    description: Optional[str]
    city: Optional[str]
    organization: Optional[str]
    price: Optional[float]
    age_limit: Optional[str]
    address: Optional[str]
    external_url: Optional[str]
    pictures_main: Optional[str]
    categories: list[str]
    date_event: Optional[datetime]
    start_time: Optional[time]
    score: float


async def handle_assistant_chat(
    db_connect: AsyncSession,
    settings: AppSettings,
    request: AssistantChatRequest,
) -> AssistantChatResponse:
    message = request.message.strip()
    if not message:
        return AssistantChatResponse(
            intent="general_chat",
            message="Пожалуйста, отправьте непустой запрос.",
            fallback_level="none",
            filters=AssistantFiltersOut(),
            matches=[],
            warnings=[],
        )

    parsed = await _parse_user_query(settings, message)
    if parsed.intent == "general_chat":
        answer = await _answer_general_question(settings, message)
        return AssistantChatResponse(
            intent="general_chat",
            message=answer,
            fallback_level="none",
            filters=_to_filters_out(parsed),
            matches=[],
            warnings=[],
        )

    candidates = await _search_semantic_candidates(
        db_connect=db_connect,
        settings=settings,
        query_text=message,
        limit=max(settings.assistant_semantic_limit, request.top_k * 12),
    )
    if not candidates:
        candidates = await _load_recent_candidates(db_connect, limit=80)

    matches, fallback_level, response_message, warnings = _select_best_matches(
        query_text=message,
        parsed=parsed,
        candidates=candidates,
        top_k=request.top_k,
    )

    return AssistantChatResponse(
        intent="afisha_search",
        message=response_message,
        fallback_level=fallback_level,
        filters=_to_filters_out(parsed),
        matches=[_to_event_match(item, reason=fallback_level) for item in matches],
        warnings=warnings,
    )


async def sync_events_vector_index(
    db_connect: AsyncSession,
    settings: AppSettings,
) -> AssistantReindexResponse:
    started_at = perf_counter()
    try:
        docs_without_vectors = await _build_vector_documents(db_connect=db_connect)
        embedding_texts = [doc["embedding_text"] for doc in docs_without_vectors]

        vectors: list[list[float]] = []
        batch_size = max(1, settings.assistant_embedding_batch_size)
        for offset in range(0, len(embedding_texts), batch_size):
            batch = embedding_texts[offset: offset + batch_size]
            batch_vectors = await asyncio.to_thread(
                create_embeddings,
                settings,
                texts=batch,
            )
            vectors.extend(batch_vectors)

        if vectors and len(vectors[0]) != settings.assistant_embedding_dim:
            raise RuntimeError(
                "Размерность эмбеддинга не совпадает с assistant_embedding_dim. "
                f"Ожидалось {settings.assistant_embedding_dim}, получено {len(vectors[0])}."
            )

        vector_documents = [
            VectorDocument(
                doc_id=item["doc_id"],
                event_id=item["event_id"],
                timeslot_id=item["timeslot_id"],
                name=item["name"],
                city=item["city"],
                price=item["price"],
                organization=item["organization"],
                age_limit=item["age_limit"],
                categories=item["categories"],
                date_event=item["date_event"],
                start_time=item["start_time"],
                date_sort=item["date_sort"],
                start_minutes=item["start_minutes"],
                payload=item["payload"],
                embedding=vectors[idx] if idx < len(vectors) else [],
            )
            for idx, item in enumerate(docs_without_vectors)
        ]

        indexed_events, indexed_documents = await asyncio.to_thread(
            rebuild_collection,
            settings,
            vector_documents,
        )
        elapsed_ms = int((perf_counter() - started_at) * 1000)
        return AssistantReindexResponse(
            success=True,
            collection_name=settings.milvus_collection_name,
            indexed_events=indexed_events,
            indexed_documents=indexed_documents,
            duration_ms=elapsed_ms,
            error=None,
        )
    except Exception as exc:
        elapsed_ms = int((perf_counter() - started_at) * 1000)
        return AssistantReindexResponse(
            success=False,
            collection_name=settings.milvus_collection_name,
            indexed_events=0,
            indexed_documents=0,
            duration_ms=elapsed_ms,
            error=str(exc)[:500],
        )


async def _parse_user_query(settings: AppSettings, query_text: str) -> ParsedUserQuery:
    today = datetime.utcnow().date()
    extracted = await _extract_query_with_llm(settings, query_text, today=today)

    category = _normalize_category(extracted.get("category")) or _infer_category_from_text(query_text)
    city = _normalize_city(extracted.get("city")) or _extract_city_from_text(query_text)
    organization = _normalize_text(extracted.get("organization")) or None
    time_period = _normalize_time_period(extracted.get("time_period")) or _extract_time_period_from_text(query_text)
    min_price, max_price = _extract_price_bounds(query_text, extracted)
    age_limit = _extract_age_limit(query_text, extracted)

    requested_date, requested_date_is_past = _extract_requested_date(
        query_text=query_text,
        llm_date_value=extracted.get("requested_date"),
        today=today,
    )

    intent = extracted.get("intent")
    normalized_intent = "afisha_search" if _looks_like_afisha_intent(intent, query_text) else "general_chat"

    return ParsedUserQuery(
        intent=normalized_intent,
        category=category,
        city=city,
        organization=organization,
        requested_date=requested_date,
        requested_date_is_past=requested_date_is_past,
        time_period=time_period,
        min_price=min_price,
        max_price=max_price,
        age_limit=age_limit,
    )


async def _extract_query_with_llm(
    settings: AppSettings,
    query_text: str,
    *,
    today: date,
) -> dict[str, object]:
    system_prompt = (
        "Ты анализируешь запрос пользователя для ассистента афиши.\n"
        "Верни только JSON-объект и ничего больше.\n"
        "Схема JSON:\n"
        "{\n"
        '  "intent": "afisha_search" | "general_chat",\n'
        '  "category": "theater|cinema|sport|concert|exhibition|master_class|null",\n'
        '  "city": "norilsk|talnah|kayerkan|oganeer|dudinka|null",\n'
        '  "organization": "string|null",\n'
        '  "requested_date": "YYYY-MM-DD|null",\n'
        '  "time_period": "morning|day|evening|night|null",\n'
        '  "min_price": number|null,\n'
        '  "max_price": number|null,\n'
        '  "age_limit": number|null\n'
        "}\n"
        f"Текущая дата: {today.isoformat()}."
    )
    user_prompt = f"Запрос пользователя: {query_text}"
    try:
        return await asyncio.to_thread(
            create_chat_json,
            settings,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            model=settings.mistral_chat_model,
            temperature=0.0,
            max_tokens=350,
        )
    except Exception:
        return {}


async def _answer_general_question(settings: AppSettings, query_text: str) -> str:
    try:
        return await asyncio.to_thread(
            create_chat_completion,
            settings,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Ты дружелюбный русскоязычный ассистент. "
                        "Отвечай кратко, понятно и по теме вопроса пользователя."
                    ),
                },
                {"role": "user", "content": query_text},
            ],
            model=settings.mistral_chat_model,
            temperature=0.6,
            max_tokens=700,
        )
    except MistralClientError:
        return "Сейчас не удалось получить ответ от языковой модели. Попробуйте повторить запрос."


async def _search_semantic_candidates(
    *,
    db_connect: AsyncSession,
    settings: AppSettings,
    query_text: str,
    limit: int,
) -> list[EventCandidate]:
    try:
        query_vectors = await asyncio.to_thread(
            create_embeddings,
            settings,
            texts=[query_text],
        )
    except Exception:
        return []
    if not query_vectors:
        return []

    hits = await asyncio.to_thread(
        search_collection,
        settings,
        embedding=query_vectors[0],
        limit=limit,
    )
    if not hits:
        return []

    event_ids = sorted({item.event_id for item in hits})
    event_map = await _load_events_map(db_connect, event_ids)
    slot_score_map: dict[tuple[int, int], float] = {}
    event_score_map: dict[int, float] = {}
    for item in hits:
        slot_key = (item.event_id, item.timeslot_id)
        slot_score_map[slot_key] = max(slot_score_map.get(slot_key, float("-inf")), item.score)
        event_score_map[item.event_id] = max(event_score_map.get(item.event_id, float("-inf")), item.score)

    candidates: list[EventCandidate] = []
    for event_id in event_ids:
        event = event_map.get(event_id)
        if not event:
            continue
        categories = _event_categories(event)
        org_name = event.organization_rel.name_org if event.organization_rel else None
        slots = sorted(event.time_slots, key=lambda item: item.date_event)
        if slots:
            for slot in slots:
                score = slot_score_map.get(
                    (event.id, slot.id),
                    event_score_map.get(event.id, 0.0),
                )
                candidates.append(
                    EventCandidate(
                        event_id=event.id,
                        name=event.name,
                        description=event.description,
                        city=event.city.value if event.city else None,
                        organization=org_name,
                        price=event.price,
                        age_limit=event.age_limit,
                        address=event.address,
                        external_url=event.external_url,
                        pictures_main=event.pictures_main,
                        categories=categories,
                        date_event=slot.date_event,
                        start_time=slot.start_time,
                        score=score,
                    )
                )
        else:
            candidates.append(
                EventCandidate(
                    event_id=event.id,
                    name=event.name,
                    description=event.description,
                    city=event.city.value if event.city else None,
                    organization=org_name,
                    price=event.price,
                    age_limit=event.age_limit,
                    address=event.address,
                    external_url=event.external_url,
                    pictures_main=event.pictures_main,
                    categories=categories,
                    date_event=None,
                    start_time=None,
                    score=event_score_map.get(event.id, 0.0),
                )
            )
    return sorted(
        candidates,
        key=lambda item: (
            item.score,
            item.date_event or datetime.min,
            item.event_id,
        ),
        reverse=True,
    )


async def _load_recent_candidates(db_connect: AsyncSession, limit: int) -> list[EventCandidate]:
    query = (
        select(Events)
        .where(Events.deleted_at.is_(None))
        .options(
            selectinload(Events.organization_rel),
            selectinload(Events.time_slots),
            selectinload(Events.group_links).selectinload(EventGroupsEvent.group),
        )
        .order_by(Events.created_at.desc())
        .limit(limit)
    )
    events = (await db_connect.execute(query)).scalars().all()

    candidates: list[EventCandidate] = []
    for event in events:
        categories = _event_categories(event)
        org_name = event.organization_rel.name_org if event.organization_rel else None
        slots = sorted(event.time_slots, key=lambda item: item.date_event)
        if slots:
            for slot in slots:
                candidates.append(
                    EventCandidate(
                        event_id=event.id,
                        name=event.name,
                        description=event.description,
                        city=event.city.value if event.city else None,
                        organization=org_name,
                        price=event.price,
                        age_limit=event.age_limit,
                        address=event.address,
                        external_url=event.external_url,
                        pictures_main=event.pictures_main,
                        categories=categories,
                        date_event=slot.date_event,
                        start_time=slot.start_time,
                        score=0.0,
                    )
                )
        else:
            candidates.append(
                EventCandidate(
                    event_id=event.id,
                    name=event.name,
                    description=event.description,
                    city=event.city.value if event.city else None,
                    organization=org_name,
                    price=event.price,
                    age_limit=event.age_limit,
                    address=event.address,
                    external_url=event.external_url,
                    pictures_main=event.pictures_main,
                    categories=categories,
                    date_event=None,
                    start_time=None,
                    score=0.0,
                )
            )
    return candidates


def _select_best_matches(
    *,
    query_text: str,
    parsed: ParsedUserQuery,
    candidates: list[EventCandidate],
    top_k: int,
) -> tuple[list[EventCandidate], str, str, list[str]]:
    warnings: list[str] = []
    now_date = datetime.utcnow().date()

    if parsed.requested_date_is_past:
        warnings.append(
            "Запрошенная дата уже прошла. Подобраны ближайшие будущие мероприятия по остальным критериям."
        )
        future_filtered = _filter_candidates(
            candidates,
            parsed=parsed,
            include_category=True,
            include_date=False,
            include_time=True,
            include_city=True,
            include_org=True,
            include_price=True,
            include_age=True,
            allow_without_time=False,
            only_future_dates=True,
        )
        nearest = _pick_nearest_future_date(future_filtered, now_date=now_date)
        if nearest:
            return (
                nearest[:top_k],
                "alternative",
                "Дата в запросе уже прошла, поэтому я подобрал ближайшие подходящие варианты.",
                warnings,
            )

    exact = _filter_candidates(
        candidates,
        parsed=parsed,
        include_category=True,
        include_date=True,
        include_time=True,
        include_city=True,
        include_org=True,
        include_price=True,
        include_age=True,
        allow_without_time=False,
        only_future_dates=False,
    )
    if exact:
        return (
            exact[:top_k],
            "exact",
            "Нашёл подходящие мероприятия по вашему запросу.",
            warnings,
        )

    if parsed.category:
        similar = _filter_candidates(
            candidates,
            parsed=parsed,
            include_category=False,
            include_date=True,
            include_time=True,
            include_city=True,
            include_org=True,
            include_price=True,
            include_age=True,
            allow_without_time=False,
            only_future_dates=False,
        )
        if similar:
            return (
                similar[:top_k],
                "similar",
                "Точных совпадений в выбранной категории не нашлось. Предлагаю похожие мероприятия на ту же дату и время.",
                warnings,
            )

    relaxed_with_unknown_time = _filter_candidates(
        candidates,
        parsed=parsed,
        include_category=bool(parsed.category),
        include_date=bool(parsed.requested_date),
        include_time=bool(parsed.time_period),
        include_city=True,
        include_org=True,
        include_price=True,
        include_age=True,
        allow_without_time=True,
        only_future_dates=False,
    )
    if relaxed_with_unknown_time:
        return (
            relaxed_with_unknown_time[:top_k],
            "alternative",
            "Нашёл ближайшие варианты. Для части событий время не указано, поэтому они добавлены как запасные.",
            warnings,
        )

    alternatives = _filter_candidates(
        candidates,
        parsed=parsed,
        include_category=False,
        include_date=False,
        include_time=False,
        include_city=False,
        include_org=False,
        include_price=False,
        include_age=False,
        allow_without_time=True,
        only_future_dates=False,
    )
    if alternatives:
        return (
            alternatives[:top_k],
            "alternative",
            "К сожалению, точных совпадений нет. Ниже — другие доступные мероприятия на сайте.",
            warnings,
        )

    return (
        [],
        "empty",
        "Пока не удалось подобрать мероприятия. Попробуйте уточнить запрос или изменить фильтры.",
        warnings,
    )


def _filter_candidates(
    candidates: list[EventCandidate],
    *,
    parsed: ParsedUserQuery,
    include_category: bool,
    include_date: bool,
    include_time: bool,
    include_city: bool,
    include_org: bool,
    include_price: bool,
    include_age: bool,
    allow_without_time: bool,
    only_future_dates: bool,
) -> list[EventCandidate]:
    filtered: list[EventCandidate] = []
    now_date = datetime.utcnow().date()

    for item in candidates:
        if include_city and parsed.city and (item.city or "").lower() != parsed.city.lower():
            continue

        if include_org and parsed.organization:
            org_text = (item.organization or "").lower()
            if parsed.organization.lower() not in org_text:
                continue

        if include_price:
            if parsed.min_price is not None and (item.price is None or item.price < parsed.min_price):
                continue
            if parsed.max_price is not None and (item.price is None or item.price > parsed.max_price):
                continue

        if include_age and parsed.age_limit is not None:
            event_age = _extract_event_age(item.age_limit)
            if event_age is None or event_age > parsed.age_limit:
                continue

        if include_category and parsed.category:
            if not _candidate_matches_category(item, parsed.category):
                continue

        if only_future_dates:
            if not item.date_event or item.date_event.date() <= now_date:
                continue

        if include_date and parsed.requested_date:
            if not item.date_event or item.date_event.date() != parsed.requested_date:
                continue

        if include_time and parsed.time_period:
            if not item.start_time:
                if allow_without_time:
                    pass
                else:
                    continue
            else:
                if not _matches_time_period(item.start_time, parsed.time_period):
                    continue

        filtered.append(item)

    return sorted(
        filtered,
        key=lambda item: (
            item.score,
            item.date_event or datetime.max,
            item.start_time or time.max,
        ),
        reverse=True,
    )


def _pick_nearest_future_date(
    candidates: list[EventCandidate],
    *,
    now_date: date,
) -> list[EventCandidate]:
    dated = [item for item in candidates if item.date_event and item.date_event.date() > now_date]
    if not dated:
        return []
    nearest_date = min(item.date_event.date() for item in dated)
    return [item for item in dated if item.date_event and item.date_event.date() == nearest_date]


def _to_event_match(item: EventCandidate, *, reason: str) -> AssistantEventMatch:
    return AssistantEventMatch(
        event_id=item.event_id,
        name=item.name,
        description=item.description,
        city=item.city,
        organization=item.organization,
        price=item.price,
        age_limit=item.age_limit,
        address=item.address,
        external_url=item.external_url,
        pictures_main=item.pictures_main,
        categories=item.categories,
        date_event=item.date_event,
        start_time=item.start_time.strftime("%H:%M") if item.start_time else None,
        score=round(item.score, 4),
        reason=reason,
    )


def _to_filters_out(parsed: ParsedUserQuery) -> AssistantFiltersOut:
    return AssistantFiltersOut(
        category=parsed.category,
        city=parsed.city,
        organization=parsed.organization,
        requested_date=parsed.requested_date,
        time_period=parsed.time_period,
        min_price=parsed.min_price,
        max_price=parsed.max_price,
        age_limit=parsed.age_limit,
    )


def _normalize_text(value: object) -> str:
    return " ".join(str(value or "").strip().split())


def _looks_like_afisha_intent(raw_intent: object, query_text: str) -> bool:
    if _normalize_text(raw_intent).lower() == "afisha_search":
        return True
    lowered = query_text.lower()
    if any(hint in lowered for hint in AFISHA_HINTS):
        return True
    if _extract_time_period_from_text(query_text):
        return True
    if _extract_city_from_text(query_text):
        return True
    return _extract_date_from_text(query_text, today=datetime.utcnow().date())[0] is not None


def _normalize_category(raw_value: object) -> Optional[str]:
    value = _normalize_text(raw_value).lower()
    return value if value in CATEGORY_KEYWORDS else None


def _normalize_city(raw_value: object) -> Optional[str]:
    value = _normalize_text(raw_value).lower()
    return CITY_ALIASES.get(value)


def _normalize_time_period(raw_value: object) -> Optional[str]:
    value = _normalize_text(raw_value).lower()
    return value if value in TIME_PERIODS else None


def _infer_category_from_text(text: str) -> Optional[str]:
    lowered = text.lower()
    for key, keywords in CATEGORY_KEYWORDS.items():
        if any(keyword in lowered for keyword in keywords):
            return key
    return None


def _extract_city_from_text(text: str) -> Optional[str]:
    lowered = text.lower()
    for alias, normalized in CITY_ALIASES.items():
        if alias in lowered:
            return normalized
    return None


def _extract_time_period_from_text(text: str) -> Optional[str]:
    lowered = text.lower()
    rules = {
        "morning": ("утро", "утром"),
        "day": ("день", "днём", "днем"),
        "evening": ("вечер", "вечером"),
        "night": ("ночь", "ночью"),
    }
    for period, keywords in rules.items():
        if any(keyword in lowered for keyword in keywords):
            return period

    match = re.search(r"\b([01]?\d|2[0-3]):([0-5]\d)\b", lowered)
    if not match:
        return None
    hour = int(match.group(1))
    minute = int(match.group(2))
    total = hour * 60 + minute
    for period, (start, end) in TIME_PERIODS.items():
        if start <= total < end:
            return period
    return None


def _extract_price_bounds(query_text: str, llm_data: dict[str, object]) -> tuple[Optional[float], Optional[float]]:
    min_price = _to_float(llm_data.get("min_price"))
    max_price = _to_float(llm_data.get("max_price"))

    lowered = query_text.lower()
    max_match = re.search(r"(до|не дороже)\s*(\d+(?:[.,]\d+)?)", lowered)
    if max_match:
        max_price = float(max_match.group(2).replace(",", "."))

    min_match = re.search(r"(от|не дешевле)\s*(\d+(?:[.,]\d+)?)", lowered)
    if min_match:
        min_price = float(min_match.group(2).replace(",", "."))

    return min_price, max_price


def _extract_age_limit(query_text: str, llm_data: dict[str, object]) -> Optional[int]:
    from_llm = _to_int(llm_data.get("age_limit"))
    if from_llm is not None:
        return from_llm
    match = re.search(r"\b(\d{1,2})\s*\+\b", query_text)
    if not match:
        return None
    return int(match.group(1))


def _to_float(value: object) -> Optional[float]:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _to_int(value: object) -> Optional[int]:
    if value is None:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _extract_requested_date(
    *,
    query_text: str,
    llm_date_value: object,
    today: date,
) -> tuple[Optional[date], bool]:
    parsed_date, explicit_year = _extract_date_from_text(query_text, today=today)
    if parsed_date:
        is_past = explicit_year and parsed_date < today
        return parsed_date, is_past

    llm_value = _normalize_text(llm_date_value)
    if not llm_value:
        return None, False
    try:
        llm_date = date.fromisoformat(llm_value)
    except ValueError:
        return None, False
    return llm_date, llm_date < today


def _extract_date_from_text(query_text: str, *, today: date) -> tuple[Optional[date], bool]:
    lowered = query_text.lower()
    month_match = re.search(
        r"\b(\d{1,2})\s+"
        r"(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)"
        r"(?:\s+(\d{4}))?\b",
        lowered,
    )
    if month_match:
        day_value = int(month_match.group(1))
        month_value = MONTHS[month_match.group(2)]
        year_raw = month_match.group(3)
        if year_raw:
            candidate = _safe_build_date(int(year_raw), month_value, day_value)
            return candidate, True
        candidate = _safe_build_date(today.year, month_value, day_value)
        if candidate and candidate < today:
            candidate = _safe_build_date(today.year + 1, month_value, day_value)
        return candidate, False

    digit_match = re.search(r"\b(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?\b", lowered)
    if digit_match:
        day_value = int(digit_match.group(1))
        month_value = int(digit_match.group(2))
        year_raw = digit_match.group(3)
        if year_raw:
            year = int(year_raw)
            if year < 100:
                year += 2000
            candidate = _safe_build_date(year, month_value, day_value)
            return candidate, True
        candidate = _safe_build_date(today.year, month_value, day_value)
        if candidate and candidate < today:
            candidate = _safe_build_date(today.year + 1, month_value, day_value)
        return candidate, False

    return None, False


def _safe_build_date(year: int, month: int, day: int) -> Optional[date]:
    try:
        return date(year, month, day)
    except ValueError:
        return None


def _candidate_matches_category(item: EventCandidate, category_key: str) -> bool:
    keywords = CATEGORY_KEYWORDS.get(category_key)
    if not keywords:
        return True
    blob = " ".join(
        filter(
            None,
            [
                item.name,
                item.description,
                " ".join(item.categories),
            ],
        )
    ).lower()
    return any(keyword in blob for keyword in keywords)


def _matches_time_period(start_time: time, period: str) -> bool:
    minutes = start_time.hour * 60 + start_time.minute
    bounds = TIME_PERIODS.get(period)
    if not bounds:
        return True
    return bounds[0] <= minutes < bounds[1]


def _extract_event_age(age_limit_value: Optional[str]) -> Optional[int]:
    value = _normalize_text(age_limit_value)
    if not value:
        return None
    match = re.search(r"(\d{1,2})", value)
    if not match:
        return None
    return int(match.group(1))


def _event_categories(event: Events) -> list[str]:
    categories: list[str] = []
    for link in event.group_links:
        if link.group and link.group.name:
            categories.append(link.group.name)
    return sorted(set(categories))


async def _load_events_map(db_connect: AsyncSession, event_ids: list[int]) -> dict[int, Events]:
    if not event_ids:
        return {}
    query = (
        select(Events)
        .where(
            Events.id.in_(event_ids),
            Events.deleted_at.is_(None),
        )
        .options(
            selectinload(Events.organization_rel),
            selectinload(Events.time_slots),
            selectinload(Events.group_links).selectinload(EventGroupsEvent.group),
        )
    )
    rows = (await db_connect.execute(query)).scalars().all()
    return {item.id: item for item in rows}


async def _build_vector_documents(db_connect: AsyncSession) -> list[dict[str, object]]:
    query = (
        select(Events)
        .where(Events.deleted_at.is_(None))
        .options(
            selectinload(Events.organization_rel),
            selectinload(Events.time_slots),
            selectinload(Events.group_links).selectinload(EventGroupsEvent.group),
        )
        .order_by(Events.id.asc())
    )
    events = (await db_connect.execute(query)).scalars().all()

    docs: list[dict[str, object]] = []
    for event in events:
        categories = _event_categories(event)
        org_name = event.organization_rel.name_org if event.organization_rel else ""
        city_value = event.city.value if event.city else ""
        price_value = float(event.price) if event.price is not None else 0.0
        age_value = event.age_limit or ""
        slots = sorted(event.time_slots, key=lambda item: item.date_event)

        if slots:
            for slot in slots:
                docs.append(
                    _build_single_document(
                        event=event,
                        organization=org_name,
                        city=city_value,
                        categories=categories,
                        price=price_value,
                        age_limit=age_value,
                        date_event_value=slot.date_event,
                        start_time_value=slot.start_time,
                        timeslot_id=slot.id,
                    )
                )
        else:
            docs.append(
                _build_single_document(
                    event=event,
                    organization=org_name,
                    city=city_value,
                    categories=categories,
                    price=price_value,
                    age_limit=age_value,
                    date_event_value=None,
                    start_time_value=None,
                    timeslot_id=0,
                )
            )

    return docs


def _build_single_document(
    *,
    event: Events,
    organization: str,
    city: str,
    categories: list[str],
    price: float,
    age_limit: str,
    date_event_value: Optional[datetime],
    start_time_value: Optional[time],
    timeslot_id: int,
) -> dict[str, object]:
    date_event_str = date_event_value.strftime("%d.%m.%Y") if date_event_value else ""
    start_time_str = start_time_value.strftime("%H:%M") if start_time_value else ""
    date_sort = int(date_event_value.timestamp()) if date_event_value else 0
    start_minutes = (
        start_time_value.hour * 60 + start_time_value.minute
        if start_time_value
        else -1
    )
    categories_text = ", ".join(categories)

    embedding_text = (
        f"Название: {event.name}\n"
        f"Город: {city or 'не указан'}\n"
        f"Цена: {price}\n"
        f"Организация: {organization or 'не указана'}\n"
        f"Возрастное ограничение: {age_limit or 'не указано'}\n"
        f"Категории: {categories_text or 'не указаны'}\n"
        f"Дата: {date_event_str or 'не указана'}\n"
        f"Время: {start_time_str or 'не указано'}\n"
        f"Описание: {event.description or ''}"
    )

    payload_json = json.dumps(
        {
            "event_id": event.id,
            "name": event.name,
            "city": city,
            "organization": organization,
            "price": price,
            "age_limit": age_limit,
            "categories": categories,
            "date_event": date_event_str,
            "start_time": start_time_str,
            "external_url": event.external_url,
            "address": event.address,
            "pictures_main": event.pictures_main,
        },
        ensure_ascii=False,
    )

    return {
        "doc_id": f"{event.id}:{timeslot_id}",
        "event_id": event.id,
        "timeslot_id": timeslot_id,
        "name": event.name[:512],
        "city": (city or "")[:64],
        "price": price,
        "organization": (organization or "")[:255],
        "age_limit": (age_limit or "")[:64],
        "categories": categories_text[:512],
        "date_event": date_event_str[:32],
        "start_time": start_time_str[:16],
        "date_sort": date_sort,
        "start_minutes": start_minutes,
        "payload": payload_json[:65535],
        "embedding_text": embedding_text,
    }
