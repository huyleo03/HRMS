/**
 * Rate Limiting Middleware
 * Ngăn chặn spam và DDoS attacks bằng cách giới hạn số lượng request
 */

const rateLimit = require('express-rate-limit');

/**
 * General Rate Limiter - Áp dụng cho hầu hết các API endpoints
 * Giới hạn: 200 requests mỗi 15 phút (tăng từ 100)
 */
exports.generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 200, // Giới hạn 200 requests mỗi windowMs (tăng từ 100)
  message: {
    message: "Quá nhiều request từ IP này, vui lòng thử lại sau 15 phút.",
    error: "RATE_LIMIT_EXCEEDED"
  },
  standardHeaders: true, // Trả về rate limit info trong `RateLimit-*` headers
  legacyHeaders: false, // Tắt `X-RateLimit-*` headers
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  // Key generator - sử dụng IP address với trust proxy
  keyGenerator: (req) => {
    // req.ip sẽ lấy IP thật nhờ 'trust proxy' trong app.js
    return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  },
  // Handler khi vượt quá limit
  handler: (req, res) => {
    console.warn(`⚠️ Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      message: "Quá nhiều request từ IP này, vui lòng thử lại sau.",
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000),
      error: "RATE_LIMIT_EXCEEDED"
    });
  },
});

/**
 * Strict Rate Limiter - Cho các critical operations
 * Giới hạn: 30 requests mỗi 1 phút (tăng từ 10)
 * Áp dụng cho: Create Request, Approve, Reject, Cancel
 */
exports.strictLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 30, // Giới hạn 30 requests mỗi phút (tăng từ 10 - cho phép thao tác nhanh hơn)
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
    return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  },
  handler: (req, res) => {
    console.warn(`⚠️ Strict rate limit exceeded for user: ${req.user?.userId || req.ip}`);
    res.status(429).json({
      message: "Bạn đang thực hiện thao tác quá nhanh. Vui lòng đợi 1 phút.",
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000),
      error: "STRICT_RATE_LIMIT_EXCEEDED"
    });
  },
});

/**
 * Auth Rate Limiter - Cho login/authentication endpoints
 * Giới hạn: 10 attempts mỗi 15 phút (tăng từ 5)
 * Ngăn chặn brute force attacks nhưng không quá khắt khe
 */
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 10, // Giới hạn 10 login attempts (tăng từ 5 - ít bị khóa nhầm)
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
    return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  },
  handler: (req, res) => {
    console.warn(`⚠️ Auth rate limit exceeded for: ${req.body?.email || req.ip}`);
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
 * Giới hạn: 60 searches mỗi 1 phút (tăng từ 30)
 * Ngăn chặn expensive search queries spam
 */
exports.searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 60, // Giới hạn 60 searches mỗi phút (tăng từ 30)
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
    return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  },
  handler: (req, res) => {
    console.warn(`⚠️ Search rate limit exceeded for user: ${req.user?.userId || req.ip}`);
    res.status(429).json({
      message: "Bạn đang tìm kiếm quá nhanh. Vui lòng đợi 1 phút.",
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000),
      error: "SEARCH_RATE_LIMIT_EXCEEDED"
    });
  },
});

/**
 * Admin Operations Rate Limiter
 * Giới hạn: 100 operations mỗi 5 phút (tăng từ 50)
 * Áp dụng cho: Create/Update/Delete workflows, departments, users
 */
exports.adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 phút
  max: 100, // Giới hạn 100 operations (tăng từ 50)
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
    return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  },
  handler: (req, res) => {
    console.warn(`⚠️ Admin rate limit exceeded for user: ${req.user?.userId || req.ip}`);
    res.status(429).json({
      message: "Quá nhiều thao tác quản trị. Vui lòng thực hiện từ từ.",
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000),
      error: "ADMIN_RATE_LIMIT_EXCEEDED"
    });
  },
});

/**
 * Polling Rate Limiter - Cho real-time polling endpoints
 * Giới hạn: 150 requests mỗi 1 giờ (≈ 2.5 requests/phút)
 * 
 * MỤC ĐÍCH:
 * - Bảo vệ khỏi abuse (user mở quá nhiều tab, hack polling interval)
 * - Cho phép polling bình thường (30 giây = 2 requests/phút = 120 requests/giờ)
 * - Buffer thêm 30 requests để tránh false positive
 * 
 * TÍNH TOÁN:
 * - Polling interval: 30 giây
 * - Requests/phút: 2
 * - Requests/giờ: 120
 * - Buffer: +30 (cho network delay, retry, multiple tabs)
 * - Total: 150 requests/giờ
 * 
 * LƯU Ý: Rate limiter này RẤT LỎI - chỉ để ngăn abuse
 */
exports.pollingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 150, // 150 requests/giờ (polling bình thường = 120, buffer = 30)
  message: {
    message: "Polling quá nhiều. Vui lòng kiểm tra lại ứng dụng.",
    error: "POLLING_RATE_LIMIT_EXCEEDED"
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: (req) => {
    // Sử dụng userId để track per-user polling
    if (req.user && req.user.userId) {
      return `polling_${req.user.userId}`;
    }
    return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  },
  handler: (req, res) => {
    console.warn(`⚠️ Polling rate limit exceeded for user: ${req.user?.userId || req.ip}`);
    res.status(429).json({
      message: "Hệ thống phát hiện polling bất thường. Vui lòng liên hệ support.",
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000),
      error: "POLLING_RATE_LIMIT_EXCEEDED",
      details: "Có thể bạn đang mở quá nhiều tab hoặc ứng dụng gặp lỗi."
    });
  },
});
