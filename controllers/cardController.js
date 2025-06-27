// // const { ethers } = require("ethers")
// // const Card = require("../models/Card")
// // const Transaction = require("../models/Transaction")

// // // In-memory nonce storage (in production, use Redis)
// // const usedNonces = new Set()

// // // Helper function to validate nonce and timestamp
// // const validateNonceAndTimestamp = (nonce, timestamp) => {
// //   if (usedNonces.has(nonce)) {
// //     throw new Error("Nonce already used")
// //   }

// //   const currentTime = Date.now()
// //   const signatureAge = currentTime - timestamp
// //   const maxAge = 5 * 60 * 1000 // 5 minutes

// //   if (signatureAge > maxAge) {
// //     throw new Error("Signature expired")
// //   }
// // }

// // // Helper function to verify signature
// // const verifySignature = (message, signature, expectedAddress) => {
// //   try {
// //     const recoveredAddress = ethers.verifyMessage(message, signature)

// //     if (recoveredAddress.toLowerCase() !== expectedAddress.toLowerCase()) {
// //       throw new Error("Signature verification failed")
// //     }

// //     return true
// //   } catch (error) {
// //     throw new Error("Invalid signature")
// //   }
// // }

// // // Get all cards for a wallet
// // exports.getCards = async (req, res) => {
// //   try {
// //     const { walletAddress } = req.query

// //     if (!walletAddress) {
// //       return res.status(400).json({ error: "Wallet address is required" })
// //     }

// //     const cards = await Card.find({
// //       walletAddress: walletAddress.toLowerCase(),
// //     }).sort({ createdAt: -1 })

// //     res.status(200).json(cards)
// //   } catch (error) {
// //     console.error("Get cards error:", error)
// //     res.status(500).json({ error: "Internal server error" })
// //   }
// // }

// // // Create a new card
// // exports.createCard = async (req, res) => {
// //   try {
// //     const {
// //       walletAddress,
// //       name,
// //       type,
// //       balance,
// //       spendingLimit,
// //       color,
// //       icon,
// //       cardNumber,
// //       cvv,
// //       expiry,
// //       cashback,
// //       plan,
// //       features,
// //     } = req.body

// //     if (!walletAddress || !name || !type) {
// //       return res.status(400).json({ error: "Missing required fields" })
// //     }

// //     const newCard = new Card({
// //       walletAddress: walletAddress.toLowerCase(),
// //       name,
// //       type,
// //       balance: balance || 0,
// //       spendingLimit: spendingLimit || 1000,
// //       color: color || "from-blue-500 to-purple-600",
// //       icon: icon || "💳",
// //       cardNumber: cardNumber || `**** **** **** ${Math.floor(1000 + Math.random() * 9000)}`,
// //       cvv: cvv || "***",
// //       expiry: expiry || "12/27",
// //       cashback: cashback || 1.5,
// //       plan: plan || "Basic",
// //       features: features || ["Basic features"],
// //       transactions: [],
// //     })

// //     await newCard.save()

// //     res.status(201).json({
// //       success: true,
// //       card: newCard,
// //       message: "Card created successfully",
// //     })
// //   } catch (error) {
// //     console.error("Create card error:", error)
// //     res.status(500).json({ error: "Internal server error" })
// //   }
// // }

// // // Process payment
// // exports.processPayment = async (req, res) => {
// //   try {
// //     const { message, signature, cardId, amount, merchant, walletAddress, nonce, timestamp } = req.body

// //     // Validate required fields
// //     if (!message || !signature || !cardId || !amount || !walletAddress || !nonce) {
// //       return res.status(400).json({ error: "Missing required fields" })
// //     }

// //     // Validate nonce and timestamp
// //     validateNonceAndTimestamp(nonce, timestamp)

// //     // Verify the signature
// //     verifySignature(message, signature, walletAddress)

// //     // Parse and validate the message
// //     let parsedMessage
// //     try {
// //       parsedMessage = JSON.parse(message)
// //     } catch (error) {
// //       return res.status(400).json({ error: "Invalid message format" })
// //     }

// //     // Validate message content
// //     if (
// //       parsedMessage.action !== "payment" ||
// //       parsedMessage.cardId !== cardId ||
// //       parsedMessage.amount !== amount ||
// //       parsedMessage.walletAddress.toLowerCase() !== walletAddress.toLowerCase() ||
// //       parsedMessage.nonce !== nonce
// //     ) {
// //       return res.status(400).json({ error: "Message content mismatch" })
// //     }

// //     // Find and verify card
// //     const card = await Card.findOne({
// //       _id: cardId,
// //       walletAddress: walletAddress.toLowerCase(),
// //       isActive: true,
// //       isFrozen: false,
// //     })

// //     if (!card) {
// //       return res.status(404).json({ error: "Card not found or not accessible" })
// //     }

// //     // Check balance and limits
// //     if (card.balance < amount) {
// //       return res.status(400).json({ error: "Insufficient card balance" })
// //     }

// //     if (card.dailySpent + amount > card.spendingLimit) {
// //       return res.status(400).json({ error: "Daily spending limit exceeded" })
// //     }

// //     // Generate transaction hash
// //     const transactionHash = ethers.keccak256(ethers.toUtf8Bytes(`${cardId}-${Date.now()}-${walletAddress}-${nonce}`))

// //     // Calculate cashback
// //     const cashbackAmount = (amount * card.cashback) / 100

// //     // Create transaction record
// //     const transaction = new Transaction({
// //       cardId: cardId,
// //       walletAddress: walletAddress.toLowerCase(),
// //       merchant: merchant || "Quick Payment",
// //       amount: amount,
// //       cashbackAmount: cashbackAmount,
// //       type: "payment",
// //       status: "completed",
// //       transactionHash: transactionHash,
// //       signature: signature,
// //       nonce: nonce,
// //       timestamp: new Date(),
// //       metadata: {
// //         userAgent: req.headers["user-agent"],
// //         ip: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
// //       },
// //     })

// //     await transaction.save()

// //     // Update card
// //     card.balance -= amount
// //     card.dailySpent += amount
// //     card.monthlyRewards += cashbackAmount
// //     card.lastTransaction = new Date().toISOString()

// //     // Add transaction to card's transaction array
// //     card.transactions.unshift({
// //       id: transaction._id.toString(),
// //       merchant: merchant || "Quick Payment",
// //       amount: -amount,
// //       type: "purchase",
// //       time: "now",
// //       category: "payment",
// //       status: "completed",
// //       transactionHash: transactionHash,
// //       signature: signature,
// //       nonce: nonce,
// //     })

// //     await card.save()

// //     // Add nonce to used set
// //     usedNonces.add(nonce)

// //     res.status(200).json({
// //       success: true,
// //       transactionId: transaction._id.toString(),
// //       transactionHash: transactionHash,
// //       amount: amount,
// //       cashbackAmount: cashbackAmount,
// //       newBalance: card.balance,
// //       message: "Payment processed successfully",
// //     })
// //   } catch (error) {
// //     console.error("Payment processing error:", error)
// //     res.status(500).json({
// //       error: error.message || "Internal server error",
// //     })
// //   }
// // }

// // // Toggle card status
// // exports.toggleCardStatus = async (req, res) => {
// //   try {
// //     const { message, signature, cardId, walletAddress, nonce } = req.body

// //     if (!message || !signature || !cardId || !walletAddress || !nonce) {
// //       return res.status(400).json({ error: "Missing required fields" })
// //     }

// //     // Check if nonce has been used
// //     if (usedNonces.has(nonce)) {
// //       return res.status(400).json({ error: "Nonce already used" })
// //     }

// //     // Verify the signature
// //     verifySignature(message, signature, walletAddress)

// //     // Parse and validate the message
// //     let parsedMessage
// //     try {
// //       parsedMessage = JSON.parse(message)
// //     } catch (error) {
// //       return res.status(400).json({ error: "Invalid message format" })
// //     }

// //     if (
// //       parsedMessage.action !== "toggle_card_status" ||
// //       parsedMessage.cardId !== cardId ||
// //       parsedMessage.walletAddress.toLowerCase() !== walletAddress.toLowerCase() ||
// //       parsedMessage.nonce !== nonce
// //     ) {
// //       return res.status(400).json({ error: "Message content mismatch" })
// //     }

// //     // Find and update the card
// //     const card = await Card.findOne({
// //       _id: cardId,
// //       walletAddress: walletAddress.toLowerCase(),
// //     })

// //     if (!card) {
// //       return res.status(404).json({ error: "Card not found" })
// //     }

// //     card.isActive = !card.isActive
// //     card.lastUpdated = new Date()
// //     await card.save()

// //     // Add nonce to used set
// //     usedNonces.add(nonce)

// //     res.status(200).json({
// //       success: true,
// //       cardId: cardId,
// //       newStatus: card.isActive,
// //       message: `Card ${card.isActive ? "activated" : "deactivated"} successfully`,
// //     })
// //   } catch (error) {
// //     console.error("Toggle card status error:", error)
// //     res.status(500).json({
// //       error: error.message || "Internal server error",
// //     })
// //   }
// // }

// // // Toggle card freeze
// // exports.toggleCardFreeze = async (req, res) => {
// //   try {
// //     const { message, signature, cardId, walletAddress, nonce } = req.body

// //     if (!message || !signature || !cardId || !walletAddress || !nonce) {
// //       return res.status(400).json({ error: "Missing required fields" })
// //     }

// //     // Check if nonce has been used
// //     if (usedNonces.has(nonce)) {
// //       return res.status(400).json({ error: "Nonce already used" })
// //     }

// //     // Verify the signature
// //     verifySignature(message, signature, walletAddress)

// //     // Parse and validate the message
// //     let parsedMessage
// //     try {
// //       parsedMessage = JSON.parse(message)
// //     } catch (error) {
// //       return res.status(400).json({ error: "Invalid message format" })
// //     }

// //     if (
// //       parsedMessage.action !== "toggle_card_freeze" ||
// //       parsedMessage.cardId !== cardId ||
// //       parsedMessage.walletAddress.toLowerCase() !== walletAddress.toLowerCase() ||
// //       parsedMessage.nonce !== nonce
// //     ) {
// //       return res.status(400).json({ error: "Message content mismatch" })
// //     }

// //     // Find and update the card
// //     const card = await Card.findOne({
// //       _id: cardId,
// //       walletAddress: walletAddress.toLowerCase(),
// //     })

// //     if (!card) {
// //       return res.status(404).json({ error: "Card not found" })
// //     }

// //     card.isFrozen = !card.isFrozen
// //     card.lastUpdated = new Date()
// //     await card.save()

// //     // Add nonce to used set
// //     usedNonces.add(nonce)

// //     res.status(200).json({
// //       success: true,
// //       cardId: cardId,
// //       newFreezeStatus: card.isFrozen,
// //       message: `Card ${card.isFrozen ? "frozen" : "unfrozen"} successfully`,
// //     })
// //   } catch (error) {
// //     console.error("Toggle card freeze error:", error)
// //     res.status(500).json({
// //       error: error.message || "Internal server error",
// //     })
// //   }
// // }

// // // Update spending limit
// // exports.updateSpendingLimit = async (req, res) => {
// //   try {
// //     const { message, signature, cardId, newLimit, walletAddress, nonce } = req.body

// //     if (!message || !signature || !cardId || newLimit === undefined || !walletAddress || !nonce) {
// //       return res.status(400).json({ error: "Missing required fields" })
// //     }

// //     if (newLimit < 0) {
// //       return res.status(400).json({ error: "Spending limit cannot be negative" })
// //     }

// //     // Check if nonce has been used
// //     if (usedNonces.has(nonce)) {
// //       return res.status(400).json({ error: "Nonce already used" })
// //     }

// //     // Verify the signature
// //     verifySignature(message, signature, walletAddress)

// //     // Parse and validate the message
// //     let parsedMessage
// //     try {
// //       parsedMessage = JSON.parse(message)
// //     } catch (error) {
// //       return res.status(400).json({ error: "Invalid message format" })
// //     }

// //     if (
// //       parsedMessage.action !== "update_spending_limit" ||
// //       parsedMessage.cardId !== cardId ||
// //       parsedMessage.newLimit !== newLimit ||
// //       parsedMessage.walletAddress.toLowerCase() !== walletAddress.toLowerCase() ||
// //       parsedMessage.nonce !== nonce
// //     ) {
// //       return res.status(400).json({ error: "Message content mismatch" })
// //     }

// //     // Find and update the card
// //     const card = await Card.findOne({
// //       _id: cardId,
// //       walletAddress: walletAddress.toLowerCase(),
// //     })

// //     if (!card) {
// //       return res.status(404).json({ error: "Card not found" })
// //     }

// //     card.spendingLimit = newLimit
// //     card.lastUpdated = new Date()
// //     await card.save()

// //     // Add nonce to used set
// //     usedNonces.add(nonce)

// //     res.status(200).json({
// //       success: true,
// //       cardId: cardId,
// //       newSpendingLimit: newLimit,
// //       message: "Spending limit updated successfully",
// //     })
// //   } catch (error) {
// //     console.error("Update spending limit error:", error)
// //     res.status(500).json({
// //       error: error.message || "Internal server error",
// //     })
// //   }
// // }

// // // Get transaction history
// // exports.getTransactionHistory = async (req, res) => {
// //   try {
// //     const { walletAddress, cardId, limit = 50, offset = 0 } = req.query

// //     if (!walletAddress) {
// //       return res.status(400).json({ error: "Wallet address is required" })
// //     }

// //     const query = { walletAddress: walletAddress.toLowerCase() }
// //     if (cardId) {
// //       query.cardId = cardId
// //     }

// //     const transactions = await Transaction.find(query)
// //       .sort({ timestamp: -1 })
// //       .limit(Number.parseInt(limit))
// //       .skip(Number.parseInt(offset))
// //       .populate("cardId", "name type")

// //     const total = await Transaction.countDocuments(query)

// //     res.status(200).json({
// //       success: true,
// //       transactions,
// //       pagination: {
// //         total,
// //         limit: Number.parseInt(limit),
// //         offset: Number.parseInt(offset),
// //         hasMore: total > Number.parseInt(offset) + Number.parseInt(limit),
// //       },
// //     })
// //   } catch (error) {
// //     console.error("Get transaction history error:", error)
// //     res.status(500).json({ error: "Internal server error" })
// //   }
// // }



// const { ethers } = require("ethers")
// const Card = require("../models/Card")
// const Transaction = require("../models/Transaction")

// // In-memory nonce storage (in production, use Redis)
// const usedNonces = new Set()

// // Helper function to validate nonce and timestamp
// const validateNonceAndTimestamp = (nonce, timestamp) => {
//   if (usedNonces.has(nonce)) {
//     throw new Error("Nonce already used")
//   }

//   const currentTime = Date.now()
//   const signatureAge = currentTime - timestamp
//   const maxAge = 5 * 60 * 1000 // 5 minutes

//   if (signatureAge > maxAge) {
//     throw new Error("Signature expired")
//   }
// }

// // Helper function to verify signature
// const verifySignature = (message, signature, expectedAddress) => {
//   try {
//     const recoveredAddress = ethers.verifyMessage(message, signature)

//     if (recoveredAddress.toLowerCase() !== expectedAddress.toLowerCase()) {
//       throw new Error("Signature verification failed")
//     }

//     return true
//   } catch (error) {
//     throw new Error("Invalid signature")
//   }
// }

// exports.seedCards = async (req, res) => {
//   try {
//     const { walletAddress } = req.body

//     if (!walletAddress) {
//       return res.status(400).json({ error: "Wallet address is required" })
//     }

//     // Delete existing cards for this wallet
//     await Card.deleteMany({ walletAddress: walletAddress.toLowerCase() })

//     // Mock cards data
//     const mockCards = [
//       {
//         walletAddress: walletAddress.toLowerCase(),
//         name: "Coinbase Pro",
//         type: "Crypto Exchange",
//         balance: 2450.75,
//         isActive: true,
//         isFrozen: false,
//         spendingLimit: 5000,
//         dailySpent: 234.5,
//         color: "from-blue-500 via-blue-600 to-indigo-600",
//         icon: "₿",
//         lastTransaction: "2 hours ago",
//         cardNumber: "**** **** **** 1234",
//         cvv: "***",
//         expiry: "12/27",
//         cashback: 2.5,
//         monthlyRewards: 45.3,
//         plan: "Premium",
//         features: ["Crypto rewards", "No foreign fees", "Priority support"],
//         transactions: [
//           { id: "1", merchant: "Amazon", amount: -89.99, type: "purchase", time: "2 hours ago", category: "shopping" },
//           { id: "2", merchant: "Starbucks", amount: -5.5, type: "purchase", time: "5 hours ago", category: "food" },
//           {
//             id: "3",
//             merchant: "Cashback Reward",
//             amount: +12.3,
//             type: "reward",
//             time: "1 day ago",
//             category: "reward",
//           },
//         ],
//       },
//       {
//         walletAddress: walletAddress.toLowerCase(),
//         name: "CashApp Elite",
//         type: "Digital Wallet",
//         balance: 1250.3,
//         isActive: true,
//         isFrozen: false,
//         spendingLimit: 3000,
//         dailySpent: 156.8,
//         color: "from-green-500 via-emerald-500 to-teal-500",
//         icon: "$",
//         lastTransaction: "5 hours ago",
//         cardNumber: "**** **** **** 5678",
//         cvv: "***",
//         expiry: "09/26",
//         cashback: 1.8,
//         monthlyRewards: 28.9,
//         plan: "Basic",
//         features: ["Instant transfers", "Stock investing", "Bitcoin rewards"],
//         transactions: [
//           { id: "1", merchant: "Uber", amount: -25.4, type: "purchase", time: "5 hours ago", category: "transport" },
//           {
//             id: "2",
//             merchant: "Netflix",
//             amount: -15.99,
//             type: "subscription",
//             time: "2 days ago",
//             category: "entertainment",
//           },
//         ],
//       },
//       {
//         walletAddress: walletAddress.toLowerCase(),
//         name: "PayPal Business",
//         type: "Payment Service",
//         balance: 890.45,
//         isActive: false,
//         isFrozen: false,
//         spendingLimit: 2500,
//         dailySpent: 0,
//         color: "from-blue-400 via-indigo-500 to-purple-500",
//         icon: "P",
//         lastTransaction: "1 day ago",
//         cardNumber: "**** **** **** 9012",
//         cvv: "***",
//         expiry: "03/28",
//         cashback: 1.5,
//         monthlyRewards: 15.6,
//         plan: "Premium",
//         features: ["Buyer protection", "Global payments", "Invoice tools"],
//         transactions: [
//           {
//             id: "1",
//             merchant: "Office Supplies",
//             amount: -145.3,
//             type: "purchase",
//             time: "1 day ago",
//             category: "business",
//           },
//         ],
//       },
//       {
//         walletAddress: walletAddress.toLowerCase(),
//         name: "Nexo Platinum",
//         type: "Crypto Platform",
//         balance: 3200.8,
//         isActive: true,
//         isFrozen: true,
//         spendingLimit: 7500,
//         dailySpent: 450.2,
//         color: "from-purple-500 via-violet-600 to-purple-700",
//         icon: "N",
//         lastTransaction: "3 hours ago",
//         cardNumber: "**** **** **** 3456",
//         cvv: "***",
//         expiry: "06/29",
//         cashback: 3.0,
//         monthlyRewards: 89.4,
//         plan: "Platinum",
//         features: ["Crypto loans", "High yield", "Premium support"],
//         transactions: [
//           {
//             id: "1",
//             merchant: "Tesla Supercharger",
//             amount: -45.8,
//             type: "purchase",
//             time: "3 hours ago",
//             category: "transport",
//           },
//           {
//             id: "2",
//             merchant: "Crypto Reward",
//             amount: +25.6,
//             type: "reward",
//             time: "6 hours ago",
//             category: "reward",
//           },
//         ],
//       },
//       {
//         walletAddress: walletAddress.toLowerCase(),
//         name: "TrustWallet Pro",
//         type: "Mobile Wallet",
//         balance: 1680.25,
//         isActive: true,
//         isFrozen: false,
//         spendingLimit: 4000,
//         dailySpent: 89.3,
//         color: "from-cyan-500 via-blue-500 to-indigo-500",
//         icon: "T",
//         lastTransaction: "6 hours ago",
//         cardNumber: "**** **** **** 7890",
//         cvv: "***",
//         expiry: "11/27",
//         cashback: 2.0,
//         monthlyRewards: 34.7,
//         plan: "Premium",
//         features: ["DeFi access", "NFT storage", "Multi-chain support"],
//         transactions: [
//           {
//             id: "1",
//             merchant: "Gas Station",
//             amount: -65.4,
//             type: "purchase",
//             time: "6 hours ago",
//             category: "transport",
//           },
//           { id: "2", merchant: "DeFi Yield", amount: +18.9, type: "reward", time: "12 hours ago", category: "defi" },
//         ],
//       },
//       {
//         walletAddress: walletAddress.toLowerCase(),
//         name: "Robinhood Gold",
//         type: "Investment App",
//         balance: 5420.15,
//         isActive: true,
//         isFrozen: false,
//         spendingLimit: 10000,
//         dailySpent: 1250.6,
//         color: "from-emerald-500 via-green-500 to-teal-600",
//         icon: "R",
//         lastTransaction: "1 hour ago",
//         cardNumber: "**** **** **** 2468",
//         cvv: "***",
//         expiry: "08/28",
//         cashback: 2.2,
//         monthlyRewards: 156.8,
//         plan: "Platinum",
//         features: ["Stock rewards", "Margin trading", "Research tools"],
//         transactions: [
//           {
//             id: "1",
//             merchant: "Apple Store",
//             amount: -1299.0,
//             type: "purchase",
//             time: "1 hour ago",
//             category: "electronics",
//           },
//           {
//             id: "2",
//             merchant: "Stock Dividend",
//             amount: +45.3,
//             type: "dividend",
//             time: "4 hours ago",
//             category: "investment",
//           },
//         ],
//       },
//     ]

//     // Create cards in database
//     const createdCards = await Card.insertMany(mockCards)

//     res.status(200).json({
//       success: true,
//       message: `${createdCards.length} cards created successfully`,
//       cards: createdCards,
//     })
//   } catch (error) {
//     console.error("Seed cards error:", error)
//     res.status(500).json({ error: "Internal server error" })
//   }
// }

// // Seed database with mock cards for testing
// // exports.seedCards = async (req, res) => {
// //   try {
// //     const { walletAddress } = req.body

// //     if (!walletAddress) {
// //       return res.status(400).json({ error: "Wallet address is required" })
// //     }

// //     // Delete existing cards for this wallet
// //     await Card.deleteMany({ walletAddress: walletAddress.toLowerCase() })

// //     // Mock cards data
// //     const mockCards = [
// //       {
// //         walletAddress: walletAddress.toLowerCase(),
// //         name: "Coinbase Pro",
// //         type: "Crypto Exchange",
// //         balance: 2450.75,
// //         isActive: true,
// //         isFrozen: false,
// //         spendingLimit: 5000,
// //         dailySpent: 234.5,
// //         color: "from-blue-500 via-blue-600 to-indigo-600",
// //         icon: "₿",
// //         lastTransaction: "2 hours ago",
// //         cardNumber: "**** **** **** 1234",
// //         cvv: "***",
// //         expiry: "12/27",
// //         cashback: 2.5,
// //         monthlyRewards: 45.3,
// //         plan: "Premium",
// //         features: ["Crypto rewards", "No foreign fees", "Priority support"],
// //         transactions: [
// //           { id: "1", merchant: "Amazon", amount: -89.99, type: "purchase", time: "2 hours ago", category: "shopping" },
// //           { id: "2", merchant: "Starbucks", amount: -5.5, type: "purchase", time: "5 hours ago", category: "food" },
// //           {
// //             id: "3",
// //             merchant: "Cashback Reward",
// //             amount: +12.3,
// //             type: "reward",
// //             time: "1 day ago",
// //             category: "reward",
// //           },
// //         ],
// //       },
// //       {
// //         walletAddress: walletAddress.toLowerCase(),
// //         name: "CashApp Elite",
// //         type: "Digital Wallet",
// //         balance: 1250.3,
// //         isActive: true,
// //         isFrozen: false,
// //         spendingLimit: 3000,
// //         dailySpent: 156.8,
// //         color: "from-green-500 via-emerald-500 to-teal-500",
// //         icon: "$",
// //         lastTransaction: "5 hours ago",
// //         cardNumber: "**** **** **** 5678",
// //         cvv: "***",
// //         expiry: "09/26",
// //         cashback: 1.8,
// //         monthlyRewards: 28.9,
// //         plan: "Standard",
// //         features: ["Instant transfers", "Stock investing", "Bitcoin rewards"],
// //         transactions: [
// //           { id: "1", merchant: "Uber", amount: -25.4, type: "purchase", time: "5 hours ago", category: "transport" },
// //           {
// //             id: "2",
// //             merchant: "Netflix",
// //             amount: -15.99,
// //             type: "subscription",
// //             time: "2 days ago",
// //             category: "entertainment",
// //           },
// //         ],
// //       },
// //       {
// //         walletAddress: walletAddress.toLowerCase(),
// //         name: "PayPal Business",
// //         type: "Payment Service",
// //         balance: 890.45,
// //         isActive: false,
// //         isFrozen: false,
// //         spendingLimit: 2500,
// //         dailySpent: 0,
// //         color: "from-blue-400 via-indigo-500 to-purple-500",
// //         icon: "P",
// //         lastTransaction: "1 day ago",
// //         cardNumber: "**** **** **** 9012",
// //         cvv: "***",
// //         expiry: "03/28",
// //         cashback: 1.5,
// //         monthlyRewards: 15.6,
// //         plan: "Business",
// //         features: ["Buyer protection", "Global payments", "Invoice tools"],
// //         transactions: [
// //           {
// //             id: "1",
// //             merchant: "Office Supplies",
// //             amount: -145.3,
// //             type: "purchase",
// //             time: "1 day ago",
// //             category: "business",
// //           },
// //         ],
// //       },
// //       {
// //         walletAddress: walletAddress.toLowerCase(),
// //         name: "Nexo Platinum",
// //         type: "Crypto Platform",
// //         balance: 3200.8,
// //         isActive: true,
// //         isFrozen: true,
// //         spendingLimit: 7500,
// //         dailySpent: 450.2,
// //         color: "from-purple-500 via-violet-600 to-purple-700",
// //         icon: "N",
// //         lastTransaction: "3 hours ago",
// //         cardNumber: "**** **** **** 3456",
// //         cvv: "***",
// //         expiry: "06/29",
// //         cashback: 3.0,
// //         monthlyRewards: 89.4,
// //         plan: "Platinum",
// //         features: ["Crypto loans", "High yield", "Premium support"],
// //         transactions: [
// //           {
// //             id: "1",
// //             merchant: "Tesla Supercharger",
// //             amount: -45.8,
// //             type: "purchase",
// //             time: "3 hours ago",
// //             category: "transport",
// //           },
// //           {
// //             id: "2",
// //             merchant: "Crypto Reward",
// //             amount: +25.6,
// //             type: "reward",
// //             time: "6 hours ago",
// //             category: "reward",
// //           },
// //         ],
// //       },
// //       {
// //         walletAddress: walletAddress.toLowerCase(),
// //         name: "TrustWallet Pro",
// //         type: "Mobile Wallet",
// //         balance: 1680.25,
// //         isActive: true,
// //         isFrozen: false,
// //         spendingLimit: 4000,
// //         dailySpent: 89.3,
// //         color: "from-cyan-500 via-blue-500 to-indigo-500",
// //         icon: "T",
// //         lastTransaction: "6 hours ago",
// //         cardNumber: "**** **** **** 7890",
// //         cvv: "***",
// //         expiry: "11/27",
// //         cashback: 2.0,
// //         monthlyRewards: 34.7,
// //         plan: "Pro",
// //         features: ["DeFi access", "NFT storage", "Multi-chain support"],
// //         transactions: [
// //           {
// //             id: "1",
// //             merchant: "Gas Station",
// //             amount: -65.4,
// //             type: "purchase",
// //             time: "6 hours ago",
// //             category: "transport",
// //           },
// //           { id: "2", merchant: "DeFi Yield", amount: +18.9, type: "reward", time: "12 hours ago", category: "defi" },
// //         ],
// //       },
// //       {
// //         walletAddress: walletAddress.toLowerCase(),
// //         name: "Robinhood Gold",
// //         type: "Investment App",
// //         balance: 5420.15,
// //         isActive: true,
// //         isFrozen: false,
// //         spendingLimit: 10000,
// //         dailySpent: 1250.6,
// //         color: "from-emerald-500 via-green-500 to-teal-600",
// //         icon: "R",
// //         lastTransaction: "1 hour ago",
// //         cardNumber: "**** **** **** 2468",
// //         cvv: "***",
// //         expiry: "08/28",
// //         cashback: 2.2,
// //         monthlyRewards: 156.8,
// //         plan: "Gold",
// //         features: ["Stock rewards", "Margin trading", "Research tools"],
// //         transactions: [
// //           {
// //             id: "1",
// //             merchant: "Apple Store",
// //             amount: -1299.0,
// //             type: "purchase",
// //             time: "1 hour ago",
// //             category: "electronics",
// //           },
// //           {
// //             id: "2",
// //             merchant: "Stock Dividend",
// //             amount: +45.3,
// //             type: "dividend",
// //             time: "4 hours ago",
// //             category: "investment",
// //           },
// //         ],
// //       },
// //     ]

// //     // Create cards in database
// //     const createdCards = await Card.insertMany(mockCards)

// //     res.status(200).json({
// //       success: true,
// //       message: `${createdCards.length} cards created successfully`,
// //       cards: createdCards,
// //     })
// //   } catch (error) {
// //     console.error("Seed cards error:", error)
// //     res.status(500).json({ error: "Internal server error" })
// //   }
// // }

// // Get all cards for a wallet
// exports.getCards = async (req, res) => {
//   try {
//     const { walletAddress } = req.query

//     if (!walletAddress) {
//       return res.status(400).json({ error: "Wallet address is required" })
//     }

//     const cards = await Card.find({
//       walletAddress: walletAddress.toLowerCase(),
//     }).sort({ createdAt: -1 })

//     res.status(200).json(cards)
//   } catch (error) {
//     console.error("Get cards error:", error)
//     res.status(500).json({ error: "Internal server error" })
//   }
// }

// // Create a new card
// exports.createCard = async (req, res) => {
//   try {
//     const {
//       walletAddress,
//       name,
//       type,
//       balance,
//       spendingLimit,
//       color,
//       icon,
//       cardNumber,
//       cvv,
//       expiry,
//       cashback,
//       plan,
//       features,
//     } = req.body

//     if (!walletAddress || !name || !type) {
//       return res.status(400).json({ error: "Missing required fields" })
//     }

//     const newCard = new Card({
//       walletAddress: walletAddress.toLowerCase(),
//       name,
//       type,
//       balance: balance || 0,
//       spendingLimit: spendingLimit || 1000,
//       color: color || "from-blue-500 to-purple-600",
//       icon: icon || "💳",
//       cardNumber: cardNumber || `**** **** **** ${Math.floor(1000 + Math.random() * 9000)}`,
//       cvv: cvv || "***",
//       expiry: expiry || "12/27",
//       cashback: cashback || 1.5,
//       plan: plan || "Basic",
//       features: features || ["Basic features"],
//       transactions: [],
//     })

//     await newCard.save()

//     res.status(201).json({
//       success: true,
//       card: newCard,
//       message: "Card created successfully",
//     })
//   } catch (error) {
//     console.error("Create card error:", error)
//     res.status(500).json({ error: "Internal server error" })
//   }
// }

// // Process payment
// exports.processPayment = async (req, res) => {
//   try {
//     const { message, signature, cardId, amount, merchant, walletAddress, nonce, timestamp } = req.body

//     // Validate required fields
//     if (!message || !signature || !cardId || !amount || !walletAddress || !nonce) {
//       return res.status(400).json({ error: "Missing required fields" })
//     }

//     // Validate nonce and timestamp
//     validateNonceAndTimestamp(nonce, timestamp)

//     // Verify the signature
//     verifySignature(message, signature, walletAddress)

//     // Parse and validate the message
//     let parsedMessage
//     try {
//       parsedMessage = JSON.parse(message)
//     } catch (error) {
//       return res.status(400).json({ error: "Invalid message format" })
//     }

//     // Validate message content
//     if (
//       parsedMessage.action !== "payment" ||
//       parsedMessage.cardId !== cardId ||
//       parsedMessage.amount !== amount ||
//       parsedMessage.walletAddress.toLowerCase() !== walletAddress.toLowerCase() ||
//       parsedMessage.nonce !== nonce
//     ) {
//       return res.status(400).json({ error: "Message content mismatch" })
//     }

//     // Find and verify card
//     const card = await Card.findOne({
//       _id: cardId,
//       walletAddress: walletAddress.toLowerCase(),
//       isActive: true,
//       isFrozen: false,
//     })

//     if (!card) {
//       return res.status(404).json({ error: "Card not found or not accessible" })
//     }

//     // Check balance and limits
//     if (card.balance < amount) {
//       return res.status(400).json({ error: "Insufficient card balance" })
//     }

//     if (card.dailySpent + amount > card.spendingLimit) {
//       return res.status(400).json({ error: "Daily spending limit exceeded" })
//     }

//     // Generate transaction hash
//     const transactionHash = ethers.keccak256(ethers.toUtf8Bytes(`${cardId}-${Date.now()}-${walletAddress}-${nonce}`))

//     // Calculate cashback
//     const cashbackAmount = (amount * card.cashback) / 100

//     // Create transaction record
//     const transaction = new Transaction({
//       cardId: cardId,
//       walletAddress: walletAddress.toLowerCase(),
//       merchant: merchant || "Quick Payment",
//       amount: amount,
//       cashbackAmount: cashbackAmount,
//       type: "payment",
//       status: "completed",
//       transactionHash: transactionHash,
//       signature: signature,
//       nonce: nonce,
//       timestamp: new Date(),
//       metadata: {
//         userAgent: req.headers["user-agent"],
//         ip: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
//       },
//     })

//     await transaction.save()

//     // Update card
//     card.balance -= amount
//     card.dailySpent += amount
//     card.monthlyRewards += cashbackAmount
//     card.lastTransaction = new Date().toISOString()

//     // Add transaction to card's transaction array
//     card.transactions.unshift({
//       id: transaction._id.toString(),
//       merchant: merchant || "Quick Payment",
//       amount: -amount,
//       type: "purchase",
//       time: "now",
//       category: "payment",
//       status: "completed",
//       transactionHash: transactionHash,
//       signature: signature,
//       nonce: nonce,
//     })

//     await card.save()

//     // Add nonce to used set
//     usedNonces.add(nonce)

//     res.status(200).json({
//       success: true,
//       transactionId: transaction._id.toString(),
//       transactionHash: transactionHash,
//       amount: amount,
//       cashbackAmount: cashbackAmount,
//       newBalance: card.balance,
//       message: "Payment processed successfully",
//     })
//   } catch (error) {
//     console.error("Payment processing error:", error)
//     res.status(500).json({
//       error: error.message || "Internal server error",
//     })
//   }
// }

// // Toggle card status
// exports.toggleCardStatus = async (req, res) => {
//   try {
//     const { message, signature, cardId, walletAddress, nonce } = req.body

//     if (!message || !signature || !cardId || !walletAddress || !nonce) {
//       return res.status(400).json({ error: "Missing required fields" })
//     }

//     // Check if nonce has been used
//     if (usedNonces.has(nonce)) {
//       return res.status(400).json({ error: "Nonce already used" })
//     }

//     // Verify the signature
//     verifySignature(message, signature, walletAddress)

//     // Parse and validate the message
//     let parsedMessage
//     try {
//       parsedMessage = JSON.parse(message)
//     } catch (error) {
//       return res.status(400).json({ error: "Invalid message format" })
//     }

//     if (
//       parsedMessage.action !== "toggle_card_status" ||
//       parsedMessage.cardId !== cardId ||
//       parsedMessage.walletAddress.toLowerCase() !== walletAddress.toLowerCase() ||
//       parsedMessage.nonce !== nonce
//     ) {
//       return res.status(400).json({ error: "Message content mismatch" })
//     }

//     // Find and update the card
//     const card = await Card.findOne({
//       _id: cardId,
//       walletAddress: walletAddress.toLowerCase(),
//     })

//     if (!card) {
//       return res.status(404).json({ error: "Card not found" })
//     }

//     card.isActive = !card.isActive
//     card.lastUpdated = new Date()
//     await card.save()

//     // Add nonce to used set
//     usedNonces.add(nonce)

//     res.status(200).json({
//       success: true,
//       cardId: cardId,
//       newStatus: card.isActive,
//       message: `Card ${card.isActive ? "activated" : "deactivated"} successfully`,
//     })
//   } catch (error) {
//     console.error("Toggle card status error:", error)
//     res.status(500).json({
//       error: error.message || "Internal server error",
//     })
//   }
// }

// // Toggle card freeze
// exports.toggleCardFreeze = async (req, res) => {
//   try {
//     const { message, signature, cardId, walletAddress, nonce } = req.body

//     if (!message || !signature || !cardId || !walletAddress || !nonce) {
//       return res.status(400).json({ error: "Missing required fields" })
//     }

//     // Check if nonce has been used
//     if (usedNonces.has(nonce)) {
//       return res.status(400).json({ error: "Nonce already used" })
//     }

//     // Verify the signature
//     verifySignature(message, signature, walletAddress)

//     // Parse and validate the message
//     let parsedMessage
//     try {
//       parsedMessage = JSON.parse(message)
//     } catch (error) {
//       return res.status(400).json({ error: "Invalid message format" })
//     }

//     if (
//       parsedMessage.action !== "toggle_card_freeze" ||
//       parsedMessage.cardId !== cardId ||
//       parsedMessage.walletAddress.toLowerCase() !== walletAddress.toLowerCase() ||
//       parsedMessage.nonce !== nonce
//     ) {
//       return res.status(400).json({ error: "Message content mismatch" })
//     }

//     // Find and update the card
//     const card = await Card.findOne({
//       _id: cardId,
//       walletAddress: walletAddress.toLowerCase(),
//     })

//     if (!card) {
//       return res.status(404).json({ error: "Card not found" })
//     }

//     card.isFrozen = !card.isFrozen
//     card.lastUpdated = new Date()
//     await card.save()

//     // Add nonce to used set
//     usedNonces.add(nonce)

//     res.status(200).json({
//       success: true,
//       cardId: cardId,
//       newFreezeStatus: card.isFrozen,
//       message: `Card ${card.isFrozen ? "frozen" : "unfrozen"} successfully`,
//     })
//   } catch (error) {
//     console.error("Toggle card freeze error:", error)
//     res.status(500).json({
//       error: error.message || "Internal server error",
//     })
//   }
// }

// // Update spending limit
// exports.updateSpendingLimit = async (req, res) => {
//   try {
//     const { message, signature, cardId, newLimit, walletAddress, nonce } = req.body

//     if (!message || !signature || !cardId || newLimit === undefined || !walletAddress || !nonce) {
//       return res.status(400).json({ error: "Missing required fields" })
//     }

//     if (newLimit < 0) {
//       return res.status(400).json({ error: "Spending limit cannot be negative" })
//     }

//     // Check if nonce has been used
//     if (usedNonces.has(nonce)) {
//       return res.status(400).json({ error: "Nonce already used" })
//     }

//     // Verify the signature
//     verifySignature(message, signature, walletAddress)

//     // Parse and validate the message
//     let parsedMessage
//     try {
//       parsedMessage = JSON.parse(message)
//     } catch (error) {
//       return res.status(400).json({ error: "Invalid message format" })
//     }

//     if (
//       parsedMessage.action !== "update_spending_limit" ||
//       parsedMessage.cardId !== cardId ||
//       parsedMessage.newLimit !== newLimit ||
//       parsedMessage.walletAddress.toLowerCase() !== walletAddress.toLowerCase() ||
//       parsedMessage.nonce !== nonce
//     ) {
//       return res.status(400).json({ error: "Message content mismatch" })
//     }

//     // Find and update the card
//     const card = await Card.findOne({
//       _id: cardId,
//       walletAddress: walletAddress.toLowerCase(),
//     })

//     if (!card) {
//       return res.status(404).json({ error: "Card not found" })
//     }

//     card.spendingLimit = newLimit
//     card.lastUpdated = new Date()
//     await card.save()

//     // Add nonce to used set
//     usedNonces.add(nonce)

//     res.status(200).json({
//       success: true,
//       cardId: cardId,
//       newSpendingLimit: newLimit,
//       message: "Spending limit updated successfully",
//     })
//   } catch (error) {
//     console.error("Update spending limit error:", error)
//     res.status(500).json({
//       error: error.message || "Internal server error",
//     })
//   }
// }

// // Get transaction history
// exports.getTransactionHistory = async (req, res) => {
//   try {
//     const { walletAddress, cardId, limit = 50, offset = 0 } = req.query

//     if (!walletAddress) {
//       return res.status(400).json({ error: "Wallet address is required" })
//     }

//     const query = { walletAddress: walletAddress.toLowerCase() }
//     if (cardId) {
//       query.cardId = cardId
//     }

//     const transactions = await Transaction.find(query)
//       .sort({ timestamp: -1 })
//       .limit(Number.parseInt(limit))
//       .skip(Number.parseInt(offset))
//       .populate("cardId", "name type")

//     const total = await Transaction.countDocuments(query)

//     res.status(200).json({
//       success: true,
//       transactions,
//       pagination: {
//         total,
//         limit: Number.parseInt(limit),
//         offset: Number.parseInt(offset),
//         hasMore: total > Number.parseInt(offset) + Number.parseInt(limit),
//       },
//     })
//   } catch (error) {
//     console.error("Get transaction history error:", error)
//     res.status(500).json({ error: "Internal server error" })
//   }
// }



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

// Seed database with mock cards for testing
exports.seedCards = async (req, res) => {
  try {
    const { walletAddress } = req.body

    if (!walletAddress) {
      return res.status(400).json({ error: "Wallet address is required" })
    }

    // Delete existing cards for this wallet
    await Card.deleteMany({ walletAddress: walletAddress.toLowerCase() })

    // Mock cards data
    const mockCards = [
      {
        walletAddress: walletAddress.toLowerCase(),
        name: "Coinbase Pro",
        type: "Crypto Exchange",
        balance: 2450.75,
        isActive: true,
        isFrozen: false,
        spendingLimit: 5000,
        dailySpent: 234.5,
        color: "from-blue-500 via-blue-600 to-indigo-600",
        icon: "₿",
        lastTransaction: "2 hours ago",
        cardNumber: "**** **** **** 1234",
        cvv: "***",
        expiry: "12/27",
        cashback: 2.5,
        monthlyRewards: 45.3,
        plan: "Premium",
        features: ["Crypto rewards", "No foreign fees", "Priority support"],
        transactions: [
          { id: "1", merchant: "Amazon", amount: -89.99, type: "purchase", time: "2 hours ago", category: "shopping" },
          { id: "2", merchant: "Starbucks", amount: -5.5, type: "purchase", time: "5 hours ago", category: "food" },
          {
            id: "3",
            merchant: "Cashback Reward",
            amount: +12.3,
            type: "reward",
            time: "1 day ago",
            category: "reward",
          },
        ],
      },
      {
        walletAddress: walletAddress.toLowerCase(),
        name: "CashApp Elite",
        type: "Digital Wallet",
        balance: 1250.3,
        isActive: true,
        isFrozen: false,
        spendingLimit: 3000,
        dailySpent: 156.8,
        color: "from-green-500 via-emerald-500 to-teal-500",
        icon: "$",
        lastTransaction: "5 hours ago",
        cardNumber: "**** **** **** 5678",
        cvv: "***",
        expiry: "09/26",
        cashback: 1.8,
        monthlyRewards: 28.9,
        plan: "Basic",
        features: ["Instant transfers", "Stock investing", "Bitcoin rewards"],
        transactions: [
          { id: "1", merchant: "Uber", amount: -25.4, type: "purchase", time: "5 hours ago", category: "transport" },
          {
            id: "2",
            merchant: "Netflix",
            amount: -15.99,
            type: "subscription",
            time: "2 days ago",
            category: "entertainment",
          },
        ],
      },
      {
        walletAddress: walletAddress.toLowerCase(),
        name: "PayPal Business",
        type: "Payment Service",
        balance: 890.45,
        isActive: false,
        isFrozen: false,
        spendingLimit: 2500,
        dailySpent: 0,
        color: "from-blue-400 via-indigo-500 to-purple-500",
        icon: "P",
        lastTransaction: "1 day ago",
        cardNumber: "**** **** **** 9012",
        cvv: "***",
        expiry: "03/28",
        cashback: 1.5,
        monthlyRewards: 15.6,
        plan: "Premium",
        features: ["Buyer protection", "Global payments", "Invoice tools"],
        transactions: [
          {
            id: "1",
            merchant: "Office Supplies",
            amount: -145.3,
            type: "purchase",
            time: "1 day ago",
            category: "business",
          },
        ],
      },
      {
        walletAddress: walletAddress.toLowerCase(),
        name: "Nexo Platinum",
        type: "Crypto Platform",
        balance: 3200.8,
        isActive: true,
        isFrozen: true,
        spendingLimit: 7500,
        dailySpent: 450.2,
        color: "from-purple-500 via-violet-600 to-purple-700",
        icon: "N",
        lastTransaction: "3 hours ago",
        cardNumber: "**** **** **** 3456",
        cvv: "***",
        expiry: "06/29",
        cashback: 3.0,
        monthlyRewards: 89.4,
        plan: "Platinum",
        features: ["Crypto loans", "High yield", "Premium support"],
        transactions: [
          {
            id: "1",
            merchant: "Tesla Supercharger",
            amount: -45.8,
            type: "purchase",
            time: "3 hours ago",
            category: "transport",
          },
          {
            id: "2",
            merchant: "Crypto Reward",
            amount: +25.6,
            type: "reward",
            time: "6 hours ago",
            category: "reward",
          },
        ],
      },
      {
        walletAddress: walletAddress.toLowerCase(),
        name: "TrustWallet Pro",
        type: "Mobile Wallet",
        balance: 1680.25,
        isActive: true,
        isFrozen: false,
        spendingLimit: 4000,
        dailySpent: 89.3,
        color: "from-cyan-500 via-blue-500 to-indigo-500",
        icon: "T",
        lastTransaction: "6 hours ago",
        cardNumber: "**** **** **** 7890",
        cvv: "***",
        expiry: "11/27",
        cashback: 2.0,
        monthlyRewards: 34.7,
        plan: "Premium",
        features: ["DeFi access", "NFT storage", "Multi-chain support"],
        transactions: [
          {
            id: "1",
            merchant: "Gas Station",
            amount: -65.4,
            type: "purchase",
            time: "6 hours ago",
            category: "transport",
          },
          { id: "2", merchant: "DeFi Yield", amount: +18.9, type: "reward", time: "12 hours ago", category: "defi" },
        ],
      },
      {
        walletAddress: walletAddress.toLowerCase(),
        name: "Robinhood Gold",
        type: "Investment App",
        balance: 5420.15,
        isActive: true,
        isFrozen: false,
        spendingLimit: 10000,
        dailySpent: 1250.6,
        color: "from-emerald-500 via-green-500 to-teal-600",
        icon: "R",
        lastTransaction: "1 hour ago",
        cardNumber: "**** **** **** 2468",
        cvv: "***",
        expiry: "08/28",
        cashback: 2.2,
        monthlyRewards: 156.8,
        plan: "Platinum",
        features: ["Stock rewards", "Margin trading", "Research tools"],
        transactions: [
          {
            id: "1",
            merchant: "Apple Store",
            amount: -1299.0,
            type: "purchase",
            time: "1 hour ago",
            category: "electronics",
          },
          {
            id: "2",
            merchant: "Stock Dividend",
            amount: +45.3,
            type: "dividend",
            time: "4 hours ago",
            category: "investment",
          },
        ],
      },
    ]

    // Create cards in database
    const createdCards = await Card.insertMany(mockCards)

    res.status(200).json({
      success: true,
      message: `${createdCards.length} cards created successfully`,
      cards: createdCards,
    })
  } catch (error) {
    console.error("Seed cards error:", error)
    res.status(500).json({ error: "Internal server error" })
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
