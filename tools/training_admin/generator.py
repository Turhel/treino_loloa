from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

if __package__ in (None, ""):
    sys.path.append(str(Path(__file__).resolve().parent))
    from storage import DATA_DIR, ROOT, load_all
    from validators import assert_valid
else:  # pragma: no cover
    from .storage import DATA_DIR, ROOT, load_all
    from .validators import assert_valid

GENERATED_DIR = ROOT / "frontend" / "src" / "data" / "generated"


def ts_literal(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, indent=2)


def build_exercise_items(exercises: list[dict[str, Any]]) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for exercise in exercises:
        item = {
            "id": exercise["id"],
            "name": exercise["name"],
            "focus": exercise["focus"],
            "muscles": exercise.get("muscles", []),
            "equipment": exercise.get("equipment", []),
            "description": exercise.get("description", ""),
            "tips": exercise.get("tips", []),
            "alternatives": exercise.get("alternatives", []),
            "rest": exercise.get("rest", 60),
            "videoKey": exercise.get("videoKey") or exercise["id"],
            "illustrations": exercise.get("illustrations", []),
            "met": exercise.get("met"),
            "exerciseKind": exercise.get("exerciseKind"),
            "availableByDefault": exercise.get("availableByDefault"),
        }
        items.append({key: value for key, value in item.items() if value is not None})
    return items


def build_muscles(muscles: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    return {
        muscle["id"]: {
            "title": muscle["title"],
            "description": muscle["description"],
            "tips": muscle.get("tips", []),
            "image": muscle["image"],
            "group": muscle.get("group"),
        }
        for muscle in muscles
    }


def build_videos(videos: list[dict[str, Any]]) -> dict[str, dict[str, str]]:
    result: dict[str, dict[str, str]] = {}
    for video in videos:
        links = {
            key: value
            for key, value in {
                "youtube": video.get("youtube") or "",
                "tiktok": video.get("tiktok") or "",
            }.items()
            if value
        }
        if links:
            result[video["exerciseId"]] = links
    return result


def build_training_plans(plans: list[dict[str, Any]], exercises: list[dict[str, Any]]) -> list[dict[str, Any]]:
    exercise_map = {exercise["id"]: exercise for exercise in exercises}
    enriched = json.loads(json.dumps(plans, ensure_ascii=False))
    for plan in enriched:
        for week in plan.get("weeks", []):
            for day in week.get("days", []):
                for item in day.get("exercises", []):
                    source = exercise_map.get(item.get("id"), {})
                    item.setdefault("name", source.get("name", item.get("id", "")))
                    item.setdefault("focus", source.get("focus", ""))
                    item.setdefault("rest", source.get("rest", 60))
                    item.setdefault("alternatives", source.get("alternatives", []))
                    item.setdefault("videoKey", source.get("videoKey") or source.get("id"))
    return enriched


def write_file(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def generate(data: dict[str, list[dict[str, Any]]] | None = None, output_dir: Path = GENERATED_DIR) -> list[Path]:
    loaded = data if data is not None else load_all()
    assert_valid(loaded)
    output_dir.mkdir(parents=True, exist_ok=True)

    exercise_items = build_exercise_items(loaded["exercises"])
    muscle_data = build_muscles(loaded["muscles"])
    video_data = build_videos(loaded["videos"])
    training_plans = build_training_plans(loaded["training_plans"], loaded["exercises"])

    files = {
        "exerciseLibrary.generated.ts": (
            "import type { ExerciseLibraryItem } from \"../../types/training\";\n\n"
            "export const generatedExerciseLibraryItems = "
            f"{ts_literal(exercise_items)} satisfies ExerciseLibraryItem[];\n\n"
            "export const generatedExerciseLibrary = Object.fromEntries(\n"
            "  generatedExerciseLibraryItems.map((item) => [item.id, item]),\n"
            ") as Record<string, ExerciseLibraryItem>;\n"
        ),
        "muscleData.generated.ts": (
            "import type { MuscleInfo } from \"../../types/training\";\n\n"
            "export const generatedMuscleImages = "
            f"{ts_literal(muscle_data)} satisfies Record<string, MuscleInfo>;\n"
        ),
        "exerciseVideos.generated.ts": (
            "import type { ExerciseVideoLinks } from \"../../types/training\";\n\n"
            "export const generatedExerciseVideoLinks = "
            f"{ts_literal(video_data)} satisfies Record<string, ExerciseVideoLinks>;\n"
        ),
        "trainingPlans.generated.ts": (
            "import type { TrainingPlan } from \"../../types/training\";\n\n"
            "export const generatedTrainingPlans = "
            f"{ts_literal(training_plans)} satisfies TrainingPlan[];\n"
        ),
    }

    written: list[Path] = []
    for filename, content in files.items():
        path = output_dir / filename
        write_file(path, content)
        written.append(path)
    return written


def main() -> int:
    try:
        files = generate()
    except Exception as exc:
        print(f"Erro ao gerar TypeScript: {exc}", file=sys.stderr)
        return 1
    for path in files:
        print(path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
