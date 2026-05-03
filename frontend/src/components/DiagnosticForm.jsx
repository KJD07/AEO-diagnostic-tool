import { useState } from "react";
import { SiteAuditForm } from "./SiteAudit.jsx";

const EXAMPLE_QUERIES = [
  { query: "best magnesium supplement for seniors", brand: "Nature Made", competitors: ["NOW Foods", "Thorne", "Garden of Life"] },
  { query: "best project management software for small teams", brand: "Asana", competitors: ["Monday.com", "Notion", "ClickUp"] },
  { query: "best noise cancelling headphones under $300", brand: "Sony WH-1000XM5", competitors: ["Bose QuietComfort 45", "Apple AirPods Max"] },
];

export default function DiagnosticForm({ onSubmit }) {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("");
  const [competitorInput, setCompetitorInput] = useState("");
  const [competitors, setCompetitors] = useState([]);
  const [domain, setDomain] = useState("");

  const addCompetitor = () => {
    const c = competitorInput.trim();
    if (c && !competitors.includes(c) && competitors.length < 4) {
      setCompetitors([...competitors, c]);
      setCompetitorInput("");
    }
  };

  const removeCompetitor = (c) => setCompetitors(competitors.filter((x) => x !== c));

  const loadExample = (ex) => {
    setQuery(ex.query);
    setBrand(ex.brand);
    setCompetitors(ex.competitors);
    setCompetitorInput("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() || !brand.trim()) return;
    onSubmit({ query: query.trim(), brand: brand.trim(), competitors, domain: domain.trim() });
  };

  return (
    <div style={{ paddingTop: 60 }}>
      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <div style={{
          display: "inline-block",
          fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.15em",
          color: "var(--accent)", border: "1px solid var(--accent)30",
          padding: "4px 12px", borderRadius: 4, marginBottom: 20,
          textTransform: "uppercase",
        }}>
          Answer Engine Optimization
        </div>
        <h1 style={{
          fontSize: "clamp(36px, 6vw, 64px)",
          fontWeight: 800, lineHeight: 1.05,
          letterSpacing: "-2px", marginBottom: 20,
        }}>
          How visible is your brand<br />
          <span style={{ color: "var(--accent)" }}>across AI engines?</span>
        </h1>
        <p style={{ color: "var(--text2)", fontSize: 17, maxWidth: 560, margin: "0 auto", lineHeight: 1.6 }}>
          Type any shopping query. We'll ask GPT-4o, Claude, and Gemini — then score how your brand ranks vs. competitors.
        </p>
      </div>

      {/* Example queries */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text3)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Try an example
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {EXAMPLE_QUERIES.map((ex) => (
            <button
              key={ex.query}
              onClick={() => loadExample(ex)}
              style={{
                background: "transparent", border: "1px solid var(--border2)",
                borderRadius: 6, padding: "8px 14px", color: "var(--text2)",
                fontFamily: "var(--font-mono)", fontSize: 12, cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.target.style.borderColor = "var(--accent)"; e.target.style.color = "var(--accent)"; }}
              onMouseLeave={(e) => { e.target.style.borderColor = "var(--border2)"; e.target.style.color = "var(--text2)"; }}
            >
              {ex.query}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 16, padding: 32,
          display: "flex", flexDirection: "column", gap: 24,
        }}>
          {/* Query */}
          <Field label="Search Query" hint="What a user would ask an AI assistant">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='e.g. "best magnesium supplement for seniors"'
              style={inputStyle}
              required
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {/* Brand */}
            <Field label="Your Brand" hint="The brand you want to track">
              <input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Nature Made"
                style={inputStyle}
                required
              />
            </Field>

            {/* Competitors */}
            <Field label={`Competitors (${competitors.length}/4)`} hint="Brands to compare against">
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={competitorInput}
                  onChange={(e) => setCompetitorInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCompetitor(); } }}
                  placeholder="Add competitor name"
                  style={{ ...inputStyle, flex: 1 }}
                  disabled={competitors.length >= 4}
                />
                <button
                  type="button"
                  onClick={addCompetitor}
                  disabled={competitors.length >= 4 || !competitorInput.trim()}
                  style={{
                    background: "var(--border2)", border: "none", borderRadius: 8,
                    padding: "0 16px", color: "var(--text)", cursor: "pointer",
                    fontFamily: "var(--font-head)", fontWeight: 600, fontSize: 18,
                    opacity: competitors.length >= 4 ? 0.4 : 1,
                  }}
                >
                  +
                </button>
              </div>
              {competitors.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                  {competitors.map((c) => (
                    <span key={c} style={{
                      background: "var(--surface2)", border: "1px solid var(--border2)",
                      borderRadius: 6, padding: "4px 10px", fontSize: 12,
                      fontFamily: "var(--font-mono)", color: "var(--text2)",
                      display: "flex", alignItems: "center", gap: 6,
                    }}>
                      {c}
                      <button
                        type="button" onClick={() => removeCompetitor(c)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", fontSize: 14, lineHeight: 1 }}
                      >×</button>
                    </span>
                  ))}
                </div>
              )}
            </Field>
          </div>

          <Field label="Your Website (optional)" hint="Enables full site AEO audit alongside the brand diagnostic">
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g. notion.so or https://notion.so"
              style={inputStyle}
            />
          </Field>

          <button
            type="submit"
            disabled={!query.trim() || !brand.trim()}
            style={{
              background: !query.trim() || !brand.trim() ? "var(--border2)" : "var(--accent)",
              color: !query.trim() || !brand.trim() ? "var(--text3)" : "var(--bg)",
              border: "none", borderRadius: 10, padding: "16px 0",
              fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 16,
              cursor: !query.trim() || !brand.trim() ? "not-allowed" : "pointer",
              letterSpacing: "-0.3px", transition: "all 0.2s",
            }}
          >
            Run AEO Diagnostic →
          </button>
        </div>
      </form>

      {/* How it works */}
      <div style={{ marginTop: 48, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {[
          { icon: "🔍", title: "Query 3 AI engines", desc: "Simultaneously asks GPT-4o, Claude Sonnet, and Gemini Flash the same question" },
          { icon: "📊", title: "Analyze brand mentions", desc: "Detects if your brand appears, its rank position, and sentiment in each AI response" },
          { icon: "📋", title: "Generate report card", desc: "Scores your AEO visibility 0-100 with competitor benchmarks and improvement tips" },
        ].map((item) => (
          <div key={item.title} style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 12, padding: 20,
          }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>{item.icon}</div>
            <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 14 }}>{item.title}</div>
            <div style={{ color: "var(--text2)", fontSize: 13, lineHeight: 1.5 }}>{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label style={{ display: "block", marginBottom: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 13 }}>{label}</span>
        {hint && <span style={{ color: "var(--text3)", fontFamily: "var(--font-mono)", fontSize: 11, marginLeft: 8 }}>{hint}</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", background: "var(--surface2)",
  border: "1px solid var(--border2)", borderRadius: 8,
  padding: "12px 14px", color: "var(--text)",
  fontFamily: "var(--font-head)", fontSize: 14, outline: "none",
};
