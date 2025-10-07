const express = require("express");
const router = express.Router();
const authController = require("../controller/AuthController");
const authenticate = require("../middlewares/authMiddleware").authenticate;
const authenticateReset =
  require("../middlewares/authMiddleware").authenticateReset;
// Forgot password (gửi OTP)
router.post("/forgot-password", authController.forgotPassword);

// Verify OTP (chỉ cần resetToken + otp)
router.post("/verify-otp", authController.verifyOtp);

// Reset password (cần resetToken trong headers)
router.post("/reset-password", authenticateReset, authController.resetPassword);

// Login
router.post("/login", authController.login);

router.post("/change-password", authenticate, authController.changePassword);

module.exports = router;
