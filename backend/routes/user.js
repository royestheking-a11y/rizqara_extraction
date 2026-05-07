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
    req.user.usage_today += count;
    req.user.total_usage += count;
    await req.user.save();
    res.send({ usage_today: req.user.usage_today, daily_limit: req.user.daily_limit });
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
