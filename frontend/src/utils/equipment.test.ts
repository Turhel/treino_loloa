import { describe, expect, it } from "vitest";
import { exerciseLibrary, findExerciseLibraryItem } from "../data/exerciseLibrary";
import { filterAvailableExercises, isEquipmentAvailable, isExerciseAvailable } from "./equipment";

describe("equipment inventory", () => {
  it("detecta equipamentos disponíveis e indisponíveis", () => {
    expect(isEquipmentAvailable("leg_press_45")).toBe(true);
    expect(isEquipmentAvailable("leg_press_90")).toBe(false);
  });

  it("marca exercício com equipamento disponível como disponível", () => {
    expect(isExerciseAvailable(findExerciseLibraryItem("leg_press_45"))).toBe(true);
  });

  it("marca exercício com equipamento indisponível como indisponível", () => {
    expect(isExerciseAvailable(findExerciseLibraryItem("leg_press_90"))).toBe(false);
  });

  it("filtra alternativas indisponíveis", () => {
    const available = filterAvailableExercises([exerciseLibrary.leg_press_45, exerciseLibrary.leg_press_90].filter(Boolean));
    expect(available.map((item) => item.id)).toEqual(["leg_press_45"]);
  });

  it("mantém esteira e bicicleta como cardio disponível e elíptico indisponível", () => {
    expect(isExerciseAvailable(findExerciseLibraryItem("esteira"))).toBe(true);
    expect(isExerciseAvailable(findExerciseLibraryItem("bicicleta_ergometrica"))).toBe(true);
    expect(isExerciseAvailable(findExerciseLibraryItem("eliptico"))).toBe(false);
  });

  it("mantém sumô separado em terra e agachamento", () => {
    expect(findExerciseLibraryItem("levantamento_terra_sumo")?.name).toContain("terra");
    expect(findExerciseLibraryItem("agachamento_sumo")?.name).toContain("Agachamento");
  });
});
