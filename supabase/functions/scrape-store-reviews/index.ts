import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface ParsedReview {
  author: string;
  text: string;
  stars: number;
  platform: string;
}

// ─── Google Play scraping via unofficial RSS ──────────────────────────────────

async function scrapeGooglePlay(appId: string): Promise<ParsedReview[]> {
  // Google Play RSS feed — works without auth, returns up to 20 recent reviews
  const url = `https://play.google.com/store/apps/details?id=${appId}&hl=pt_BR&showAllReviews=true`;

  // Use iTunes Search-style public RSS that Google exposes
  const rssUrl = `https://play.google.com/store/getreviews?id=${appId}&reviewType=0&pageNum=0&hl=pt_BR`;

  const resp = await fetch(rssUrl, {
    method: "POST",
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; ProductOS/1.0)",
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  if (!resp.ok) {
    throw new Error(`Google Play fetch failed: ${resp.status}`);
  }

  const text = await resp.text();

  // Parse the JSON-in-text response that Google Play returns
  // The response wraps JSON in )]}' 
  const clean = text.replace(/^\)\]\}'\n/, "");
  let parsed: unknown;
  try {
    parsed = JSON.parse(clean);
  } catch {
    throw new Error("Não foi possível parsear a resposta do Google Play");
  }

  const reviews: ParsedReview[] = [];

  // Navigate the nested array structure Google Play uses
  const reviewData = (parsed as unknown[][])?.[0]?.[2];
  if (!Array.isArray(reviewData)) {
    throw new Error("Estrutura de reviews não encontrada. Verifique o ID do app.");
  }

  for (const item of reviewData) {
    try {
      const author = item?.[1]?.[4]?.[0] ?? "Anônimo";
      const text = item?.[4] ?? "";
      const stars = item?.[2] ?? 3;
      if (text && typeof text === "string" && text.length > 3) {
        reviews.push({
          author: String(author),
          text: String(text).slice(0, 600),
          stars: Math.min(5, Math.max(1, Number(stars))),
          platform: "android",
        });
      }
    } catch {
      // skip malformed entries
    }
  }

  return reviews.slice(0, 40);
}

// ─── App Store scraping via Apple RSS ────────────────────────────────────────

async function scrapeAppStore(appId: string, country = "br"): Promise<ParsedReview[]> {
  // Apple's official RSS feed for app reviews — completely public
  const url = `https://itunes.apple.com/${country}/rss/customerreviews/id=${appId}/sortBy=mostRecent/json`;

  const resp = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; ProductOS/1.0)" },
  });

  if (!resp.ok) {
    // Try US store as fallback
    const fallback = await fetch(
      `https://itunes.apple.com/us/rss/customerreviews/id=${appId}/sortBy=mostRecent/json`,
      { headers: { "User-Agent": "Mozilla/5.0 (compatible; ProductOS/1.0)" } }
    );
    if (!fallback.ok) throw new Error(`App Store fetch failed: ${resp.status}`);
    const data = await fallback.json();
    return parseAppStoreRSS(data);
  }

  const data = await resp.json();
  return parseAppStoreRSS(data);
}

function parseAppStoreRSS(data: unknown): ParsedReview[] {
  const entries = (data as { feed?: { entry?: unknown[] } })?.feed?.entry ?? [];
  const reviews: ParsedReview[] = [];

  for (const entry of entries) {
    try {
      const e = entry as Record<string, { label?: string | number }>;
      const author = e?.["author"]?.["name"]?.label ?? "Anônimo";
      const text = String(e?.["content"]?.label ?? "").trim();
      const rating = e?.["im:rating"]?.label;
      const stars = Math.min(5, Math.max(1, Number(rating ?? 3)));

      if (text && text.length > 3) {
        reviews.push({
          author: String(author),
          text: text.slice(0, 600),
          stars,
          platform: "ios",
        });
      }
    } catch {
      // skip malformed
    }
  }

  return reviews.slice(0, 40);
}

// ─── Extract app ID from URL ──────────────────────────────────────────────────

function extractPlayStoreId(url: string): string | null {
  const match = url.match(/[?&]id=([a-zA-Z0-9._]+)/);
  return match?.[1] ?? null;
}

function extractAppStoreId(url: string): string | null {
  // Handles: /app/nome-do-app/id123456789  OR  /id123456789
  const match = url.match(/\/id(\d+)/);
  return match?.[1] ?? null;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Use getUser() — getClaims() não existe no supabase-js v2
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { url } = await req.json();
    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: "URL é obrigatória" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formattedUrl = url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`;
    const isPlayStore = formattedUrl.includes("play.google.com");
    const isAppStore = formattedUrl.includes("apps.apple.com");

    if (!isPlayStore && !isAppStore) {
      return new Response(
        JSON.stringify({ success: false, error: "URL inválida. Use uma URL da Google Play (play.google.com) ou App Store (apps.apple.com)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Scraping reviews from:", formattedUrl);

    let reviews: ParsedReview[] = [];
    let platform: string;

    if (isPlayStore) {
      const appId = extractPlayStoreId(formattedUrl);
      if (!appId) {
        return new Response(
          JSON.stringify({ success: false, error: "ID do app não encontrado na URL da Play Store. Exemplo: play.google.com/store/apps/details?id=com.exemplo.app" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      reviews = await scrapeGooglePlay(appId);
      platform = "android";
    } else {
      const appId = extractAppStoreId(formattedUrl);
      if (!appId) {
        return new Response(
          JSON.stringify({ success: false, error: "ID do app não encontrado na URL da App Store. Exemplo: apps.apple.com/br/app/nome-do-app/id123456789" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      reviews = await scrapeAppStore(appId);
      platform = "ios";
    }

    if (reviews.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Nenhum review encontrado. O app pode ter poucos reviews ou a loja pode estar bloqueando a consulta temporariamente." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${reviews.length} reviews for platform: ${platform}`);

    return new Response(
      JSON.stringify({ success: true, reviews, platform, count: reviews.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("scrape-store-reviews error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Erro ao extrair reviews" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
