import { readFileSync, writeFileSync } from "fs";

const HOOKS = [
  "src/hooks/useABExperiments.ts",
  "src/hooks/useBehaviorModels.ts",
  "src/hooks/useBenchmark.ts",
  "src/hooks/useBusinessModelCanvas.ts",
  "src/hooks/useCSD.ts",
  "src/hooks/useCardSorting.ts",
  "src/hooks/useEmpathyMap.ts",
  "src/hooks/useGamification.ts",
  "src/hooks/useHMW.ts",
  "src/hooks/useJTBD.ts",
  "src/hooks/useMicrocopy.ts",
  "src/hooks/useNielsen.ts",
  "src/hooks/useQABugs.ts",
  "src/hooks/useSitemap.ts",
  "src/hooks/useToneOfVoice.ts",
  "src/hooks/useUXPatterns.ts",
  "src/hooks/useUsabilityTest.ts",
  "src/hooks/useWCAG.ts",
];

const STALE_LINE = "  staleTime: 5 * 60 * 1000,";
let changed = 0, skipped = 0;

for (const file of HOOKS) {
  let src;
  try { src = readFileSync(file, "utf-8"); }
  catch { console.log(`⚠️  Não encontrado: ${file}`); continue; }

  if (src.includes("staleTime")) {
    console.log(`✓ Já tem staleTime: ${file}`);
    skipped++; continue;
  }

  const result = src.replace(
    /(useQuery\s*\(\s*\{)([\s\S]*?)(\}\s*\))/g,
    (match, open, body, close) => {
      if (body.includes("staleTime")) return match;
      const trimmedBody = body.trimEnd();
      const bodyWithComma = trimmedBody.endsWith(",") ? trimmedBody : trimmedBody + ",";
      return `${open}${bodyWithComma}\n${STALE_LINE}\n${close}`;
    }
  );

  if (result !== src) {
    writeFileSync(file, result, "utf-8");
    console.log(`✅ staleTime adicionado: ${file}`);
    changed++;
  } else {
    console.log(`⚠️  Padrão useQuery não reconhecido: ${file}`);
  }
}

console.log(`\n${"─".repeat(50)}`);
console.log(`Concluído: ${changed} modificado(s), ${skipped} já tinham staleTime`);
