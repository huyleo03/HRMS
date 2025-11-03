const mongoose = require("mongoose");

const payrollTemplateSchema = new mongoose.Schema(
  {
    // ===== BASIC INFO =====
    name: {
      type: String,
      required: [true, "Tên template là bắt buộc"],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    
    // ===== APPLIES TO =====
    type: {
      type: String,
      enum: ["Role", "Department", "Individual"],
      required: [true, "Loại template là bắt buộc"],
    },
    appliesTo: {
      role: {
        type: String,
        enum: ["Admin", "Manager", "Employee"],
      },
      departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
    
    // ===== DEFAULT ALLOWANCES =====
    defaultAllowances: [
      {
        type: {
          type: String,
          enum: ["Transport", "Housing", "Meal", "Phone", "Position", "Other"],
          required: true,
        },
        amount: {
          type: Number,
          default: 0,
          min: 0,
        },
        isPercentage: {
          type: Boolean,
          default: false,
        },
        percentage: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },
        description: {
          type: String,
          trim: true,
        },
      },
    ],
    
    // ===== DEFAULT DEDUCTIONS =====
    defaultDeductions: [
      {
        type: {
          type: String,
          enum: ["Tax", "Insurance", "Other"],
          required: true,
        },
        amount: {
          type: Number,
          default: 0,
          min: 0,
        },
        isPercentage: {
          type: Boolean,
          default: false,
        },
        percentage: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },
        description: {
          type: String,
          trim: true,
        },
      },
    ],
    
    // ===== RULES =====
    rules: {
      lateDeductionPerMinute: {
        type: Number,
        default: 0,
        min: 0,
      },
      absentDeductionPerDay: {
        type: Number,
        default: 0,
        min: 0,
      },
      earlyLeaveDeductionPerMinute: {
        type: Number,
        default: 0,
        min: 0,
      },
      minWorkDaysForFullSalary: {
        type: Number,
        default: 20,
        min: 1,
        max: 31,
      },
    },
    
    // ===== STATUS =====
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    
    // ===== AUDIT =====
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
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// ===== INDEXES =====
payrollTemplateSchema.index({ type: 1, status: 1 });
payrollTemplateSchema.index({ "appliesTo.role": 1 });
payrollTemplateSchema.index({ "appliesTo.departmentId": 1 });
payrollTemplateSchema.index({ "appliesTo.userId": 1 });

// ===== STATIC METHODS =====

// Find template for a specific user
payrollTemplateSchema.statics.findForUser = async function (userId) {
  const User = mongoose.model("User");
  const user = await User.findById(userId);
  
  if (!user) return null;
  
  // Priority 1: Individual template
  let template = await this.findOne({
    type: "Individual",
    "appliesTo.userId": userId,
    status: "Active",
  });
  
  if (template) return template;
  
  // Priority 2: Department template
  if (user.department?.department_id) {
    template = await this.findOne({
      type: "Department",
      "appliesTo.departmentId": user.department.department_id,
      status: "Active",
    });
    
    if (template) return template;
  }
  
  // Priority 3: Role template
  template = await this.findOne({
    type: "Role",
    "appliesTo.role": user.role,
    status: "Active",
  });
  
  return template;
};

// Calculate allowances for a user based on template
payrollTemplateSchema.methods.calculateAllowances = function (baseSalary) {
  return this.defaultAllowances.map((allowance) => {
    const amount = allowance.isPercentage
      ? (baseSalary * allowance.percentage) / 100
      : allowance.amount;
    
    return {
      type: allowance.type,
      amount: Math.round(amount * 100) / 100,
      description: allowance.description || `${allowance.type} allowance`,
    };
  });
};

// Calculate deductions for a user based on template
payrollTemplateSchema.methods.calculateDeductions = function (grossSalary) {
  return this.defaultDeductions.map((deduction) => {
    const amount = deduction.isPercentage
      ? (grossSalary * deduction.percentage) / 100
      : deduction.amount;
    
    return {
      type: deduction.type,
      amount: Math.round(amount * 100) / 100,
      description: deduction.description || `${deduction.type} deduction`,
    };
  });
};

const PayrollTemplate = mongoose.model("PayrollTemplate", payrollTemplateSchema);

module.exports = PayrollTemplate;
