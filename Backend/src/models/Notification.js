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
      enum: ["TaskAssigned", "RequestApproved", "RequestRejected", "AttendanceUpdate", "General"],
      required: true,
    },
    // Can refer to a Task, Request, Attendance, etc.
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
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
    targetUserIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
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
    readBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

// Indexes để tối ưu hóa truy vấn
notificationSchema.index({ userId: 1, isRead: 0 }); // Find unread notifications for a user
notificationSchema.index({ departmentId: 1 });
notificationSchema.index({ targetAudience: 1 });
notificationSchema.index({ targetUserIds: 1 }); // Find notifications for specific users
notificationSchema.index({ type: 1 });

const Notification = mongoose.model("Notification", notificationSchema, "Notification");

module.exports = Notification;