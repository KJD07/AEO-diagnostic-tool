import { useState } from "react";
import DiagnosticForm from "./components/DiagnosticForm.jsx";
import ProgressPanel from "./components/ProgressPanel.jsx";
import ReportCard from "./components/ReportCard.jsx";

export default function App() {
  const [state, setState] = useState("idle");
  const [progress, setProgress] = useState([]);
  const [rawResponses, setRawResponses] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Site audit state
  const [auditResult, setAuditResult] = useState(null);
  const [auditProgress, setAuditProgress] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const runAudit = (domain) => {
    if (!domain) return;
    setAuditLoading(true);
    setAuditResult(null);
    setAuditProgress([]);

    fetch("/api/crawl", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain }),
    }).then(async (res) => {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();
        let currentEvent = null;
        for (const line of lines) {
          if (line.startsWith("event: ")) currentEvent = line.slice(7).trim();
          else if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));
            if (currentEvent === "crawlProgress") setAuditProgress((p) => [...p, data.message]);
            else if (currentEvent === "crawlResult") setAuditResult(data);
            else if (currentEvent === "error") console.error("Audit error:", data.message);
            currentEvent = null;
          }
        }
      }
    }).catch((e) => console.error("Audit fetch error:", e))
      .finally(() => setAuditLoading(false));
  };

  const handleSubmit = ({ query, brand, competitors, domain }) => {
    setState("running");
    setProgress([]);
    setRawResponses(null);
    setResult(null);
    setError(null);
    setAuditResult(null);
    setAuditProgress([]);

    // Run site audit in parallel if domain provided
    if (domain) runAudit(domain);

    const evtSource = new EventSource(
      `/api/diagnose?` + new URLSearchParams({ query, brand, competitors: competitors.join(",") })
    );
    evtSource.close();

    fetch("/api/diagnose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, brand, competitors }),
    }).then(async (res) => {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();
        let currentEvent = null;
        for (const line of lines) {
          if (line.startsWith("event: ")) currentEvent = line.slice(7).trim();
          else if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));
            if (currentEvent === "progress") setProgress((p) => [...p, data.message]);
            else if (currentEvent === "rawResponses") setRawResponses(data);
            else if (currentEvent === "result") { setResult(data); setState("done"); }
            else if (currentEvent === "error") { setError(data.message); setState("error"); }
            currentEvent = null;
          }
        }
      }
    }).catch((e) => { setError(e.message); setState("error"); });
  };

  const handleReset = () => {
    setState("idle");
    setProgress([]);
    setRawResponses(null);
    setResult(null);
    setError(null);
    setAuditResult(null);
    setAuditProgress([]);
    setAuditLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />
      <main style={{ flex: 1, maxWidth: 1100, margin: "0 auto", width: "100%", padding: "0 24px 80px" }}>
        {state === "idle" && <DiagnosticForm onSubmit={handleSubmit} />}
        {state === "running" && (
          <ProgressPanel progress={progress} rawResponses={rawResponses} />
        )}
        {state === "done" && result && (
          <ReportCard result={result} onReset={handleReset} auditResult={auditResult} auditProgress={auditProgress} auditLoading={auditLoading} />
        )}
        {state === "error" && (
          <ErrorPanel message={error} onReset={handleReset} />
        )}
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header style={{
      borderBottom: "1px solid var(--border)",
      padding: "20px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      maxWidth: 1100,
      margin: "0 auto",
      width: "100%",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: "linear-gradient(135deg, var(--accent), var(--accent2))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, fontWeight: 800,
        }}>⚡</div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.5px" }}>AEO Diagnostic</div>
          <div style={{ fontSize: 11, color: "var(--text2)", fontFamily: "var(--font-mono)", marginTop: 1 }}>
            AI Brand Visibility Scanner
          </div>
        </div>
      </div>
      <div style={{
        display: "flex", gap: 8, alignItems: "center",
        fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text3)",
      }}>
        <EnginePill label="Groq" color="var(--gpt)" />
        <EnginePill label="OpenRouter" color="var(--claude)" />
        <EnginePill label="Gemini" color="var(--gemini)" />
      </div>
    </header>
  );
}

function EnginePill({ label, color }) {
  return (
    <span style={{
      padding: "3px 8px", borderRadius: 4,
      border: `1px solid ${color}40`,
      color, fontSize: 10, fontWeight: 500,
    }}>{label}</span>
  );
}

function ErrorPanel({ message, onReset }) {
  return (
    <div style={{ textAlign: "center", padding: "80px 0" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: "var(--red)", marginBottom: 8 }}>Diagnostic Failed</div>
      <div style={{ color: "var(--text2)", fontFamily: "var(--font-mono)", fontSize: 13, marginBottom: 32 }}>{message}</div>
      <button onClick={onReset} style={btnStyle}>Try Again</button>
    </div>
  );
}

const btnStyle = {
  background: "var(--accent)", color: "var(--bg)",
  border: "none", borderRadius: 8, padding: "12px 28px",
  fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 14,
  cursor: "pointer", letterSpacing: "0.5px",
};

function Footer() {
  return (
    <div style={{
      borderTop: "1px solid var(--border)", padding: "16px 24px",
      textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11,
      color: "var(--text3)",
    }}>
      AEO Diagnostic — Answer Engine Optimization · Powered by Groq (Llama 3.3 70B), OpenRouter & Gemini Flash
    </div>
  );
}
