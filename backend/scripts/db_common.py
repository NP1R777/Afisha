from __future__ import annotations

import os
import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class DbConfig:
    host: str
    port: str
    name: str
    user: str
    password: str


def load_env_file(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}

    result: dict[str, str] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        result[key] = value
    return result


def resolve_db_config(env_file: Path) -> DbConfig:
    env_values = load_env_file(env_file)

    def get_value(key: str) -> str | None:
        return os.getenv(key) or env_values.get(key)

    db_name = get_value("DB_NAME")
    db_user = get_value("DB_USER")
    db_password = get_value("DB_PASSWORD")
    db_address = get_value("DB_ADDRESS")
    db_host = get_value("DB_HOST")
    db_port = get_value("DB_PORT")

    if db_address:
        host, separator, port = db_address.rpartition(":")
        if separator:
            db_host = host
            db_port = port
        else:
            db_host = db_address

    db_host = db_host or "localhost"
    db_port = db_port or "5432"

    missing = [
        key
        for key, value in (
            ("DB_NAME", db_name),
            ("DB_USER", db_user),
            ("DB_PASSWORD", db_password),
        )
        if not value
    ]
    if missing:
        missing_text = ", ".join(missing)
        raise ValueError(
            f"Не заданы обязательные переменные окружения: {missing_text}. "
            f"Проверьте файл {env_file}."
        )

    return DbConfig(
        host=db_host,
        port=db_port,
        name=db_name,
        user=db_user,
        password=db_password,
    )


def ensure_binary_exists(binary_name: str) -> None:
    if shutil.which(binary_name):
        return
    raise FileNotFoundError(
        f"Не найден исполняемый файл '{binary_name}'. "
        "Установите PostgreSQL client tools и добавьте их в PATH."
    )


def run_command(command: list[str], password: str) -> None:
    command_env = os.environ.copy()
    command_env["PGPASSWORD"] = password
    subprocess.run(command, env=command_env, check=True)
