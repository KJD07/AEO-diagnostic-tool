import { useState } from "react";
import SiteAudit from "./SiteAudit.jsx";

const ENGINES = [
  { key: "groq", label: "Groq (Llama 3.3)", color: "var(--gpt)", bg: "#10a37f18", icon: "🤖" },
  { key: "openrouter", label: "OpenRouter (Mistral)", color: "var(--claude)", bg: "#d9770618", icon: "🧠" },
  { key: "gemini", label: "Gemini Flash", color: "var(--gemini)", bg: "#4285f418", icon: "✨" },
];

const SENTIMENT_CONFIG = {
  positive: { label: "Positive", color: "var(--green)", icon: "↑" },
  neutral: { label: "Neutral", color: "var(--yellow)", icon: "→" },
  negative: { label: "Negative", color: "var(--red)", icon: "↓" },
  not_mentioned: { label: "Not Mentioned", color: "var(--text3)", icon: "–" },
};

function ScoreRing({ score, size = 100 }) {
  const r = (size / 2) - 8;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 70 ? "var(--green)" : score >= 40 ? "var(--yellow)" : "var(--red)";

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border2)" strokeWidth="6" />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
      <text
        x={size/2} y={size/2 + 1}
        textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize={size === 100 ? 22 : 14} fontWeight="800"
        fontFamily="Syne, sans-serif"
        style={{ transform: `rotate(90deg)`, transformOrigin: `${size/2}px ${size/2}px` }}
      >
        {score}
      </text>
    </svg>
  );
}

function MentionBadge({ mentioned, rank, sentiment }) {
  if (!mentioned) {
    return (
      <span style={{
        background: "var(--surface2)", border: "1px solid var(--border)",
        borderRadius: 4, padding: "3px 8px", fontSize: 11,
        fontFamily: "var(--font-mono)", color: "var(--text3)",
      }}>Not mentioned</span>
    );
  }
  const s = SENTIMENT_CONFIG[sentiment] || SENTIMENT_CONFIG.neutral;
  return (
    <span style={{
      background: `${s.color}18`, border: `1px solid ${s.color}40`,
      borderRadius: 4, padding: "3px 8px", fontSize: 11,
      fontFamily: "var(--font-mono)", color: s.color,
      display: "inline-flex", alignItems: "center", gap: 4,
    }}>
      {rank ? `#${rank}` : "✓"} {s.icon} {s.label}
    </span>
  );
}

export default function ReportCard({ result, onReset, auditResult, auditProgress, auditLoading }) {
  const [activeTab, setActiveTab] = useState("overview");
  const { query, brand, competitors, analysis, timestamp } = result;
  const { engines, overallScores, insights } = analysis;

  const allBrands = [brand, ...(competitors || [])].filter(Boolean);
  const sortedBrands = [...allBrands].sort((a, b) => {
    const sa = overallScores[a]?.aeoScore || 0;
    const sb = overallScores[b]?.aeoScore || 0;
    return sb - sa;
  });

  const brandRank = sortedBrands.indexOf(brand) + 1;
  const myScore = overallScores[brand];

  return (
    <div style={{ paddingTop: 48 }}>
      {/* Report header */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 16, padding: "28px 32px", marginBottom: 24,
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
            AEO Report Card
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 6 }}>
            "{query}"
          </h2>
          <div style={{ color: "var(--text2)", fontSize: 13, fontFamily: "var(--font-mono)" }}>
            Tracking: <span style={{ color: "var(--accent)" }}>{brand}</span>
            {competitors?.length > 0 && <> vs. {competitors.join(", ")}</>}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text3)" }}>
            {new Date(timestamp).toLocaleString()}
          </div>
          <button
            onClick={onReset}
            style={{
              background: "transparent", border: "1px solid var(--border2)",
              borderRadius: 6, padding: "6px 14px", color: "var(--text2)",
              fontFamily: "var(--font-head)", fontSize: 12, cursor: "pointer",
            }}
          >
            ← New Diagnostic
          </button>
        </div>
      </div>

      {/* Brand overview cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fill, minmax(280px, 1fr))`,
        gap: 16, marginBottom: 24,
      }}>
        {sortedBrands.map((b, i) => {
          const score = overallScores[b];
          if (!score) return null;
          const isMine = b === brand;
          const scoreColor = score.aeoScore >= 70 ? "var(--green)" : score.aeoScore >= 40 ? "var(--yellow)" : "var(--red)";
          return (
            <div key={b} style={{
              background: isMine ? `${scoreColor}0a` : "var(--surface)",
              border: `1px solid ${isMine ? scoreColor : "var(--border)"}`,
              borderRadius: 14, padding: "24px 20px",
              position: "relative",
            }}>
              {i === 0 && (
                <div style={{
                  position: "absolute", top: -10, left: 16,
                  background: "var(--yellow)", color: "var(--bg)",
                  fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700,
                  padding: "2px 8px", borderRadius: 4,
                }}>
                  #1 RANKED
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{b}</div>
                  {isMine && (
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)", border: "1px solid var(--accent)30", borderRadius: 3, padding: "1px 6px", display: "inline-block" }}>
                      YOUR BRAND
                    </div>
                  )}
                </div>
                <ScoreRing score={score.aeoScore} size={72} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <Stat label="Mention Rate" value={`${score.mentionRate}%`} />
                <Stat label="Avg Rank" value={score.avgRank ? `#${score.avgRank.toFixed(1)}` : "N/A"} />
              </div>
              <div style={{
                marginTop: 12, padding: "8px 10px",
                background: "var(--surface2)", borderRadius: 6,
                fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text2)",
                lineHeight: 1.4,
              }}>
                💡 {score.recommendation}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid var(--border)", paddingBottom: 0 }}>
        {[
          { id: "overview", label: "Engine Breakdown" },
          { id: "responses", label: "Raw AI Responses" },
          { id: "insights", label: "Insights & Tips" },
          ...(auditResult || auditLoading ? [{ id: "siteaudit", label: `Site Audit${auditLoading && !auditResult ? " ⏳" : ""}` }] : []),
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: "transparent",
              border: "none",
              borderBottom: activeTab === tab.id ? "2px solid var(--accent)" : "2px solid transparent",
              padding: "10px 16px", cursor: "pointer",
              fontFamily: "var(--font-head)", fontWeight: 600, fontSize: 13,
              color: activeTab === tab.id ? "var(--accent)" : "var(--text2)",
              marginBottom: -1, transition: "all 0.15s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Engine Breakdown */}
      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {ENGINES.map((engine) => {
            const engineData = engines[engine.key];
            if (!engineData) return null;
            return (
              <div key={engine.key} style={{
                background: engine.bg, border: `1px solid ${engine.color}30`,
                borderLeft: `3px solid ${engine.color}`,
                borderRadius: 12, padding: 20,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span>{engine.icon}</span>
                  <span style={{ fontWeight: 800, color: engine.color, fontSize: 15 }}>{engine.label}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {allBrands.map((b) => {
                    const mention = engineData.mentions?.[b];
                    if (!mention) return null;
                    const isMine = b === brand;
                    return (
                      <div key={b} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "10px 14px", borderRadius: 8,
                        background: isMine ? "var(--surface)" : "transparent",
                        border: isMine ? "1px solid var(--border2)" : "1px solid transparent",
                      }}>
                        <div>
                          <span style={{ fontWeight: isMine ? 700 : 500, fontSize: 13 }}>{b}</span>
                          {isMine && <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)", marginLeft: 6 }}>YOU</span>}
                          {mention.context && (
                            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text3)", marginTop: 3 }}>
                              "{mention.context}"
                            </div>
                          )}
                        </div>
                        <MentionBadge mentioned={mention.mentioned} rank={mention.rank} sentiment={mention.sentiment} />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: Raw Responses */}
      {activeTab === "responses" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {ENGINES.map((engine) => {
            const engineData = engines[engine.key];
            if (!engineData) return null;
            return (
              <div key={engine.key} style={{
                background: "var(--surface)", border: `1px solid ${engine.color}30`,
                borderRadius: 12, padding: 20,
              }}>
                <div style={{ color: engine.color, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  {engine.icon} {engine.label}
                </div>
                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--text2)",
                  lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word",
                  background: "var(--surface2)", borderRadius: 8, padding: 16,
                  maxHeight: 300, overflow: "auto",
                }}>
                  {engineData.rawResponse || "No response captured."}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: Insights */}
      {activeTab === "insights" && (
        <div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
            {insights?.map((insight, i) => (
              <div key={i} style={{
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: 10, padding: "16px 20px",
                display: "flex", gap: 14, alignItems: "flex-start",
              }}>
                <div style={{
                  width: 28, height: 28, minWidth: 28, borderRadius: "50%",
                  background: "var(--accent)20", border: "1px solid var(--accent)40",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--accent)", fontWeight: 700,
                }}>
                  {i + 1}
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text2)", margin: 0 }}>{insight}</p>
              </div>
            ))}
          </div>

          {/* My brand recommendation */}
          {myScore?.recommendation && (
            <div style={{
              background: "var(--accent)10", border: "1px solid var(--accent)30",
              borderRadius: 12, padding: "20px 24px",
            }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                Top recommendation for {brand}
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.6, fontWeight: 500 }}>{myScore.recommendation}</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Site Audit */}
      {activeTab === "siteaudit" && (
        <SiteAudit auditResult={auditResult} auditProgress={auditProgress} auditLoading={auditLoading} />
      )}

      {/* Leaderboard summary */}
      <div style={{
        marginTop: 32, background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 12, padding: 20,
      }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
          AEO Leaderboard
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sortedBrands.map((b, i) => {
            const score = overallScores[b];
            if (!score) return null;
            const isMine = b === brand;
            const scoreColor = score.aeoScore >= 70 ? "var(--green)" : score.aeoScore >= 40 ? "var(--yellow)" : "var(--red)";
            return (
              <div key={b} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 14px", borderRadius: 8,
                background: isMine ? `${scoreColor}0d` : "transparent",
                border: isMine ? `1px solid ${scoreColor}30` : "1px solid transparent",
              }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: i === 0 ? "var(--yellow)" : "var(--text3)", minWidth: 24 }}>
                  #{i + 1}
                </span>
                <span style={{ flex: 1, fontWeight: isMine ? 700 : 500, fontSize: 14 }}>{b}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text3)" }}>
                    {score.mentionRate}% mention
                  </span>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700,
                    color: scoreColor, minWidth: 40, textAlign: "right",
                  }}>
                    {score.aeoScore}
                  </span>
                  <div style={{ width: 80, height: 6, background: "var(--border2)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${score.aeoScore}%`, height: "100%", background: scoreColor, borderRadius: 3, transition: "width 1s ease" }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ background: "var(--surface2)", borderRadius: 6, padding: "8px 10px" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text3)", marginBottom: 3, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: 16 }}>{value}</div>
    </div>
  );
}
