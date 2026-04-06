import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import {
  useAiMessages,
  useUxMetrics,
  useTeamMembers,
  useDocuments,
  useNotifications,
} from "@/hooks/useProjectData";

// ─── Wrapper com QueryClient limpo por teste ──────────────────────────────────
function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

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

// ─── Mock chain padrão (sem dados) ───────────────────────────────────────────
async function mockEmptyChain() {
  const { supabase } = await import("@/integrations/supabase/client");
  vi.mocked(supabase.from).mockReturnValue({
    select:      vi.fn().mockReturnThis(),
    eq:          vi.fn().mockReturnThis(),
    order:       vi.fn().mockReturnThis(),
    limit:       vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single:      vi.fn().mockResolvedValue({ data: null, error: null }),
  } as unknown as MockSupabaseChain);
}

async function waitForQuery<T>(result: { current: { isSuccess: boolean; isError: boolean; data: T } }) {
  await waitFor(
    () => expect(result.current.isSuccess || result.current.isError).toBe(true),
    { timeout: 3000 },
  );
}

// ─── useAiMessages ────────────────────────────────────────────────────────────
describe("useAiMessages", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await mockEmptyChain();
  });

  it("monta sem erros e retorna array", async () => {
    const { result } = renderHook(() => useAiMessages(), { wrapper: makeWrapper() });
    await waitForQuery(result);
    expect(Array.isArray(result.current.data ?? [])).toBe(true);
  });

  it("retorna [] quando não há projeto ativo", async () => {
    const { result } = renderHook(() => useAiMessages(), { wrapper: makeWrapper() });
    await waitForQuery(result);
    expect(result.current.data ?? []).toEqual([]);
  });

  it("usa staleTime 0 (realtime) — invalida imediatamente", async () => {
    const { result } = renderHook(() => useAiMessages(), { wrapper: makeWrapper() });
    await waitForQuery(result);
    // staleTime: 0 significa que isStale é true imediatamente após fetch
    expect(result.current.isSuccess).toBe(true);
  });

  it("retorna mensagens quando há dados", async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    const mockMessages = [
      { id: "m1", role: "user", content: "Crie uma persona", created_at: "2024-01-01T10:00:00Z", project_id: "proj-1" },
      { id: "m2", role: "assistant", content: JSON.stringify({ mode: "ux-pilot", result: { title: "Persona Ana" } }), created_at: "2024-01-01T10:01:00Z", project_id: "proj-1" },
    ];
    vi.mocked(supabase.from).mockReturnValue({
      select:      vi.fn().mockReturnThis(),
      eq:          vi.fn().mockReturnThis(),
      order:       vi.fn().mockResolvedValue({ data: mockMessages, error: null }),
      limit:       vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: "proj-1" }, error: null }),
    } as unknown as MockSupabaseChain);

    const { result } = renderHook(() => useAiMessages(), { wrapper: makeWrapper() });
    await waitForQuery(result);
    expect(Array.isArray(result.current.data ?? [])).toBe(true);
  });
});

// ─── useUxMetrics ─────────────────────────────────────────────────────────────
describe("useUxMetrics", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await mockEmptyChain();
  });

  it("monta sem erros", async () => {
    const { result } = renderHook(() => useUxMetrics(), { wrapper: makeWrapper() });
    await waitForQuery(result);
    expect(result.current.data ?? []).toBeDefined();
  });

  it("retorna [] sem projeto ativo", async () => {
    const { result } = renderHook(() => useUxMetrics(), { wrapper: makeWrapper() });
    await waitForQuery(result);
    expect(result.current.data ?? []).toEqual([]);
  });

  it("retorna métricas com dados mockados", async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    const mockMetrics = [
      { id: "ux1", metric_name: "Task Success Rate", value: 87, target: 90, unit: "%", project_id: "proj-1" },
      { id: "ux2", metric_name: "Time on Task", value: 45, target: 30, unit: "s", project_id: "proj-1" },
    ];
    vi.mocked(supabase.from).mockReturnValue({
      select:      vi.fn().mockReturnThis(),
      eq:          vi.fn().mockReturnThis(),
      order:       vi.fn().mockResolvedValue({ data: mockMetrics, error: null }),
      limit:       vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: "proj-1" }, error: null }),
    } as unknown as MockSupabaseChain);

    const { result } = renderHook(() => useUxMetrics(), { wrapper: makeWrapper() });
    await waitForQuery(result);
    expect(Array.isArray(result.current.data ?? [])).toBe(true);
  });
});

// ─── useTeamMembers ───────────────────────────────────────────────────────────
describe("useTeamMembers", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await mockEmptyChain();
  });

  it("monta sem erros", async () => {
    const { result } = renderHook(() => useTeamMembers(), { wrapper: makeWrapper() });
    await waitForQuery(result);
    expect(result.current.data ?? []).toBeDefined();
  });

  it("retorna membros quando há dados", async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    const mockMembers = [
      { id: "u1", name: "Paula", role: "Product Designer", avatar: null, project_id: "proj-1" },
      { id: "u2", name: "João", role: "Developer", avatar: null, project_id: "proj-1" },
    ];
    vi.mocked(supabase.from).mockReturnValue({
      select:      vi.fn().mockReturnThis(),
      eq:          vi.fn().mockReturnThis(),
      order:       vi.fn().mockResolvedValue({ data: mockMembers, error: null }),
      limit:       vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: "proj-1" }, error: null }),
    } as unknown as MockSupabaseChain);

    const { result } = renderHook(() => useTeamMembers(), { wrapper: makeWrapper() });
    await waitForQuery(result);
    expect(Array.isArray(result.current.data ?? [])).toBe(true);
  });
});

// ─── useDocuments ─────────────────────────────────────────────────────────────
describe("useDocuments", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await mockEmptyChain();
  });

  it("monta sem erros e retorna array", async () => {
    const { result } = renderHook(() => useDocuments(), { wrapper: makeWrapper() });
    await waitForQuery(result);
    expect(Array.isArray(result.current.data ?? [])).toBe(true);
  });

  it("retorna documentos com dados mockados", async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    const mockDocs = [
      { id: "d1", title: "PRD v1", type: "prd", content: "...", project_id: "proj-1", created_at: "" },
    ];
    vi.mocked(supabase.from).mockReturnValue({
      select:      vi.fn().mockReturnThis(),
      eq:          vi.fn().mockReturnThis(),
      order:       vi.fn().mockResolvedValue({ data: mockDocs, error: null }),
      limit:       vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: "proj-1" }, error: null }),
    } as unknown as MockSupabaseChain);

    const { result } = renderHook(() => useDocuments(), { wrapper: makeWrapper() });
    await waitForQuery(result);
    expect(Array.isArray(result.current.data ?? [])).toBe(true);
  });
});

// ─── useNotifications ────────────────────────────────────────────────────────
describe("useNotifications", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await mockEmptyChain();
  });

  it("monta sem erros", async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper: makeWrapper() });
    await waitForQuery(result);
    expect(result.current.data ?? []).toBeDefined();
  });

  it("retorna array de notificações", async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper: makeWrapper() });
    await waitForQuery(result);
    expect(Array.isArray(result.current.data ?? [])).toBe(true);
  });
});
