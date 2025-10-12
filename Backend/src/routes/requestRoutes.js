const express = require("express");
const router = express.Router();
const {
  createRequest,
  approveRequest,
  rejectRequest,
  requestChanges,
  resubmitRequest,
  cancelRequest,
} = require("../controller/RequestController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

// Tạo và gửi đơn
router.post("/create",authenticate, createRequest);

// Phê duyệt đơn
router.post("/:requestId/approve", approveRequest);

// Từ chối đơn
router.post("/:requestId/reject", rejectRequest);

// Yêu cầu chỉnh sửa
router.post("/:requestId/request-changes", requestChanges);

// Gửi lại đơn sau khi chỉnh sửa
router.put("/:requestId/resubmit", resubmitRequest);

// Hủy đơn
router.post("/:requestId/cancel", cancelRequest);

module.exports = router;