import { useState, useEffect } from "react";

// Breakpoints alinhados com o Tailwind do projeto
const BREAKPOINTS = {
  sm:  640,
  md:  768,
  lg:  1024,
  xl:  1280,
} as const;

type Breakpoint = keyof typeof BREAKPOINTS;

// Hook principal — retorna true se a largura for MENOR que o breakpoint
export function useIsMobile(breakpoint: Breakpoint = "md"): boolean {
  const query = `(max-width: ${BREAKPOINTS[breakpoint] - 1}px)`;

  const [matches, setMatches] = useState<boolean>(
    // SSR-safe: só acessa window no cliente
    typeof window !== "undefined"
      ? window.matchMedia(query).matches
      : false,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);

    // Sincroniza estado imediatamente (evita flash no mount)
    setMatches(mql.matches);

    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

// Alias semântico mais legível em componentes
export const useIsMobileScreen   = () => useIsMobile("md");   // < 768px
export const useIsTabletOrBelow  = () => useIsMobile("lg");   // < 1024px
