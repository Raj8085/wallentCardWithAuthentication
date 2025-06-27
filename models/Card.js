const mongoose = require("mongoose")

const transactionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  merchant: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ["purchase", "reward", "refund", "subscription", "dividend"], required: true },
  time: { type: String, required: true },
  category: { type: String, required: true },
  status: { type: String, enum: ["pending", "completed", "failed"], default: "completed" },
  transactionHash: { type: String },
  signature: { type: String },
  nonce: { type: String },
})

const cardSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    lowercase: true,
    index: true,
  },
  name: { type: String, required: true },
  type: { type: String, required: true },
  balance: { type: Number, required: true, default: 0 },
  isActive: { type: Boolean, default: true },
  isFrozen: { type: Boolean, default: false },
  spendingLimit: { type: Number, required: true, default: 1000 },
  dailySpent: { type: Number, default: 0 },
  color: { type: String, required: true },
  icon: { type: String, required: true },
  lastTransaction: { type: String },
  cardNumber: { type: String, required: true },
  cvv: { type: String, required: true },
  expiry: { type: String, required: true },
  cashback: { type: Number, default: 1.5 },
  monthlyRewards: { type: Number, default: 0 },
  plan: { type: String, enum: ["Basic", "Premium", "Platinum"], default: "Basic" },
  features: [{ type: String }],
  transactions: [transactionSchema],
  createdAt: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now },
})

// Index for efficient queries
cardSchema.index({ walletAddress: 1, isActive: 1 })

module.exports = mongoose.model("Card", cardSchema)
