const mongoose = require("mongoose");
const crypto = require("crypto");

const requestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      unique: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    submittedByName: {
      type: String,
      required: true,
      trim: true,
    },
    submittedByEmail: {
      type: String,
      trim: true,
    },
    submittedByAvatar: {
      type: String,
    },
    department: {
      department_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
      },
      department_name: {
        type: String,
        trim: true,
      },
    },
    type: {
      type: String,
      enum: [
        "Leave", // Nghỉ phép
        "Overtime", // Tăng ca
        "RemoteWork", // Làm từ xa
        "Resignation", // Nghỉ việc
        "BusinessTrip", // Công tác
        "Equipment", // Thiết bị
        "ITSupport", // Hỗ trợ IT
        "HRDocument", // Tài liệu HR
        "Expense", // Chi phí
        "Other", // Khác
      ],
      required: [true, "Loại yêu cầu là bắt buộc"],
    },
    subject: {
      type: String,
      trim: true,
      maxlength: [200, "Tiêu đề không được vượt quá 200 ký tự"],
    },

    reason: {
      type: String,
      required: [true, "Lý do là bắt buộc"],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, "Ngày bắt đầu là bắt buộc"],
    },
    endDate: {
      type: Date,
    },
    hour: {
      type: Number,
      min: 0,
    },
    attachments: [
      {
        fileName: {
          type: String,
          required: true,
        },
        fileUrl: {
          type: String,
          required: true,
        },
        fileSize: {
          type: Number,
        },
        fileType: {
          type: String,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ===== TRẠNG THÁI =====
    status: {
      type: String,
      enum: [
        "Pending", // Chờ duyệt
        "NeedsReview", // Cần chỉnh sửa
        "Manager_Approved", // Manager đã duyệt
        "Approved", // Đã duyệt
        "Rejected", // Từ chối
        "Cancelled", // Đã hủy
        "Completed", // Hoàn thành
      ],
      default: "Pending",
    },
    priority: {
      type: String,
      enum: ["Low", "Normal", "High", "Urgent"],
      default: "Normal",
    },
    approvalFlow: [
      {
        level: {
          type: Number,
          required: true,
        },
        approverId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        approverName: {
          type: String,
          required: true,
        },
        approverEmail: {
          type: String,
        },
        role: {
          type: String,
          enum: ["Approver", "Reviewer", "Notified"],
          default: "Approver",
        },
        status: {
          type: String,
          enum: ["Pending", "Approved", "Rejected", "NeedsReview"],
          default: "Pending",
        },
        comment: {
          type: String,
          trim: true,
        },
        approvedAt: {
          type: Date,
        },
        isRead: {
          type: Boolean,
          default: false,
        },
        readAt: {
          type: Date,
        },
      },
    ],
    cc: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // ===== HISTORY - Lịch sử thay đổi (cho Override) =====
    history: [
      {
        action: {
          type: String,
          enum: ["Override", "Escalate", "Reopen"],
        },
        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        performedByName: {
          type: String,
        },
        oldStatus: {
          type: String,
        },
        newStatus: {
          type: String,
        },
        comment: {
          type: String,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ===== TRẠNG THÁI NGƯỜI GỬI =====
    senderStatus: {
      isDeleted: {
        type: Boolean,
        default: false,
      },
      deletedAt: {
        type: Date,
      },
      cancelledAt: {
        type: Date,
      },
      cancelReason: {
        type: String,
      },
    },

    // ===== NGÀY GIỜ GỬI =====
    sentAt: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// ===== HOOKS =====

// Tự động tạo requestId
requestSchema.pre("save", function (next) {
  if (this.isNew && !this.requestId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    this.requestId = `REQ-${timestamp}-${random}`.toUpperCase();
  }
  next();
});

// Set sentAt khi gửi (luôn set nếu chưa có)
requestSchema.pre("save", function (next) {
  if (this.isNew && !this.sentAt) {
    this.sentAt = new Date();
  }
  next();
});

// Validate ngày kết thúc phải sau ngày bắt đầu
requestSchema.pre("save", function (next) {
  if (this.startDate && this.endDate && this.startDate > this.endDate) {
    next(new Error("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu."));
  } else {
    next();
  }
});

// Tự động cập nhật status dựa trên approvalFlow
requestSchema.pre("save", function (next) {
  const specialStatuses = ["Cancelled", "NeedsReview", "Completed"];
  if (specialStatuses.includes(this.status)) {
    return next();
  }
  if (this.approvalFlow && this.approvalFlow.length > 0) {
    const approvers = this.approvalFlow.filter((a) => a.role === "Approver");
    if (approvers.length > 0) {
      const allApproved = approvers.every((a) => a.status === "Approved");
      const anyRejected = approvers.some((a) => a.status === "Rejected");
      if (anyRejected) {
        this.status = "Rejected";
      } else if (allApproved) {
        this.status = "Approved";
      } else if (this.sentAt) {
        this.status = "Pending";
      }
    }
  }
  next();
});

// ===== METHODS =====

// Yêu cầu chỉnh sửa
requestSchema.methods.requestChanges = function (userId, comment = "") {
  const approver = this.approvalFlow.find(
    (a) =>
      a.approverId.toString() === userId.toString() && a.role === "Approver"
  );

  if (!approver) {
    throw new Error("User không có quyền yêu cầu chỉnh sửa đơn này");
  }

  if (!comment || comment.trim() === "") {
    throw new Error("Vui lòng cung cấp lý do cần chỉnh sửa");
  }

  approver.status = "NeedsReview";
  approver.comment = comment;
  approver.approvedAt = new Date();
  this.status = "NeedsReview";

  return this.save();
};

// Gửi lại đơn sau khi chỉnh sửa
requestSchema.methods.resubmit = function (userId) {
  if (this.submittedBy.toString() !== userId.toString()) {
    throw new Error("Chỉ người gửi mới có thể gửi lại đơn");
  }

  if (this.status !== "NeedsReview") {
    throw new Error("Chỉ có thể gửi lại đơn đang ở trạng thái 'Cần Chỉnh Sửa'");
  }

  // ✅ SMART RESUBMIT: Chỉ reset approver đã yêu cầu chỉnh sửa
  // Giữ nguyên status của approvers đã Approved
  let hasNeedsReview = false;
  
  this.approvalFlow.forEach((approver) => {
    if (approver.role === "Approver") {
      // Chỉ reset approver đã yêu cầu chỉnh sửa
      if (approver.status === "NeedsReview") {
        approver.status = "Pending";
        approver.comment = ""; // Clear old comment
        approver.approvedAt = null;
        approver.isRead = false;
        approver.readAt = null;
        hasNeedsReview = true;
      }
      // ✅ GIỮ NGUYÊN approvers đã Approved - Không làm mất progress!
      // Không reset approver.status === "Approved"
    }
  });

  if (!hasNeedsReview) {
    throw new Error("Không tìm thấy approver nào đã yêu cầu chỉnh sửa");
  }

  this.status = "Pending";
  this.sentAt = new Date();

  return this.save();
};

// Đánh dấu đã đọc
requestSchema.methods.markAsRead = function (userId) {
  const approver = this.approvalFlow.find(
    (a) => a.approverId.toString() === userId.toString()
  );
  if (approver && !approver.isRead) {
    approver.isRead = true;
    approver.readAt = new Date();
  }

  const ccRecipient = this.cc.find(
    (c) => c.userId.toString() === userId.toString()
  );
  if (ccRecipient && !ccRecipient.isRead) {
    ccRecipient.isRead = true;
    ccRecipient.readAt = new Date();
  }

  return this.save();
};

// Phê duyệt
requestSchema.methods.approve = function (userId, comment = "") {
  const approver = this.approvalFlow.find(
    (a) =>
      a.approverId.toString() === userId.toString() && a.role === "Approver"
  );

  if (!approver) {
    throw new Error("User không có quyền phê duyệt đơn này");
  }

  if (approver.status !== "Pending") {
    // ✅ Cải thiện error message
    if (approver.status === "Approved") {
      throw new Error("Bạn đã phê duyệt đơn này rồi. Vui lòng refresh trang để cập nhật.");
    } else if (approver.status === "Rejected") {
      throw new Error("Bạn đã từ chối đơn này rồi. Không thể phê duyệt lại.");
    } else if (approver.status === "Needs Review") {
      throw new Error("Bạn đã yêu cầu chỉnh sửa đơn này. Vui lòng chờ người gửi cập nhật.");
    }
    throw new Error("Đơn này đã được xử lý rồi");
  }

  approver.status = "Approved";
  approver.comment = comment;
  approver.approvedAt = new Date();

  return this.save();
};

// Từ chối
requestSchema.methods.reject = function (userId, comment = "") {
  const approver = this.approvalFlow.find(
    (a) =>
      a.approverId.toString() === userId.toString() && a.role === "Approver"
  );

  if (!approver) {
    throw new Error("User không có quyền từ chối đơn này");
  }

  if (approver.status !== "Pending") {
    // ✅ Cải thiện error message
    if (approver.status === "Rejected") {
      throw new Error("Bạn đã từ chối đơn này rồi. Vui lòng refresh trang để cập nhật.");
    } else if (approver.status === "Approved") {
      throw new Error("Bạn đã phê duyệt đơn này rồi. Không thể từ chối lại.");
    } else if (approver.status === "Needs Review") {
      throw new Error("Bạn đã yêu cầu chỉnh sửa đơn này. Vui lòng chờ người gửi cập nhật.");
    }
    throw new Error("Đơn này đã được xử lý rồi");
  }

  if (!comment || comment.trim() === "") {
    throw new Error("Vui lòng cung cấp lý do từ chối");
  }

  approver.status = "Rejected";
  approver.comment = comment;
  approver.approvedAt = new Date();

  return this.save();
};

// Hủy đơn
requestSchema.methods.cancel = function (userId, comment = "") {
  if (this.submittedBy.toString() !== userId.toString()) {
    throw new Error("Chỉ người gửi mới có thể hủy đơn");
  }

  if (this.status === "Approved" || this.status === "Completed") {
    throw new Error("Không thể hủy đơn đã được duyệt hoặc hoàn thành");
  }

  if (this.status === "Rejected") {
    throw new Error("Không thể hủy đơn đã bị từ chối");
  }

  this.status = "Cancelled";
  this.senderStatus.cancelledAt = new Date();
  this.senderStatus.cancelReason = comment;

  return this.save();
};

// ===== OVERRIDE - GHI ĐÈ QUYẾT ĐỊNH (CHỈ ADMIN) =====
requestSchema.methods.override = async function (adminId, newStatus, comment = "") {
  const User = mongoose.model("User");
  const admin = await User.findById(adminId).select("role full_name avatar");
  
  // Chỉ Admin mới có quyền override
  if (!admin || admin.role !== "Admin") {
    throw new Error("Chỉ Admin mới có quyền ghi đè quyết định");
  }
  
  // Kiểm tra newStatus hợp lệ
  if (!["Pending", "Approved"].includes(newStatus)) {
    throw new Error("Status không hợp lệ. Chỉ chấp nhận 'Pending' hoặc 'Approved'");
  }
  
  // Không thể override đơn Cancelled hoặc Completed
  if (["Cancelled", "Completed"].includes(this.status)) {
    throw new Error("Không thể ghi đè đơn đã hủy hoặc hoàn thành");
  }
  
  if (!comment || comment.trim() === "") {
    throw new Error("Vui lòng cung cấp lý do ghi đè quyết định");
  }
  
  // Log lại lịch sử override
  if (!this.history) {
    this.history = [];
  }
  
  this.history.push({
    action: "Override",
    performedBy: adminId,
    performedByName: admin.full_name,
    oldStatus: this.status,
    newStatus: newStatus,
    comment: comment,
    timestamp: new Date()
  });
  
  if (newStatus === "Pending") {
    // Reset tất cả approvers về Pending
    this.approvalFlow.forEach(approver => {
      if (approver.role === "Approver") {
        approver.status = "Pending";
        approver.comment = "";
        approver.approvedAt = null;
      }
    });
    this.status = "Pending";
  } else if (newStatus === "Approved") {
    // Approve tất cả approvers
    this.approvalFlow.forEach(approver => {
      if (approver.role === "Approver") {
        approver.status = "Approved";
        approver.comment = `Admin override: ${comment}`;
        approver.approvedAt = new Date();
      }
    });
    this.status = "Approved";
  }
  
  return this.save();
};

// ===== ĐÁNH DẤU ĐÃ ĐỌC =====

// ✅ BASIC INDEXES
requestSchema.index({ requestId: 1 }, { unique: true });
requestSchema.index({ submittedBy: 1 });
requestSchema.index({ status: 1 });
requestSchema.index({ priority: 1 });
requestSchema.index({ type: 1 });
requestSchema.index({ "department.department_id": 1 });
requestSchema.index({ "approvalFlow.approverId": 1 });
requestSchema.index({ sentAt: -1 });

// ✅ COMPOUND INDEXES (Optimize common queries)
// Query: Get user's requests sorted by date
requestSchema.index({ submittedBy: 1, sentAt: -1 });

// Query: Filter by status + priority (Admin view)
requestSchema.index({ status: 1, priority: 1, sentAt: -1 });

// Query: Get pending requests for approver
requestSchema.index({ 
  "approvalFlow.approverId": 1, 
  "approvalFlow.status": 1, 
  sentAt: -1 
});

// Query: Department-based filtering
requestSchema.index({ 
  "department.department_id": 1, 
  status: 1, 
  sentAt: -1 
});

// Query: User's inbox (not deleted, sorted by date)
requestSchema.index({ 
  submittedBy: 1, 
  "senderStatus.isDeleted": 1, 
  sentAt: -1 
});

// ✅ TEXT INDEX (Full-text search on subject + reason)
requestSchema.index({ 
  subject: "text", 
  reason: "text",
  submittedByName: "text" 
}, {
  weights: {
    subject: 10,        // Subject has highest priority in search
    reason: 5,          // Reason medium priority
    submittedByName: 3  // Name lowest priority
  },
  name: "request_text_search"
});

// ✅ SPARSE INDEX (Only index non-null values)
requestSchema.index({ 
  "senderStatus.deletedAt": 1 
}, { 
  sparse: true  // Only index deleted requests
});

requestSchema.index({ 
  "senderStatus.cancelledAt": 1 
}, { 
  sparse: true  // Only index cancelled requests
});

// ===== POST SAVE HOOK: CẬP NHẬT ATTENDANCE KHI OT REQUEST APPROVED =====
requestSchema.post("save", async function(doc) {
  try {
    // Chỉ xử lý khi Request type = Overtime và status = Approved
    if (doc.type === "Overtime" && doc.status === "Approved") {
      const Attendance = mongoose.model("Attendance");
      const Payroll = mongoose.model("Payroll");
      
      // Lấy startDate và endDate từ request
      const startDate = new Date(doc.startDate);
      const endDate = doc.endDate ? new Date(doc.endDate) : startDate;
      
      // Chuẩn hóa về đầu ngày để so sánh chính xác
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      
      // Tìm tất cả attendance records trong khoảng thời gian và của user này
      const attendanceRecords = await Attendance.find({
        userId: doc.submittedBy,
        date: {
          $gte: startDate,
          $lte: endDate
        }
      });
      
      // Cập nhật overtimeApproved = true cho tất cả records tìm được
      if (attendanceRecords.length > 0) {
        await Attendance.updateMany(
          {
            userId: doc.submittedBy,
            date: {
              $gte: startDate,
              $lte: endDate
            }
          },
          {
            $set: {
              overtimeApproved: true,
              approvedOvertimeRequestId: doc._id
            }
          }
        );
        
        console.log(`✅ Updated ${attendanceRecords.length} attendance record(s) with approved OT for Request ${doc.requestId}`);
        
        // ===== RECALCULATE PAYROLL FOR THE AFFECTED MONTH(S) =====
        const monthsToRecalculate = new Set();
        attendanceRecords.forEach(att => {
          const attDate = new Date(att.date);
          const monthKey = `${attDate.getFullYear()}-${attDate.getMonth() + 1}`;
          monthsToRecalculate.add(monthKey);
        });
        
        // Recalculate payroll for each affected month
        for (const monthKey of monthsToRecalculate) {
          const [year, month] = monthKey.split('-').map(Number);
          
          // Find existing payroll
          const existingPayroll = await Payroll.findOne({
            employeeId: doc.submittedBy,
            month: month,
            year: year
          });
          
          if (existingPayroll) {
            console.log(`🔄 Recalculating payroll for ${year}-${month} after OT approval...`);
            
            // Trigger recalculation by calling PayrollController's calculatePayroll
            // Note: We need to import and call it properly
            try {
              const PayrollController = require('../controller/PayrollController');
              await PayrollController.recalculatePayrollForEmployee(doc.submittedBy, month, year);
              console.log(`✅ Recalculated payroll for ${year}-${month}`);
            } catch (recalcError) {
              console.error(`❌ Error recalculating payroll for ${year}-${month}:`, recalcError.message);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("❌ Error updating attendance after OT approval:", error);
    // Không throw error để tránh rollback transaction
  }
});

const Request = mongoose.model("Request", requestSchema, "Request");

module.exports = Request;
