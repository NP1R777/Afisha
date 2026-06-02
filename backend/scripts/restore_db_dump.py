#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path

from db_common import ensure_binary_exists, resolve_db_config, run_command


def parse_args() -> argparse.Namespace:
    project_root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(
        description="Восстановить PostgreSQL БД из SQL-дампа."
    )
    parser.add_argument(
        "--dump-file",
        type=Path,
        required=True,
        help="Путь к .sql дампу, созданному скриптом create_db_dump.py.",
    )
    parser.add_argument(
        "--env-file",
        type=Path,
        default=project_root / ".env",
        help="Путь к .env с DB_* переменными (по умолчанию backend/.env).",
    )
    parser.add_argument(
        "--maintenance-db",
        type=str,
        default="postgres",
        help=(
            "Служебная БД, через которую выполняется восстановление. "
            "Обычно postgres."
        ),
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    ensure_binary_exists("psql")
    config = resolve_db_config(args.env_file)

    dump_file = args.dump_file.resolve()
    if not dump_file.exists():
        raise FileNotFoundError(f"Файл дампа не найден: {dump_file}")

    command = [
        "psql",
        "--host",
        config.host,
        "--port",
        config.port,
        "--username",
        config.user,
        "--dbname",
        args.maintenance_db,
        "--set",
        "ON_ERROR_STOP=on",
        "--file",
        str(dump_file),
    ]

    run_command(command, password=config.password)

    print("База данных успешно восстановлена из дампа.")
    print(f"Использованный файл: {dump_file}")
    print(f"Целевая БД из дампа: {config.name}")


if __name__ == "__main__":
    main()
