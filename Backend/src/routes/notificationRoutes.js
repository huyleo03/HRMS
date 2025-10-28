const express = require("express");
const router = express.Router();
const notificationController = require("../controller/NotificationController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");
const { validateSendNotification } = require("../middlewares/validationMiddleware");

// ============ ADMIN/MANAGER ROUTES ============

// Gửi thông báo (Admin/Manager only)
router.post(
  "/send",
  authenticate,
  authorize("Admin", "Manager"),
  validateSendNotification,
  notificationController.sendNotification
);

// ============ USER ROUTES ============
// Tất cả routes đều cần authentication

// Lấy danh sách notifications
router.get(
  "/",
  authenticate,
  notificationController.getUserNotifications
);

// Đếm số notifications chưa đọc
router.get(
  "/unread-count",
  authenticate,
  notificationController.getUnreadCount
);

// Đánh dấu tất cả đã đọc
router.put(
  "/read-all",
  authenticate,
  notificationController.markAllAsRead
);

// Xóa tất cả notifications đã đọc
router.delete(
  "/read",
  authenticate,
  notificationController.deleteAllRead
);

// Đánh dấu 1 notification đã đọc
router.put(
  "/:id/read",
  authenticate,
  notificationController.markAsRead
);

// Xóa 1 notification
router.delete(
  "/:id",
  authenticate,
  notificationController.deleteNotification
);

module.exports = router;
