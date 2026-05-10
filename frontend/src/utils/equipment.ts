import { equipmentInventory } from "../data/equipmentInventory";
import type { ExerciseLibraryItem } from "../types/training";

export function isEquipmentAvailable(equipmentId: string) {
  return equipmentInventory[equipmentId]?.available === true;
}

export function getEquipmentName(equipmentId: string) {
  return equipmentInventory[equipmentId]?.name ?? equipmentId;
}

export function getMissingEquipment(exercise?: Pick<ExerciseLibraryItem, "equipment" | "availableByDefault"> | null) {
  if (!exercise?.equipment?.length) return [];
  if (exercise.availableByDefault === false) return exercise.equipment.filter((id) => !isEquipmentAvailable(id));
  return exercise.equipment.filter((id) => !isEquipmentAvailable(id));
}

export function isExerciseAvailable(exercise?: Pick<ExerciseLibraryItem, "equipment" | "availableByDefault"> | null) {
  if (!exercise) return true;
  if (exercise.availableByDefault === false) return false;
  if (!exercise.equipment?.length) return true;
  return exercise.equipment.some(isEquipmentAvailable);
}

export function filterAvailableExercises<T extends Pick<ExerciseLibraryItem, "equipment" | "availableByDefault">>(exercises: T[]) {
  return exercises.filter(isExerciseAvailable);
}

export function splitExercisesByAvailability<T extends Pick<ExerciseLibraryItem, "equipment" | "availableByDefault">>(exercises: T[]) {
  return exercises.reduce(
    (groups, exercise) => {
      groups[isExerciseAvailable(exercise) ? "available" : "unavailable"].push(exercise);
      return groups;
    },
    { available: [] as T[], unavailable: [] as T[] },
  );
}
