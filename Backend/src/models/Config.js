const mongoose = require("mongoose");

const configSchema = new mongoose.Schema(
  {
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
      unique: true, // Mỗi phòng ban chỉ có một cấu hình duy nhất
    },
    departmentName: {
      type: String,
      required: true,
      trim: true,
    },
    startTime: {
      type: String,
      required: [true, "Thời gian bắt đầu là bắt buộc"],
      match: [
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Định dạng thời gian bắt đầu không hợp lệ (HH:mm)",
      ],
    },
    endTime: {
      type: String,
      required: [true, "Thời gian kết thúc là bắt buộc"],
      match: [
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Định dạng thời gian kết thúc không hợp lệ (HH:mm)",
      ],
    },
    wifiList: {
      type: [String],
      required: [true, "Danh sách WiFi là bắt buộc"],
      validate: [
        (val) => val.length > 0,
        "Danh sách WiFi không được để trống",
      ],
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

// Index để tìm kiếm nhanh cấu hình theo phòng ban
// unique:true đã được đặt ở trên, nhưng index() vẫn tốt cho việc làm rõ
configSchema.index({ departmentId: 1 });

const Config = mongoose.model("Config", configSchema);

module.exports = Config;