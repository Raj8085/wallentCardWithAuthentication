const { ethers } = require("ethers")
const UserPlan = require("../models/UserPlan")

// In-memory nonce storage (in production, use Redis)
const usedNonces = new Set()

// Available plans
const availablePlans = {
  basic: {
    id: "basic",
    name: "Basic",
    price: 0,
    features: ["2 Virtual Cards", "Basic Support", "Standard Limits"],
    maxCards: 2,
  },
  premium: {
    id: "premium",
    name: "Premium",
    price: 9.99,
    features: ["6 Virtual Cards", "Priority Support", "Higher Limits", "Cashback Rewards"],
    maxCards: 6,
  },
  platinum: {
    id: "platinum",
    name: "Platinum",
    price: 19.99,
    features: ["Unlimited Cards", "24/7 Support", "No Limits", "Premium Rewards", "Crypto Integration"],
    maxCards: -1, // Unlimited
  },
}

// Helper function to verify signature
const verifySignature = (message, signature, expectedAddress) => {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature)

    if (recoveredAddress.toLowerCase() !== expectedAddress.toLowerCase()) {
      throw new Error("Signature verification failed")
    }

    return true
  } catch (error) {
    throw new Error("Invalid signature")
  }
}

// Get user's current plan
exports.getUserPlan = async (req, res) => {
  try {
    const { walletAddress } = req.query

    if (!walletAddress) {
      return res.status(400).json({ error: "Wallet address is required" })
    }

    let userPlan = await UserPlan.findOne({
      walletAddress: walletAddress.toLowerCase(),
    })

    // If no plan exists, create a basic plan
    if (!userPlan) {
      const basicPlan = availablePlans.basic
      userPlan = new UserPlan({
        walletAddress: walletAddress.toLowerCase(),
        planId: basicPlan.id,
        planName: basicPlan.name,
        planPrice: basicPlan.price,
        features: basicPlan.features,
      })
      await userPlan.save()
    }

    res.status(200).json({
      success: true,
      plan: userPlan,
      availablePlans: Object.values(availablePlans),
    })
  } catch (error) {
    console.error("Get user plan error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

// Upgrade user plan
exports.upgradePlan = async (req, res) => {
  try {
    const { message, signature, planId, walletAddress, nonce } = req.body

    if (!message || !signature || !planId || !walletAddress || !nonce) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    // Check if plan exists
    const selectedPlan = availablePlans[planId]
    if (!selectedPlan) {
      return res.status(400).json({ error: "Invalid plan selected" })
    }

    // Check if nonce has been used
    if (usedNonces.has(nonce)) {
      return res.status(400).json({ error: "Nonce already used" })
    }

    // Verify the signature
    verifySignature(message, signature, walletAddress)

    // Parse and validate the message
    let parsedMessage
    try {
      parsedMessage = JSON.parse(message)
    } catch (error) {
      return res.status(400).json({ error: "Invalid message format" })
    }

    if (
      parsedMessage.action !== "upgrade_plan" ||
      parsedMessage.planId !== planId ||
      parsedMessage.walletAddress.toLowerCase() !== walletAddress.toLowerCase() ||
      parsedMessage.nonce !== nonce
    ) {
      return res.status(400).json({ error: "Message content mismatch" })
    }

    // Find or create user plan
    let userPlan = await UserPlan.findOne({
      walletAddress: walletAddress.toLowerCase(),
    })

    if (!userPlan) {
      userPlan = new UserPlan({
        walletAddress: walletAddress.toLowerCase(),
      })
    }

    // Update plan details
    userPlan.planId = selectedPlan.id
    userPlan.planName = selectedPlan.name
    userPlan.planPrice = selectedPlan.price
    userPlan.features = selectedPlan.features
    userPlan.isActive = true
    userPlan.subscriptionDate = new Date()
    userPlan.updatedAt = new Date()

    // Set expiry date (1 month from now for paid plans)
    if (selectedPlan.price > 0) {
      const expiryDate = new Date()
      expiryDate.setMonth(expiryDate.getMonth() + 1)
      userPlan.expiryDate = expiryDate
    }

    // Add payment history entry
    if (selectedPlan.price > 0) {
      userPlan.paymentHistory.push({
        amount: selectedPlan.price,
        date: new Date(),
        transactionHash: ethers.keccak256(ethers.toUtf8Bytes(`${walletAddress}-${planId}-${Date.now()}`)),
        status: "completed",
      })
    }

    await userPlan.save()

    // Add nonce to used set
    usedNonces.add(nonce)

    res.status(200).json({
      success: true,
      plan: userPlan,
      message: `Successfully upgraded to ${selectedPlan.name} plan`,
    })
  } catch (error) {
    console.error("Upgrade plan error:", error)
    res.status(500).json({
      error: error.message || "Internal server error",
    })
  }
}

// Get all available plans
exports.getAvailablePlans = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      plans: Object.values(availablePlans),
    })
  } catch (error) {
    console.error("Get available plans error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}
