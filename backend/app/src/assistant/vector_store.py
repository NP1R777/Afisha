from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

from pymilvus import Collection, CollectionSchema, DataType, FieldSchema, connections, utility

from core.settings import AppSettings

MILVUS_ALIAS = "assistant_milvus"


@dataclass(frozen=True)
class VectorDocument:
    doc_id: str
    event_id: int
    timeslot_id: int
    name: str
    city: str
    price: float
    organization: str
    age_limit: str
    categories: str
    date_event: str
    start_time: str
    date_sort: int
    start_minutes: int
    payload: str
    embedding: list[float]


@dataclass(frozen=True)
class VectorSearchHit:
    doc_id: str
    event_id: int
    timeslot_id: int
    score: float


def _connect(settings: AppSettings) -> None:
    connect_kwargs: dict[str, object] = {"alias": MILVUS_ALIAS}
    if settings.milvus_uri:
        connect_kwargs["uri"] = settings.milvus_uri
    else:
        connect_kwargs["host"] = settings.milvus_host
        connect_kwargs["port"] = str(settings.milvus_port)

    if settings.milvus_user:
        connect_kwargs["user"] = settings.milvus_user
    if settings.milvus_password:
        connect_kwargs["password"] = settings.milvus_password
    if settings.milvus_db_name:
        connect_kwargs["db_name"] = settings.milvus_db_name

    connections.connect(**connect_kwargs)


def _create_collection(settings: AppSettings) -> Collection:
    fields = [
        FieldSchema(name="doc_id", dtype=DataType.VARCHAR, max_length=128, is_primary=True),
        FieldSchema(name="event_id", dtype=DataType.INT64),
        FieldSchema(name="timeslot_id", dtype=DataType.INT64),
        FieldSchema(name="name", dtype=DataType.VARCHAR, max_length=512),
        FieldSchema(name="city", dtype=DataType.VARCHAR, max_length=64),
        FieldSchema(name="price", dtype=DataType.DOUBLE),
        FieldSchema(name="organization", dtype=DataType.VARCHAR, max_length=255),
        FieldSchema(name="age_limit", dtype=DataType.VARCHAR, max_length=64),
        FieldSchema(name="categories", dtype=DataType.VARCHAR, max_length=512),
        FieldSchema(name="date_event", dtype=DataType.VARCHAR, max_length=32),
        FieldSchema(name="start_time", dtype=DataType.VARCHAR, max_length=16),
        FieldSchema(name="date_sort", dtype=DataType.INT64),
        FieldSchema(name="start_minutes", dtype=DataType.INT64),
        FieldSchema(name="payload", dtype=DataType.VARCHAR, max_length=65535),
        FieldSchema(
            name="embedding",
            dtype=DataType.FLOAT_VECTOR,
            dim=settings.assistant_embedding_dim,
        ),
    ]
    schema = CollectionSchema(fields=fields, enable_dynamic_field=False)
    collection = Collection(
        name=settings.milvus_collection_name,
        schema=schema,
        using=MILVUS_ALIAS,
        consistency_level="Strong",
    )
    collection.create_index(
        field_name="embedding",
        index_params={
            "index_type": "IVF_FLAT",
            "metric_type": "COSINE",
            "params": {"nlist": 1024},
        },
    )
    collection.load()
    return collection


def rebuild_collection(settings: AppSettings, documents: Iterable[VectorDocument]) -> tuple[int, int]:
    _connect(settings)

    docs = list(documents)
    if utility.has_collection(settings.milvus_collection_name, using=MILVUS_ALIAS):
        utility.drop_collection(settings.milvus_collection_name, using=MILVUS_ALIAS)

    collection = _create_collection(settings)

    if not docs:
        return 0, 0

    payload = [
        [doc.doc_id for doc in docs],
        [doc.event_id for doc in docs],
        [doc.timeslot_id for doc in docs],
        [doc.name for doc in docs],
        [doc.city for doc in docs],
        [doc.price for doc in docs],
        [doc.organization for doc in docs],
        [doc.age_limit for doc in docs],
        [doc.categories for doc in docs],
        [doc.date_event for doc in docs],
        [doc.start_time for doc in docs],
        [doc.date_sort for doc in docs],
        [doc.start_minutes for doc in docs],
        [doc.payload for doc in docs],
        [doc.embedding for doc in docs],
    ]
    collection.insert(payload)
    collection.flush()
    collection.load()

    unique_events = len({doc.event_id for doc in docs})
    return unique_events, len(docs)


def search_collection(
    settings: AppSettings,
    *,
    embedding: list[float],
    limit: int,
) -> list[VectorSearchHit]:
    _connect(settings)
    if not utility.has_collection(settings.milvus_collection_name, using=MILVUS_ALIAS):
        return []

    collection = Collection(settings.milvus_collection_name, using=MILVUS_ALIAS)
    collection.load()
    results = collection.search(
        data=[embedding],
        anns_field="embedding",
        param={"metric_type": "COSINE", "params": {"nprobe": 16}},
        limit=limit,
        output_fields=["doc_id", "event_id", "timeslot_id"],
    )

    hits: list[VectorSearchHit] = []
    if not results:
        return hits

    for item in results[0]:
        entity = item.entity
        hits.append(
            VectorSearchHit(
                doc_id=str(entity.get("doc_id")),
                event_id=int(entity.get("event_id")),
                timeslot_id=int(entity.get("timeslot_id")),
                score=float(item.score),
            )
        )
    return hits
