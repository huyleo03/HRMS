const express = require("express");
const router = express.Router();
const configController = require("../controller/ConfigController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

// ============ ADMIN ROUTES ============
// Tất cả routes đều yêu cầu Admin role

// Get company config
router.get(
  "/company",
  authenticate,
  authorize("Admin"),
  configController.getCompanyConfig
);

// Update company config
router.put(
  "/company",
  authenticate,
  authorize("Admin"),
  configController.updateCompanyConfig
);

// Test IP address
router.post(
  "/test-ip",
  authenticate,
  authorize("Admin"),
  configController.testIPAddress
);

// Reset to default
router.post(
  "/reset",
  authenticate,
  authorize("Admin"),
  configController.resetToDefault
);

// Get current client IP (for testing)
router.get(
  "/current-ip",
  authenticate,
  authorize("Admin"),
  configController.getCurrentIP
);

module.exports = router;
