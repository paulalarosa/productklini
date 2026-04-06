import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals:     true,
    setupFiles:  ["./src/test/setup.ts"],
    include:     ["src/test/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include:  ["src/lib/**", "src/hooks/**", "src/components/**"],
      exclude:  ["src/test/**", "src/integrations/**"],
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
