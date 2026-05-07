const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  plan: { 
    type: String, 
    enum: ['free', 'pro', 'business'], 
    default: 'free' 
  },
  daily_limit: { type: Number, default: 20 }, // 20 for free trial (LIFETIME), 100 for Pro (DAILY), 300 for Business (DAILY)
  usage_today: { type: Number, default: 0 },
  total_usage: { type: Number, default: 0 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  last_reset_date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Method to compare password
userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
