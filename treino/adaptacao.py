"""Motor de treino adaptativo, independente de interface e banco de dados."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ExerciseAttempt:
    load_kg: float
    reps: int
    target_reps: int
    rir: int
    pain: int = 0
    completed: bool = True


@dataclass(frozen=True)
class IntensitySuggestion:
    action: str
    suggested_load_kg: float
    message: str
    confidence: str


def suggest_next_intensity(attempts: list[ExerciseAttempt]) -> IntensitySuggestion:
    """Sugere o próximo passo sem assumir que existe uma sessão em calendário.

    A decisão usa as três últimas tentativas do mesmo exercício. Dor, falha e
    queda de repetições têm precedência sobre qualquer regra de progressão.
    """
    if not attempts:
        return IntensitySuggestion(
            action="começar",
            suggested_load_kg=0,
            message="Sem histórico: escolha uma carga confortável e registre a primeira tentativa.",
            confidence="baixa",
        )

    recent = attempts[-3:]
    latest = recent[-1]
    if latest.pain >= 2:
        return _adjust(latest, -0.10, "reduzir", "Houve dor relevante. Reduza a carga em 10% ou troque o exercício.", "alta")
    if not latest.completed or latest.reps < max(1, latest.target_reps - 3):
        return _adjust(latest, -0.05, "reduzir", "A última tentativa ficou abaixo da faixa prevista. Reduza 5% e priorize a execução.", "alta")

    successful = [
        attempt
        for attempt in recent
        if attempt.completed and attempt.pain == 0 and attempt.reps >= attempt.target_reps and attempt.rir >= 2
    ]
    if len(successful) >= 2:
        return _adjust(latest, 0.025, "progredir", "Duas tentativas recentes ficaram sólidas. Suba 2,5% na próxima vez.", "média")
    if latest.rir <= 0:
        return _adjust(latest, -0.025, "reduzir", "Você chegou ao limite na última tentativa. Reduza 2,5% para recuperar margem.", "média")

    return IntensitySuggestion(
        action="manter",
        suggested_load_kg=round(latest.load_kg, 2),
        message="Mantenha a carga e procure repetir com mais controle ou uma repetição a mais.",
        confidence="média",
    )


def _adjust(attempt: ExerciseAttempt, factor: float, action: str, message: str, confidence: str) -> IntensitySuggestion:
    return IntensitySuggestion(
        action=action,
        suggested_load_kg=round(max(0, attempt.load_kg * (1 + factor)), 2),
        message=message,
        confidence=confidence,
    )
