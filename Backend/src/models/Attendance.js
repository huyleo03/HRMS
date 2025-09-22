const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    clockIn: {
      type: Date,
      required: true,
    },
    clockInMethod: {
      type: String,
      default: "WiFi",
      enum: ["WiFi"], // Giới hạn giá trị là "WiFi"
    },
    clockInLocation: {
      type: String, // SSID of the WiFi
      required: true,
      trim: true,
    },
    clockOut: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["Present", "Late", "Absent"],
      required: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    departmentName: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

// Indexes để tối ưu hóa truy vấn và đảm bảo tính duy nhất
// Đảm bảo một người dùng chỉ có một bản ghi chấm công mỗi ngày
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

// Các index khác để tìm kiếm
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ departmentId: 1 });

const Attendance = mongoose.model("Attendance", attendanceSchema);

module.exports = Attendance;