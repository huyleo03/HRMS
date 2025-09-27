const mongoose = require("mongoose");

const configSchema = new mongoose.Schema(
  {
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: false,
      default: null,
      unique: true,
      sparse: true,
    },

    departmentName: { type: String, required: true, trim: true },
    startTime: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Định dạng không hợp lệ (HH:mm)"],
    },
    endTime: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Định dạng không hợp lệ (HH:mm)"],
    },
    wifiList: {
      type: [String],
      required: true,
      validate: {
        validator: (val) =>
          Array.isArray(val) &&
          val.length > 0 &&
          val.every((ip) => /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/.test(ip)),
        message: "Danh sách WiFi phải là IPv4 hoặc subnet CIDR hợp lệ",
      },
    },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

configSchema.index({ departmentId: 1 });

const Config = mongoose.model("Config", configSchema,"Config");
module.exports = Config;
