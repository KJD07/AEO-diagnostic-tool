const OpenAI = require("openai");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ─── Clients ─────────────────────────────────────────────────────────────────

const groqClient = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const openRouterClient = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

// ─── Build the shopping recommendation prompt ────────────────────────────────
function buildPrompt(query, brand, competitors) {                                // CHANGED: added brand, competitors params
  const allBrands = [brand, ...competitors].filter(Boolean);                    // CHANGED: build brand list
  return `You are a helpful shopping assistant. A user asks: "${query}"

You must evaluate and rank ONLY these specific brands: ${allBrands.join(", ")}.

For each brand, provide:
1. Whether it is a good choice for this query
2. Its key strengths and weaknesses relevant to the query
3. Your recommendation ranking among these options

Do not add or suggest any other brands outside this list. Be honest — if a brand is less well-known or lacks information, say so. Format your answer as a clear numbered ranking list of only these brands.`;
}                                                                               // CHANGED: replaced entire prompt body

// ─── Query Groq (Llama 3.3 70B) ──────────────────────────────────────────────
async function queryGroq(query, brand, competitors) {                           // CHANGED: added brand, competitors params
  const response = await groqClient.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: buildPrompt(query, brand, competitors) }],  // CHANGED: pass brand, competitors
    max_tokens: 1200,
  });
  return response.choices[0].message.content;
}

// ─── Query OpenRouter (Qwen3) ─────────────────────────────────────────────────
async function queryOpenRouter(query, brand, competitors) {                     // CHANGED: added brand, competitors params
  const response = await openRouterClient.chat.completions.create({
    model: "nvidia/nemotron-3-super-120b-a12b:free",  // change to any model from openrouter.ai/models
    messages: [{ role: "user", content: buildPrompt(query, brand, competitors) }],  // CHANGED: pass brand, competitors
    max_tokens: 1200,
  });
  return response.choices[0].message.content;
}

// ─── Query Google AI Studio (Gemini Flash) ────────────────────────────────────
async function queryGemini(query, brand, competitors) {                         // CHANGED: added brand, competitors params
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_STUDIO_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(buildPrompt(query, brand, competitors));  // CHANGED: pass brand, competitors
  return result.response.text();
}

// ─── Analysis prompt: extract brands, ranks, sentiment ───────────────────────
function buildAnalysisPrompt(query, brand, competitors, groqResp, openRouterResp, geminiResp) {
  const allBrands = [brand, ...competitors].filter(Boolean);
  return `You are an Answer Engine Optimization (AEO) analyst. A user searched for: "${query}"

Here are three AI engine responses to that query:

=== Groq (Llama 3.3 70B) Response ===
${groqResp}

=== OpenRouter (Mistral) Response ===
${openRouterResp}

=== Gemini Flash Response ===
${geminiResp}

Analyze these responses for the following brands: ${allBrands.join(", ")}

Return ONLY valid JSON (no markdown, no backticks) in this exact format:
{
  "engines": {
    "groq": {
      "rawResponse": "...(first 300 chars of Groq response)...",
      "mentions": {
        "BrandName": {
          "mentioned": true/false,
          "rank": 1-5 or null,
          "sentiment": "positive"/"neutral"/"negative"/"not_mentioned",
          "context": "brief quote or context where mentioned, or null"
        }
      }
    },
    "openrouter": { ...same structure... },
    "gemini": { ...same structure... }
  },
  "overallScores": {
    "BrandName": {
      "mentionRate": 0-100,
      "avgRank": number or null,
      "dominantSentiment": "positive"/"neutral"/"negative"/"not_mentioned",
      "aeoScore": 0-100,
      "recommendation": "one sentence tip to improve AEO for this brand"
    }
  },
  "insights": [
    "Key insight about the competitive landscape",
    "Another insight about brand visibility",
    "Actionable recommendation"
  ]
}

For aeoScore: calculate based on mention rate (40%), rank position (35%), and sentiment (25%). 100 = perfect.
For mentionRate: percentage of the 3 engines that mentioned the brand.
Be precise and analytical.`;
}

// ─── Main orchestrator ───────────────────────────────────────────────────────
async function runDiagnostic({ query, brand, competitors }, send) {

  // Fire all three queries in parallel
  send("progress", { message: "Querying all 3 AI engines simultaneously...", step: 1, total: 5 });

  const [groqResult, openRouterResult, geminiResult] = await Promise.allSettled([
    queryGroq(query, brand, competitors).catch((e) => { throw new Error(`Groq: ${e.message}`); }),          // CHANGED: pass brand, competitors
    queryOpenRouter(query, brand, competitors).catch((e) => { throw new Error(`OpenRouter: ${e.message}`); }),  // CHANGED: pass brand, competitors
    queryGemini(query, brand, competitors).catch((e) => { throw new Error(`Gemini: ${e.message}`); }),      // CHANGED: pass brand, competitors
  ]);

  // Extract values or error messages
  const groqResp = groqResult.status === "fulfilled" ? groqResult.value : `[Error: ${groqResult.reason?.message}]`;
  const openRouterResp = openRouterResult.status === "fulfilled" ? openRouterResult.value : `[Error: ${openRouterResult.reason?.message}]`;
  const geminiResp = geminiResult.status === "fulfilled" ? geminiResult.value : `[Error: ${geminiResult.reason?.message}]`;

  send("progress", { message: "All engines responded. Analyzing brand mentions...", step: 2, total: 5 });

  // Stream raw responses so UI can preview them
  send("rawResponses", {
    groq: groqResp,
    openrouter: openRouterResp,
    gemini: geminiResp,
  });

  send("progress", { message: "Running AEO analysis with Gemini...", step: 3, total: 5 });

  // Use Gemini to analyze all three responses (replaces Claude analysis)
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_STUDIO_KEY);
  const analysisModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const analysisPrompt = buildAnalysisPrompt(query, brand, competitors, groqResp, openRouterResp, geminiResp);
  const analysisResult = await analysisModel.generateContent(analysisPrompt);
  const rawText = analysisResult.response.text().trim();

  send("progress", { message: "Scoring brands and generating report card...", step: 4, total: 5 });

  let analysis;
  try {
    const cleaned = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    analysis = JSON.parse(cleaned);
  } catch (e) {
    throw new Error("Failed to parse analysis JSON: " + e.message);
  }

  send("progress", { message: "Report ready!", step: 5, total: 5 });

  send("result", {
    query,
    brand,
    competitors,
    timestamp: new Date().toISOString(),
    analysis,
  });
}

module.exports = { runDiagnostic };