const express = require("express");
const router = express.Router();
const workflowController = require("../controller/WorkflowController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

// ✅ IMPORT RATE LIMITING MIDDLEWARE
const { adminLimiter } = require("../middlewares/rateLimitMiddleware");

router.get(
  "/template",
  authenticate,
  workflowController.getWorkflowTemplate
);

router.get(
  "/",
  authenticate,
  authorize("Admin"),
  workflowController.getAllWorkflows
);

// Get workflow by ID (MUST be before /:id update/delete routes to avoid conflicts with /template)
router.get(
  "/:id",
  authenticate,
  authorize("Admin"),
  workflowController.getWorkflowById
);

router.post(
  "/",
  authenticate,
  authorize("Admin"),
  adminLimiter, // ✅ Rate limit: 50 operations/5 min
  workflowController.createWorkflow
);

router.put(
  "/:id",
  authenticate,
  authorize("Admin"),
  adminLimiter, // ✅ Rate limit: 50 operations/5 min
  workflowController.updateWorkflow
);

router.delete(
  "/:id",
  authenticate,
  authorize("Admin"),
  adminLimiter, // ✅ Rate limit: 50 operations/5 min
  workflowController.deleteWorkflow
);

module.exports = router;