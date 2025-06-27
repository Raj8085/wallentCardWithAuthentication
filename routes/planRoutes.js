const express = require("express")
const { getUserPlan, upgradePlan, getAvailablePlans } = require("../controllers/planController")

const router = express.Router()

// Plan management routes
router.get("/user-plan", getUserPlan)
router.post("/upgrade", upgradePlan)
router.get("/available", getAvailablePlans)

module.exports = router
