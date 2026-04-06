import "@testing-library/jest-dom";
import { vi } from "vitest";

// ─── Mock do Supabase — chain completa ───────────────────────────────────────
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "test-user", email: "test@test.com" } },
      }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signOut: vi.fn().mockResolvedValue({}),
    },
    from: vi.fn().mockReturnValue({
      select:      vi.fn().mockReturnThis(),
      insert:      vi.fn().mockReturnThis(),
      update:      vi.fn().mockReturnThis(),
      delete:      vi.fn().mockReturnThis(),
      upsert:      vi.fn().mockReturnThis(),
      eq:          vi.fn().mockReturnThis(),
      order:       vi.fn().mockReturnThis(),
      limit:       vi.fn().mockReturnThis(),   // ← faltava este
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single:      vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
    channel: vi.fn().mockReturnValue({
      on:        vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
    }),
    removeChannel: vi.fn(),
  },
}));

// ─── Mock do localStorage ─────────────────────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem:    (k: string) => store[k] ?? null,
    setItem:    (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear:      () => { store = {}; },
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// ─── Silencia warnings esperados nos testes ───────────────────────────────────
const IGNORED = [
  "Warning: An update to",
  "Warning: ReactDOM.render is no longer",
];
const originalError = console.error.bind(console);
console.error = (...args: unknown[]) => {
  const msg = String(args[0]);
  if (IGNORED.some(w => msg.includes(w))) return;
  originalError(...args);
};
