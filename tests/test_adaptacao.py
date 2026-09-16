import unittest

from treino.adaptacao import ExerciseAttempt, suggest_next_intensity
from treino.blocos import BlockExercise, ExerciseRecord, block_progress, create_block, next_exercise


class AdaptacaoTest(unittest.TestCase):
    def test_pain_has_priority_over_progression(self):
        result = suggest_next_intensity([ExerciseAttempt(100, 10, 10, 2), ExerciseAttempt(100, 10, 10, 2, pain=2)])
        self.assertEqual(result.action, "reduzir")
        self.assertEqual(result.suggested_load_kg, 90)

    def test_two_solid_attempts_progress(self):
        result = suggest_next_intensity([ExerciseAttempt(80, 10, 10, 2), ExerciseAttempt(80, 11, 10, 3)])
        self.assertEqual(result.action, "progredir")
        self.assertEqual(result.suggested_load_kg, 82)

    def test_insufficient_reps_reduces(self):
        result = suggest_next_intensity([ExerciseAttempt(60, 5, 10, 0)])
        self.assertEqual(result.action, "reduzir")
        self.assertEqual(result.suggested_load_kg, 57)

    def test_block_chooses_the_least_exposed_exercise(self):
        block = create_block("base", "Base", "força", [BlockExercise("agachar", "Agachamento", 2), BlockExercise("remar", "Remada", 2)])
        records = [ExerciseRecord("agachar", ExerciseAttempt(60, 10, 10, 2))]
        result = next_exercise(block, records)
        self.assertEqual(result.exercise.id, "remar")
        self.assertEqual(result.reason, "Remada: 0/2 exposições concluídas neste bloco.")

    def test_block_counts_exposures_without_exceeding_target(self):
        block = create_block("base", "Base", "força", [BlockExercise("agachar", "Agachamento", 2)])
        records = [ExerciseRecord("agachar", ExerciseAttempt(60, 10, 10, 2)) for _ in range(3)]
        self.assertEqual(block_progress(block, records), (2, 2))


if __name__ == "__main__":
    unittest.main()
