import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === "development" && import("lovable-tagger").then(m => m.componentTagger()),
  ].filter(Boolean),

  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // ── React core — cache máximo, muda nunca ──────────────────────────
          if (id.includes("node_modules/react/") ||
              id.includes("node_modules/react-dom/") ||
              id.includes("node_modules/scheduler/")) return "react";

          // ── React Router ───────────────────────────────────────────────────
          if (id.includes("react-router")) return "router";

          // ── Supabase — muda raramente ──────────────────────────────────────
          if (id.includes("@supabase")) return "supabase";

          // ── Radix UI — base do shadcn/ui ───────────────────────────────────
          if (id.includes("@radix-ui")) return "radix";

          // ── Tanstack Query ─────────────────────────────────────────────────
          if (id.includes("@tanstack")) return "query";

          // ── Recharts separado por submódulo ───────────────────────────────
          // d3-shape, d3-scale, etc. são importados internamente pelo recharts
          if (id.includes("recharts")) return "recharts";
          if (id.includes("/d3-")) return "d3";

          // ── PDF — carregado lazily só no ReportPage ────────────────────────
          if (id.includes("jspdf"))        return "jspdf";
          if (id.includes("html2canvas")) return "html2canvas";

          // ── Framer Motion ──────────────────────────────────────────────────
          if (id.includes("framer-motion")) return "motion";

          // ── date-fns ───────────────────────────────────────────────────────
          if (id.includes("date-fns")) return "dates";

          // ── Markdown pipeline ──────────────────────────────────────────────
          if (id.includes("react-markdown") ||
              id.includes("remark") ||
              id.includes("rehype") ||
              id.includes("micromark") ||
              id.includes("unified") ||
              id.includes("mdast") ||
              id.includes("hast"))         return "markdown";

          // ── Lucide icons — grande mas tree-shakeable ───────────────────────
          if (id.includes("lucide-react")) return "icons";

          // ── Sonner (toasts) ────────────────────────────────────────────────
          if (id.includes("sonner")) return "ui-utils";

          // ── cmdk (Command Palette) ─────────────────────────────────────────
          if (id.includes("cmdk")) return "ui-utils";

          // ── Restante do node_modules → vendor genérico ─────────────────────
          if (id.includes("node_modules")) return "vendor";
        },
      },
    },

    // Avisa acima de 600 KB (pdf é inevitavelmente grande)
    chunkSizeWarningLimit: 600,

    // esbuild é mais rápido que terser e produz resultado similar
    minify: "esbuild",
    target: "es2020",

    // Gera sourcemaps apenas em staging (não em prod puro)
    sourcemap: mode === "staging",
  },

  server: {
    host: "::",
    port: 8080,
    strictPort: false,
  },

  // Otimiza deps que são sempre usadas — pré-bundladas em dev
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
      "@supabase/supabase-js",
    ],
    // Exclui as pesadas — carregadas lazily
    exclude: ["jspdf", "html2canvas-pro"],
  },
}));
