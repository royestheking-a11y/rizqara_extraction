const express = require('express');
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const router = express.Router();

// Submit payment
router.post('/submit', auth, async (req, res) => {
  try {
    const { transactionId, amount, method, planRequested } = req.body;
    
    const transaction = new Transaction({
      userId: req.user._id,
      transactionId,
      amount,
      method,
      planRequested
    });

    await transaction.save();
    res.status(201).send(transaction);
  } catch (e) {
    res.status(400).send({ error: 'Transaction ID already exists or invalid data.' });
  }
});

// Get user transactions
router.get('/history', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id }).sort({ submittedAt: -1 });
    res.send(transactions);
  } catch (e) {
    res.status(500).send(e);
  }
});

module.exports = router;
