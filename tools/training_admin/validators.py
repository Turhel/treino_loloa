from __future__ import annotations

import re
from pathlib import Path
from typing import Any

try:
    from .storage import ROOT
except ImportError:  # pragma: no cover - direct script execution
    from storage import ROOT

URL_RE = re.compile(r"^https?://", re.I)
VALID_CATEGORIES = {"puxar", "empurrar", "inferior", "gluteo", "superior", "core", "cardio", "mobilidade"}
VALID_KINDS = {"composto", "isolador", "cardio", "mobilidade"}


def public_path_exists(value: str, root: Path = ROOT) -> bool:
    if not value:
        return True
    normalized = value[1:] if value.startswith("/") else value
    return (root / "frontend" / "public" / normalized).exists()


def validate_data(data: dict[str, list[dict[str, Any]]], root: Path = ROOT) -> list[str]:
    errors: list[str] = []
    exercises = data.get("exercises", [])
    muscles = data.get("muscles", [])
    equipment = data.get("equipment", [])
    videos = data.get("videos", [])
    plans = data.get("training_plans", [])

    exercise_ids = ids_for(exercises, "exercícios", errors)
    muscle_ids = ids_for(muscles, "músculos", errors)
    equipment_ids = ids_for(equipment, "equipamentos", errors)
    ids_for(plans, "planos", errors)

    for item in exercises:
        label = item.get("id", "<sem id>")
        if item.get("category") not in VALID_CATEGORIES:
            errors.append(f"Exercício {label} tem categoria inválida.")
        if item.get("exerciseKind") not in VALID_KINDS:
            errors.append(f"Exercício {label} tem tipo inválido.")
        if not item.get("muscles"):
            errors.append(f"Exercício {label} sem músculo.")
        for muscle in item.get("muscles", []):
            if muscle not in muscle_ids:
                errors.append(f"Exercício {label} usa músculo inexistente: {muscle}.")
        for alt in item.get("alternatives", []):
            if alt not in exercise_ids:
                errors.append(f"Exercício {label} usa alternativa inexistente: {alt}.")
        for eq in item.get("equipment", []):
            if eq not in equipment_ids:
                errors.append(f"Exercício {label} usa equipamento inexistente: {eq}.")
        rest = item.get("rest", 0)
        if not isinstance(rest, (int, float)) or rest < 0:
            errors.append(f"Exercício {label} tem descanso inválido.")
        met = item.get("met")
        if met is not None and (not isinstance(met, (int, float)) or met <= 0):
            errors.append(f"Exercício {label} tem MET inválido.")
        for illustration in item.get("illustrations", []):
            if not public_path_exists(illustration, root):
                errors.append(f"Ilustração não encontrada em {label}: {illustration}.")

    for muscle in muscles:
        image = muscle.get("image", "")
        if image and not public_path_exists(image, root):
            errors.append(f"Imagem de músculo não encontrada em {muscle.get('id')}: {image}.")

    for video in videos:
        exercise_id = video.get("exerciseId")
        if exercise_id not in exercise_ids:
            errors.append(f"Vídeo aponta para exercício inexistente: {exercise_id}.")
        for field in ("youtube", "tiktok"):
            url = video.get(field)
            if url and not URL_RE.match(url):
                errors.append(f"URL inválida em {field} para {exercise_id}.")

    for plan in plans:
        plan_id = plan.get("id", "<sem id>")
        if not plan.get("weeks"):
            errors.append(f"Plano {plan_id} sem semana.")
        for week in plan.get("weeks", []):
            if not week.get("days"):
                errors.append(f"Semana {week.get('id')} do plano {plan_id} sem dia.")
            for day in week.get("days", []):
                if not day.get("exercises"):
                    errors.append(f"Dia {day.get('id')} do plano {plan_id} sem exercício.")
                for exercise in day.get("exercises", []):
                    exercise_id = exercise.get("id")
                    if exercise_id not in exercise_ids:
                        errors.append(f"Treino {plan_id} usa exercício inexistente: {exercise_id}.")

    return errors


def ids_for(items: list[dict[str, Any]], name: str, errors: list[str]) -> set[str]:
    seen: set[str] = set()
    for item in items:
        item_id = item.get("id")
        if not item_id:
            errors.append(f"Item sem id em {name}.")
            continue
        if item_id in seen:
            errors.append(f"ID duplicado em {name}: {item_id}.")
        seen.add(item_id)
    return seen


def assert_valid(data: dict[str, list[dict[str, Any]]], root: Path = ROOT) -> None:
    errors = validate_data(data, root)
    if errors:
        raise ValueError("\n".join(errors))
