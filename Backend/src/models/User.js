const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email là bắt buộc"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Vui lòng nhập một địa chỉ email hợp lệ",
      ],
    },
    passwordHash: {
      type: String,
      required: [true, "Mật khẩu là bắt buộc"],
      select: false, // Không trả về mật khẩu khi query
    },
    full_name: {
      type: String,
      required: [true, "Họ tên là bắt buộc"],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
      default: "https://i.pravatar.cc/150",
    },
    address: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female"],
    },
    role: {
      type: String,
      enum: ["Admin", "Manager", "Employee"],
      required: true,
      default: "Employee",
    },
    department: {
      department_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
      },
      department_name: {
        type: String,
        trim: true,
      },
    },
    jobTitle: {
      type: String,
      trim: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    salary: {
      type: Number,
      min: 0,
    },
    manager_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Suspended"],
      default: "Active",
    },
    profileCompleted: {
      type: Boolean,
      default: false,
    },
    // ===== Thêm 2 trường cho OTP =====
    otp: {
      type: String,
      select: false,
    },
    otpExpires: { 
      type: Date,
      select: false,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Middleware để hash mật khẩu trước khi lưu
userSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method để so sánh mật khẩu đã nhập với mật khẩu đã hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

const User = mongoose.model("User", userSchema, "User");

module.exports = User;
