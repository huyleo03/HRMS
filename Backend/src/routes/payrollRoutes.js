const express = require("express");
const router = express.Router();
const PayrollController = require("../controller/PayrollController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

// ============ EMPLOYEE & MANAGER ROUTES ============
// Get my payrolls (for logged-in employee/manager) - MUST BE BEFORE /:id route
router.get("/my-payrolls", authenticate, PayrollController.getMyPayrolls);

// ============ ADMIN ROUTES ============
// All routes require Admin authentication

// Calculate payroll for all employees
router.post("/calculate-all", authenticate, authorize("Admin"), PayrollController.calculateAllPayroll);

// Calculate payroll for specific employee
router.post("/calculate", authenticate, authorize("Admin"), PayrollController.calculatePayroll);

// Get all payrolls (with filters)
router.get("/all", authenticate, authorize("Admin"), PayrollController.getAllPayrolls);

// Get payroll analytics (yearly)
router.get("/analytics", authenticate, authorize("Admin"), PayrollController.getPayrollAnalytics);

// Get payroll by ID
router.get("/:id", authenticate, authorize("Admin"), PayrollController.getPayrollById);

// Update payroll (manual adjustment)
router.put("/:id", authenticate, authorize("Admin"), PayrollController.updatePayroll);

// Approve payroll (single)
router.post("/:id/approve", authenticate, authorize("Admin"), PayrollController.approvePayroll);

// Bulk approve payrolls
router.post("/bulk-approve", authenticate, authorize("Admin"), PayrollController.bulkApprovePayrolls);

// Mark payroll as Paid
router.post("/:id/mark-paid", authenticate, authorize("Admin"), PayrollController.markAsPaid);

// Delete payroll (only Draft)
router.delete("/:id", authenticate, authorize("Admin"), PayrollController.deletePayroll);

module.exports = router;
