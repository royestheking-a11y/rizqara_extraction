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

  // Check limit
  if (user.usage_today >= user.daily_limit) {
    return res.status(403).json({
      error: 'Limit reached',
      message: `You have reached your daily limit of ${user.daily_limit} leads. Upgrade your plan for more!`,
      plan: user.plan,
      usage: user.usage_today,
      limit: user.daily_limit
    });
  }

  next();
};

module.exports = checkLimit;
