const mongoose = require("mongoose");
const User = mongoose.model("User");
const Department = mongoose.model("Department");

const approvalStepSchema = new mongoose.Schema({
  level: {
    type: Number,
    required: [true, "Cấp phê duyệt là bắt buộc"],
    min: 1,
  },
  approverType: {
    type: String,
    required: true,
    enum: ["DIRECT_MANAGER", "SPECIFIC_DEPARTMENT_HEAD", "SPECIFIC_USER"],
    default: "SPECIFIC_USER",
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
  },
  approverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  displayName: {
    type: String,
    required: [true, "Tên hiển thị là bắt buộc"],
    trim: true,
  },
  isRequired: {
    type: Boolean,
    default: true,
  },
});

const workflowSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tên quy trình là bắt buộc"],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    requestType: {
      type: String,
      required: [true, "Loại đơn áp dụng là bắt buộc"],
      enum: [
        "Leave",
        "Overtime",
        "RemoteWork",
        "Resignation",
        "BusinessTrip",
        "Equipment",
        "ITSupport",
        "HRDocument",
        "Expense",
        "Other",
      ],
      unique: true,
    },
    approvalFlow: [approvalStepSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    applicableDepartments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ===== INDEXES =====
workflowSchema.index({ requestType: 1, isActive: 1 });
workflowSchema.index({ isActive: 1 });

// ===== METHODS =====
workflowSchema.methods.resolveApprovers = async function (user) {
  const resolvedApprovers = [];

  for (const step of this.approvalFlow) {
    let approver = null;

    switch (step.approverType) {
      case "DIRECT_MANAGER":
        // Employee: Dùng manager_id (người quản lý trực tiếp)
        if (user.role === "Employee") {
          if (user.manager_id) {
            approver = await User.findById(user.manager_id).select(
              "_id full_name email avatar"
            );
          } else {
            throw new Error("Employee phải có người quản lý trực tiếp");
          }
        } 
        // Manager: Tự động chuyển lên Admin để duyệt
        else if (user.role === "Manager") {
          approver = await User.findOne({ role: "Admin" }).select(
            "_id full_name email avatar"
          );
          if (!approver) {
            throw new Error("Không tìm thấy Admin để duyệt đơn của Manager");
          }
        } 
        // Admin: Không được gửi đơn (đã được block ở RequestController)
        else {
          throw new Error("Admin không được tạo đơn yêu cầu");
        }
        break;

      case "SPECIFIC_DEPARTMENT_HEAD":
        if (step.departmentId) {
          const dept = await Department.findById(step.departmentId);
          if (dept && dept.managerId) {
            approver = await User.findById(dept.managerId).select(
              "_id full_name email avatar"
            );
          }
        }
        break;

      case "SPECIFIC_USER":
        if (step.approverId) {
          approver = await User.findById(step.approverId).select(
            "_id full_name email avatar"
          );
        }
        break;

      default:
        throw new Error(`Loại approver không hợp lệ: ${step.approverType}`);
    }

    if (approver) {
      resolvedApprovers.push({
        level: step.level,
        approverId: approver._id,
        approverName: approver.full_name,
        approverEmail: approver.email,
        approverAvatar: approver.avatar,
        role: "Approver",
        status: "Pending",
      });
    } else if (step.isRequired) {
      throw new Error(
        `Không tìm thấy người duyệt cho bước "${step.displayName}"`
      );
    }
  }

  return resolvedApprovers;
};

workflowSchema.statics.getActiveWorkflow = async function (
  requestType,
  departmentId = null
) {
  let query = { requestType, isActive: true };

  if (departmentId) {
    const specificWorkflow = await this.findOne({
      ...query,
      applicableDepartments: departmentId,
    });
    if (specificWorkflow) return specificWorkflow;
  }

  return await this.findOne({
    ...query,
    $or: [
      { applicableDepartments: { $size: 0 } },
      { applicableDepartments: { $exists: false } },
    ],
  });
};

const Workflow = mongoose.model("Workflow", workflowSchema, "Workflow");
module.exports = Workflow;
