from __future__ import annotations

import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

TOOL_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(TOOL_DIR))

from generator import generate
from schemas import Exercise
from storage import DATA_FILES, create_backup
from validators import validate_data


GOOD_DATA = {
    "equipment": [{"id": "cabo", "name": "Cabo", "type": "maquina", "available": True}],
    "muscles": [
        {
            "id": "dorsal",
            "title": "Dorsal",
            "description": "Costas.",
            "tips": ["Controle."],
            "image": "",
            "group": "costas",
        }
    ],
    "exercises": [
        {
            "id": "puxada",
            "name": "Puxada",
            "category": "puxar",
            "exerciseKind": "composto",
            "focus": "Dorsal",
            "muscles": ["dorsal"],
            "equipment": ["cabo"],
            "rest": 90,
            "met": 4.5,
            "description": "Puxada vertical.",
            "tips": ["Puxe com os cotovelos."],
            "alternatives": [],
            "videoKey": "puxada",
            "illustrations": [],
        }
    ],
    "videos": [{"exerciseId": "puxada", "youtube": "https://youtube.com/watch?v=abc", "tiktok": ""}],
    "training_plans": [
        {
            "id": "plano",
            "name": "Plano",
            "phase": "custom",
            "weeks": [
                {
                    "id": "A",
                    "label": "Semana A",
                    "days": [
                        {
                            "id": "a-segunda",
                            "week": "A",
                            "day": "Segunda",
                            "title": "Puxar",
                            "type": "puxar",
                            "exercises": [{"id": "puxada", "order": 1}],
                        }
                    ],
                }
            ],
        }
    ],
}


class TrainingAdminTests(unittest.TestCase):
    def test_schema_accepts_good_exercise(self) -> None:
        exercise = Exercise.model_validate(GOOD_DATA["exercises"][0])
        self.assertEqual(exercise.id, "puxada")
        self.assertEqual(exercise.muscles, ["dorsal"])

    def test_schema_rejects_missing_required_field(self) -> None:
        bad = dict(GOOD_DATA["exercises"][0])
        del bad["name"]
        with self.assertRaises(TypeError):
            Exercise.model_validate(bad)

    def test_validator_detects_missing_alternative(self) -> None:
        data = json.loads(json.dumps(GOOD_DATA))
        data["exercises"][0]["alternatives"] = ["nao_existe"]
        errors = validate_data(data)
        self.assertTrue(any("alternativa inexistente" in error for error in errors))

    def test_generator_creates_files(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            files = generate(json.loads(json.dumps(GOOD_DATA)), Path(tmp))
            self.assertEqual(len(files), 4)
            self.assertTrue((Path(tmp) / "exerciseLibrary.generated.ts").exists())

    def test_backup_is_created_before_save(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            backup_path = TOOL_DIR / "backups"
            before = set(backup_path.iterdir()) if backup_path.exists() else set()
            for path in DATA_FILES.values():
                path.parent.mkdir(parents=True, exist_ok=True)
                if not path.exists():
                    path.write_text("[]\n", encoding="utf-8")
            created = create_backup()
            try:
                self.assertTrue(created.exists())
                self.assertTrue((created / "exercises.json").exists())
            finally:
                after = set(backup_path.iterdir()) if backup_path.exists() else set()
                for path in after - before:
                    shutil.rmtree(path, ignore_errors=True)
            self.assertTrue(tmp_path.exists())


if __name__ == "__main__":
    unittest.main()

