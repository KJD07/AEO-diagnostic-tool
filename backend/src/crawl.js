const fetch = (...args) => import("node-fetch").then(({ default: f }) => f(...args));
const cheerio = require("cheerio");

const AI_BOTS = [
  { name: "GPTBot",        agent: "GPTBot" },
  { name: "ClaudeBot",     agent: "ClaudeBot" },
  { name: "PerplexityBot", agent: "PerplexityBot" },
  { name: "GoogleBot",     agent: "Googlebot" },
  { name: "BingBot",       agent: "Bingbot" },
];

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; AEODiagnostic/1.0)",
  "Accept": "text/html,application/xhtml+xml",
  "Accept-Language": "en-US,en;q=0.9",
};

// ─── Normalize domain to URL ──────────────────────────────────────────────────
function toUrl(domain) {
  let url = domain.trim();
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  return url.replace(/\/$/, "");
}

// ─── Fetch robots.txt and check AI bot permissions ───────────────────────────
async function checkRobots(baseUrl) {
  const results = {};
  try {
    const res = await fetch(`${baseUrl}/robots.txt`, { headers: HEADERS, timeout: 8000 });
    if (!res.ok) {
      AI_BOTS.forEach((b) => { results[b.name] = { allowed: true, note: "No robots.txt found — bots allowed by default" }; });
      return { found: false, results };
    }
    const text = await res.text();
    const lines = text.split("\n").map((l) => l.trim());

    AI_BOTS.forEach((bot) => {
      // Find relevant user-agent blocks
      let inBlock = false;
      let inWildcard = false;
      let botDisallowed = null;
      let wildcardDisallowed = null;

      for (const line of lines) {
        const lower = line.toLowerCase();
        if (lower.startsWith("user-agent:")) {
          const val = line.split(":")[1]?.trim() || "";
          inBlock = val.toLowerCase() === bot.agent.toLowerCase();
          inWildcard = val === "*";
        }
        if (lower.startsWith("disallow:")) {
          const path = line.split(":")[1]?.trim() || "";
          if (inBlock) {
            if (path === "/" || path === "") botDisallowed = path === "/";
            else botDisallowed = false; // partial disallow = mostly allowed
          }
          if (inWildcard) {
            if (path === "/") wildcardDisallowed = true;
            else wildcardDisallowed = false;
          }
        }
      }

      const blocked = botDisallowed === true || (botDisallowed === null && wildcardDisallowed === true);
      results[bot.name] = {
        allowed: !blocked,
        note: botDisallowed !== null
          ? `Explicit rule for ${bot.agent}`
          : wildcardDisallowed !== null
          ? `Inherits wildcard rule`
          : `No specific rule — allowed by default`,
      };
    });

    return { found: true, rawText: text.slice(0, 1500), results };
  } catch (e) {
    AI_BOTS.forEach((b) => { results[b.name] = { allowed: true, note: "Could not fetch robots.txt" }; });
    return { found: false, error: e.message, results };
  }
}

// ─── Fetch & parse homepage HTML ──────────────────────────────────────────────
async function fetchPage(url) {
  const res = await fetch(url, { headers: HEADERS, timeout: 10000 });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const html = await res.text();
  return cheerio.load(html);
}

// ─── Check answer block presence (40-60 word answers after headings) ──────────
function checkAnswerBlocks($) {
  const headings = $("h1, h2, h3").toArray();
  let blocksFound = 0;
  let totalHeadings = headings.length;
  const examples = [];

  headings.forEach((h) => {
    const next = $(h).next();
    const tag = next.prop("tagName")?.toLowerCase();
    if (tag === "p" || tag === "div") {
      const text = next.text().trim();
      const words = text.split(/\s+/).filter(Boolean).length;
      if (words >= 30 && words <= 100) {
        blocksFound++;
        if (examples.length < 2) {
          examples.push({
            heading: $(h).text().trim().slice(0, 80),
            words,
            preview: text.slice(0, 120) + (text.length > 120 ? "..." : ""),
          });
        }
      }
    }
  });

  const score = totalHeadings === 0 ? 0 : Math.round((blocksFound / Math.min(totalHeadings, 10)) * 100);
  return {
    totalHeadings,
    blocksFound,
    score: Math.min(score, 100),
    examples,
    pass: blocksFound >= 2,
    tip: blocksFound < 2
      ? "Add concise 40-60 word answer paragraphs immediately after your H2/H3 headings so AI engines can extract direct answers."
      : "Good — you have answer blocks after headings.",
  };
}

// ─── Check question-based heading structure ───────────────────────────────────
function checkHeadingStructure($) {
  const questionWords = /^(what|how|why|when|where|who|which|can|is|are|does|do|should|will|would|could)\b/i;
  const headings = $("h2, h3").toArray();
  let questionHeadings = 0;
  const examples = [];
  const nonExamples = [];

  headings.forEach((h) => {
    const text = $(h).text().trim();
    if (!text) return;
    if (questionWords.test(text)) {
      questionHeadings++;
      if (examples.length < 3) examples.push(text.slice(0, 80));
    } else {
      if (nonExamples.length < 3) nonExamples.push(text.slice(0, 80));
    }
  });

  const total = headings.length;
  const pct = total === 0 ? 0 : Math.round((questionHeadings / total) * 100);

  return {
    total,
    questionHeadings,
    percentage: pct,
    examples,
    nonExamples,
    pass: pct >= 30,
    score: Math.min(pct * 1.5, 100),
    tip: pct < 30
      ? `Only ${pct}% of your headings are question-based. Rewrite generic headings like "${nonExamples[0] || "Features"}" as natural questions like "What features does ${nonExamples[0] || "this product"} offer?"`
      : `${pct}% of headings are question-based — AI engines love this format.`,
  };
}

// ─── Check extractable formats (lists, tables, FAQ schema) ───────────────────
function checkExtractableFormats($) {
  const lists = $("ul, ol").length;
  const tables = $("table").length;

  // Check for FAQ schema in JSON-LD
  let hasFaqSchema = false;
  let hasHowToSchema = false;
  let hasProductSchema = false;
  $("script[type='application/ld+json']").each((_, el) => {
    try {
      const json = JSON.parse($(el).html());
      const types = [].concat(json["@type"] || []);
      if (types.some((t) => t === "FAQPage")) hasFaqSchema = true;
      if (types.some((t) => t === "HowTo")) hasHowToSchema = true;
      if (types.some((t) => t === "Product")) hasProductSchema = true;
    } catch (_) {}
  });

  // Check for FAQ-like HTML (dt/dd pairs or divs with question/answer pattern)
  const dtElements = $("dt").length;
  const hasHtmlFaq = dtElements >= 3;

  const score = Math.min(
    (lists >= 3 ? 25 : lists >= 1 ? 12 : 0) +
    (tables >= 1 ? 20 : 0) +
    (hasFaqSchema ? 30 : hasHtmlFaq ? 15 : 0) +
    (hasHowToSchema ? 15 : 0) +
    (hasProductSchema ? 10 : 0),
    100
  );

  return {
    lists,
    tables,
    hasFaqSchema,
    hasHowToSchema,
    hasProductSchema,
    hasHtmlFaq,
    score,
    pass: score >= 40,
    tip: !hasFaqSchema
      ? "Add FAQ schema (JSON-LD) to your pages — this is one of the strongest signals for AI engines to extract structured answers."
      : lists < 3
      ? "Add more bullet lists and comparison tables — AI engines extract these easily as structured answers."
      : "Good structured content — FAQ schema, lists, and tables detected.",
  };
}

// ─── Check meta tags & Open Graph (entity signals) ───────────────────────────
function checkEntitySignals($) {
  const title = $("title").first().text().trim();
  const metaDesc = $("meta[name='description']").attr("content") || "";
  const ogName = $("meta[property='og:site_name']").attr("content") || "";
  const ogDesc = $("meta[property='og:description']").attr("content") || "";
  const canonical = $("link[rel='canonical']").attr("href") || "";

  // Check for organization schema
  let hasOrgSchema = false;
  let orgName = "";
  $("script[type='application/ld+json']").each((_, el) => {
    try {
      const json = JSON.parse($(el).html());
      const types = [].concat(json["@type"] || []);
      if (types.some((t) => ["Organization", "LocalBusiness", "Corporation"].includes(t))) {
        hasOrgSchema = true;
        orgName = json.name || "";
      }
    } catch (_) {}
  });

  const score =
    (title ? 15 : 0) +
    (metaDesc.length > 50 ? 20 : metaDesc.length > 0 ? 10 : 0) +
    (ogName ? 15 : 0) +
    (canonical ? 15 : 0) +
    (hasOrgSchema ? 35 : 0);

  return {
    title: title.slice(0, 80),
    metaDesc: metaDesc.slice(0, 120),
    ogName,
    canonical,
    hasOrgSchema,
    orgName,
    score,
    pass: score >= 50,
    tip: !hasOrgSchema
      ? "Add Organization schema (JSON-LD) with your brand name, URL, logo, and contact details — this builds your Knowledge Graph entity."
      : !canonical
      ? "Add canonical URLs to prevent duplicate content confusion for AI crawlers."
      : "Good entity signals — Organization schema and meta tags detected.",
  };
}

// ─── Main crawl orchestrator ──────────────────────────────────────────────────
async function runCrawl({ domain }, send) {
  const baseUrl = toUrl(domain);

  send("crawlProgress", { message: `Fetching robots.txt from ${baseUrl}...`, step: 1, total: 4 });
  const robots = await checkRobots(baseUrl);

  send("crawlProgress", { message: "Fetching homepage HTML...", step: 2, total: 4 });
  let $;
  try {
    $ = await fetchPage(baseUrl);
  } catch (e) {
    throw new Error(`Could not fetch ${baseUrl}: ${e.message}`);
  }

  send("crawlProgress", { message: "Analyzing content structure...", step: 3, total: 4 });
  const answerBlocks = checkAnswerBlocks($);
  const headingStructure = checkHeadingStructure($);
  const extractableFormats = checkExtractableFormats($);
  const entitySignals = checkEntitySignals($);

  send("crawlProgress", { message: "Calculating AEO readiness score...", step: 4, total: 4 });

  // Overall site AEO readiness score (weighted)
  const overallScore = Math.round(
    answerBlocks.score * 0.25 +
    headingStructure.score * 0.20 +
    extractableFormats.score * 0.30 +
    entitySignals.score * 0.25
  );

  // Bot access score
  const allowedBots = Object.values(robots.results).filter((r) => r.allowed).length;
  const botScore = Math.round((allowedBots / AI_BOTS.length) * 100);

  send("crawlResult", {
    domain: baseUrl,
    timestamp: new Date().toISOString(),
    overallScore,
    botAccess: {
      score: botScore,
      pass: botScore >= 80,
      results: robots.results,
      found: robots.found,
      tip: botScore < 100
        ? "Some AI bots may be blocked in your robots.txt. Review and explicitly allow GPTBot, ClaudeBot, and PerplexityBot."
        : "All major AI bots are allowed to crawl your site.",
    },
    answerBlocks,
    headingStructure,
    extractableFormats,
    entitySignals,
  });
}

module.exports = { runCrawl };
