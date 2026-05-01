// ====================================================
// RIZQARA EXTRACTION — Backend Server
// ====================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { enrichWebsite } = require('./services/enricher');
const { generateAIInsight } = require('./services/ai');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ─────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '2mb' }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Too many requests, slow down.' }
});
app.use('/enrich', limiter);

// ── Health Check ───────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok', name: 'Rizqara Extraction API', version: '1.0.0' });
});

// ── Enrich Endpoint ────────────────────────────────────
// POST /enrich { url, settings }
app.post('/enrich', async (req, res) => {
  const { url, settings = {} } = req.body;
  if (!url) return res.status(400).json({ error: 'url is required' });

  try {
    const result = await enrichWebsite(url, settings);

    // AI Insight (optional, if key provided)
    if (settings.ai && settings.openaiKey && result) {
      result.aiInsight = await generateAIInsight(result, settings.openaiKey);
    }

    res.json(result);
  } catch (err) {
    console.error('Enrich error:', err.message);
    res.status(500).json({ error: 'Enrichment failed', detail: err.message });
  }
});

// ── Bulk Enrich ────────────────────────────────────────
// POST /enrich/bulk { leads: [{website},...], settings }
app.post('/enrich/bulk', async (req, res) => {
  const { leads = [], settings = {} } = req.body;
  if (!Array.isArray(leads)) return res.status(400).json({ error: 'leads must be array' });

  const results = [];
  for (const lead of leads.slice(0, 50)) { // cap at 50
    if (!lead.website) { results.push(lead); continue; }
    try {
      const enriched = await enrichWebsite(lead.website, settings);
      results.push({ ...lead, ...enriched });
      await sleep(800); // be polite
    } catch {
      results.push(lead);
    }
  }
  res.json({ results, count: results.length });
});

// ── Start ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Rizqara Extraction API running on http://localhost:${PORT}\n`);
});

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
