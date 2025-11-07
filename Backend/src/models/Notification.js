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
        "Payroll",
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
      enum: ["Individual", "All", "Department"],
      required: true,
    },
    // For 'Individual' audience
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // For 'Individual' notifications
    isRead: {
      type: Boolean,
      default: false,
    },
    // For 'All', 'Department' notifications
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

// Indexes để tối ưu hóa truy vấn
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ targetAudience: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model(
  "Notification",
  notificationSchema,
  "Notification"
);

module.exports = Notification;