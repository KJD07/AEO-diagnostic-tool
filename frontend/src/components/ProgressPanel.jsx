export default function ProgressPanel({ progress, rawResponses }) {
  const engines = [
    { key: "groq", label: "Groq (Llama 3.3)", color: "var(--gpt)", icon: "⚡" },
    { key: "openrouter", label: "OpenRouter (Nemotron)", color: "var(--claude)", icon: "🔀" },
    { key: "gemini", label: "Gemini Flash", color: "var(--gemini)", icon: "✨" },
  ];

  return (
    <div style={{ paddingTop: 60, maxWidth: 760, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{
          width: 64, height: 64, margin: "0 auto 20px",
          borderRadius: "50%",
          background: "conic-gradient(var(--accent), var(--accent2), var(--gpt), var(--accent))",
          animation: "spin 1.5s linear infinite",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
            ⚡
          </div>
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-1px" }}>Running Diagnostic...</h2>
        <p style={{ color: "var(--text2)", marginTop: 8, fontFamily: "var(--font-mono)", fontSize: 13 }}>
          Querying all AI engines in parallel
        </p>
      </div>

      {/* Progress steps */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 12, padding: 24, marginBottom: 24,
      }}>
        {progress.length === 0 ? (
          <div style={{ color: "var(--text3)", fontFamily: "var(--font-mono)", fontSize: 13 }}>Initializing...</div>
        ) : (
          progress.map((msg, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 0",
              borderBottom: i < progress.length - 1 ? "1px solid var(--border)" : "none",
              animation: "fadeIn 0.3s ease",
            }}>
              <span style={{ color: "var(--green)", fontSize: 12 }}>✓</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: i === progress.length - 1 ? "var(--text)" : "var(--text2)" }}>
                {msg}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Raw responses preview */}
      {rawResponses && (
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text3)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Raw AI Responses (previewing...)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {engines.map((e) => (
              <div key={e.key} style={{
                background: "var(--surface)", border: `1px solid ${e.color}30`,
                borderLeft: `3px solid ${e.color}`,
                borderRadius: 8, padding: 16,
              }}>
                <div style={{ color: e.color, fontWeight: 700, fontSize: 12, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>{e.icon}</span> {e.label}
                </div>
                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text2)",
                  lineHeight: 1.6, maxHeight: 80, overflow: "hidden",
                  WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent)",
                }}>
                  {rawResponses[e.key] || "Waiting..."}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
