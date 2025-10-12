const express = require("express");
const router = express.Router();
const workflowController = require("../controller/WorkflowController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

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
  workflowController.createWorkflow
);

router.put(
  "/:id",
  authenticate,
  authorize("Admin"),
  workflowController.updateWorkflow
);

router.delete(
  "/:id",
  authenticate,
  authorize("Admin"),
  workflowController.deleteWorkflow
);

module.exports = router;