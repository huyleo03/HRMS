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
  getArchivedRequests,
  restoreArchivedRequest,
  getArchivingStats,
  runArchiving,
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

// ✅ IMPORT AUDIT LOGGING MIDDLEWARE
const {
  logRequestCreation,
  logRequestApproval,
  logRequestRejection,
  logRequestChanges,
  logRequestResubmit,
  logRequestCancellation,
} = require("../middlewares/auditMiddleware");

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
  logRequestApproval, // ✅ Audit log
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
  logRequestRejection, // ✅ Audit log
  forceRejectRequest
);

// Lấy thống kê (Admin)
router.get("/admin/stats", authenticate, authorize("Admin"), getAdminStats);

// Lấy archived requests (Admin)
router.get(
  "/admin/archived",
  authenticate,
  authorize("Admin"),
  searchLimiter, // ✅ Rate limit searches
  getArchivedRequests
);

// Restore archived request (Admin)
router.post(
  "/admin/archived/:archivedRequestId/restore",
  authenticate,
  authorize("Admin"),
  adminLimiter, // ✅ Rate limit admin operations
  validateObjectId("archivedRequestId"), // ✅ Validate archivedRequestId
  restoreArchivedRequest
);

// Get archiving statistics (Admin)
router.get(
  "/admin/archiving/stats",
  authenticate,
  authorize("Admin"),
  getArchivingStats
);

// Manually trigger archiving (Admin)
router.post(
  "/admin/archiving/run",
  authenticate,
  authorize("Admin"),
  adminLimiter, // ✅ Rate limit admin operations
  runArchiving
);


// ============ USER ROUTES ============
// Tạo và gửi đơn
router.post(
  "/create",
  authenticate,
  strictLimiter, // ✅ Rate limit: 10 requests/minute
  uploadLimiter, // ✅ Rate limit uploads: 20/hour
  validateCreateRequest, // ✅ Validate request payload
  logRequestCreation, // ✅ Audit log
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
  logRequestCancellation, // ✅ Audit log
  cancelRequest
);

// Phê duyệt đơn
router.put(
  "/:requestId/approve",
  authenticate,
  strictLimiter, // ✅ Rate limit: 10 requests/minute
  validateObjectId("requestId"), // ✅ Validate requestId
  validateComment, // ✅ Validate comment
  logRequestApproval, // ✅ Audit log
  approveRequest
);

// Từ chối đơn
router.put(
  "/:requestId/reject",
  authenticate,
  strictLimiter, // ✅ Rate limit: 10 requests/minute
  validateObjectId("requestId"), // ✅ Validate requestId
  validateComment, // ✅ Validate comment (required)
  logRequestRejection, // ✅ Audit log
  rejectRequest
);

// Yêu cầu chỉnh sửa
router.put(
  "/:requestId/change-request",
  authenticate,
  strictLimiter, // ✅ Rate limit: 10 requests/minute
  validateObjectId("requestId"), // ✅ Validate requestId
  validateComment, // ✅ Validate comment (required)
  logRequestChanges, // ✅ Audit log
  requestChanges
);

// Gửi lại đơn sau khi chỉnh sửa
router.put(
  "/:requestId/resubmit",
  authenticate,
  strictLimiter, // ✅ Rate limit: 10 requests/minute
  validateObjectId("requestId"), // ✅ Validate requestId
  validateResubmitRequest, // ✅ Validate resubmit payload
  logRequestResubmit, // ✅ Audit log
  resubmitRequest
);

module.exports = router;
