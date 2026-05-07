const express = require('express');
const auth = require('../middleware/auth');
const checkLimit = require('../middleware/limit');
const Lead = require('../models/Lead');
const router = express.Router();

// Save a new lead
router.post('/', [auth, checkLimit], async (req, res) => {
  try {
    const lead = new Lead({
      ...req.body,
      userId: req.user._id
    });
    
    await lead.save();

    // Increment user usage
    const user = req.user;
    user.usage_today += 1;
    user.total_usage += 1;
    await user.save();

    res.status(201).send({
        lead,
        usage: {
            today: user.usage_today,
            total: user.total_usage,
            limit: user.daily_limit
        }
    });
  } catch (e) {
    res.status(400).send(e);
  }
});

// Get user's leads
router.get('/', auth, async (req, res) => {
  try {
    const leads = await Lead.find({ userId: req.user._id }).sort({ extractedAt: -1 });
    res.send(leads);
  } catch (e) {
    res.status(500).send(e);
  }
});

module.exports = router;
