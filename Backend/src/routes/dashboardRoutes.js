const express = require("express");
const router = express.Router();
const {
  getOverviewStats,
  getRequestsDetails,
  getAttendanceTrend,
  getDepartmentComparison,
  getLateEmployeesToday,
} = require("../controller/DashboardController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

/**
 * @route   GET /api/dashboard/stats/overview
 * @desc    Get all KPIs for Admin Dashboard
 * @access  Admin only
 */
router.get(
  "/stats/overview",
  authenticate,
  authorize("Admin"),
  getOverviewStats
);

/**
 * @route   GET /api/dashboard/stats/requests-details
 * @desc    Get detailed requests statistics (by type, priority, department, month comparison)
 * @access  Admin only
 */
router.get(
  "/stats/requests-details",
  authenticate,
  authorize("Admin"),
  getRequestsDetails
);

/**
 * @route   GET /api/dashboard/stats/attendance-trend
 * @desc    Get attendance trend (7 days or 6 months)
 * @access  Admin only
 * @query   period: 'week' | 'month'
 */
router.get(
  "/stats/attendance-trend",
  authenticate,
  authorize("Admin"),
  getAttendanceTrend
);

/**
 * @route   GET /api/dashboard/stats/department-comparison
 * @desc    Compare departments by attendance, requests, payroll
 * @access  Admin only
 */
router.get(
  "/stats/department-comparison",
  authenticate,
  authorize("Admin"),
  getDepartmentComparison
);

/**
 * @route   GET /api/dashboard/stats/late-employees-today
 * @desc    Get list of employees who are late today
 * @access  Admin only
 */
router.get(
  "/stats/late-employees-today",
  authenticate,
  authorize("Admin"),
  getLateEmployeesToday
);

module.exports = router;
