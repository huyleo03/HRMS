const express = require("express");
const router = express.Router();
const authController = require("../controller/AuthController");
const auth = require("../middlewares/auth");
const ipCheck = require("../middlewares/ipCheck");

// Forgot password (gửi OTP)
router.post("/forgot-password", authController.forgotPassword);

// Verify OTP (chỉ cần resetToken + otp)
router.post("/verify-otp", auth, authController.verifyOtp);

// Reset password (cần resetToken trong headers)
router.post("/reset-password", auth, authController.resetPassword);

// Login (có check WiFi/IP)
router.post("/login", ipCheck.checkAllowedIP, authController.login);




module.exports = router;
