const express = require('express');
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const router = express.Router();

// Get profile
router.get('/profile', auth, async (req, res) => {
  res.send(req.user);
});

// Check limits
router.get('/check-limit', auth, async (req, res) => {
    res.send({
        can_extract: req.user.usage_today < req.user.daily_limit,
        usage: req.user.usage_today,
        limit: req.user.daily_limit,
        plan: req.user.plan
    });
});

module.exports = router;
