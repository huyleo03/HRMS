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
} = require("../controller/RequestController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

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
router.put("/:requestId/request-changes", authenticate, requestChanges);

// Gửi lại đơn sau khi chỉnh sửa
router.put("/:requestId/resubmit", authenticate, resubmitRequest);

module.exports = router;
