const mongoose = require("mongoose")

const transactionSchema = new mongoose.Schema({
  cardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Card",
    required: true,
    index: true,
  },
  walletAddress: {
    type: String,
    required: true,
    lowercase: true,
    index: true,
  },
  merchant: { type: String, required: true },
  amount: { type: Number, required: true },
  cashbackAmount: { type: Number, default: 0 },
  type: {
    type: String,
    enum: ["payment", "refund", "cashback", "fee"],
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed", "cancelled"],
    default: "completed",
  },
  transactionHash: { type: String, required: true, unique: true },
  signature: { type: String, required: true },
  nonce: { type: String, required: true, unique: true },
  timestamp: { type: Date, default: Date.now },
  metadata: {
    userAgent: String,
    ip: String,
    deviceInfo: String,
  },
  createdAt: { type: Date, default: Date.now },
})

// Indexes for efficient queries
transactionSchema.index({ walletAddress: 1, timestamp: -1 })
transactionSchema.index({ cardId: 1, timestamp: -1 })
transactionSchema.index({ nonce: 1 }, { unique: true })

module.exports = mongoose.model("Transaction", transactionSchema)
