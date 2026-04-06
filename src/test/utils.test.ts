import { describe, it, expect, vi, beforeEach } from "vitest";
import { setCurrentProjectId, clearCurrentProjectId } from "@/lib/api";

function getQuadrant(impact: string, effort: string): string {
  const hi = impact === "high";
  const he = effort === "high";
  if (hi && !he) return "high-impact-low-effort";
  if (hi && he)  return "high-impact-high-effort";
  if (!hi && !he) return "low-impact-low-effort";
  return "low-impact-high-effort";
}

describe("getQuadrant", () => {
  it("high impact + low effort → Quick Wins", () => expect(getQuadrant("high", "low")).toBe("high-impact-low-effort"));
  it("high impact + high effort → Big Bets", () => expect(getQuadrant("high", "high")).toBe("high-impact-high-effort"));
  it("low impact + low effort → Fill-ins", () => expect(getQuadrant("low", "low")).toBe("low-impact-low-effort"));
  it("low impact + high effort → Avoid", () => expect(getQuadrant("low", "high")).toBe("low-impact-high-effort"));
});

function calcNPS(surveys: { score: number }[]): number | null {
  if (surveys.length === 0) return null;
  const promoters  = surveys.filter(s => s.score >= 9).length;
  const detractors = surveys.filter(s => s.score <= 6).length;
  return Math.round(((promoters - detractors) / surveys.length) * 100);
}

describe("NPS Score calculation", () => {
  it("retorna null para lista vazia", () => expect(calcNPS([])).toBeNull());
  it("NPS 100 quando todos são promotores", () => expect(calcNPS([{score:9},{score:10},{score:10}])).toBe(100));
  it("NPS -100 quando todos são detratores", () => expect(calcNPS([{score:0},{score:5},{score:6}])).toBe(-100));
  it("NPS 0 quando promotores = detratores", () => expect(calcNPS([{score:10},{score:5}])).toBe(0));
  it("passivos (7-8) não contam no NPS", () => expect(calcNPS([{score:10},{score:7},{score:8}])).toBe(33));
});

function calcProgress(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, (current / target) * 100);
}

describe("HEART progress calculation", () => {
  it("retorna 0 quando target é 0", () => expect(calcProgress(50, 0)).toBe(0));
  it("retorna 100 quando current >= target", () => expect(calcProgress(100, 80)).toBe(100));
  it("retorna valor correto", () => expect(calcProgress(45, 90)).toBe(50));
  it("não ultrapassa 100%", () => expect(calcProgress(200, 100)).toBe(100));
});

function toggleStatus(current: string): string {
  return current === "on" ? "off" : "on";
}

describe("Feature Flag toggle", () => {
  it("on → off", () => expect(toggleStatus("on")).toBe("off"));
  it("off → on", () => expect(toggleStatus("off")).toBe("on"));
  it("partial → on", () => expect(toggleStatus("partial")).toBe("on"));
});

function parseColorPalette(input: string): string[] {
  return input.split(",").map(c => c.trim()).filter(Boolean);
}

describe("Moodboard color palette parsing", () => {
  it("parseia cores separadas por vírgula", () => expect(parseColorPalette("#FF5733, #3498DB")).toEqual(["#FF5733", "#3498DB"]));
  it("ignora entradas vazias", () => expect(parseColorPalette("#FF5733,,#3498DB")).toEqual(["#FF5733", "#3498DB"]));
  it("retorna [] para string vazia", () => expect(parseColorPalette("")).toEqual([]));
  it("remove espaços extras", () => expect(parseColorPalette("  #FFF  ,  #000  ")).toEqual(["#FFF", "#000"]));
});

function parseFlowSteps(input: string) {
  return input.split("\n").filter(Boolean).map((s, i) => ({ label: s.trim(), type: i === 0 ? "start" : "step" }));
}

describe("User Flow steps parsing", () => {
  it("parseia etapas separadas por linha", () => expect(parseFlowSteps("Abrir app\nFazer login\nVer dashboard")).toHaveLength(3));
  it("primeiro passo é start", () => expect(parseFlowSteps("Abrir app\nFazer login")[0].type).toBe("start"));
  it("demais passos são step", () => expect(parseFlowSteps("Abrir app\nFazer login")[1].type).toBe("step"));
  it("ignora linhas vazias", () => expect(parseFlowSteps("Abrir app\n\nFazer login")).toHaveLength(2));
  it("retorna [] para input vazio", () => expect(parseFlowSteps("")).toEqual([]));
});

describe("Project ID cache helpers", () => {
  beforeEach(() => { clearCurrentProjectId(); localStorage.clear(); vi.clearAllMocks(); });
  it("setCurrentProjectId persiste no localStorage", () => { setCurrentProjectId("proj-123"); expect(localStorage.getItem("current_project_id")).toBe("proj-123"); });
  it("clearCurrentProjectId remove do localStorage", () => { setCurrentProjectId("proj-123"); clearCurrentProjectId(); expect(localStorage.getItem("current_project_id")).toBeNull(); });
  it("clearCurrentProjectId é idempotente", () => { clearCurrentProjectId(); clearCurrentProjectId(); expect(localStorage.getItem("current_project_id")).toBeNull(); });
});
