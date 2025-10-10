const mongoose = require("mongoose");

// ===== SUB-SCHEMA: APPROVAL STEP =====
const approvalStepSchema = new mongoose.Schema({
  level: {
    type: Number,
    required: [true, "Cấp phê duyệt là bắt buộc"],
    min: 1,
  },

  // Loại người duyệt (Dynamic)
  approverType: {
    type: String,
    required: true,
    enum: [
      "DIRECT_MANAGER", // Quản lý trực tiếp của người gửi
      "DEPARTMENT_HEAD", // Trưởng phòng của người gửi
      "SPECIFIC_DEPARTMENT_HEAD", // Trưởng của một phòng ban cụ thể
      "SPECIFIC_USER", // Một người dùng cụ thể
    ],
    default: "SPECIFIC_USER",
  },

  // Dùng khi approverType = 'SPECIFIC_DEPARTMENT_HEAD'
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
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

// ===== MAIN SCHEMA: WORKFLOW =====
const workflowSchema = new mongoose.Schema(
  {
    // Tên workflow
    name: {
      type: String,
      required: [true, "Tên quy trình là bắt buộc"],
      trim: true,
      unique: true,
    },

    // Mô tả workflow
    description: {
      type: String,
      trim: true,
    },

    // Loại đơn áp dụng (phải khớp với Request.type)
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
      unique: true, // Mỗi loại đơn chỉ có 1 workflow active
    },

    // Luồng phê duyệt
    approvalFlow: [approvalStepSchema],

    // Trạng thái kích hoạt
    isActive: {
      type: Boolean,
      default: true,
    },

    // Áp dụng cho phòng ban cụ thể (optional - nếu muốn có workflow khác nhau cho từng phòng)
    applicableDepartments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
      },
    ],

    // Người tạo workflow
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Người cập nhật cuối
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
  const User = mongoose.model("User");
  const Department = mongoose.model("Department");

  const resolvedApprovers = [];

  for (const step of this.approvalFlow) {
    let approver = null;

    switch (step.approverType) {
      case "DIRECT_MANAGER":
        if (user.manager_id) {
          approver = await User.findById(user.manager_id).select(
            "_id full_name email avatar"
          );
        }
        break;

      case "DEPARTMENT_HEAD":
        if (user.department?.department_id) {
          const dept = await Department.findById(user.department.department_id);
          if (dept && dept.manager) {
            approver = await User.findById(dept.manager).select(
              "_id full_name email avatar"
            );
          }
        }
        break;

      case "SPECIFIC_DEPARTMENT_HEAD":
        if (step.departmentId) {
          const dept = await Department.findById(step.departmentId);
          if (dept && dept.manager) {
            approver = await User.findById(dept.manager).select(
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

  // Nếu có departmentId, ưu tiên workflow cho phòng ban đó
  if (departmentId) {
    const specificWorkflow = await this.findOne({
      ...query,
      applicableDepartments: departmentId,
    });
    if (specificWorkflow) return specificWorkflow;
  }

  // Nếu không có workflow riêng, lấy workflow chung
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
