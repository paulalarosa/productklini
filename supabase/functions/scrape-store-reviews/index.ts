import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ParsedReview {
  author: string;
  text: string;
  stars: number;
  platform: string;
}

// ─── App Store — RSS oficial da Apple ─────────────────────────────────────────
// Funciona sem autenticação. Retorna até 50 reviews por página.
async function scrapeAppStore(appId: string): Promise<ParsedReview[]> {
  const countries = ["br", "us", "pt"];
  
  for (const country of countries) {
    try {
      const url = `https://itunes.apple.com/${country}/rss/customerreviews/page=1/id=${appId}/sortby=mostrecent/json`;
      console.log(`Trying App Store RSS: ${url}`);

      const resp = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          "Accept": "application/json",
        },
      });

      if (!resp.ok) {
        console.log(`Country ${country} returned ${resp.status}, trying next...`);
        continue;
      }

      const raw = await resp.json();
      const entries = raw?.feed?.entry;

      if (!Array.isArray(entries) || entries.length === 0) {
        console.log(`Country ${country}: no entries found`);
        continue;
      }

      const reviews: ParsedReview[] = [];

      for (const entry of entries) {
        try {
          // Apple RSS structure: each field is an object with a "label" key
          const authorName = entry?.author?.name?.label ?? entry?.["author"]?.["name"]?.["label"] ?? "Anônimo";
          const content = entry?.content?.label ?? entry?.summary?.label ?? "";
          const title = entry?.title?.label ?? "";
          const ratingRaw = entry?.["im:rating"]?.label ?? entry?.["im:rating"] ?? "3";
          const stars = Math.min(5, Math.max(1, parseInt(String(ratingRaw), 10)));

          const text = [title, content].filter(Boolean).join(" — ").trim();

          if (text && text.length > 2) {
            reviews.push({
              author: String(authorName).slice(0, 80),
              text: text.slice(0, 600),
              stars,
              platform: "ios",
            });
          }
        } catch (parseErr) {
          console.log("Skipping malformed entry:", parseErr);
        }
      }

      if (reviews.length > 0) {
        console.log(`Found ${reviews.length} reviews in country: ${country}`);
        return reviews;
      }
    } catch (err) {
      console.log(`Error with country ${country}:`, err);
    }
  }

  throw new Error("Nenhum review encontrado na App Store. O app pode ter poucos reviews públicos ou a loja está indisponível temporariamente.");
}

// ─── Google Play — API pública de reviews ─────────────────────────────────────
async function scrapeGooglePlay(appId: string): Promise<ParsedReview[]> {
  // Endpoint interno do Google Play que retorna reviews em JSON
  const url = `https://play.google.com/store/getreviews`;
  
  console.log(`Fetching Google Play reviews for: ${appId}`);

  const body = new URLSearchParams({
    id: appId,
    reviewType: "0",
    pageNum: "0",
    hl: "en",
    gl: "us",
  });

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "*/*",
      "Origin": "https://play.google.com",
      "Referer": `https://play.google.com/store/apps/details?id=${appId}`,
    },
    body: body.toString(),
  });

  if (!resp.ok) {
    throw new Error(`Google Play retornou status ${resp.status}`);
  }

  const text = await resp.text();
  
  // Google Play response starts with )]}' — remove it before parsing
  const clean = text.replace(/^\s*\)\]\}'\s*\n?/, "").trim();
  
  let parsed: unknown;
  try {
    parsed = JSON.parse(clean);
  } catch {
    throw new Error("Não foi possível processar a resposta do Google Play. Tente novamente.");
  }

  // Navigate Google Play's nested array structure
  // Structure: [null, [null, [[reviewData...]]]]
  const outerArray = parsed as unknown[][];
  
  // Try to find the reviews array by navigating the structure
  let reviewsArray: unknown[] | null = null;
  
  try {
    // Common path in Google Play's response
    reviewsArray = outerArray?.[0]?.[2] as unknown[] ?? null;
  } catch {
    reviewsArray = null;
  }

  if (!Array.isArray(reviewsArray) || reviewsArray.length === 0) {
    // Try alternative path
    try {
      const alt = (outerArray as unknown[][][])?.[0]?.[0];
      if (Array.isArray(alt)) reviewsArray = alt;
    } catch {
      // ignore
    }
  }

  if (!Array.isArray(reviewsArray) || reviewsArray.length === 0) {
    throw new Error("Nenhum review encontrado no Google Play. O app pode ter poucos reviews ou estar indisponível.");
  }

  const reviews: ParsedReview[] = [];

  for (const item of reviewsArray) {
    try {
      const arr = item as any[];
      // Try multiple known positions for author/stars/text
      const author = String((arr as any)?.[1]?.[4]?.[0] ?? (arr as any)?.[1]?.[0] ?? "Anônimo").slice(0, 80);
      const stars = Math.min(5, Math.max(1, Number(arr?.[2] ?? 3)));
      const text = String(arr?.[4] ?? arr?.[3] ?? "").trim();

      if (text && text.length > 3) {
        reviews.push({ author, text: text.slice(0, 600), stars, platform: "android" });
      }
    } catch {
      // skip malformed
    }
  }

  if (reviews.length === 0) {
    throw new Error("Reviews encontrados mas não foi possível processá-los. Tente com outro app.");
  }

  return reviews.slice(0, 50);
}

// ─── Extract IDs from URLs ────────────────────────────────────────────────────
function extractPlayStoreId(url: string): string | null {
  const match = url.match(/[?&]id=([a-zA-Z0-9._]+)/);
  return match?.[1] ?? null;
}

function extractAppStoreId(url: string): string | null {
  const match = url.match(/\/id(\d+)/);
  return match?.[1] ?? null;
}

// ─── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // ✅ Fix: getUser() em vez de getClaims()
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Token inválido" }),
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
    const isAppStore = formattedUrl.includes("apps.apple.com") || formattedUrl.includes("itunes.apple.com");

    if (!isPlayStore && !isAppStore) {
      return new Response(
        JSON.stringify({ success: false, error: "URL inválida. Use uma URL da Google Play (play.google.com) ou App Store (apps.apple.com)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let reviews: ParsedReview[] = [];
    let platform: string;

    if (isPlayStore) {
      const appId = extractPlayStoreId(formattedUrl);
      if (!appId) {
        return new Response(
          JSON.stringify({ success: false, error: "ID do app não encontrado. Exemplo de URL válida: play.google.com/store/apps/details?id=com.exemplo.app" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log(`Scraping Google Play: ${appId}`);
      reviews = await scrapeGooglePlay(appId);
      platform = "android";
    } else {
      const appId = extractAppStoreId(formattedUrl);
      if (!appId) {
        return new Response(
          JSON.stringify({ success: false, error: "ID do app não encontrado. Exemplo de URL válida: apps.apple.com/br/app/nome/id123456789" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log(`Scraping App Store: ${appId}`);
      reviews = await scrapeAppStore(appId);
      platform = "ios";
    }

    console.log(`Returning ${reviews.length} reviews for platform: ${platform}`);

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
