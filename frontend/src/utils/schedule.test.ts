import { describe, expect, it } from "vitest";
import { getCurrentWeekId, getCycleIndex, getFirstBusinessDate, getSessionDateForWeekDay, getWeekBlockStartDate, getWeeksElapsed } from "./schedule";

describe("schedule", () => {
  it("calcula A/B recorrente", () => {
    const weeks = ["A", "B"];
    expect(getCurrentWeekId("2026-05-04", "2026-05-04", weeks)).toBe("A");
    expect(getCurrentWeekId("2026-05-04", "2026-05-11", weeks)).toBe("B");
    expect(getCurrentWeekId("2026-05-04", "2026-05-18", weeks)).toBe("A");
    expect(getCurrentWeekId("2026-05-04", "2026-05-25", weeks)).toBe("B");
    expect(getCycleIndex("2026-05-04", "2026-05-18", weeks.length)).toBe(1);
  });

  it("calcula A/B/C/D recorrente", () => {
    const weeks = ["A", "B", "C", "D"];
    expect(getCurrentWeekId("2026-05-04", "2026-05-04", weeks)).toBe("A");
    expect(getCurrentWeekId("2026-05-04", "2026-05-11", weeks)).toBe("B");
    expect(getCurrentWeekId("2026-05-04", "2026-05-18", weeks)).toBe("C");
    expect(getCurrentWeekId("2026-05-04", "2026-05-25", weeks)).toBe("D");
    expect(getCurrentWeekId("2026-05-04", "2026-06-01", weeks)).toBe("A");
    expect(getCurrentWeekId("2026-05-04", "2026-06-22", weeks)).toBe("D");
    expect(getCurrentWeekId("2026-05-04", "2026-06-29", weeks)).toBe("A");
  });

  it("calcula A/B/C/D/E recorrente", () => {
    const weeks = ["A", "B", "C", "D", "E"];
    expect(getCurrentWeekId("2026-05-04", "2026-05-04", weeks)).toBe("A");
    expect(getCurrentWeekId("2026-05-04", "2026-06-01", weeks)).toBe("E");
    expect(getCurrentWeekId("2026-05-04", "2026-06-08", weeks)).toBe("A");
    expect(getCurrentWeekId("2026-05-04", "2026-07-06", weeks)).toBe("E");
    expect(getCurrentWeekId("2026-05-04", "2026-07-13", weeks)).toBe("A");
  });

  it("mantém uma semana única sempre válida", () => {
    expect(getCurrentWeekId("2026-05-04", "2026-05-04", ["A"])).toBe("A");
    expect(getCurrentWeekId("2026-05-04", "2028-05-04", ["A"])).toBe("A");
  });

  it("trata datas futuras/passadas e virada de ano", () => {
    expect(getCurrentWeekId("2026-05-04", "2026-04-30", ["A", "B"])).toBe("A");
    expect(getCycleIndex("2026-05-04", "2026-04-30", 2)).toBe(0);
    expect(getCurrentWeekId("2026-12-28", "2027-01-04", ["A", "B"])).toBe("B");
    expect(getWeeksElapsed("2026-12-28", "2027-01-04")).toBe(1);
  });

  it("não retorna undefined em período longo", () => {
    const weeks = ["A", "B", "C", "D", "E", "F"];
    for (let offset = 0; offset < 156; offset += 1) {
      const date = new Date(Date.UTC(2026, 4, 4 + offset * 7, 12)).toISOString().slice(0, 10);
      expect(weeks).toContain(getCurrentWeekId("2026-05-04", date, weeks));
    }
  });
  it("agenda a semana B na semana útil seguinte quando a semana A começa em uma segunda", () => {
    expect(getSessionDateForWeekDay("2026-05-04", 0, 0)).toBe("2026-05-04");
    expect(getSessionDateForWeekDay("2026-05-04", 0, 4)).toBe("2026-05-08");
    expect(getSessionDateForWeekDay("2026-05-04", 1, 0)).toBe("2026-05-11");
    expect(getSessionDateForWeekDay("2026-05-04", 1, 4)).toBe("2026-05-15");
  });

  it("move data inicial de sábado/domingo para a próxima segunda útil", () => {
    expect(getFirstBusinessDate("2026-05-09")).toBe("2026-05-11");
    expect(getFirstBusinessDate("2026-05-10")).toBe("2026-05-11");
    expect(getSessionDateForWeekDay("2026-05-10", 0, 0)).toBe("2026-05-11");
    expect(getSessionDateForWeekDay("2026-05-10", 0, 4)).toBe("2026-05-15");
    expect(getWeekBlockStartDate("2026-05-10", 1)).toBe("2026-05-18");
  });
});
