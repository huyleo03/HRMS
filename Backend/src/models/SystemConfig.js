const mongoose = require("mongoose");

const systemConfigSchema = new mongoose.Schema(
  {
    // Chỉ có 1 document duy nhất cho toàn hệ thống
    configType: {
      type: String,
      default: "company",
      enum: ["company"],
      unique: true,
    },
    
    // ===== WORK SCHEDULE =====
    workSchedule: {
      workStartTime: {
        type: String,
        default: "08:00",
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Định dạng thời gian không hợp lệ (HH:mm)"],
      },
      workEndTime: {
        type: String,
        default: "17:00",
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Định dạng thời gian không hợp lệ (HH:mm)"],
      },
      standardWorkHours: {
        type: Number,
        default: 8,
        min: 1,
        max: 12,
      },
      gracePeriodMinutes: {
        type: Number,
        default: 15,
        min: 0,
        max: 60,
      },
    },
    
    // ===== OVERTIME =====
    overtime: {
      otMinimumMinutes: {
        type: Number,
        default: 30,
        min: 15,
        max: 120,
      },
      otRateWeekday: {
        type: Number,
        default: 1.5,
        min: 1,
        max: 5,
      },
      otRateWeekend: {
        type: Number,
        default: 2.0,
        min: 1,
        max: 5,
      },
      otRateHoliday: {
        type: Number,
        default: 3.0,
        min: 1,
        max: 5,
      },
      requireApproval: {
        type: Boolean,
        default: true,
      },
    },
    
    // ===== NETWORK =====
    network: {
      allowedIPs: {
        type: [String],
        default: ["::1", "127.0.0.1", "::ffff:127.0.0.1"],
        validate: {
          validator: function(arr) {
            return arr.length > 0;
          },
          message: "Danh sách IP không được để trống",
        },
      },
      allowRemoteCheckIn: {
        type: Boolean,
        default: false,
      },
      requireVPN: {
        type: Boolean,
        default: false,
      },
    },
    
    // ===== FACE RECOGNITION =====
    faceRecognition: {
      enabled: {
        type: Boolean,
        default: true,
      },
      strictMode: {
        type: Boolean,
        default: false,
      },
      savePhotos: {
        type: Boolean,
        default: true,
      },
      photoRetentionDays: {
        type: Number,
        default: 90,
        min: 7,
        max: 365,
      },
    },
    
    // ===== AUTO ACTIONS =====
    autoActions: {
      autoMarkAbsentTime: {
        type: String,
        default: "09:30",
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Định dạng thời gian không hợp lệ (HH:mm)"],
      },
      enableAutoMarkAbsent: {
        type: Boolean,
        default: true,
      },
    },
    
    // ===== AUDIT TRAIL =====
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lastUpdatedByName: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

// Ensure only one config document exists
systemConfigSchema.index({ configType: 1 }, { unique: true });

const SystemConfig = mongoose.model("SystemConfig", systemConfigSchema, "SystemConfig");

module.exports = SystemConfig;
