const mongoose = require("mongoose")

const userPlanSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    lowercase: true,
    unique: true,
    index: true,
  },
  planId: {
    type: String,
    enum: ["basic", "premium", "platinum"],
    default: "basic",
  },
  planName: { type: String, required: true },
  planPrice: { type: Number, required: true },
  features: [{ type: String }],
  isActive: { type: Boolean, default: true },
  subscriptionDate: { type: Date, default: Date.now },
  expiryDate: { type: Date },
  autoRenew: { type: Boolean, default: false },
  paymentHistory: [
    {
      amount: Number,
      date: { type: Date, default: Date.now },
      transactionHash: String,
      status: { type: String, enum: ["completed", "failed"], default: "completed" },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model("UserPlan", userPlanSchema)
