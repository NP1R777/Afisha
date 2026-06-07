#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
from pathlib import Path

from db_common import ensure_binary_exists, resolve_db_config, run_command

IDENTIFIER_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


def parse_args() -> argparse.Namespace:
    project_root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(
        description="Очистить выбранные таблицы PostgreSQL (TRUNCATE или DELETE)."
    )
    parser.add_argument(
        "--tables",
        nargs="+",
        required=True,
        help=(
            "Список таблиц для очистки. Поддерживается формат table "
            "или schema.table (например: parsed_event events news)."
        ),
    )
    parser.add_argument(
        "--mode",
        choices=("truncate", "delete"),
        default="truncate",
        help=(
            "Режим очистки: truncate (по умолчанию, RESTART IDENTITY CASCADE) "
            "или delete (обычное DELETE FROM)."
        ),
    )
    parser.add_argument(
        "--schema",
        type=str,
        default="public",
        help="Схема по умолчанию для таблиц без префикса schema.table.",
    )
    parser.add_argument(
        "--env-file",
        type=Path,
        default=project_root / ".env",
        help="Путь к .env с DB_* переменными (по умолчанию backend/.env).",
    )
    parser.add_argument(
        "--yes",
        action="store_true",
        help="Подтвердить очистку без интерактивного вопроса.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Только показать SQL без выполнения.",
    )
    return parser.parse_args()


def _validate_identifier(value: str, *, label: str) -> str:
    normalized = value.strip()
    if not normalized or not IDENTIFIER_RE.match(normalized):
        raise ValueError(
            f"Некорректное имя {label}: '{value}'. Разрешены только [A-Za-z0-9_] и первый символ не цифра."
        )
    return normalized


def _parse_table_ref(raw_value: str, *, default_schema: str) -> tuple[str, str]:
    normalized = raw_value.strip()
    if "." in normalized:
        if normalized.count(".") != 1:
            raise ValueError(f"Некорректный формат таблицы '{raw_value}'. Ожидается table или schema.table.")
        raw_schema, raw_table = normalized.split(".", 1)
    else:
        raw_schema, raw_table = default_schema, normalized

    schema = _validate_identifier(raw_schema, label="схемы")
    table = _validate_identifier(raw_table, label="таблицы")
    return schema, table


def _quote_ident(value: str) -> str:
    return f'"{value}"'


def _build_cleanup_sql(
    *,
    mode: str,
    table_refs: list[tuple[str, str]],
) -> str:
    quoted_tables = [f'{_quote_ident(schema)}.{_quote_ident(table)}' for schema, table in table_refs]
    if mode == "truncate":
        return f"TRUNCATE TABLE {', '.join(quoted_tables)} RESTART IDENTITY CASCADE;"
    return "\n".join([f"DELETE FROM {quoted_table};" for quoted_table in quoted_tables])


def _unique_preserve_order(items: list[tuple[str, str]]) -> list[tuple[str, str]]:
    seen: set[tuple[str, str]] = set()
    unique_items: list[tuple[str, str]] = []
    for item in items:
        if item in seen:
            continue
        seen.add(item)
        unique_items.append(item)
    return unique_items


def _format_table_list(table_refs: list[tuple[str, str]]) -> str:
    return ", ".join([f"{schema}.{table}" for schema, table in table_refs])


def main() -> None:
    args = parse_args()
    default_schema = _validate_identifier(args.schema, label="схемы")
    table_refs = _unique_preserve_order(
        [_parse_table_ref(raw_table, default_schema=default_schema) for raw_table in args.tables]
    )
    cleanup_sql = _build_cleanup_sql(mode=args.mode, table_refs=table_refs)

    print(f"Режим очистки: {args.mode}")
    print(f"Таблицы: {_format_table_list(table_refs)}")
    print("SQL:")
    print(cleanup_sql)

    if args.dry_run:
        print("Dry-run включен, SQL не выполнялся.")
        return

    ensure_binary_exists("psql")
    config = resolve_db_config(args.env_file)
    print(f"База данных: {config.name}")

    if not args.yes:
        confirmation = input("Введите YES для подтверждения очистки: ").strip()
        if confirmation != "YES":
            print("Операция отменена.")
            return

    command = [
        "psql",
        "--host",
        config.host,
        "--port",
        config.port,
        "--username",
        config.user,
        "--dbname",
        config.name,
        "--set",
        "ON_ERROR_STOP=on",
        "--command",
        cleanup_sql,
    ]

    run_command(command, password=config.password)
    print("Очистка таблиц успешно выполнена.")


if __name__ == "__main__":
    main()
