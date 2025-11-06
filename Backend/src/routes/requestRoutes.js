const express = require("express");
const router = express.Router();
const {
  createRequest,
  approveRequest,
  rejectRequest,
  requestChanges,
  resubmitRequest,
  cancelRequest,
  overrideRequest,
  getUserRequests,
  getAllRequestsAdmin,
  forceApproveRequest,
  forceRejectRequest,
  getAdminStats,
  getRequestCounts,
  getMyApprovedLeavesForCalendar,
  getAllCompanyLeavesForCalendar,
} = require("../controller/RequestController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

// ✅ IMPORT VALIDATION MIDDLEWARE
const {
  validateCreateRequest,
  validateComment,
  validateResubmitRequest,
  validateObjectId,
  sanitizeSearchQuery,
} = require("../middlewares/validationMiddleware");

// ✅ IMPORT RATE LIMITING MIDDLEWARE
const {
  strictLimiter,
  searchLimiter,
  adminLimiter,
  uploadLimiter,
} = require("../middlewares/rateLimitMiddleware");

// ============ ADMIN ROUTES ============
// Lấy tất cả đơn (Admin)
router.get(
  "/admin/all",
  authenticate,
  authorize("Admin"),
  searchLimiter, // ✅ Rate limit searches
  sanitizeSearchQuery, // ✅ Validate search params
  getAllRequestsAdmin
);

// Phê duyệt đơn bất kỳ (Admin bypass approval flow)
router.put(
  "/admin/:requestId/force-approve",
  authenticate,
  authorize("Admin"),
  adminLimiter, // ✅ Rate limit admin operations
  validateObjectId("requestId"), // ✅ Validate requestId
  validateComment, // ✅ Validate comment
  forceApproveRequest
);

// Từ chối đơn bất kỳ (Admin)
router.put(
  "/admin/:requestId/force-reject",
  authenticate,
  authorize("Admin"),
  adminLimiter, // ✅ Rate limit admin operations
  validateObjectId("requestId"), // ✅ Validate requestId
  validateComment, // ✅ Validate comment (required for reject)
  forceRejectRequest
);

// Lấy thống kê (Admin)
router.get("/admin/stats", authenticate, authorize("Admin"), getAdminStats);

// Lấy counts cho sidebar badges (All roles)
router.get("/counts", authenticate, getRequestCounts);


// ============ USER ROUTES ============
// Tạo và gửi đơn
router.post(
  "/create",
  authenticate,
  strictLimiter, // ✅ Rate limit: 10 requests/minute
  uploadLimiter, // ✅ Rate limit uploads: 20/hour
  validateCreateRequest, // ✅ Validate request payload
  createRequest
);

// Lấy đơn
router.get(
  "/",
  authenticate,
  searchLimiter, // ✅ Rate limit searches
  sanitizeSearchQuery, // ✅ Sanitize search params
  getUserRequests
);

// Hủy đơn (do người gửi thực hiện)
router.put(
  "/:requestId/cancel",
  authenticate,
  strictLimiter, // ✅ Rate limit: 10 requests/minute
  validateObjectId("requestId"), // ✅ Validate requestId
  validateComment, // ✅ Validate comment
  cancelRequest
);

// Phê duyệt đơn
router.put(
  "/:requestId/approve",
  authenticate,
  strictLimiter, // ✅ Rate limit: 10 requests/minute
  validateObjectId("requestId"), // ✅ Validate requestId
  validateComment, // ✅ Validate comment
  approveRequest
);

// Từ chối đơn
router.put(
  "/:requestId/reject",
  authenticate,
  strictLimiter, // ✅ Rate limit: 10 requests/minute
  validateObjectId("requestId"), // ✅ Validate requestId
  validateComment, // ✅ Validate comment (required)
  rejectRequest
);

// Yêu cầu chỉnh sửa
router.put(
  "/:requestId/change-request",
  authenticate,
  strictLimiter, // ✅ Rate limit: 10 requests/minute
  validateObjectId("requestId"), // ✅ Validate requestId
  validateComment, // ✅ Validate comment (required)
  requestChanges
);

// Gửi lại đơn sau khi chỉnh sửa
router.put(
  "/:requestId/resubmit",
  authenticate,
  strictLimiter, // ✅ Rate limit: 10 requests/minute
  validateObjectId("requestId"), // ✅ Validate requestId
  validateResubmitRequest, // ✅ Validate resubmit payload
  resubmitRequest
);

// ✅ GHI ĐÈ QUYẾT ĐỊNH (Admin only)
router.put(
  "/:requestId/override",
  authenticate,
  authorize("Admin"),  // Chỉ Admin
  strictLimiter,
  validateObjectId("requestId"),
  validateComment,  // Validate comment (required)
  overrideRequest
);

// ✅ LẤY APPROVED LEAVES CÁ NHÂN (CHO CALENDAR)
// Manager và Employee chỉ xem nghỉ phép của CHÍNH MÌNH
router.get(
  "/my-approved-leaves/calendar",
  authenticate,
  authorize("Manager", "Employee"), // Manager và Employee
  getMyApprovedLeavesForCalendar
);

// ✅ LẤY TẤT CẢ APPROVED LEAVES TOÀN CÔNG TY (CHO ADMIN)
router.get(
  "/all-company-leaves/calendar",
  authenticate,
  authorize("Admin"), // Chỉ Admin
  getAllCompanyLeavesForCalendar
);

module.exports = router;
