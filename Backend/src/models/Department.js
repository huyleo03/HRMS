const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    department_name: {
      type: String,
      required: [true, "Tên phòng ban là bắt buộc"],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      default: null,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

departmentSchema.index({ department_name: 1 }, { unique: true });

const Department = mongoose.model("Department", departmentSchema, "Department");

module.exports = Department;
