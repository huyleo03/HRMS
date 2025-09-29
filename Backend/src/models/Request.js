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
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
    departmentName: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ["Leave", "Overtime", "RemoteWork", "Resignation"],
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
    },
    hour: {
      type: Number,
      min: 0,
    },
    attachments: [
      {
        type: String, // Lưu URL của tệp đính kèm
      },
    ],
    status: {
      type: String,
      enum: ["Pending", "Manager_Approved", "Approved", "Rejected", "Cancelled"],
      default: "Pending",
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
        status: {
          type: String,
          enum: ["Approved", "Rejected"],
          required: true,
        },
        comment: {
          type: String,
          trim: true,
        },
        approvedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);


requestSchema.pre("save", function (next) {
  if (this.isNew && !this.requestId) {
    this.requestId = crypto.randomUUID();
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

// Indexes để tối ưu hóa truy vấn
requestSchema.index({ requestId: 1 });
requestSchema.index({ submittedBy: 1 });
requestSchema.index({ status: 1 });
requestSchema.index({ departmentId: 1 });
requestSchema.index({ "approvalFlow.approverId": 1 });

const Request = mongoose.model("Request", requestSchema, "Request");

module.exports = Request;