const mongoose = require("mongoose");

const salaryAdjustmentSchema = new mongoose.Schema(
  {
    // ===== EMPLOYEE REFERENCE =====
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Employee ID là bắt buộc"],
      index: true,
    },
    
    // ===== SALARY CHANGE =====
    oldSalary: {
      type: Number,
      required: [true, "Lương cũ là bắt buộc"],
      min: 0,
    },
    newSalary: {
      type: Number,
      required: [true, "Lương mới là bắt buộc"],
      min: 0,
    },
    adjustmentAmount: {
      type: Number,
      default: 0,
    },
    adjustmentPercentage: {
      type: Number,
      default: 0,
    },
    
    // ===== TYPE & REASON =====
    adjustmentType: {
      type: String,
      enum: ["Promotion", "Annual", "Performance", "Market", "Demotion", "Other"],
      required: [true, "Loại điều chỉnh là bắt buộc"],
    },
    reason: {
      type: String,
      required: [true, "Lý do là bắt buộc"],
      trim: true,
    },
    
    // ===== EFFECTIVE DATE =====
    effectiveDate: {
      type: Date,
      required: [true, "Ngày hiệu lực là bắt buộc"],
      index: true,
    },
    
    // ===== APPROVAL =====
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
      index: true,
    },
    proposedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    rejectedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    
    // ===== ATTACHMENTS & NOTES =====
    attachments: [
      {
        type: String,
        trim: true,
      },
    ],
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// ===== INDEXES =====
salaryAdjustmentSchema.index({ employeeId: 1, effectiveDate: -1 });
salaryAdjustmentSchema.index({ status: 1, created_at: -1 });
salaryAdjustmentSchema.index({ adjustmentType: 1 });

// ===== PRE-SAVE: Calculate adjustment amount and percentage =====
salaryAdjustmentSchema.pre("save", function (next) {
  this.adjustmentAmount = this.newSalary - this.oldSalary;
  this.adjustmentPercentage = 
    this.oldSalary > 0 
      ? Math.round((this.adjustmentAmount / this.oldSalary) * 10000) / 100 
      : 0;
  next();
});

// ===== POST-SAVE: Update User salary if approved =====
salaryAdjustmentSchema.post("save", async function (doc) {
  if (doc.status === "Approved" && doc.isModified("status")) {
    try {
      const User = mongoose.model("User");
      await User.findByIdAndUpdate(doc.employeeId, {
        salary: doc.newSalary,
      });
      console.log(`✅ Cập nhật lương cho employee ${doc.employeeId}: $${doc.newSalary}`);
    } catch (error) {
      console.error("❌ Lỗi cập nhật lương:", error);
    }
  }
});

// ===== STATIC METHODS =====

// Get adjustment history for employee
salaryAdjustmentSchema.statics.findByEmployee = function (employeeId) {
  return this.find({ employeeId })
    .populate("proposedBy", "full_name email")
    .populate("approvedBy", "full_name email")
    .populate("rejectedBy", "full_name email")
    .sort({ effectiveDate: -1 });
};

// Get pending approvals
salaryAdjustmentSchema.statics.findPendingApprovals = function () {
  return this.find({ status: "Pending" })
    .populate("employeeId", "full_name email employeeId department jobTitle")
    .populate("proposedBy", "full_name email")
    .sort({ created_at: 1 });
};

// Get adjustments by type
salaryAdjustmentSchema.statics.findByType = function (adjustmentType) {
  return this.find({ adjustmentType, status: "Approved" })
    .populate("employeeId", "full_name email employeeId department")
    .sort({ effectiveDate: -1 });
};

// ===== INSTANCE METHODS =====

// Approve adjustment
salaryAdjustmentSchema.methods.approve = function (approvedBy) {
  this.status = "Approved";
  this.approvedBy = approvedBy;
  this.approvedAt = new Date();
  this.rejectedBy = null;
  this.rejectedAt = null;
  this.rejectionReason = null;
  return this.save();
};

// Reject adjustment
salaryAdjustmentSchema.methods.reject = function (rejectedBy, rejectionReason) {
  this.status = "Rejected";
  this.rejectedBy = rejectedBy;
  this.rejectedAt = new Date();
  this.rejectionReason = rejectionReason;
  this.approvedBy = null;
  this.approvedAt = null;
  return this.save();
};

// Get display info
salaryAdjustmentSchema.methods.getDisplayInfo = function () {
  const isIncrease = this.adjustmentAmount >= 0;
  return {
    type: this.adjustmentType,
    change: `${isIncrease ? "+" : ""}$${Math.abs(this.adjustmentAmount)}`,
    percentage: `${isIncrease ? "+" : ""}${this.adjustmentPercentage}%`,
    from: `$${this.oldSalary}`,
    to: `$${this.newSalary}`,
    status: this.status,
  };
};

const SalaryAdjustment = mongoose.model("SalaryAdjustment", salaryAdjustmentSchema);

module.exports = SalaryAdjustment;
