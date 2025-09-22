const mongoose = require("mongoose");

const workScheduleSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    user_name: {
      type: String,
      required: true,
      trim: true,
    },
    department_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    department_name: {
      type: String,
      trim: true,
    },
    start_time: {
      type: Date,
      required: [true, "Thời gian bắt đầu là bắt buộc"],
    },
    end_time: {
      type: Date,
      required: [true, "Thời gian kết thúc là bắt buộc"],
    },
    description: {
      type: String,
      trim: true,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    created_by_name: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Active", "Cancelled", "Completed"],
      default: "Active",
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Validate that end_time is after start_time
workScheduleSchema.pre('save', function(next) {
  if (this.start_time && this.end_time && this.start_time >= this.end_time) {
    next(new Error('Thời gian kết thúc phải sau thời gian bắt đầu.'));
  } else {
    next();
  }
});


// Indexes để tối ưu hóa truy vấn
workScheduleSchema.index({ user_id: 1 });
workScheduleSchema.index({ department_id: 1 });
workScheduleSchema.index({ created_by: 1 });
workScheduleSchema.index({ start_time: 1, end_time: 1 }); // Index kết hợp để tìm lịch trong khoảng thời gian

const WorkSchedule = mongoose.model("WorkSchedule", workScheduleSchema, "WorkSchedule");

module.exports = WorkSchedule;