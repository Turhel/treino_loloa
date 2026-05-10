from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any, Literal

Category = Literal["puxar", "empurrar", "inferior", "gluteo", "superior", "core", "cardio", "mobilidade"]
ExerciseKind = Literal["composto", "isolador", "cardio", "mobilidade"]


class JsonModel:
    """Small pydantic-like surface so the tool runs even before deps are installed."""

    @classmethod
    def model_validate(cls, data: dict[str, Any]):
        return cls(**data)

    def model_dump(self, **_: Any) -> dict[str, Any]:
        return asdict(self)  # type: ignore[arg-type]


@dataclass
class Exercise(JsonModel):
    id: str
    name: str
    category: Category
    exerciseKind: ExerciseKind
    focus: str
    muscles: list[str]
    equipment: list[str] = field(default_factory=list)
    rest: int = 60
    met: float | None = None
    description: str = ""
    tips: list[str] = field(default_factory=list)
    alternatives: list[str] = field(default_factory=list)
    videoKey: str | None = None
    illustrations: list[str] = field(default_factory=list)
    availableByDefault: bool | None = None


@dataclass
class Muscle(JsonModel):
    id: str
    title: str
    description: str
    tips: list[str]
    image: str
    group: str


@dataclass
class Equipment(JsonModel):
    id: str
    name: str
    type: str
    available: bool = True
    notes: str | None = None


@dataclass
class VideoLinks(JsonModel):
    exerciseId: str
    youtube: str | None = None
    tiktok: str | None = None
    sourceName: str | None = None
    notes: str | None = None


@dataclass
class PlanExercise(JsonModel):
    id: str
    order: int | str
    name: str | None = None
    focus: str | None = None
    rest: int | None = None
    alternatives: list[str] = field(default_factory=list)
    videoKey: str | None = None


@dataclass
class TrainingDay(JsonModel):
    id: str
    week: str
    day: str
    title: str
    type: str
    exercises: list[PlanExercise]
    optional: str | None = None
    phase: str | None = None


@dataclass
class TrainingWeek(JsonModel):
    id: str
    label: str
    days: list[TrainingDay]
    phase: str | None = None


@dataclass
class TrainingPlan(JsonModel):
    id: str
    name: str
    phase: str
    weeks: list[TrainingWeek]
