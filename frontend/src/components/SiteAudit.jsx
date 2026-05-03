import { useState } from "react";

const CHECK_CONFIG = [
  {
    key: "botAccess",
    label: "Technical Readiness",
    icon: "🤖",
    desc: "Can AI bots crawl your site?",
  },
  {
    key: "answerBlocks",
    label: "Answer Block Presence",
    icon: "💬",
    desc: "Concise answers after headings",
  },
  {
    key: "headingStructure",
    label: "Question-Based Headings",
    icon: "❓",
    desc: "H2/H3s as natural language queries",
  },
  {
    key: "extractableFormats",
    label: "Extractable Formats",
    icon: "📋",
    desc: "Lists, tables, FAQ schema",
  },
  {
    key: "entitySignals",
    label: "Entity & Trust Signals",
    icon: "🏢",
    desc: "Schema, meta tags, canonical URLs",
  },
];

const BOT_ICONS = {
  GPTBot: "🤖",
  ClaudeBot: "🧠",
  PerplexityBot: "🔍",
  GoogleBot: "🌐",
  BingBot: "Ⓑ",
};

function ScoreGauge({ score, size = 90 }) {
  const r = size / 2 - 8;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 70 ? "var(--green)" : score >= 40 ? "var(--yellow)" : "var(--red)";
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border2)" strokeWidth="6" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1.2s ease" }}
      />
      <text
        x={size / 2} y={size / 2 + 1}
        textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize={size >= 90 ? 20 : 13} fontWeight="800"
        fontFamily="Syne, sans-serif"
        style={{ transform: `rotate(90deg)`, transformOrigin: `${size / 2}px ${size / 2}px` }}
      >
        {score}
      </text>
    </svg>
  );
}

function PassBadge({ pass }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 4, fontSize: 11,
      fontFamily: "var(--font-mono)", fontWeight: 700,
      background: pass ? "var(--green)18" : "var(--red)18",
      border: `1px solid ${pass ? "var(--green)" : "var(--red)"}40`,
      color: pass ? "var(--green)" : "var(--red)",
    }}>
      {pass ? "✓ Pass" : "✗ Needs Work"}
    </span>
  );
}

// ─── Domain input form ────────────────────────────────────────────────────────
export function SiteAuditForm({ onSubmit, loading }) {
  const [domain, setDomain] = useState("");

  const handleSubmit = () => {
    if (!domain.trim()) return;
    onSubmit(domain.trim());
  };

  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 14, padding: "24px 28px", marginTop: 24,
    }}>
      <div style={{
        fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)",
        textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10,
      }}>
        Site AEO Audit <span style={{ color: "var(--text3)" }}>— optional</span>
      </div>
      <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16, lineHeight: 1.5 }}>
        Enter your website domain to audit your content structure, bot access, schema markup, and heading quality.
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="e.g. notion.so or https://notion.so"
          disabled={loading}
          style={{
            flex: 1, background: "var(--surface2)",
            border: "1px solid var(--border2)", borderRadius: 8,
            padding: "10px 14px", color: "var(--text)",
            fontFamily: "var(--font-head)", fontSize: 14, outline: "none",
            opacity: loading ? 0.5 : 1,
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!domain.trim() || loading}
          style={{
            background: !domain.trim() || loading ? "var(--border2)" : "var(--accent)",
            color: !domain.trim() || loading ? "var(--text3)" : "var(--bg)",
            border: "none", borderRadius: 8, padding: "10px 20px",
            fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 13,
            cursor: !domain.trim() || loading ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {loading ? "Auditing..." : "Audit Site →"}
        </button>
      </div>
    </div>
  );
}

// ─── Bot access detail row ────────────────────────────────────────────────────
function BotRow({ name, data }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "8px 12px", borderRadius: 6,
      background: data.allowed ? "var(--green)08" : "var(--red)08",
      border: `1px solid ${data.allowed ? "var(--green)" : "var(--red)"}20`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 16 }}>{BOT_ICONS[name] || "🤖"}</span>
        <span style={{ fontWeight: 600, fontSize: 13 }}>{name}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text3)" }}>
          {data.note}
        </span>
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700,
          color: data.allowed ? "var(--green)" : "var(--red)",
        }}>
          {data.allowed ? "✓ Allowed" : "✗ Blocked"}
        </span>
      </div>
    </div>
  );
}

// ─── Individual check card ────────────────────────────────────────────────────
function CheckCard({ config, data }) {
  const [expanded, setExpanded] = useState(false);

  if (!data) return null;
  const score = data.score ?? 0;

  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 12, overflow: "hidden",
    }}>
      {/* Header row */}
      <div
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "16px 20px", cursor: "pointer",
        }}
      >
        <span style={{ fontSize: 22 }}>{config.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{config.label}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
            {config.desc}
          </div>
        </div>
        <ScoreGauge score={score} size={64} />
        <PassBadge pass={data.pass} />
        <span style={{ color: "var(--text3)", fontSize: 12, marginLeft: 4 }}>
          {expanded ? "▲" : "▼"}
        </span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{
          padding: "0 20px 20px",
          borderTop: "1px solid var(--border)",
          paddingTop: 16,
        }}>
          {/* Bot Access Detail */}
          {config.key === "botAccess" && data.results && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.entries(data.results).map(([name, info]) => (
                <BotRow key={name} name={name} data={info} />
              ))}
            </div>
          )}

          {/* Answer Blocks Detail */}
          {config.key === "answerBlocks" && (
            <div>
              <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                <Stat label="Headings Found" value={data.totalHeadings} />
                <Stat label="Answer Blocks" value={data.blocksFound} />
              </div>
              {data.examples?.length > 0 && (
                <div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text3)", marginBottom: 8, textTransform: "uppercase" }}>
                    Examples Found
                  </div>
                  {data.examples.map((ex, i) => (
                    <div key={i} style={{
                      background: "var(--surface2)", borderRadius: 8, padding: "10px 14px",
                      marginBottom: 8, borderLeft: "3px solid var(--green)",
                    }}>
                      <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>"{ex.heading}"</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text2)", lineHeight: 1.5 }}>
                        {ex.preview} <span style={{ color: "var(--text3)" }}>({ex.words} words)</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Heading Structure Detail */}
          {config.key === "headingStructure" && (
            <div>
              <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                <Stat label="Total H2/H3" value={data.total} />
                <Stat label="Question Headings" value={data.questionHeadings} />
                <Stat label="% Question" value={`${data.percentage}%`} />
              </div>
              {data.examples?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--green)", marginBottom: 6, textTransform: "uppercase" }}>
                    ✓ Good question headings
                  </div>
                  {data.examples.map((h, i) => (
                    <div key={i} style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text2)", padding: "4px 0", borderBottom: "1px solid var(--border)" }}>
                      {h}
                    </div>
                  ))}
                </div>
              )}
              {data.nonExamples?.length > 0 && (
                <div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--yellow)", marginBottom: 6, textTransform: "uppercase" }}>
                    → Could be rewritten as questions
                  </div>
                  {data.nonExamples.map((h, i) => (
                    <div key={i} style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text2)", padding: "4px 0", borderBottom: "1px solid var(--border)" }}>
                      {h}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Extractable Formats Detail */}
          {config.key === "extractableFormats" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Bullet/Numbered Lists", value: data.lists, good: data.lists >= 3, unit: "found" },
                { label: "Tables", value: data.tables, good: data.tables >= 1, unit: "found" },
                { label: "FAQ Schema (JSON-LD)", value: data.hasFaqSchema ? "Yes" : "No", good: data.hasFaqSchema },
                { label: "HowTo Schema", value: data.hasHowToSchema ? "Yes" : "No", good: data.hasHowToSchema },
                { label: "Product Schema", value: data.hasProductSchema ? "Yes" : "No", good: data.hasProductSchema },
                { label: "HTML FAQ (dt/dd)", value: data.hasHtmlFaq ? "Yes" : "No", good: data.hasHtmlFaq },
              ].map((item) => (
                <div key={item.label} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "8px 12px", borderRadius: 6, background: "var(--surface2)",
                }}>
                  <span style={{ fontSize: 13 }}>{item.label}</span>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700,
                    color: item.good ? "var(--green)" : "var(--red)",
                  }}>
                    {item.value} {item.unit || ""}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Entity Signals Detail */}
          {config.key === "entitySignals" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Page Title", value: data.title || "Missing", good: !!data.title },
                { label: "Meta Description", value: data.metaDesc ? data.metaDesc.slice(0, 60) + "..." : "Missing", good: !!data.metaDesc },
                { label: "OG Site Name", value: data.ogName || "Missing", good: !!data.ogName },
                { label: "Canonical URL", value: data.canonical ? "Present" : "Missing", good: !!data.canonical },
                { label: "Organization Schema", value: data.hasOrgSchema ? (data.orgName || "Present") : "Missing", good: data.hasOrgSchema },
              ].map((item) => (
                <div key={item.label} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "8px 12px", borderRadius: 6, background: "var(--surface2)",
                }}>
                  <span style={{ fontSize: 13 }}>{item.label}</span>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: 11,
                    color: item.good ? "var(--green)" : "var(--red)",
                    maxWidth: 280, textAlign: "right", wordBreak: "break-word",
                  }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Tip */}
          {data.tip && (
            <div style={{
              marginTop: 14, padding: "10px 14px",
              background: data.pass ? "var(--green)0a" : "var(--yellow)0a",
              border: `1px solid ${data.pass ? "var(--green)" : "var(--yellow)"}30`,
              borderRadius: 8, fontFamily: "var(--font-mono)", fontSize: 12,
              color: "var(--text2)", lineHeight: 1.5,
            }}>
              💡 {data.tip}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main SiteAudit results panel ─────────────────────────────────────────────
export default function SiteAudit({ auditResult, auditProgress, auditLoading }) {
  if (auditLoading && !auditResult) {
    return (
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 14, padding: "28px", marginTop: 28,
      }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
          Site AEO Audit — Running
        </div>
        {auditProgress.map((msg, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "6px 0", borderBottom: "1px solid var(--border)",
            fontFamily: "var(--font-mono)", fontSize: 12,
            color: i === auditProgress.length - 1 ? "var(--text)" : "var(--text2)",
          }}>
            <span style={{ color: "var(--green)" }}>✓</span> {msg}
          </div>
        ))}
      </div>
    );
  }

  if (!auditResult) return null;

  const { domain, overallScore, botAccess, answerBlocks, headingStructure, extractableFormats, entitySignals } = auditResult;
  const checks = { botAccess, answerBlocks, headingStructure, extractableFormats, entitySignals };
  const scoreColor = overallScore >= 70 ? "var(--green)" : overallScore >= 40 ? "var(--yellow)" : "var(--red)";

  return (
    <div style={{ marginTop: 28 }}>
      {/* Audit Header */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 14, padding: "24px 28px", marginBottom: 20,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
            Site AEO Audit
          </div>
          <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.5px", marginBottom: 4 }}>
            {domain}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text3)" }}>
            {new Date(auditResult.timestamp).toLocaleString()}
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <ScoreGauge score={overallScore} size={90} />
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: scoreColor, marginTop: 4, fontWeight: 700 }}>
            AEO Readiness
          </div>
        </div>
      </div>

      {/* Check Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {CHECK_CONFIG.map((cfg) => (
          <CheckCard key={cfg.key} config={cfg} data={checks[cfg.key]} />
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ background: "var(--surface2)", borderRadius: 6, padding: "8px 14px", textAlign: "center" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text3)", marginBottom: 3, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 18 }}>{value}</div>
    </div>
  );
}
