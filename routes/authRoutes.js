// routes/authRoutes.js
const express = require("express");
const { register, verifyOtp, login, uploadPaymentConfirmation, sendReplyToCustomer, getAllPayments, updatePaymentStatus } = require("../controllers/userController");
const { getNonce, verifySignature } = require("../controllers/walletController")
const router = express.Router();
router.post("/register",register);
router.post("/verify-otp",verifyOtp);
router.post("/login",login);


// New payment routes
router.post('/payment-confirmation', uploadPaymentConfirmation);

// Admin routes (should be protected)
router.post('/admin/reply', sendReplyToCustomer);
router.get('/admin/payments', getAllPayments);
router.put('/admin/payment-status', updatePaymentStatus);

// Wallet Authentication
router.get("/nonce", getNonce)
router.post("/wallet-login", verifySignature)


module.exports = router;