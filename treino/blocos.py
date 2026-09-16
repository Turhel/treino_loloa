"""Funções para treinos organizados por blocos adaptativos.

Um bloco não possui dias fixos. Ele termina quando seus exercícios alcançam a
quantidade de exposições definida, no ritmo que a pessoa conseguir manter.
"""

from __future__ import annotations

from dataclasses import dataclass

from treino.adaptacao import ExerciseAttempt, IntensitySuggestion, suggest_next_intensity


@dataclass(frozen=True)
class BlockExercise:
    id: str
    name: str
    target_exposures: int = 3


@dataclass(frozen=True)
class TrainingBlock:
    id: str
    name: str
    objective: str
    exercises: tuple[BlockExercise, ...]


@dataclass(frozen=True)
class ExerciseRecord:
    exercise_id: str
    attempt: ExerciseAttempt


@dataclass(frozen=True)
class NextExercise:
    exercise: BlockExercise | None
    suggestion: IntensitySuggestion | None
    reason: str


def create_block(block_id: str, name: str, objective: str, exercises: list[BlockExercise]) -> TrainingBlock:
    """Cria um bloco validado; cada exercício precisa de ao menos uma exposição."""
    if not block_id.strip() or not name.strip():
        raise ValueError("Bloco precisa de id e nome.")
    if not exercises:
        raise ValueError("Bloco precisa ter ao menos um exercício.")
    if len({exercise.id for exercise in exercises}) != len(exercises):
        raise ValueError("Um bloco não pode repetir o mesmo exercício.")
    if any(exercise.target_exposures < 1 for exercise in exercises):
        raise ValueError("Cada exercício precisa de pelo menos uma exposição.")
    return TrainingBlock(id=block_id, name=name, objective=objective, exercises=tuple(exercises))


def records_for_exercise(records: list[ExerciseRecord], exercise_id: str) -> list[ExerciseAttempt]:
    return [record.attempt for record in records if record.exercise_id == exercise_id]


def completed_exposures(records: list[ExerciseRecord], exercise_id: str) -> int:
    return sum(attempt.completed for attempt in records_for_exercise(records, exercise_id))


def block_progress(block: TrainingBlock, records: list[ExerciseRecord]) -> tuple[int, int]:
    """Retorna exposições concluídas e exposições necessárias no bloco."""
    completed = sum(min(completed_exposures(records, exercise.id), exercise.target_exposures) for exercise in block.exercises)
    target = sum(exercise.target_exposures for exercise in block.exercises)
    return completed, target


def next_exercise(block: TrainingBlock, records: list[ExerciseRecord]) -> NextExercise:
    """Escolhe o exercício menos exposto; empates respeitam a ordem do bloco.

    Assim, faltar dois dias não produz 'atraso': o próximo passo continua sendo
    simplesmente a necessidade mais antiga e menos atendida do bloco.
    """
    pending = [exercise for exercise in block.exercises if completed_exposures(records, exercise.id) < exercise.target_exposures]
    if not pending:
        return NextExercise(exercise=None, suggestion=None, reason="Bloco concluído. Revise, repita ou crie o próximo bloco.")

    chosen = min(pending, key=lambda exercise: completed_exposures(records, exercise.id))
    history = records_for_exercise(records, chosen.id)
    suggestion = suggest_next_intensity(history)
    exposure = completed_exposures(records, chosen.id)
    return NextExercise(
        exercise=chosen,
        suggestion=suggestion,
        reason=f"{chosen.name}: {exposure}/{chosen.target_exposures} exposições concluídas neste bloco.",
    )
