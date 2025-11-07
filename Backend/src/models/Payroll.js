const mongoose = require("mongoose");

const payrollSchema = new mongoose.Schema(
  {
    // ===== EMPLOYEE REFERENCE =====
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Employee ID là bắt buộc"],
      index: true,
    },
    
    // ===== PERIOD =====
    month: {
      type: Number,
      required: [true, "Tháng là bắt buộc"],
      min: 1,
      max: 12,
      index: true,
    },
    year: {
      type: Number,
      required: [true, "Năm là bắt buộc"],
      min: 2020,
      max: 2100,
      index: true,
    },
    period: {
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
    },
    
    // ===== LƯƠNG CƠ BẢN =====
    baseSalary: {
      type: Number,
      required: [true, "Lương cơ bản là bắt buộc"],
      min: 0,
    },
    workingDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    standardWorkingDays: {
      type: Number,
      default: 22,
      min: 1,
    },
    actualBaseSalary: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // ===== TĂNG CA (OVERTIME) =====
    overtimeHours: {
      weekday: {
        type: Number,
        default: 0,
        min: 0,
      },
      weekend: {
        type: Number,
        default: 0,
        min: 0,
      },
      holiday: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    overtimeRates: {
      weekday: {
        type: Number,
        default: 1.5,
      },
      weekend: {
        type: Number,
        default: 2.0,
      },
      holiday: {
        type: Number,
        default: 3.0,
      },
    },
    overtimeAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // ===== TĂNG CA CHỜ DUYỆT (OVERTIME PENDING APPROVAL) =====
    overtimePending: {
      weekday: {
        type: Number,
        default: 0,
        min: 0,
      },
      weekend: {
        type: Number,
        default: 0,
        min: 0,
      },
      holiday: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    
    // ===== PHỤ CẤP (ALLOWANCES) - REMOVED (không dùng) =====
    // allowances: [],
    totalAllowances: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // ===== THƯỞNG (BONUSES) - REMOVED (không dùng) =====
    // bonuses: [],
    totalBonuses: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // ===== KHẤU TRỪ (DEDUCTIONS) - CHỈ GIỮ: Đi muộn, Về sớm, Vắng mặt =====
    deductions: [
      {
        type: {
          type: String,
          enum: ["Đi muộn", "Về sớm", "Vắng mặt"],
          required: true,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
        description: {
          type: String,
          trim: true,
        },
      },
    ],
    totalDeductions: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // ===== TỔNG KẾT =====
    grossSalary: {
      type: Number,
      default: 0,
      min: 0,
    },
    netSalary: {
      type: Number,
      default: 0,
      // ✅ Bỏ min: 0 để cho phép lương âm (trường hợp khấu trừ nhiều)
      // Lương âm = nhân viên nợ công ty (phải trả lại tiền)
    },
    
    // ===== TRẠNG THÁI =====
    status: {
      type: String,
      enum: ["Nháp", "Chờ duyệt", "Đã duyệt", "Đã thanh toán", "Từ chối"],
      default: "Nháp",
      index: true,
    },
    
    // ===== AUDIT TRAIL =====
    calculatedAt: {
      type: Date,
    },
    calculatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    rejectedAt: {
      type: Date,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    paidAt: {
      type: Date,
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    
    // ===== MANAGER REJECTION TRACKING =====
    rejectedByManager: {
      type: Boolean,
      default: false,
      index: true,
    },
    managerRejectionHistory: [
      {
        rejectedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        rejectedByName: {
          type: String,
        },
        rejectedAt: {
          type: Date,
          default: Date.now,
        },
        reason: {
          type: String,
          required: true,
        },
        resolvedAt: {
          type: Date,
        },
        resolvedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        resolvedAction: {
          type: String, // "Admin đã chỉnh sửa thủ công" hoặc "Admin đã duyệt (Override)"
        },
      },
    ],
    
    // ===== DAILY BREAKDOWN =====
    dailyBreakdown: [
      {
        date: {
          type: Number, // Day of month (1-31)
          required: true,
        },
        fullDate: {
          type: Date,
          required: true,
        },
        isWorkingDay: {
          type: Boolean,
          default: false,
        },
        isHoliday: {
          type: Boolean,
          default: false,
        },
        holidayName: {
          type: String,
        },
        checkIn: {
          type: String, // HH:mm format
        },
        checkOut: {
          type: String, // HH:mm format
        },
        status: {
          type: String, // Present, Late, Absent, On Leave, etc.
        },
        lateMinutes: {
          type: Number,
          default: 0,
        },
        earlyLeaveMinutes: {
          type: Number,
          default: 0,
        },
        workHours: {
          type: Number,
          default: 0,
        },
        otHours: {
          type: Number,
          default: 0,
        },
        otApproved: {
          type: Boolean,
          default: false,
        },
        otMultiplier: {
          type: Number,
          default: 0, // 1.5, 2.0, 3.0
        },
        dailySalary: {
          type: Number,
          default: 0,
        },
        otSalary: {
          type: Number,
          default: 0,
        },
        lateDeduction: {
          type: Number,
          default: 0,
        },
        earlyLeaveDeduction: {
          type: Number,
          default: 0,
        },
        dayTotal: {
          type: Number,
          default: 0,
        },
      },
    ],
    
    // ===== NOTES & ATTACHMENTS =====
    notes: {
      type: String,
      trim: true,
    },
    attachments: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// ===== INDEXES =====
payrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });
payrollSchema.index({ status: 1, month: 1, year: 1 });
payrollSchema.index({ calculatedAt: 1 });

// ===== VIRTUAL: Month/Year Display =====
payrollSchema.virtual("periodDisplay").get(function () {
  return `${this.month}/${this.year}`;
});

// ===== PRE-SAVE: Auto Calculate Totals =====
payrollSchema.pre("save", function (next) {
  // Allowances và Bonuses đã bị xóa - set về 0
  this.totalAllowances = 0;
  this.totalBonuses = 0;
  
  // Calculate total deductions
  this.totalDeductions = this.deductions.reduce((sum, item) => sum + item.amount, 0);
  
  // Calculate gross salary (chỉ gồm: baseSalary + overtime)
  this.grossSalary = 
    this.actualBaseSalary + 
    this.overtimeAmount;
  
  // Calculate net salary (actual + overtime - deductions)
  this.netSalary = Math.round(
    (this.actualBaseSalary + this.overtimeAmount - this.totalDeductions) * 100
  ) / 100;
  
  next();
});

// ===== STATIC METHODS =====

// Get payroll by employee and period
payrollSchema.statics.findByEmployeeAndPeriod = function (employeeId, month, year) {
  return this.findOne({ employeeId, month, year })
    .populate("employeeId", "full_name email employeeId department jobTitle avatar")
    .populate("calculatedBy", "full_name email")
    .populate("approvedBy", "full_name email")
    .populate("paidBy", "full_name email");
};

// Get all payrolls for a specific month/year
payrollSchema.statics.findByPeriod = function (month, year) {
  return this.find({ month, year })
    .populate("employeeId", "full_name email employeeId department jobTitle avatar")
    .sort({ "employeeId.full_name": 1 });
};

// Get pending approvals
payrollSchema.statics.findPendingApprovals = function () {
  return this.find({ status: "Pending" })
    .populate("employeeId", "full_name email employeeId department jobTitle avatar")
    .sort({ created_at: 1 });
};

// ===== INSTANCE METHODS =====

// Format currency
payrollSchema.methods.formatCurrency = function (amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

// Get breakdown summary
payrollSchema.methods.getBreakdown = function () {
  return {
    period: this.periodDisplay,
    baseSalary: this.actualBaseSalary,
    overtime: this.overtimeAmount,
    // allowances và bonuses đã bị xóa
    deductions: this.totalDeductions,
    gross: this.grossSalary,
    net: this.netSalary,
  };
};

const Payroll = mongoose.model("Payroll", payrollSchema);

module.exports = Payroll;
