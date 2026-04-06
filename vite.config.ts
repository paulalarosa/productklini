import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Lovable tagger apenas em dev
    mode === "development" && import("lovable-tagger").then(m => m.componentTagger()),
  ].filter(Boolean),

  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },

  build: {
    // ── Code splitting manual por categoria ─────────────────────────────────
    // Separa as dependências pesadas em chunks próprios para que o browser
    // possa fazer cache independente de cada uma.
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Supabase — muda raramente, cache longo
          if (id.includes("@supabase")) return "supabase";

          // Recharts — usado só em páginas de analytics
          if (id.includes("recharts") || id.includes("d3-")) return "charts";

          // Framer Motion — usado em poucos componentes
          if (id.includes("framer-motion")) return "motion";

          // jsPDF + html2canvas — usados só no export de PDF
          if (id.includes("jspdf") || id.includes("html2canvas")) return "pdf";

          // Radix UI — base do shadcn/ui
          if (id.includes("@radix-ui")) return "radix";

          // React core
          if (id.includes("react-dom") || id.includes("react/")) return "react";

          // date-fns — grande, mas tree-shakeable
          if (id.includes("date-fns")) return "dates";

          // react-markdown
          if (id.includes("react-markdown") || id.includes("remark") || id.includes("rehype")) return "markdown";
        },
      },
    },

    // Avisa quando um chunk ultrapassar 500 KB
    chunkSizeWarningLimit: 500,

    // Minificação agressiva em produção
    minify: "esbuild",
    target: "es2020",
  },

  server: {
    host:        "::",
    port:        8080,
    // Evita erros de CORS com Supabase em dev
    strictPort:  false,
  },
}));
