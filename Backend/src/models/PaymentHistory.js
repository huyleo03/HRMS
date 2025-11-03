const mongoose = require("mongoose");

const paymentHistorySchema = new mongoose.Schema(
  {
    // ===== REFERENCE =====
    payrollId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payroll",
      required: [true, "Payroll ID là bắt buộc"],
      index: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Employee ID là bắt buộc"],
      index: true,
    },
    
    // ===== PAYMENT INFO =====
    amount: {
      type: Number,
      required: [true, "Số tiền là bắt buộc"],
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["BankTransfer", "Cash", "Check", "E-Wallet"],
      required: [true, "Phương thức thanh toán là bắt buộc"],
    },
    paymentDate: {
      type: Date,
      required: [true, "Ngày thanh toán là bắt buộc"],
      index: true,
    },
    transactionId: {
      type: String,
      trim: true,
    },
    
    // ===== BANK DETAILS =====
    bankDetails: {
      bankName: {
        type: String,
        trim: true,
      },
      accountNumber: {
        type: String,
        trim: true,
      },
      accountName: {
        type: String,
        trim: true,
      },
    },
    
    // ===== STATUS =====
    status: {
      type: String,
      enum: ["Pending", "Success", "Failed", "Cancelled"],
      default: "Pending",
      index: true,
    },
    
    // ===== AUDIT =====
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    notes: {
      type: String,
      trim: true,
    },
    receiptUrl: {
      type: String,
      trim: true,
    },
    
    // ===== ERROR HANDLING =====
    errorMessage: {
      type: String,
      trim: true,
    },
    retryCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// ===== INDEXES =====
paymentHistorySchema.index({ payrollId: 1, status: 1 });
paymentHistorySchema.index({ employeeId: 1, paymentDate: -1 });
paymentHistorySchema.index({ paymentMethod: 1, status: 1 });

// ===== STATIC METHODS =====

// Get payment history for employee
paymentHistorySchema.statics.findByEmployee = function (employeeId, limit = 10) {
  return this.find({ employeeId })
    .populate("payrollId", "month year netSalary")
    .populate("paidBy", "full_name email")
    .sort({ paymentDate: -1 })
    .limit(limit);
};

// Get payment history for a specific month/year
paymentHistorySchema.statics.findByPeriod = async function (month, year) {
  const Payroll = mongoose.model("Payroll");
  const payrolls = await Payroll.find({ month, year }).select("_id");
  const payrollIds = payrolls.map((p) => p._id);
  
  return this.find({ payrollId: { $in: payrollIds } })
    .populate("employeeId", "full_name email employeeId department")
    .populate("paidBy", "full_name email")
    .sort({ paymentDate: -1 });
};

// Get failed payments
paymentHistorySchema.statics.findFailed = function () {
  return this.find({ status: "Failed" })
    .populate("employeeId", "full_name email")
    .populate("payrollId", "month year netSalary")
    .sort({ created_at: -1 });
};

// ===== INSTANCE METHODS =====

// Mark as success
paymentHistorySchema.methods.markAsSuccess = function (transactionId, receiptUrl) {
  this.status = "Success";
  this.transactionId = transactionId;
  this.receiptUrl = receiptUrl;
  this.errorMessage = null;
  return this.save();
};

// Mark as failed
paymentHistorySchema.methods.markAsFailed = function (errorMessage) {
  this.status = "Failed";
  this.errorMessage = errorMessage;
  this.retryCount += 1;
  return this.save();
};

const PaymentHistory = mongoose.model("PaymentHistory", paymentHistorySchema);

module.exports = PaymentHistory;
