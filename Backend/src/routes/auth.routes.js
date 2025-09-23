const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const auth = require("../middlewares/auth");

// Forgot password (gửi OTP)
router.post("/forgot-password", authController.forgotPassword);

// Verify OTP (chỉ cần resetToken + otp)
router.post("/verify-otp", auth, authController.verifyOtp);

// Reset password (cần resetToken trong headers)
router.post("/reset-password", auth, authController.resetPassword);

// Login
router.post("/login", authController.login);




module.exports = router;
