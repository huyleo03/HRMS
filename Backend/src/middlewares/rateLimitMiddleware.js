/**
 * Rate Limiting Middleware
 * Ngăn chặn spam và DDoS attacks bằng cách giới hạn số lượng request
 */

const rateLimit = require('express-rate-limit');

/**
 * General Rate Limiter - Áp dụng cho hầu hết các API endpoints
 * Giới hạn: 100 requests mỗi 15 phút
 */
exports.generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // Giới hạn 100 requests mỗi windowMs
  message: {
    message: "Quá nhiều request từ IP này, vui lòng thử lại sau 15 phút.",
    error: "RATE_LIMIT_EXCEEDED"
  },
  standardHeaders: true, // Trả về rate limit info trong `RateLimit-*` headers
  legacyHeaders: false, // Tắt `X-RateLimit-*` headers
  // Skip successful requests (chỉ đếm failed requests)
  skipSuccessfulRequests: false,
  // Skip failed requests
  skipFailedRequests: false,
  // Key generator - sử dụng IP address
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  },
  // Handler khi vượt quá limit
  handler: (req, res) => {
    res.status(429).json({
      message: "Quá nhiều request từ IP này, vui lòng thử lại sau.",
      retryAfter: req.rateLimit.resetTime,
    });
  },
});

/**
 * Strict Rate Limiter - Cho các critical operations
 * Giới hạn: 10 requests mỗi 1 phút
 * Áp dụng cho: Create Request, Approve, Reject, Cancel
 */
exports.strictLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 10, // Giới hạn 10 requests mỗi phút
  message: {
    message: "Quá nhiều thao tác trong thời gian ngắn. Vui lòng đợi 1 phút.",
    error: "STRICT_RATE_LIMIT_EXCEEDED"
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  // Sử dụng userId thay vì IP (authenticated users)
  keyGenerator: (req) => {
    if (req.user && req.user.userId) {
      return `user_${req.user.userId}`;
    }
    return req.ip || req.connection.remoteAddress;
  },
  handler: (req, res) => {
    res.status(429).json({
      message: "Bạn đang thực hiện thao tác quá nhanh. Vui lòng đợi 1 phút.",
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000),
      error: "STRICT_RATE_LIMIT_EXCEEDED"
    });
  },
});

/**
 * Auth Rate Limiter - Cho login/authentication endpoints
 * Giới hạn: 5 attempts mỗi 15 phút
 * Ngăn chặn brute force attacks
 */
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5, // Giới hạn 5 login attempts
  message: {
    message: "Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.",
    error: "AUTH_RATE_LIMIT_EXCEEDED"
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Chỉ đếm failed login attempts
  skipFailedRequests: false,
  keyGenerator: (req) => {
    // Sử dụng email/username từ request body
    if (req.body && req.body.email) {
      return `auth_${req.body.email}`;
    }
    return req.ip || req.connection.remoteAddress;
  },
  handler: (req, res) => {
    res.status(429).json({
      message: "Quá nhiều lần đăng nhập thất bại. Tài khoản tạm thời bị khóa.",
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000),
      error: "AUTH_RATE_LIMIT_EXCEEDED",
      details: "Vui lòng thử lại sau 15 phút hoặc liên hệ admin."
    });
  },
});

/**
 * File Upload Rate Limiter
 * Giới hạn: 20 uploads mỗi 1 giờ
 */
exports.uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 20, // Giới hạn 20 uploads mỗi giờ
  message: {
    message: "Quá nhiều file uploads. Vui lòng thử lại sau 1 giờ.",
    error: "UPLOAD_RATE_LIMIT_EXCEEDED"
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: (req) => {
    if (req.user && req.user.userId) {
      return `upload_${req.user.userId}`;
    }
    return req.ip || req.connection.remoteAddress;
  },
  handler: (req, res) => {
    res.status(429).json({
      message: "Bạn đã upload quá nhiều file. Vui lòng thử lại sau.",
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000),
      error: "UPLOAD_RATE_LIMIT_EXCEEDED"
    });
  },
});

/**
 * Search Rate Limiter
 * Giới hạn: 30 searches mỗi 1 phút
 * Ngăn chặn expensive search queries spam
 */
exports.searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 30, // Giới hạn 30 searches mỗi phút
  message: {
    message: "Quá nhiều tìm kiếm. Vui lòng đợi 1 phút.",
    error: "SEARCH_RATE_LIMIT_EXCEEDED"
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: (req) => {
    if (req.user && req.user.userId) {
      return `search_${req.user.userId}`;
    }
    return req.ip || req.connection.remoteAddress;
  },
  handler: (req, res) => {
    res.status(429).json({
      message: "Bạn đang tìm kiếm quá nhanh. Vui lòng đợi 1 phút.",
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000),
      error: "SEARCH_RATE_LIMIT_EXCEEDED"
    });
  },
});

/**
 * Admin Operations Rate Limiter
 * Giới hạn: 50 operations mỗi 5 phút
 * Áp dụng cho: Create/Update/Delete workflows, departments, users
 */
exports.adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 phút
  max: 50, // Giới hạn 50 operations
  message: {
    message: "Quá nhiều thao tác quản trị. Vui lòng đợi 5 phút.",
    error: "ADMIN_RATE_LIMIT_EXCEEDED"
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: (req) => {
    if (req.user && req.user.userId) {
      return `admin_${req.user.userId}`;
    }
    return req.ip || req.connection.remoteAddress;
  },
  handler: (req, res) => {
    res.status(429).json({
      message: "Quá nhiều thao tác quản trị. Vui lòng thực hiện từ từ.",
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000),
      error: "ADMIN_RATE_LIMIT_EXCEEDED"
    });
  },
});
