const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl connector not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { url } = await req.json();
    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log("Scraping store reviews from:", formattedUrl);

    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Firecrawl API error:", data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || `Request failed with status ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const markdown = data?.data?.markdown || data?.markdown || "";

    // Detect platform from URL
    const isPlayStore = formattedUrl.includes("play.google.com");
    const isAppStore = formattedUrl.includes("apps.apple.com");
    const platform = isPlayStore ? "android" : isAppStore ? "ios" : "unknown";

    // Extract reviews from markdown using heuristics
    const reviews = parseReviewsFromMarkdown(markdown, platform);

    return new Response(
      JSON.stringify({ success: true, reviews, platform, rawLength: markdown.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error scraping store reviews:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to scrape";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

interface ParsedReview {
  author: string;
  text: string;
  stars: number;
  platform: string;
}

function parseReviewsFromMarkdown(markdown: string, platform: string): ParsedReview[] {
  const reviews: ParsedReview[] = [];
  const lines = markdown.split("\n").map((l: string) => l.trim()).filter(Boolean);

  // Heuristic: look for star patterns and nearby text
  // Play Store format often has "★★★★★" or "Rated X out of 5" patterns
  // App Store format often has star ratings near review text

  let currentAuthor = "Anônimo";
  let currentStars = 0;
  let currentText = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect star ratings
    const starMatch = line.match(/(\d)\s*(?:star|estrela|out of 5|\/5|⭐|★)/i);
    const fullStarMatch = line.match(/(★{1,5}|⭐{1,5})/);
    const ratedMatch = line.match(/Rated\s+(\d(?:\.\d)?)\s+out of\s+5/i);

    if (starMatch) {
      if (currentText && currentStars > 0) {
        reviews.push({ author: currentAuthor, text: currentText.slice(0, 500), stars: currentStars, platform });
        currentText = "";
        currentAuthor = "Anônimo";
      }
      currentStars = Math.min(5, Math.max(1, parseInt(starMatch[1])));
    } else if (fullStarMatch) {
      if (currentText && currentStars > 0) {
        reviews.push({ author: currentAuthor, text: currentText.slice(0, 500), stars: currentStars, platform });
        currentText = "";
        currentAuthor = "Anônimo";
      }
      currentStars = fullStarMatch[1].length;
    } else if (ratedMatch) {
      if (currentText && currentStars > 0) {
        reviews.push({ author: currentAuthor, text: currentText.slice(0, 500), stars: currentStars, platform });
        currentText = "";
        currentAuthor = "Anônimo";
      }
      currentStars = Math.round(parseFloat(ratedMatch[1]));
    } else if (line.length > 15 && line.length < 1000 && currentStars > 0) {
      // Likely review text
      if (!currentText) {
        currentText = line;
      } else {
        currentText += " " + line;
      }
    } else if (line.length <= 30 && line.length > 2 && !line.startsWith("#") && !line.startsWith("[")) {
      // Possibly an author name
      if (currentStars > 0 && !currentText) {
        currentAuthor = line;
      }
    }
  }

  // Push last review
  if (currentText && currentStars > 0) {
    reviews.push({ author: currentAuthor, text: currentText.slice(0, 500), stars: currentStars, platform });
  }

  return reviews.slice(0, 50); // Max 50 reviews
}
