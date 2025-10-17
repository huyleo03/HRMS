const express = require("express");
const router = express.Router();
const {
  createRequest,
  approveRequest,
  rejectRequest,
  requestChanges,
  resubmitRequest,
  cancelRequest,
  getUserRequests,
  getAllRequestsAdmin,
  forceApproveRequest,
  forceRejectRequest,
  getAdminStats,
} = require("../controller/RequestController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

// ============ ADMIN ROUTES ============
// Lấy tất cả đơn (Admin)
router.get("/admin/all", authenticate, authorize("Admin"), getAllRequestsAdmin);

// Phê duyệt đơn bất kỳ (Admin bypass approval flow)
router.put("/admin/:requestId/force-approve", authenticate, authorize("Admin"), forceApproveRequest);

// Từ chối đơn bất kỳ (Admin)
router.put("/admin/:requestId/force-reject", authenticate, authorize("Admin"), forceRejectRequest);

// Lấy thống kê (Admin)
router.get("/admin/stats", authenticate, authorize("Admin"), getAdminStats);

// ============ USER ROUTES ============
// Tạo và gửi đơn
router.post("/create", authenticate, createRequest);

// Lấy đơn
router.get(
  "/",
  authenticate,
  // authorize(["Employee", "Manager", "Admin"]),
  getUserRequests
);

// Hủy đơn (do người gửi thực hiện)
router.put("/:requestId/cancel", authenticate, cancelRequest);

// Phê duyệt đơn
router.put("/:requestId/approve", authenticate, approveRequest);

// Từ chối đơn
router.put("/:requestId/reject", authenticate, rejectRequest);

// Yêu cầu chỉnh sửa
router.put("/:requestId/change-request", authenticate, requestChanges);

// Gửi lại đơn sau khi chỉnh sửa
router.put("/:requestId/resubmit", authenticate, resubmitRequest);

module.exports = router;
