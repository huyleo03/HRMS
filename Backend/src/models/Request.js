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
    comments: [
      {
        commentId: {
          type: String,
          default: () => crypto.randomUUID(),
        },
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        userName: String,
        userAvatar: String,
        content: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ===== THREAD - Thêm mới =====
    threadId: {
      type: String,
      index: true,
    },
    inReplyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
      default: null,
    },

    // ===== TRẠNG THÁI NGƯỜI GỬI - Thêm mới =====
    senderStatus: {
      isDraft: {
        type: Boolean,
        default: false,
      },
      isStarred: {
        type: Boolean,
        default: false,
      },
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

// Tự động tạo threadId
requestSchema.pre("save", function (next) {
  if (this.isNew && !this.threadId) {
    this.threadId = this.inReplyTo ? undefined : this.requestId;
  }
  next();
});

// Set sentAt khi gửi
requestSchema.pre("save", function (next) {
  if (!this.senderStatus.isDraft && !this.sentAt) {
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

  // Reset tất cả approver về Pending
  this.approvalFlow.forEach((approver) => {
    if (approver.role === "Approver") {
      approver.status = "Pending";
      approver.comment = "";
      approver.approvedAt = null;
      approver.isRead = false;
      approver.readAt = null;
    }
  });

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

// Thêm comment
requestSchema.methods.addComment = function (
  userId,
  userName,
  userAvatar,
  content
) {
  this.comments.push({
    userId,
    userName,
    userAvatar,
    content,
    createdAt: new Date(),
  });
  return this.save();
};

// Toggle star
requestSchema.methods.toggleStar = function (userId) {
  if (this.submittedBy.toString() === userId.toString()) {
    this.senderStatus.isStarred = !this.senderStatus.isStarred;
  }
  return this.save();
};

// ===== INDEXES =====
requestSchema.index({ requestId: 1 });
requestSchema.index({ submittedBy: 1 });
requestSchema.index({ status: 1 });
requestSchema.index({ "department.department_id": 1 }); // ✅ CẬP NHẬT
requestSchema.index({ "approvalFlow.approverId": 1 });
requestSchema.index({ threadId: 1 });
requestSchema.index({ sentAt: -1 });
requestSchema.index({ type: 1 });

const Request = mongoose.model("Request", requestSchema, "Request");

module.exports = Request;
