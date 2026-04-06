import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getProjectId, setCurrentProjectId, clearCurrentProjectId,
  fetchTasks, fetchPersonas, updateTaskStatus,
} from "@/lib/api";

interface MockSupabaseChain {
  select:      () => MockSupabaseChain;
  insert:      () => MockSupabaseChain;
  update:      () => MockSupabaseChain;
  delete:      () => MockSupabaseChain;
  upsert:      () => MockSupabaseChain;
  eq:          () => MockSupabaseChain;
  order:       () => MockSupabaseChain;
  limit:       () => MockSupabaseChain;
  maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
  single:      () => Promise<{ data: unknown; error: unknown }>;
}

// ─── Auxiliares de Teste — restaura mock singleton do Supabase ────────────────
async function restoreSupabase() {
  const { supabase } = await import("@/integrations/supabase/client");
  vi.mocked(supabase.from).mockReturnValue({
    select:      vi.fn().mockReturnThis(),
    insert:      vi.fn().mockReturnThis(),
    update:      vi.fn().mockReturnThis(),
    delete:      vi.fn().mockReturnThis(),
    upsert:      vi.fn().mockReturnThis(),
    eq:          vi.fn().mockReturnThis(),
    order:       vi.fn().mockReturnThis(),
    limit:       vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single:      vi.fn().mockResolvedValue({ data: null, error: null }),
  } as unknown as MockSupabaseChain);
}

// ─── getProjectId — promise deduplication ─────────────────────────────────────
describe("getProjectId", () => {
  beforeEach(async () => {
    clearCurrentProjectId();
    localStorage.clear();
    vi.clearAllMocks();
    await restoreSupabase();
  });

  it("retorna '' quando usuário não tem projetos", async () => {
    const id = await getProjectId();
    expect(id).toBe("");
  });

  it("usa cache em memória após a primeira chamada", async () => {
    setCurrentProjectId("proj-cached");
    const id1 = await getProjectId();
    const id2 = await getProjectId();
    expect(id1).toBe("proj-cached");
    expect(id2).toBe("proj-cached");
  });

  it("deduplica chamadas paralelas — não dispara múltiplas queries", async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    const getUserSpy = vi.spyOn(supabase.auth, "getUser");

    // 5 chamadas simultâneas
    const results = await Promise.all([
      getProjectId(), getProjectId(), getProjectId(),
      getProjectId(), getProjectId(),
    ]);

    // getUser deve ser chamado no máximo 1x (deduplicação ativa)
    expect(getUserSpy).toHaveBeenCalledTimes(1);
    // Todos retornam o mesmo valor
    expect(new Set(results).size).toBe(1);
  });

  it("limpa cache ao chamar clearCurrentProjectId", async () => {
    setCurrentProjectId("proj-to-clear");
    clearCurrentProjectId();
    expect(localStorage.getItem("current_project_id")).toBeNull();
  });
});

// ─── fetchTasks ───────────────────────────────────────────────────────────────
describe("fetchTasks", () => {
  beforeEach(async () => {
    clearCurrentProjectId();
    vi.clearAllMocks();
    await restoreSupabase();
  });

  it("retorna [] quando não há projeto ativo", async () => {
    const tasks = await fetchTasks();
    expect(tasks).toEqual([]);
  });

  it("retorna tarefas quando há projeto", async () => {
    setCurrentProjectId("proj-1");
    const { supabase } = await import("@/integrations/supabase/client");
    const mockData = [
      { id: "t1", title: "Teste", status: "todo", priority: "low",
        module: "ux", phase: "discovery", project_id: "proj-1",
        assignee: null, avatar: null, days_in_phase: 0,
        estimated_days: 3, created_at: "", updated_at: "" },
    ];

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockResolvedValue({ data: mockData, error: null }),
    } as unknown as MockSupabaseChain);

    const tasks = await fetchTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe("Teste");
  });
});

// ─── fetchPersonas ────────────────────────────────────────────────────────────
// O problema: vi.clearAllMocks() zera os mocks do setup.ts, incluindo .limit().
// resolveProjectId() internamente chama .select().eq().order().limit().maybeSingle()
// então precisamos reinstalar a chain completa antes deste teste.
describe("fetchPersonas", () => {
  beforeEach(async () => {
    clearCurrentProjectId();
    // NÃO chamamos vi.clearAllMocks() aqui — preserva o mock completo do setup.ts
    // No entanto, para garantir que o mock de describe anteriores não vazou:
    await restoreSupabase();
  });

  it("retorna [] quando não há projeto ativo", async () => {
    // Com usuário sem projetos, getProjectId retorna "" → withProject retorna []
    const personas = await fetchPersonas();
    expect(personas).toEqual([]);
  });
});

// ─── updateTaskStatus ─────────────────────────────────────────────────────────
describe("updateTaskStatus", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await restoreSupabase();
  });

  it("chama supabase.update com os parâmetros corretos", async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    const updateMock = vi.fn().mockReturnThis();
    const eqMock     = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(supabase.from).mockReturnValue({
      update: updateMock,
      eq:     eqMock,
    } as unknown as MockSupabaseChain);

    await updateTaskStatus("task-123", "done");

    expect(supabase.from).toHaveBeenCalledWith("tasks");
    expect(updateMock).toHaveBeenCalledWith({ status: "done" });
  });

  it("lança erro quando supabase retorna error", async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockResolvedValue({ error: { message: "DB error" } }),
    } as unknown as MockSupabaseChain);

    await expect(updateTaskStatus("task-123", "done")).rejects.toThrow();
  });
});
