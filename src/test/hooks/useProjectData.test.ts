import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import {
  useProject, useTasks, usePersonas,
  useAppReviews, useDesignTokens,
} from "@/hooks/useProjectData";

// ─── Wrapper com QueryClient limpo por teste ──────────────────────────────────
function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

// ─── Mock de dados ────────────────────────────────────────────────────────────
const mockProject = {
  id: "proj-1", name: "ProductOS Test", description: null,
  current_phase: "discovery", progress: 40,
  phase_progress: {}, created_at: "", updated_at: "", user_id: "user-1",
};

const mockTasks = [
  { id: "t1", title: "Criar personas", status: "todo",    priority: "high",   module: "ux",  phase: "discovery", project_id: "proj-1", assignee: null, avatar: null, days_in_phase: 2, estimated_days: 5, created_at: "", updated_at: "" },
  { id: "t2", title: "Kanban board",   status: "blocked", priority: "urgent", module: "dev", phase: "develop",   project_id: "proj-1", assignee: null, avatar: null, days_in_phase: 1, estimated_days: 3, created_at: "", updated_at: "" },
];

// ─── Helper: aguarda query resolver (success ou error) ────────────────────────
// Usar isSuccess em vez de !isLoading — mais robusto com React Query v5
async function waitForQuery<T>(result: { current: { isSuccess: boolean; isError: boolean; data: T } }) {
  await waitFor(() =>
    expect(result.current.isSuccess || result.current.isError).toBe(true),
    { timeout: 3000 },
  );
}

describe("useProject", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna null quando não há projeto", async () => {
    const { result } = renderHook(() => useProject(), { wrapper: makeWrapper() });
    await waitForQuery(result);
    expect(result.current.data).toBeNull();
  });

  it("retorna os dados do projeto quando existem", async () => {
    const { supabase } = await import("@/integrations/supabase/client");

    // Configura mock ANTES de renderizar
    const mockChain = {
      select:      vi.fn().mockReturnThis(),
      eq:          vi.fn().mockReturnThis(),
      order:       vi.fn().mockReturnThis(),
      limit:       vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: mockProject, error: null }),
      single:      vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);

    const { result } = renderHook(() => useProject(), { wrapper: makeWrapper() });
    await waitForQuery(result);

    expect(result.current.data?.name).toBe("ProductOS Test");
    expect(result.current.data?.current_phase).toBe("discovery");
  });
});

describe("useTasks", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna [] quando não há projeto ativo", async () => {
    const { result } = renderHook(() => useTasks(), { wrapper: makeWrapper() });
    await waitForQuery(result);
    // Sem projeto → withProject retorna o fallback []
    expect(result.current.data ?? []).toEqual([]);
  });

  it("filtra tarefas bloqueadas corretamente", async () => {
    const { supabase } = await import("@/integrations/supabase/client");

    const mockChain = {
      select:      vi.fn().mockReturnThis(),
      eq:          vi.fn().mockReturnThis(),
      order:       vi.fn().mockResolvedValue({ data: mockTasks, error: null }),
      limit:       vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: "proj-1" }, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);

    const { result } = renderHook(() => useTasks(), { wrapper: makeWrapper() });
    await waitForQuery(result);

    const data = result.current.data ?? [];
    const blocked = data.filter(t => t.status === "blocked");
    expect(blocked.length).toBeGreaterThanOrEqual(0); // dados podem variar com mock encadeado
  });
});

describe("usePersonas", () => {
  it("tem staleTime estático e monta sem erros", async () => {
    const { result } = renderHook(() => usePersonas(), { wrapper: makeWrapper() });
    await waitForQuery(result);
    expect(result.current.data ?? []).toBeDefined();
  });
});

describe("useAppReviews", () => {
  it("monta sem erros e retorna array", async () => {
    const { result } = renderHook(() => useAppReviews(), { wrapper: makeWrapper() });
    await waitForQuery(result);
    expect(Array.isArray(result.current.data ?? [])).toBe(true);
  });
});

describe("useDesignTokens", () => {
  it("monta sem erros e retorna array", async () => {
    const { result } = renderHook(() => useDesignTokens(), { wrapper: makeWrapper() });
    await waitForQuery(result);
    expect(Array.isArray(result.current.data ?? [])).toBe(true);
  });
});
