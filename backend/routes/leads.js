const express = require('express');
const auth = require('../middleware/auth');
const Lead = require('../models/Lead');
const User = require('../models/User');
const router = express.Router();

// Save a new lead — with ATOMIC usage increment (no race condition)
router.post('/', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const userPlan = req.user.plan;
    const dailyLimit = req.user.daily_limit;

    // Handle daily reset atomically
    const now = new Date();
    const lastReset = new Date(req.user.last_reset_date);
    const isDifferentDay = now.getDate() !== lastReset.getDate() || 
                          now.getMonth() !== lastReset.getMonth() || 
                          now.getFullYear() !== lastReset.getFullYear();

    if (isDifferentDay) {
      await User.findByIdAndUpdate(userId, { 
        $set: { usage_today: 0, last_reset_date: now } 
      });
    }

    // ATOMIC check-and-increment using findOneAndUpdate
    // This is a SINGLE MongoDB operation — no race condition possible
    let query;
    if (userPlan === 'free') {
      // Free users: check lifetime total < 20
      query = { _id: userId, total_usage: { $lt: 20 } };
    } else {
      // Paid users: check daily usage < their limit
      query = { _id: userId, usage_today: { $lt: dailyLimit } };
    }

    const updatedUser = await User.findOneAndUpdate(
      query,
      { $inc: { usage_today: 1, total_usage: 1 } },
      { new: true } // Return the document AFTER the update
    );

    // If no document matched, the user has exceeded their limit
    if (!updatedUser) {
      const errorMsg = userPlan === 'free' 
        ? 'You have reached the lifetime limit of 20 leads for the FREE plan. Upgrade to continue!'
        : `You have reached your daily limit of ${dailyLimit} leads. Wait until tomorrow or upgrade!`;
      
      return res.status(403).json({ 
        error: 'Limit reached', 
        message: errorMsg,
        plan: userPlan,
        limit: userPlan === 'free' ? 20 : dailyLimit
      });
    }

    // Save the lead data
    const lead = new Lead({
      ...req.body,
      userId: userId
    });
    await lead.save();

    // Return the REAL, up-to-date counts from the database
    res.status(201).send({
      lead,
      usage: {
        today: updatedUser.usage_today,
        total: updatedUser.total_usage,
        limit: updatedUser.daily_limit,
        plan: updatedUser.plan
      }
    });
  } catch (e) {
    console.error('[Leads] Save error:', e.message);
    res.status(400).send({ error: e.message });
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
