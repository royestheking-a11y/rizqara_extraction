const express = require('express');
const auth = require('../middleware/auth');
const Lead = require('../models/Lead');
const User = require('../models/User');
const router = express.Router();

// Save a new lead — with ATOMIC usage increment & ROBUST daily reset
router.post('/', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const userPlan = req.user.plan;
    const dailyLimit = req.user.daily_limit;

    // 1. ATOMIC DAILY RESET
    // We only reset if the last_reset_date is BEFORE the start of today (local server time)
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // This update only executes for the FIRST request of the day
    await User.updateOne(
      { _id: userId, last_reset_date: { $lt: startOfToday } },
      { $set: { usage_today: 0, last_reset_date: now } }
    );

    // 2. ATOMIC CHECK-AND-INCREMENT
    // This prevents race conditions where simultaneous requests skip the limit check
    let query;
    if (userPlan === 'free') {
      // Free users: limited to 20 leads LIFETIME
      query = { _id: userId, total_usage: { $lt: 20 } };
    } else {
      // Paid users: limited to daily_limit leads TODAY
      // Note: We don't check total_usage here as paid plans are usually daily-limited
      query = { _id: userId, usage_today: { $lt: dailyLimit } };
    }

    const updatedUser = await User.findOneAndUpdate(
      query,
      { $inc: { usage_today: 1, total_usage: 1 } },
      { new: true } // Return the fresh document
    );

    // 3. HANDLE LIMIT EXCEEDED
    if (!updatedUser) {
      // Re-fetch user to get current counts for the error message
      const currentUser = await User.findById(userId);
      const isFree = currentUser.plan === 'free';
      const errorMsg = isFree 
        ? `Lifetime limit reached (${currentUser.total_usage}/20). Please upgrade for more extraction!`
        : `Daily limit reached (${currentUser.usage_today}/${currentUser.daily_limit}). Upgrade or wait until tomorrow!`;
      
      return res.status(403).json({ 
        error: 'Limit reached', 
        message: errorMsg,
        plan: currentUser.plan,
        usage: isFree ? currentUser.total_usage : currentUser.usage_today,
        limit: isFree ? 20 : currentUser.daily_limit,
        total_usage: currentUser.total_usage
      });
    }

    // 4. SAVE THE LEAD
    const lead = new Lead({
      ...req.body,
      userId: userId
    });
    await lead.save();

    // 5. SUCCESS RESPONSE with REAL DB COUNTS
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
    console.error('[Leads API Error]:', e.message);
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
