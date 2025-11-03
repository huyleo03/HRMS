const express = require("express");
const router = express.Router();
const HolidayController = require("../controller/HolidayController");
const { authenticate } = require("../middlewares/authMiddleware");

// Middleware để check role Admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({
      success: false,
      message: "Chỉ Admin mới có quyền truy cập",
    });
  }
  next();
};

// ===== PUBLIC/ALL AUTHENTICATED ROUTES =====

// Get calendar holidays (All roles) - ACTIVELY USED
router.get("/calendar", authenticate, HolidayController.getCalendarHolidays);

// Check if date is holiday (All roles) - ACTIVELY USED
router.get("/check", authenticate, HolidayController.checkHoliday);

// Get upcoming holidays (All roles) - NOT USED YET, kept for future features
router.get("/upcoming", authenticate, HolidayController.getUpcomingHolidays);

// Get all holidays with filters (All roles) - NOT USED YET, kept for future features
router.get("/", authenticate, HolidayController.getHolidays);

// Get holiday by ID (All roles) - NOT USED YET, kept for future features
router.get("/:id", authenticate, HolidayController.getHolidayById);

// ===== ADMIN ONLY ROUTES =====

// Create holiday (Admin only)
router.post("/", authenticate, requireAdmin, HolidayController.createHoliday);

// Update holiday (Admin only)
router.put("/:id", authenticate, requireAdmin, HolidayController.updateHoliday);

// Delete holiday (Admin only)
router.delete("/:id", authenticate, requireAdmin, HolidayController.deleteHoliday);

// Bulk create holidays (Admin only)
router.post("/bulk", authenticate, requireAdmin, HolidayController.bulkCreateHolidays);

// Generate recurring holidays (Admin only)
router.post("/generate-recurring", authenticate, requireAdmin, HolidayController.generateRecurringHolidays);

module.exports = router;
