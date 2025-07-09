const express = require("express")
const {
  getCards,
  createCard,
  processPayment,
  seedCards,
  toggleCardStatus,
  toggleCardFreeze,
  updateSpendingLimit,
  getTransactionHistory,
} = require("../controllers/cardController")

const router = express.Router()

// Card management routes
router.get("/", getCards)
router.post("/create", createCard)
router.post("/seed", seedCards)
// Payment processing
router.post("/process-payment", processPayment)

// Card status management
router.post("/toggle-status", toggleCardStatus)
router.post("/toggle-freeze", toggleCardFreeze)
router.post("/update-limit", updateSpendingLimit)

// Transaction history
router.get("/transactions", getTransactionHistory)

module.exports = router