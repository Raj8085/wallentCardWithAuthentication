const { ethers } = require("ethers")
const Card = require("../models/Card")
const Transaction = require("../models/Transaction")

// In-memory nonce storage (in production, use Redis)
const usedNonces = new Set()

// Helper function to validate nonce and timestamp
const validateNonceAndTimestamp = (nonce, timestamp) => {
  if (usedNonces.has(nonce)) {
    throw new Error("Nonce already used")
  }

  const currentTime = Date.now()
  const signatureAge = currentTime - timestamp
  const maxAge = 5 * 60 * 1000 // 5 minutes

  if (signatureAge > maxAge) {
    throw new Error("Signature expired")
  }
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

// Get all cards for a wallet
exports.getCards = async (req, res) => {
  try {
    const { walletAddress } = req.query

    if (!walletAddress) {
      return res.status(400).json({ error: "Wallet address is required" })
    }

    const cards = await Card.find({
      walletAddress: walletAddress.toLowerCase(),
    }).sort({ createdAt: -1 })

    res.status(200).json(cards)
  } catch (error) {
    console.error("Get cards error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

// Create a new card
exports.createCard = async (req, res) => {
  try {
    const {
      walletAddress,
      name,
      type,
      balance,
      spendingLimit,
      color,
      icon,
      cardNumber,
      cvv,
      expiry,
      cashback,
      plan,
      features,
    } = req.body

    if (!walletAddress || !name || !type) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    const newCard = new Card({
      walletAddress: walletAddress.toLowerCase(),
      name,
      type,
      balance: balance || 0,
      spendingLimit: spendingLimit || 1000,
      color: color || "from-blue-500 to-purple-600",
      icon: icon || "💳",
      cardNumber: cardNumber || `**** **** **** ${Math.floor(1000 + Math.random() * 9000)}`,
      cvv: cvv || "***",
      expiry: expiry || "12/27",
      cashback: cashback || 1.5,
      plan: plan || "Basic",
      features: features || ["Basic features"],
      transactions: [],
    })

    await newCard.save()

    res.status(201).json({
      success: true,
      card: newCard,
      message: "Card created successfully",
    })
  } catch (error) {
    console.error("Create card error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

// Process payment
exports.processPayment = async (req, res) => {
  try {
    const { message, signature, cardId, amount, merchant, walletAddress, nonce, timestamp } = req.body

    // Validate required fields
    if (!message || !signature || !cardId || !amount || !walletAddress || !nonce) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    // Validate nonce and timestamp
    validateNonceAndTimestamp(nonce, timestamp)

    // Verify the signature
    verifySignature(message, signature, walletAddress)

    // Parse and validate the message
    let parsedMessage
    try {
      parsedMessage = JSON.parse(message)
    } catch (error) {
      return res.status(400).json({ error: "Invalid message format" })
    }

    // Validate message content
    if (
      parsedMessage.action !== "payment" ||
      parsedMessage.cardId !== cardId ||
      parsedMessage.amount !== amount ||
      parsedMessage.walletAddress.toLowerCase() !== walletAddress.toLowerCase() ||
      parsedMessage.nonce !== nonce
    ) {
      return res.status(400).json({ error: "Message content mismatch" })
    }

    // Find and verify card
    const card = await Card.findOne({
      _id: cardId,
      walletAddress: walletAddress.toLowerCase(),
      isActive: true,
      isFrozen: false,
    })

    if (!card) {
      return res.status(404).json({ error: "Card not found or not accessible" })
    }

    // Check balance and limits
    if (card.balance < amount) {
      return res.status(400).json({ error: "Insufficient card balance" })
    }

    if (card.dailySpent + amount > card.spendingLimit) {
      return res.status(400).json({ error: "Daily spending limit exceeded" })
    }

    // Generate transaction hash
    const transactionHash = ethers.keccak256(ethers.toUtf8Bytes(`${cardId}-${Date.now()}-${walletAddress}-${nonce}`))

    // Calculate cashback
    const cashbackAmount = (amount * card.cashback) / 100

    // Create transaction record
    const transaction = new Transaction({
      cardId: cardId,
      walletAddress: walletAddress.toLowerCase(),
      merchant: merchant || "Quick Payment",
      amount: amount,
      cashbackAmount: cashbackAmount,
      type: "payment",
      status: "completed",
      transactionHash: transactionHash,
      signature: signature,
      nonce: nonce,
      timestamp: new Date(),
      metadata: {
        userAgent: req.headers["user-agent"],
        ip: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
      },
    })

    await transaction.save()

    // Update card
    card.balance -= amount
    card.dailySpent += amount
    card.monthlyRewards += cashbackAmount
    card.lastTransaction = new Date().toISOString()

    // Add transaction to card's transaction array
    card.transactions.unshift({
      id: transaction._id.toString(),
      merchant: merchant || "Quick Payment",
      amount: -amount,
      type: "purchase",
      time: "now",
      category: "payment",
      status: "completed",
      transactionHash: transactionHash,
      signature: signature,
      nonce: nonce,
    })

    await card.save()

    // Add nonce to used set
    usedNonces.add(nonce)

    res.status(200).json({
      success: true,
      transactionId: transaction._id.toString(),
      transactionHash: transactionHash,
      amount: amount,
      cashbackAmount: cashbackAmount,
      newBalance: card.balance,
      message: "Payment processed successfully",
    })
  } catch (error) {
    console.error("Payment processing error:", error)
    res.status(500).json({
      error: error.message || "Internal server error",
    })
  }
}

// Toggle card status
exports.toggleCardStatus = async (req, res) => {
  try {
    const { message, signature, cardId, walletAddress, nonce } = req.body

    if (!message || !signature || !cardId || !walletAddress || !nonce) {
      return res.status(400).json({ error: "Missing required fields" })
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
      parsedMessage.action !== "toggle_card_status" ||
      parsedMessage.cardId !== cardId ||
      parsedMessage.walletAddress.toLowerCase() !== walletAddress.toLowerCase() ||
      parsedMessage.nonce !== nonce
    ) {
      return res.status(400).json({ error: "Message content mismatch" })
    }

    // Find and update the card
    const card = await Card.findOne({
      _id: cardId,
      walletAddress: walletAddress.toLowerCase(),
    })

    if (!card) {
      return res.status(404).json({ error: "Card not found" })
    }

    card.isActive = !card.isActive
    card.lastUpdated = new Date()
    await card.save()

    // Add nonce to used set
    usedNonces.add(nonce)

    res.status(200).json({
      success: true,
      cardId: cardId,
      newStatus: card.isActive,
      message: `Card ${card.isActive ? "activated" : "deactivated"} successfully`,
    })
  } catch (error) {
    console.error("Toggle card status error:", error)
    res.status(500).json({
      error: error.message || "Internal server error",
    })
  }
}

// Toggle card freeze
exports.toggleCardFreeze = async (req, res) => {
  try {
    const { message, signature, cardId, walletAddress, nonce } = req.body

    if (!message || !signature || !cardId || !walletAddress || !nonce) {
      return res.status(400).json({ error: "Missing required fields" })
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
      parsedMessage.action !== "toggle_card_freeze" ||
      parsedMessage.cardId !== cardId ||
      parsedMessage.walletAddress.toLowerCase() !== walletAddress.toLowerCase() ||
      parsedMessage.nonce !== nonce
    ) {
      return res.status(400).json({ error: "Message content mismatch" })
    }

    // Find and update the card
    const card = await Card.findOne({
      _id: cardId,
      walletAddress: walletAddress.toLowerCase(),
    })

    if (!card) {
      return res.status(404).json({ error: "Card not found" })
    }

    card.isFrozen = !card.isFrozen
    card.lastUpdated = new Date()
    await card.save()

    // Add nonce to used set
    usedNonces.add(nonce)

    res.status(200).json({
      success: true,
      cardId: cardId,
      newFreezeStatus: card.isFrozen,
      message: `Card ${card.isFrozen ? "frozen" : "unfrozen"} successfully`,
    })
  } catch (error) {
    console.error("Toggle card freeze error:", error)
    res.status(500).json({
      error: error.message || "Internal server error",
    })
  }
}

// Update spending limit
exports.updateSpendingLimit = async (req, res) => {
  try {
    const { message, signature, cardId, newLimit, walletAddress, nonce } = req.body

    if (!message || !signature || !cardId || newLimit === undefined || !walletAddress || !nonce) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    if (newLimit < 0) {
      return res.status(400).json({ error: "Spending limit cannot be negative" })
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
      parsedMessage.action !== "update_spending_limit" ||
      parsedMessage.cardId !== cardId ||
      parsedMessage.newLimit !== newLimit ||
      parsedMessage.walletAddress.toLowerCase() !== walletAddress.toLowerCase() ||
      parsedMessage.nonce !== nonce
    ) {
      return res.status(400).json({ error: "Message content mismatch" })
    }

    // Find and update the card
    const card = await Card.findOne({
      _id: cardId,
      walletAddress: walletAddress.toLowerCase(),
    })

    if (!card) {
      return res.status(404).json({ error: "Card not found" })
    }

    card.spendingLimit = newLimit
    card.lastUpdated = new Date()
    await card.save()

    // Add nonce to used set
    usedNonces.add(nonce)

    res.status(200).json({
      success: true,
      cardId: cardId,
      newSpendingLimit: newLimit,
      message: "Spending limit updated successfully",
    })
  } catch (error) {
    console.error("Update spending limit error:", error)
    res.status(500).json({
      error: error.message || "Internal server error",
    })
  }
}

// Get transaction history
exports.getTransactionHistory = async (req, res) => {
  try {
    const { walletAddress, cardId, limit = 50, offset = 0 } = req.query

    if (!walletAddress) {
      return res.status(400).json({ error: "Wallet address is required" })
    }

    const query = { walletAddress: walletAddress.toLowerCase() }
    if (cardId) {
      query.cardId = cardId
    }

    const transactions = await Transaction.find(query)
      .sort({ timestamp: -1 })
      .limit(Number.parseInt(limit))
      .skip(Number.parseInt(offset))
      .populate("cardId", "name type")

    const total = await Transaction.countDocuments(query)

    res.status(200).json({
      success: true,
      transactions,
      pagination: {
        total,
        limit: Number.parseInt(limit),
        offset: Number.parseInt(offset),
        hasMore: total > Number.parseInt(offset) + Number.parseInt(limit),
      },
    })
  } catch (error) {
    console.error("Get transaction history error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}
