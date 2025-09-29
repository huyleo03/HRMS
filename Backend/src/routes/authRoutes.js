const express = require("express");
const router = express.Router();
const authController = require("../controller/AuthController");
const authenticate = require("../middlewares/authMiddleware").authenticate;

// Forgot password (gửi OTP)
router.post("/forgot-password", authController.forgotPassword);

// Verify OTP (chỉ cần resetToken + otp)
router.post("/verify-otp", authenticate, authController.verifyOtp);

// Reset password (cần resetToken trong headers)
router.post("/reset-password", authenticate, authController.resetPassword);

// Login
router.post("/login", authController.login);

module.exports = router;
