const User = require('../models/User');

const checkLimit = async (req, res, next) => {
  const user = req.user;
  const now = new Date();
  
  // Daily reset check
  const lastReset = new Date(user.last_reset_date);
  const isDifferentDay = now.getDate() !== lastReset.getDate() || 
                        now.getMonth() !== lastReset.getMonth() || 
                        now.getFullYear() !== lastReset.getFullYear();

  if (isDifferentDay) {
    user.usage_today = 0;
    user.last_reset_date = now;
    await user.save();
  }

  // ENFORCE LIFETIME LIMIT FOR FREE USERS
  if (user.plan === 'free') {
    if (user.total_usage >= 20) {
      return res.status(403).json({
        error: 'Lifetime limit reached',
        message: 'You have reached the lifetime limit of 20 leads for the FREE plan. Please upgrade to Pro or Business to continue extracting!',
        plan: user.plan,
        usage: user.total_usage,
        limit: 20,
        isLifetime: true
      });
    }
  } else {
    // ENFORCE DAILY LIMIT FOR PAID USERS
    if (user.usage_today >= user.daily_limit) {
      return res.status(403).json({
        error: 'Daily limit reached',
        message: `You have reached your daily limit of ${user.daily_limit} leads for the ${user.plan.toUpperCase()} plan. Wait until tomorrow or upgrade!`,
        plan: user.plan,
        usage: user.usage_today,
        limit: user.daily_limit
      });
    }
  }

  next();
};

module.exports = checkLimit;
