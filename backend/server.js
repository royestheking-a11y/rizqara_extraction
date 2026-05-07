// ====================================================
// RIZQARA EXTRACTION — Backend Server
// ====================================================

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const User = require('./models/User'); // Ensure path is correct
const { enrichWebsite } = require('./services/enricher');
const { generateAIInsight } = require('./services/ai');

// Midnight reset for daily usage
cron.schedule('0 0 * * *', async () => {
  try {
    await User.updateMany({}, { usage_today: 0, last_reset_date: new Date() });
    console.log('[Rizqara] Midnight usage reset successful');
  } catch (err) {
    console.error('[Rizqara] Reset error:', err);
  }
});

// Routes & Middleware
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const paymentRoutes = require('./routes/payment');
const adminRoutes = require('./routes/admin');
const auth = require('./middleware/auth');
const checkLimit = require('./middleware/limit');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rizqara';

// ── Database Connection ───────────────────────────────
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ── Middleware ─────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '2mb' }));

app.use((req, res, next) => {
  console.log(`[Server] ${req.method} ${req.url}`);
  next();
});

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100, // Slightly increased for bulk ops
  message: { error: 'Too many requests, slow down.' }
});

// ── Public Routes ──────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok', name: 'Rizqara Extraction API', version: '1.1.0' });
});

app.use('/api/auth', authRoutes);

// ── Protected Routes ───────────────────────────────────
app.use('/api/user', userRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);

// ── Enrich Endpoint (Protected + Limited) ──────────────
app.post('/enrich', [auth, checkLimit, limiter], async (req, res) => {
  const { url, settings = {} } = req.body;
  if (!url) return res.status(400).json({ error: 'url is required' });

  try {
    const result = await enrichWebsite(url, settings);

    // AI Insight (optional, if key provided)
    if (settings.ai && settings.openaiKey && result) {
      result.aiInsight = await generateAIInsight(result, settings.openaiKey);
    }

    // Increment usage
    req.user.usage_today += 1;
    req.user.total_usage += 1;
    await req.user.save();

    res.json(result);
  } catch (err) {
    console.error('Enrich error:', err.message);
    res.status(500).json({ error: 'Enrichment failed', detail: err.message });
  }
});

// ── Bulk Enrich (Protected + Limited) ──────────────────
app.post('/enrich/bulk', [auth, limiter], async (req, res) => {
  const { leads = [], settings = {} } = req.body;
  if (!Array.isArray(leads)) return res.status(400).json({ error: 'leads must be array' });

  // Pre-check limit for the whole batch
  if (req.user.usage_today + leads.length > req.user.daily_limit) {
      return res.status(403).json({ 
          error: 'Limit exceeded', 
          message: `Batch size (${leads.length}) exceeds your remaining daily limit (${req.user.daily_limit - req.user.usage_today}).`
      });
  }

  const results = [];
  for (const lead of leads.slice(0, 50)) { // cap at 50 per batch
    if (!lead.website) { results.push(lead); continue; }
    try {
      const enriched = await enrichWebsite(lead.website, settings);
      results.push({ ...lead, ...enriched });
      
      // Increment usage
      req.user.usage_today += 1;
      req.user.total_usage += 1;
      
      await sleep(800); // be polite
    } catch {
      results.push(lead);
    }
  }
  
  await req.user.save();
  res.json({ results, count: results.length });
});

// ── Admin: Manual Upgrade (Temporary) ──────────────────
// In a real app, this would be restricted to admin users
app.post('/api/admin/approve-transaction', async (req, res) => {
    const { transactionId, adminSecret } = req.body;
    if (adminSecret !== 'rizqara_admin_2024') return res.status(401).send('Unauthorized');

    try {
        const Transaction = require('./models/Transaction');
        const User = require('./models/User');
        
        const tx = await Transaction.findOne({ transactionId, status: 'pending' });
        if (!tx) return res.status(404).send('Pending transaction not found');

        const user = await User.findById(tx.userId);
        if (!user) return res.status(404).send('User not found');

        tx.status = 'approved';
        tx.updatedAt = new Date();
        await tx.save();

        user.plan = tx.planRequested;
        user.daily_limit = tx.planRequested === 'premium' ? 300 : 100;
        await user.save();

        res.send({ message: 'Plan upgraded successfully', user });
    } catch (e) {
        res.status(500).send(e.message);
    }
});

// ── Start ──────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`\n🚀 Rizqara Extraction API running on http://localhost:${PORT}\n`);
  await seedAdmin();
});

async function seedAdmin() {
  try {
    const adminEmail = 'admin@rizqara.com';
    const adminPassword = 'rizqara 878';
    
    let admin = await User.findOne({ email: adminEmail });
    
    if (admin) {
      // Update existing account to be admin with the correct password
      admin.password = adminPassword;
      admin.role = 'admin';
      admin.plan = 'premium';
      admin.daily_limit = 999999;
      await admin.save();
      console.log('👑 Admin account updated: admin@rizqara.com');
    } else {
      // Create new admin account
      admin = new User({
        name: 'Super Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        plan: 'premium',
        daily_limit: 999999
      });
      await admin.save();
      console.log('👑 Admin account created: admin@rizqara.com / rizqara 878');
    }
  } catch (err) {
    console.error('Admin seeding error:', err);
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
