const express = require("express");
const router = express.Router();
const authController = require("../controller/AuthController");
const authenticate = require("../middlewares/authMiddleware").authenticate;
const authenticateReset =
  require("../middlewares/authMiddleware").authenticateReset;

// ✅ IMPORT RATE LIMITING MIDDLEWARE
const {
  authLimiter,
  strictLimiter,
} = require("../middlewares/rateLimitMiddleware");

// Forgot password (gửi OTP)
router.post("/forgot-password", authLimiter, authController.forgotPassword);

// Verify OTP (chỉ cần resetToken + otp)
router.post("/verify-otp", authLimiter, authController.verifyOtp);

// Reset password (cần resetToken trong headers)
router.post(
  "/reset-password",
  authLimiter,
  authenticateReset,
  authController.resetPassword
);

// Login
router.post("/login", authLimiter, authController.login);

router.post(
  "/change-password",
  strictLimiter,
  authenticate,
  authController.changePassword
);

module.exports = router;
