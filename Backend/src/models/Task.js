const mongoose = require("mongoose");

const assignedUserSchema = new mongoose.Schema({
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
}, {_id: false}); 

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Tiêu đề task là bắt buộc"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    deadline: {
      type: Date,
      required: [true, "Thời hạn hoàn thành là bắt buộc"],
    },
    assignedTo: [assignedUserSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdByName: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["To Do", "In Progress", "Completed"],
      default: "To Do",
    },
    startTime: {
      type: Date,
    },
    completionTime: {
      type: Date,
      default: null,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium",
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Indexes để tối ưu hóa truy vấn
taskSchema.index({ createdBy: 1 });
taskSchema.index({ "assignedTo.user_id": 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ deadline: 1 });


const Task = mongoose.model("Task", taskSchema, "Task");

module.exports = Task;