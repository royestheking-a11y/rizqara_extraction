const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  console.log('[Auth] Registration request received:', req.body.email);
  try {
    const { name, email, password } = req.body;
    
    console.log('[Auth] Checking for existing user...');
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('[Auth] User already exists');
      return res.status(400).json({ error: 'Email already exists' });
    }

    console.log('[Auth] Creating new user...');
    const user = new User({ name, email, password });
    
    console.log('[Auth] Saving user to database...');
    await user.save();
    console.log('[Auth] User saved successfully');

    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET || 'rizqara_secret_123');
    console.log('[Auth] Token generated');
    
    res.status(201).send({ user, token });
  } catch (e) {
    console.error('[Auth] Registration error:', e.message);
    res.status(400).send({ error: e.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`[Auth] Login attempt: ${email}`);
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      console.log(`[Auth] User not found: ${email}`);
      return res.status(400).json({ error: 'Invalid login credentials' });
    }

    const isMatch = await user.comparePassword(password);
    console.log(`[Auth] Password match for ${email}: ${isMatch}`);

    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid login credentials' });
    }

    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET || 'rizqara_secret_123');
    res.send({ user, token });
  } catch (e) {
    res.status(500).send(e);
  }
});

module.exports = router;
