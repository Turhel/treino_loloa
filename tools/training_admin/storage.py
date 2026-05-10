from __future__ import annotations

import json
import shutil
from datetime import datetime
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
TOOL_DIR = Path(__file__).resolve().parent
DATA_DIR = TOOL_DIR / "data"
BACKUP_DIR = TOOL_DIR / "backups"

DATA_FILES = {
    "exercises": DATA_DIR / "exercises.json",
    "muscles": DATA_DIR / "muscles.json",
    "videos": DATA_DIR / "videos.json",
    "training_plans": DATA_DIR / "training_plans.json",
    "equipment": DATA_DIR / "equipment.json",
}


def ensure_data_files() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    for path in DATA_FILES.values():
        if not path.exists():
            path.write_text("[]\n", encoding="utf-8")


def load_json(name: str) -> list[dict[str, Any]]:
    ensure_data_files()
    path = DATA_FILES[name]
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError(f"JSON inválido em {path}: {exc}") from exc
    if not isinstance(data, list):
        raise ValueError(f"{path} precisa conter uma lista JSON.")
    return data


def load_all() -> dict[str, list[dict[str, Any]]]:
    return {name: load_json(name) for name in DATA_FILES}


def create_backup() -> Path:
    ensure_data_files()
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    target = BACKUP_DIR / stamp
    target.mkdir(parents=True, exist_ok=True)
    for path in DATA_FILES.values():
        if path.exists():
            shutil.copy2(path, target / path.name)
    return target


def save_json(name: str, data: list[dict[str, Any]], *, backup: bool = True) -> Path:
    ensure_data_files()
    if backup:
        create_backup()
    path = DATA_FILES[name]
    serialized = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    path.write_text(serialized, encoding="utf-8")
    return path


def save_all(data: dict[str, list[dict[str, Any]]], *, backup: bool = True, validate: bool = True) -> None:
    ensure_data_files()
    if validate:
        try:
            from .validators import assert_valid
        except ImportError:  # pragma: no cover - direct script execution
            from validators import assert_valid

        assert_valid(data)
    if backup:
        create_backup()
    for name, items in data.items():
        if name in DATA_FILES:
            save_json(name, items, backup=False)
