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
async function scrapeAppStore(appId: string): Promise<ParsedReview[]> {
  const countries = ["br", "us", "pt", "gb"];

  for (const country of countries) {
    try {
      const url = `https://itunes.apple.com/${country}/rss/customerreviews/page=1/id=${appId}/sortby=mostrecent/json`;
      console.log(`Trying App Store RSS: ${url}`);

      const resp = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          Accept: "application/json",
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
          const authorName = entry?.author?.name?.label ?? "Anônimo";
          const content = entry?.content?.label ?? entry?.summary?.label ?? "";
          const title = entry?.title?.label ?? "";
          const ratingRaw = entry?.["im:rating"]?.label ?? "3";
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
        console.log(`Found ${reviews.length} reviews from App Store (${country})`);
        return reviews;
      }
    } catch (err) {
      console.log(`Error with country ${country}:`, err);
    }
  }

  // Try multiple pages
  for (const country of ["br", "us"]) {
    try {
      const allReviews: ParsedReview[] = [];
      for (let page = 1; page <= 3; page++) {
        const url = `https://itunes.apple.com/${country}/rss/customerreviews/page=${page}/id=${appId}/sortby=mostrecent/json`;
        const resp = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
        });
        if (!resp.ok) break;
        const raw = await resp.json();
        const entries = raw?.feed?.entry;
        if (!Array.isArray(entries)) break;
        for (const entry of entries) {
          const content = entry?.content?.label ?? "";
          const title = entry?.title?.label ?? "";
          const text = [title, content].filter(Boolean).join(" — ").trim();
          if (text.length > 2) {
            allReviews.push({
              author: entry?.author?.name?.label ?? "Anônimo",
              text: text.slice(0, 600),
              stars: Math.min(5, Math.max(1, parseInt(entry?.["im:rating"]?.label ?? "3", 10))),
              platform: "ios",
            });
          }
        }
      }
      if (allReviews.length > 0) return allReviews;
    } catch { /* continue */ }
  }

  throw new Error(
    "Nenhum review encontrado na App Store. Verifique se o app possui reviews públicos."
  );
}

// ─── Google Play — via Firecrawl ──────────────────────────────────────────────
async function scrapeGooglePlayWithFirecrawl(appId: string): Promise<ParsedReview[]> {
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!firecrawlKey) {
    throw new Error(
      "FIRECRAWL_API_KEY não configurada. Conecte o Firecrawl nas configurações do projeto para importar reviews do Google Play."
    );
  }

  const playUrl = `https://play.google.com/store/apps/details?id=${appId}&hl=pt_BR&gl=BR`;
  console.log(`Scraping Google Play via Firecrawl: ${playUrl}`);

  // Use Firecrawl's JSON extraction to pull structured review data
  const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${firecrawlKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: playUrl,
      formats: [
        "markdown",
        {
          type: "json",
          prompt:
            "Extract all user reviews from this Google Play Store app page. For each review, extract: the author name, the review text content, and the star rating (1-5). Return an array of objects with keys: author, text, stars.",
          schema: {
            type: "object",
            properties: {
              reviews: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    author: { type: "string" },
                    text: { type: "string" },
                    stars: { type: "number" },
                  },
                  required: ["author", "text", "stars"],
                },
              },
            },
            required: ["reviews"],
          },
        },
      ],
      waitFor: 5000,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    console.error("Firecrawl error:", response.status, errBody);
    if (response.status === 402) {
      throw new Error("Créditos insuficientes no Firecrawl. Atualize seu plano para continuar importando reviews.");
    }
    throw new Error(`Firecrawl retornou erro ${response.status}. Tente novamente.`);
  }

  const data = await response.json();
  console.log("Firecrawl response keys:", Object.keys(data?.data || data || {}));

  // Try JSON extraction first
  const jsonData = data?.data?.json || data?.json;
  if (jsonData?.reviews && Array.isArray(jsonData.reviews) && jsonData.reviews.length > 0) {
    console.log(`Found ${jsonData.reviews.length} reviews via JSON extraction`);
    return jsonData.reviews
      .filter((r: any) => r.text && r.text.length > 3)
      .map((r: any) => ({
        author: String(r.author || "Anônimo").slice(0, 80),
        text: String(r.text).slice(0, 600),
        stars: Math.min(5, Math.max(1, Number(r.stars) || 3)),
        platform: "android",
      }));
  }

  // Fallback: parse markdown content for reviews
  const markdown = data?.data?.markdown || data?.markdown || "";
  if (markdown) {
    console.log("Trying markdown fallback parsing...");
    const reviews = parseReviewsFromMarkdown(markdown);
    if (reviews.length > 0) return reviews;
  }

  throw new Error(
    "Não foi possível extrair reviews do Google Play. Tente com outro app ou use a importação por CSV."
  );
}

// Parse reviews from markdown content as fallback
function parseReviewsFromMarkdown(md: string): ParsedReview[] {
  const reviews: ParsedReview[] = [];

  // Pattern: look for star ratings followed by review text
  // Common patterns in Play Store markdown:
  // "⭐⭐⭐⭐⭐" or "5/5" or "Rated 5 stars"
  const blocks = md.split(/\n{2,}/);

  let currentAuthor = "";
  let currentStars = 0;

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed || trimmed.length < 5) continue;

    // Try to detect star ratings
    const starMatch = trimmed.match(/(\d)\s*(?:star|estrela|⭐)/i) ||
      trimmed.match(/(\d)\/5/) ||
      trimmed.match(/Rating:\s*(\d)/i);

    if (starMatch) {
      currentStars = Math.min(5, Math.max(1, parseInt(starMatch[1], 10)));
    }

    // Detect author-like patterns
    const authorMatch = trimmed.match(/^(?:By |Por |— )(.+?)(?:\s*$|\s*\|)/m);
    if (authorMatch) {
      currentAuthor = authorMatch[1].trim().slice(0, 80);
    }

    // If block looks like a review (long enough, has text content)
    if (trimmed.length > 20 && !trimmed.startsWith("#") && !trimmed.startsWith("[")) {
      const hasReviewIndicators =
        /review|avaliação|comentário/i.test(trimmed) ||
        currentStars > 0 ||
        trimmed.length > 50;

      if (hasReviewIndicators) {
        reviews.push({
          author: currentAuthor || "Anônimo",
          text: trimmed.slice(0, 600),
          stars: currentStars || 3,
          platform: "android",
        });
        currentAuthor = "";
        currentStars = 0;
      }
    }
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
    const isAppStore =
      formattedUrl.includes("apps.apple.com") || formattedUrl.includes("itunes.apple.com");

    if (!isPlayStore && !isAppStore) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "URL inválida. Use uma URL da Google Play (play.google.com) ou App Store (apps.apple.com).",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let reviews: ParsedReview[] = [];
    let platform: string;

    if (isPlayStore) {
      const appId = extractPlayStoreId(formattedUrl);
      if (!appId) {
        return new Response(
          JSON.stringify({
            success: false,
            error:
              "ID do app não encontrado. Exemplo: play.google.com/store/apps/details?id=com.exemplo.app",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log(`Scraping Google Play: ${appId}`);
      reviews = await scrapeGooglePlayWithFirecrawl(appId);
      platform = "android";
    } else {
      const appId = extractAppStoreId(formattedUrl);
      if (!appId) {
        return new Response(
          JSON.stringify({
            success: false,
            error:
              "ID do app não encontrado. Exemplo: apps.apple.com/br/app/nome/id123456789",
          }),
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
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erro ao extrair reviews",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
