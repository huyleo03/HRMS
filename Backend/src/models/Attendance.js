const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    // ===== USER REFERENCE =====
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID là bắt buộc"],
      index: true,
    },
    
    // ===== DATE =====
    date: {
      type: Date,
      required: [true, "Ngày chấm công là bắt buộc"],
      index: true,
    },
    
    // ===== CHECK-IN INFO =====
    clockIn: {
      type: Date,
    },
    clockInIP: {
      type: String,
      trim: true,
    },
    clockInPhoto: {
      type: String, // Base64 string hoặc URL
    },
    
    // ===== CHECK-OUT INFO =====
    clockOut: {
      type: Date,
    },
    clockOutIP: {
      type: String,
      trim: true,
    },
    clockOutPhoto: {
      type: String, // Base64 string hoặc URL
    },
    
    // ===== STATUS & CALCULATIONS =====
    status: {
      type: String,
      enum: ["Present", "Late", "Absent", "On Leave"],
      default: "Absent",
      index: true,
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    lateMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    workHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    overtimeHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // ===== MANUAL ADJUSTMENTS =====
    isManuallyAdjusted: {
      type: Boolean,
      default: false,
    },
    adjustedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    adjustedAt: {
      type: Date,
    },
    adjustmentReason: {
      type: String,
      trim: true,
      maxlength: [500, "Lý do không được vượt quá 500 ký tự"],
    },
    
    // ===== REMARKS =====
    remarks: {
      type: String,
      trim: true,
      maxlength: [1000, "Ghi chú không được vượt quá 1000 ký tự"],
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ===== INDEXES =====
// Composite unique index: một user chỉ có một bản ghi mỗi ngày
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

// Index cho queries thường dùng
attendanceSchema.index({ date: -1 });
attendanceSchema.index({ status: 1, date: -1 });
attendanceSchema.index({ createdAt: -1 });

// ===== VIRTUALS =====
// Virtual để get user info khi populate
attendanceSchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

// ===== METHODS =====

// Tính toán lại work hours và overtime
attendanceSchema.methods.recalculate = function (config) {
  if (!this.clockIn || !this.clockOut) {
    this.workHours = 0;
    this.overtimeHours = 0;
    return this;
  }

  const workMs = new Date(this.clockOut) - new Date(this.clockIn);
  const workMinutes = Math.floor(workMs / 60000);
  this.workHours = +(workMinutes / 60).toFixed(2);

  const overtimeMinutes = Math.max(
    0,
    workMinutes - config.standardWorkHours * 60
  );
  this.overtimeHours =
    overtimeMinutes >= config.otMinimumMinutes
      ? +(overtimeMinutes / 60).toFixed(2)
      : 0;

  return this;
};

// Kiểm tra có muộn không
attendanceSchema.methods.checkLate = function (config) {
  if (!this.clockIn) {
    this.isLate = false;
    this.lateMinutes = 0;
    return this;
  }

  const clockInTime = new Date(this.clockIn);
  const [startHour, startMinute] = config.workStartTime.split(":").map(Number);

  const scheduledStart = new Date(clockInTime);
  scheduledStart.setHours(startHour, startMinute, 0, 0);

  const lateMs = clockInTime - scheduledStart;
  const lateMinutes = Math.max(0, Math.floor(lateMs / 60000));

  this.isLate = lateMinutes > config.gracePeriodMinutes;
  this.lateMinutes = this.isLate ? lateMinutes : 0;
  this.status = this.isLate ? "Late" : "Present";

  return this;
};

// ===== STATICS =====

// Lấy attendance records cho một user trong khoảng thời gian
attendanceSchema.statics.getUserRecords = function (
  userId,
  startDate,
  endDate
) {
  const query = { userId };

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  return this.find(query).sort({ date: -1 }).populate("userId", "full_name email employeeId avatar");
};

// Lấy attendance records cho một department
attendanceSchema.statics.getDepartmentRecords = async function (
  departmentId,
  startDate,
  endDate
) {
  const User = mongoose.model("User");
  
  // Tìm tất cả users trong department
  const users = await User.find({
    "department.department_id": departmentId,
    status: "Active",
  }).select("_id");

  const userIds = users.map((u) => u._id);

  const query = { userId: { $in: userIds } };

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  return this.find(query)
    .sort({ date: -1, clockIn: 1 })
    .populate("userId", "full_name email employeeId avatar department");
};

// Tính statistics cho một khoảng thời gian
attendanceSchema.statics.getStats = async function (query) {
  const records = await this.find(query).lean();

  const stats = {
    totalRecords: records.length,
    present: records.filter((r) => r.status === "Present").length,
    late: records.filter((r) => r.status === "Late").length,
    absent: records.filter((r) => r.status === "Absent").length,
    onLeave: records.filter((r) => r.status === "On Leave").length,
    avgWorkHours:
      records.length > 0
        ? +(
            records.reduce((sum, r) => sum + (r.workHours || 0), 0) /
            records.length
          ).toFixed(2)
        : 0,
    totalOT: +records
      .reduce((sum, r) => sum + (r.overtimeHours || 0), 0)
      .toFixed(2),
    onTimeRate:
      records.length > 0
        ? +(
            (records.filter((r) => !r.isLate).length / records.length) *
            100
          ).toFixed(1)
        : 0,
  };

  return stats;
};

// ===== HOOKS =====

// Normalize date to midnight before save
attendanceSchema.pre("save", function (next) {
  if (this.date) {
    const d = new Date(this.date);
    d.setHours(0, 0, 0, 0);
    this.date = d;
  }
  next();
});

const Attendance = mongoose.model("Attendance", attendanceSchema, "Attendance");

module.exports = Attendance;