const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Apply auth and admin middleware to all routes here
router.use(auth, admin);

// ── User Management ───────────────────────────────────

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user limit/plan
router.patch('/users/:id', async (req, res) => {
  try {
    const { plan, daily_limit } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { plan, daily_limit },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Transaction Management ──────────────────────────

// Get all transactions
router.get('/transactions', async (req, res) => {
  try {
    const txs = await Transaction.find().populate('userId', 'name email').sort({ submittedAt: -1 });
    res.json(txs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve/Reject transaction
router.post('/transactions/:id/status', async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });

    tx.status = status;
    tx.updatedAt = Date.now();
    await tx.save();

    // If approved, update user plan and limit
    if (status === 'approved') {
      const limits = { pro: 100, business: 300 };
      await User.findByIdAndUpdate(tx.userId, {
        plan: tx.planRequested,
        daily_limit: limits[tx.planRequested] || 20
      });
    }

    res.json(tx);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Analytics ────────────────────────────────────────

router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalLeads = await User.aggregate([{ $group: { _id: null, total: { $sum: "$total_usage" } } }]);
    const pendingPayments = await Transaction.countDocuments({ status: 'pending' });
    const totalRevenue = await Transaction.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    res.json({
      users: totalUsers,
      leads: totalLeads[0]?.total || 0,
      pending: pendingPayments,
      revenue: totalRevenue[0]?.total || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
