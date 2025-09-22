const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Leave", "Overtime", "RemoteWork"],
      required: [true, "Loại yêu cầu là bắt buộc"],
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
      default: null,
    },
    hour: {
      type: Number,
      default: null,
      min: 0,
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
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedByName: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    denialReason: {
      type: String,
      trim: true,
      default: null,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    departmentName: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Validate that endDate is after startDate if it exists
requestSchema.pre('save', function(next) {
  if (this.startDate && this.endDate && this.startDate > this.endDate) {
    next(new Error('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.'));
  } else {
    next();
  }
});

// Indexes để tối ưu hóa truy vấn
requestSchema.index({ submittedBy: 1 });
requestSchema.index({ reviewedBy: 1 });
requestSchema.index({ status: 1 });
requestSchema.index({ departmentId: 1 });

const Request = mongoose.model("Request", requestSchema , "Request");

module.exports = Request;