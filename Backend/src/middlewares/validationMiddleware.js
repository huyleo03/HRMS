const validator = require("validator");

/**
 * ===== INPUT VALIDATION & SANITIZATION MIDDLEWARE =====
 * Prevent XSS, SQL Injection, and malicious input
 */

// ===== HELPER FUNCTIONS =====

/**
 * Sanitize string - Remove HTML tags and trim
 */
const sanitizeString = (str) => {
  if (typeof str !== "string") return str;
  
  // Remove HTML tags
  let clean = str.replace(/<[^>]*>/g, "");
  
  // Escape special characters
  clean = validator.escape(clean);
  
  // Trim whitespace
  clean = clean.trim();
  
  return clean;
};

/**
 * Validate and sanitize email
 */
const sanitizeEmail = (email) => {
  if (!email) return null;
  
  const trimmed = email.trim().toLowerCase();
  
  if (!validator.isEmail(trimmed)) {
    throw new Error(`Email không hợp lệ: ${email}`);
  }
  
  return validator.normalizeEmail(trimmed);
};

/**
 * Validate URL
 */
const validateURL = (url) => {
  if (!url) return true;
  
  return validator.isURL(url, {
    protocols: ["http", "https"],
    require_protocol: true,
  });
};

/**
 * Sanitize array of strings
 */
const sanitizeStringArray = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr.map((item) => sanitizeString(item)).filter(Boolean);
};

// ===== VALIDATION MIDDLEWARE =====

/**
 * Validate CREATE REQUEST payload
 */
exports.validateCreateRequest = (req, res, next) => {
  try {
    const {
      type,
      subject,
      reason,
      startDate,
      endDate,
      hour,
      priority,
      attachments,
      cc,
    } = req.body;

    // ===== VALIDATE REQUIRED FIELDS =====
    if (!type) {
      return res.status(400).json({ message: "Loại đơn là bắt buộc" });
    }

    if (!reason || reason.trim() === "") {
      return res.status(400).json({ message: "Lý do là bắt buộc" });
    }

    if (!startDate) {
      return res.status(400).json({ message: "Ngày bắt đầu là bắt buộc" });
    }

    // ===== VALIDATE ENUM VALUES =====
    const validTypes = [
      "Leave",
      "Overtime",
      "RemoteWork",
      "Resignation",
      "BusinessTrip",
      "Equipment",
      "ITSupport",
      "HRDocument",
      "Expense",
      "Other",
    ];

    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: `Loại đơn không hợp lệ: ${type}` });
    }

    const validPriorities = ["Low", "Normal", "High", "Urgent"];
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({ message: `Mức độ ưu tiên không hợp lệ: ${priority}` });
    }

    // ===== SANITIZE STRING INPUTS =====
    req.body.subject = subject ? sanitizeString(subject) : "";
    req.body.reason = sanitizeString(reason);

    // ===== VALIDATE DATES =====
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      return res.status(400).json({ message: "Ngày bắt đầu không hợp lệ" });
    }

    if (endDate) {
      const end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return res.status(400).json({ message: "Ngày kết thúc không hợp lệ" });
      }

      if (end < start) {
        return res.status(400).json({
          message: "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu",
        });
      }
    }

    // ===== VALIDATE HOUR =====
    if (hour !== undefined && hour !== null && hour !== "") {
      const hourNum = Number(hour);
      if (isNaN(hourNum) || hourNum < 0 || hourNum > 24) {
        return res.status(400).json({
          message: "Số giờ phải từ 0 đến 24",
        });
      }
    }

    // ===== VALIDATE ATTACHMENTS =====
    if (attachments && Array.isArray(attachments)) {
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      const ALLOWED_TYPES = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];

      for (const file of attachments) {
        // Validate file URL
        if (!file.fileUrl || !validateURL(file.fileUrl)) {
          return res.status(400).json({
            message: `URL file không hợp lệ: ${file.fileName}`,
          });
        }

        // Validate file size
        if (file.fileSize && file.fileSize > MAX_FILE_SIZE) {
          return res.status(400).json({
            message: `File "${file.fileName}" vượt quá kích thước cho phép (10MB)`,
          });
        }

        // Validate file type
        if (file.fileType && !ALLOWED_TYPES.includes(file.fileType)) {
          return res.status(400).json({
            message: `Loại file không được hỗ trợ: ${file.fileType}`,
          });
        }

        // Sanitize filename
        file.fileName = sanitizeString(file.fileName);
      }

      req.body.attachments = attachments;
    }

    // ===== VALIDATE CC LIST =====
    if (cc && Array.isArray(cc)) {
      for (const recipient of cc) {
        if (!recipient.userId || !validator.isMongoId(recipient.userId)) {
          return res.status(400).json({
            message: "CC user ID không hợp lệ",
          });
        }
      }
    }

    next();
  } catch (error) {
    console.error("❌ Validation error:", error);
    return res.status(400).json({
      message: error.message || "Dữ liệu không hợp lệ",
    });
  }
};

/**
 * Validate APPROVE/REJECT/REQUEST_CHANGES comment
 */
exports.validateComment = (req, res, next) => {
  try {
    const { comment } = req.body;

    // Sanitize comment
    if (comment) {
      req.body.comment = sanitizeString(comment);

      // Validate length
      if (req.body.comment.length > 1000) {
        return res.status(400).json({
          message: "Nhận xét không được vượt quá 1000 ký tự",
        });
      }
    }

    next();
  } catch (error) {
    console.error("❌ Validation error:", error);
    return res.status(400).json({
      message: error.message || "Dữ liệu không hợp lệ",
    });
  }
};

/**
 * Validate RESUBMIT REQUEST payload
 */
exports.validateResubmitRequest = (req, res, next) => {
  try {
    const { subject, reason, startDate, endDate, hour, attachments } = req.body;

    // Sanitize strings
    if (subject) {
      req.body.subject = sanitizeString(subject);
    }

    if (reason) {
      req.body.reason = sanitizeString(reason);
    }

    // Validate dates if provided
    if (startDate) {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        return res.status(400).json({ message: "Ngày bắt đầu không hợp lệ" });
      }

      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          return res.status(400).json({ message: "Ngày kết thúc không hợp lệ" });
        }

        if (end < start) {
          return res.status(400).json({
            message: "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu",
          });
        }
      }
    }

    // Validate hour
    if (hour !== undefined && hour !== null && hour !== "") {
      const hourNum = Number(hour);
      if (isNaN(hourNum) || hourNum < 0 || hourNum > 24) {
        return res.status(400).json({
          message: "Số giờ phải từ 0 đến 24",
        });
      }
    }

    // Validate attachments
    if (attachments && Array.isArray(attachments)) {
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

      for (const file of attachments) {
        if (!file.fileUrl || !validateURL(file.fileUrl)) {
          return res.status(400).json({
            message: `URL file không hợp lệ: ${file.fileName}`,
          });
        }

        if (file.fileSize && file.fileSize > MAX_FILE_SIZE) {
          return res.status(400).json({
            message: `File "${file.fileName}" vượt quá kích thước cho phép (10MB)`,
          });
        }

        file.fileName = sanitizeString(file.fileName);
      }

      req.body.attachments = attachments;
    }

    next();
  } catch (error) {
    console.error("❌ Validation error:", error);
    return res.status(400).json({
      message: error.message || "Dữ liệu không hợp lệ",
    });
  }
};

/**
 * Validate MongoDB ObjectId
 */
exports.validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];

    if (!validator.isMongoId(id)) {
      return res.status(400).json({
        message: `${paramName} không hợp lệ`,
      });
    }

    next();
  };
};

/**
 * Sanitize query parameters for search
 */
exports.sanitizeSearchQuery = (req, res, next) => {
  try {
    const { search, status, priority, type } = req.query;

    // Sanitize search string
    if (search) {
      req.query.search = sanitizeString(search);

      // Prevent too long search queries
      if (req.query.search.length > 200) {
        return res.status(400).json({
          message: "Từ khóa tìm kiếm quá dài (tối đa 200 ký tự)",
        });
      }
    }

    // Validate enum values
    const validStatuses = [
      "Pending",
      "NeedsReview",
      "Manager_Approved",
      "Approved",
      "Rejected",
      "Cancelled",
      "Completed",
    ];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Trạng thái không hợp lệ: ${status}`,
      });
    }

    const validPriorities = ["Low", "Normal", "High", "Urgent"];
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({
        message: `Mức độ ưu tiên không hợp lệ: ${priority}`,
      });
    }

    const validTypes = [
      "Leave",
      "Overtime",
      "RemoteWork",
      "Resignation",
      "BusinessTrip",
      "Equipment",
      "ITSupport",
      "HRDocument",
      "Expense",
      "Other",
    ];

    if (type && !validTypes.includes(type)) {
      return res.status(400).json({
        message: `Loại đơn không hợp lệ: ${type}`,
      });
    }

    next();
  } catch (error) {
    console.error("❌ Validation error:", error);
    return res.status(400).json({
      message: error.message || "Dữ liệu không hợp lệ",
    });
  }
};

module.exports = exports;
