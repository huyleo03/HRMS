const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
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
      select: false,
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
    dateOfBirth: {
      type: Date,
      default: null,
    },
    manager_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
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
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    otp: {
      type: String,
      select: false,
    },
    otpExpires: {
      type: Date,
      select: false,
    },

    // ===== FACE ID - Giống iPhone Face ID =====
    faceId: {
      enrolled: {
        type: Boolean,
        default: false,
      },
      descriptors: [{
        type: [Number], 
      }],
      enrolledAt: {
        type: Date,
      },
      nextEnrollmentDate: {
        type: Date,
      },
      enrollmentCount: {
        type: Number,
        default: 0,
      },
      samplePhotos: [{
        url: String,
        capturedAt: Date,
      }],
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// ===== HOOKS =====

// Tự động tạo employeeId
userSchema.pre("save", function (next) {
  if (this.isNew && !this.employeeId) {
    this.employeeId = crypto.randomUUID().split("-")[0].toUpperCase();
  }
  next();
});

// Hash mật khẩu
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

userSchema.pre("save", async function (next) {
  if (
    this.isNew &&
    this.role === "Employee" &&
    this.department &&
    this.department.department_id &&
    !this.manager_id
  ) {
    try {
      const Department = mongoose.model("Department");
      const department = await Department.findById(
        this.department.department_id
      );

      // Nếu phòng ban có managerId, gán vào
      if (department && department.managerId) {
        this.manager_id = department.managerId;
      } else {
        console.log(
          `⚠️ Phòng ban "${this.department.department_name}" chưa có Manager. Employee ${this.full_name} sẽ có manager_id = null.`
        );
      }
    } catch (error) {
      console.error("❌ Lỗi khi tự động gán manager:", error);
    }
  }
  next();
});

// ===== BASIC METHODS =====

// So sánh mật khẩu
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Lấy số request pending cần user approve
userSchema.methods.getPendingRequestCount = async function () {
  const Request = mongoose.model("Request");
  const count = await Request.countDocuments({
    "approvalFlow.approverId": this._id,
    "approvalFlow.status": "Pending",
    status: { $in: ["Pending", "Manager_Approved"] },
  });

  return count;
};

// Lấy số request pending của user (người gửi)
userSchema.methods.getMyPendingRequestCount = async function () {
  const Request = mongoose.model("Request");
  const count = await Request.countDocuments({
    submittedBy: this._id,
    status: { $in: ["Pending", "Manager_Approved"] },
  });

  return count;
};

// Lấy full hierarchy chain (từ user lên đến top manager)
userSchema.methods.getManagerChain = async function () {
  const chain = [];
  let currentUser = this;

  while (currentUser.manager_id) {
    const manager = await this.model("User").findById(currentUser.manager_id);
    if (!manager) break;

    chain.push({
      _id: manager._id,
      full_name: manager.full_name,
      email: manager.email,
      role: manager.role,
      jobTitle: manager.jobTitle,
    });

    currentUser = manager;
  }

  return chain;
};

// ===== INDEXES =====
userSchema.index({ email: 1 });
userSchema.index({ employeeId: 1 });
userSchema.index({ manager_id: 1 });
userSchema.index({ "department.department_id": 1 });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ full_name: "text" });

const User = mongoose.model("User", userSchema, "User");

module.exports = User;
