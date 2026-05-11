#!/usr/bin/env python3
from __future__ import annotations

import argparse
from datetime import datetime
from pathlib import Path

from db_common import ensure_binary_exists, resolve_db_config, run_command


def parse_args() -> argparse.Namespace:
    project_root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(
        description="Создать SQL-дамп PostgreSQL с CREATE DATABASE."
    )
    parser.add_argument(
        "--env-file",
        type=Path,
        default=project_root / ".env",
        help="Путь к .env с DB_* переменными (по умолчанию backend/.env).",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=project_root / "db_dumps",
        help="Директория для сохранения дампа.",
    )
    parser.add_argument(
        "--dump-name",
        type=str,
        default=None,
        help="Имя файла дампа без расширения .sql.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    ensure_binary_exists("pg_dump")
    config = resolve_db_config(args.env_file)

    args.output_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    dump_name = args.dump_name or f"{config.name}_{timestamp}"
    dump_path = args.output_dir / f"{dump_name}.sql"

    command = [
        "pg_dump",
        "--host",
        config.host,
        "--port",
        config.port,
        "--username",
        config.user,
        "--format",
        "plain",
        "--encoding",
        "UTF8",
        "--create",
        "--clean",
        "--if-exists",
        "--no-owner",
        "--no-privileges",
        "--file",
        str(dump_path),
        config.name,
    ]

    run_command(command, password=config.password)

    print("Дамп создан успешно.")
    print(f"Файл: {dump_path}")


if __name__ == "__main__":
    main()
