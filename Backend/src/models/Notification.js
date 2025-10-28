const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: [true, "Nội dung thông báo là bắt buộc"],
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "TaskAssigned",
        "RequestApproved",
        "RequestRejected",
        "RequestNeedsReview",
        "RequestResubmitted",
        "RequestCancelled",
        "RequestOverride",
        "NewRequest",
        "AttendanceUpdate",
        "General",
        "RequestUpdate",
      ],
      required: true,
    },
    // Can refer to a Task, Request, Attendance, etc.
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    // Thêm thông tin người gửi
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    senderName: {
      type: String,
      trim: true,
    },
    senderAvatar: {
      type: String,
    },
    targetAudience: {
      type: String,
      enum: ["Individual", "All", "Department", "SpecificUsers"],
      required: true,
    },
    // For 'Individual' audience
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    userName: {
      type: String,
      trim: true,
      default: null,
    },
    // For 'SpecificUsers' audience
    targetUserIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // For 'Department' audience
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    departmentName: {
      type: String,
      trim: true,
    },
    // For 'Individual' notifications
    isRead: {
      type: Boolean,
      default: false,
    },
    // For 'All', 'Department', 'SpecificUsers' notifications
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Metadata bổ sung
    metadata: {
      requestType: String,
      requestSubject: String,
      priority: String,
      actionUrl: String,
      comment: String, // ✅ THÊM MỚI - Lưu comment từ approver
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

// Indexes để tối ưu hóa truy vấn
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ departmentId: 1 });
notificationSchema.index({ targetAudience: 1 });
notificationSchema.index({ targetUserIds: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: -1 });

// ===== METHODS =====

// Đánh dấu đã đọc (cho Individual)
notificationSchema.methods.markAsRead = function () {
  if (this.targetAudience === "Individual") {
    this.isRead = true;
  }
  return this.save();
};

// Đánh dấu đã đọc cho user cụ thể (cho SpecificUsers/All/Department)
notificationSchema.methods.markAsReadByUser = function (userId) {
  if (!this.readBy.includes(userId)) {
    this.readBy.push(userId);
  }
  return this.save();
};

// ===== STATIC METHODS =====

// Tạo thông báo cho nhiều users
notificationSchema.statics.createForMultipleUsers = async function (
  userIds,
  notificationData
) {
  const notifications = userIds.map((userId) => ({
    ...notificationData,
    targetAudience: "Individual",
    userId: userId,
    isRead: false,
  }));
  return this.insertMany(notifications);
};

// Đánh dấu tất cả thông báo đã đọc
notificationSchema.statics.markAllAsReadForUser = async function (userId) {
  return this.updateMany(
    { userId: userId, isRead: false, targetAudience: "Individual" },
    { isRead: true }
  );
};

const Notification = mongoose.model(
  "Notification",
  notificationSchema,
  "Notification"
);

module.exports = Notification;