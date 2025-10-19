const express = require("express");
const router = express.Router();
const attendanceController = require("../controller/AttendanceController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

// ============ PUBLIC ENDPOINT ============
// Ping để kiểm tra intranet (không cần auth)
router.get("/ping", attendanceController.pingIntranet);

// ============ EMPLOYEE ROUTES ============
// Tất cả nhân viên đã đăng nhập
router.post("/clock-in", authenticate, attendanceController.clockIn);
router.post("/clock-out", authenticate, attendanceController.clockOut);
router.get("/today", authenticate, attendanceController.getTodayStatus);
router.get("/my-history", authenticate, attendanceController.getMyHistory);

// ============ MANAGER ROUTES ============
// Manager và Admin xem phòng ban
router.get(
  "/department",
  authenticate,
  authorize("Manager", "Admin"),
  attendanceController.getDepartmentOverview
);

router.get(
  "/department/report",
  authenticate,
  authorize("Manager", "Admin"),
  attendanceController.getDepartmentReport
);

// ============ ADMIN ROUTES ============
// Chỉ Admin
router.get(
  "/all",
  authenticate,
  authorize("Admin"),
  attendanceController.getAllAttendance
);

router.get(
  "/company/report",
  authenticate,
  authorize("Admin"),
  attendanceController.getCompanyReport
);

router.put(
  "/:attendanceId/adjust",
  authenticate,
  authorize("Admin"),
  attendanceController.manualAdjust
);

router.post(
  "/mark-absent",
  authenticate,
  authorize("Admin"),
  attendanceController.markAbsent
);

router.get(
  "/export",
  authenticate,
  authorize("Manager", "Admin"),
  attendanceController.exportData
);

module.exports = router;
