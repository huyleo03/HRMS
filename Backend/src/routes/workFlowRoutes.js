const express = require("express");
const router = express.Router();
const workflowController = require("../controller/WorkflowController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

// ✅ IMPORT RATE LIMITING MIDDLEWARE
const { adminLimiter } = require("../middlewares/rateLimitMiddleware");

// ✅ IMPORT AUDIT LOGGING MIDDLEWARE
const {
  logWorkflowCreation,
  logWorkflowUpdate,
  logWorkflowDeletion,
} = require("../middlewares/auditMiddleware");

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

router.post(
  "/",
  authenticate,
  authorize("Admin"),
  adminLimiter, // ✅ Rate limit: 50 operations/5 min
  logWorkflowCreation, // ✅ Audit log
  workflowController.createWorkflow
);

router.put(
  "/:id",
  authenticate,
  authorize("Admin"),
  adminLimiter, // ✅ Rate limit: 50 operations/5 min
  logWorkflowUpdate, // ✅ Audit log
  workflowController.updateWorkflow
);

router.delete(
  "/:id",
  authenticate,
  authorize("Admin"),
  adminLimiter, // ✅ Rate limit: 50 operations/5 min
  logWorkflowDeletion, // ✅ Audit log
  workflowController.deleteWorkflow
);

module.exports = router;