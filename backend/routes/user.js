const express = require('express');
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const router = express.Router();

// Get profile
router.get('/profile', auth, async (req, res) => {
  res.send(req.user);
});

// Update usage (increment by 1 or more)
router.post('/usage', auth, async (req, res) => {
  try {
    const { count = 1 } = req.body;
    const user = req.user;

    // Check if incrementing would exceed limit
    if (user.plan === 'free') {
      if (user.total_usage + count > 20) {
        return res.status(403).json({ error: 'Limit exceeded', message: 'Free trial limit (20) reached.' });
      }
    } else {
      if (user.usage_today + count > user.daily_limit) {
        return res.status(403).json({ error: 'Limit exceeded', message: `Daily limit (${user.daily_limit}) reached.` });
      }
    }

    user.usage_today += count;
    user.total_usage += count;
    await user.save();
    res.send({ 
      usage_today: user.usage_today, 
      total_usage: user.total_usage,
      daily_limit: user.daily_limit,
      plan: user.plan
    });
  } catch (e) {
    res.status(500).send(e);
  }
});

// Check limits
router.get('/check-limit', auth, async (req, res) => {
    // Logic is handled by middleware but we can expose a check here too
    res.send({
        can_extract: req.user.usage_today < req.user.daily_limit,
        usage: req.user.usage_today,
        limit: req.user.daily_limit
    });
});

module.exports = router;
