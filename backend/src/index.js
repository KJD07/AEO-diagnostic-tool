require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { runDiagnostic } = require("./diagnostic");
const { runCrawl } = require("./crawl");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.post("/api/diagnose", async (req, res) => {
  const { query, brand, competitors } = req.body;

  if (!query || !brand) {
    return res.status(400).json({ error: "query and brand are required" });
  }

  // Use SSE to stream progress updates to the client
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    await runDiagnostic({ query, brand, competitors: competitors || [] }, send);
    send("done", { success: true });
  } catch (err) {
    console.error(err);
    send("error", { message: err.message });
  } finally {
    res.end();
  }
});

app.post("/api/crawl", async (req, res) => {
  const { domain } = req.body;
  if (!domain) return res.status(400).json({ error: "domain is required" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    await runCrawl({ domain }, send);
    send("done", { success: true });
  } catch (err) {
    console.error(err);
    send("error", { message: err.message });
  } finally {
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`AEO Diagnostic backend running on port ${PORT}`);
});
