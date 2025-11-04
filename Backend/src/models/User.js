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
    // ===== STATUS - Trạng thái tài khoản =====
    // Active: Tài khoản hoạt động bình thường, có thể đăng nhập
    // Inactive: Tài khoản đã bị vô hiệu hóa (nhân viên nghỉ việc), KHÔNG thể đăng nhập
    // Suspended: Tài khoản bị tạm ngưng (vi phạm), KHÔNG thể đăng nhập
    status: {
      type: String,
      enum: ["Active", "Inactive", "Suspended"],
      default: "Active",
    },
    profileCompleted: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      select: false,
    },
    otpExpires: {
      type: Date,
      select: false,
    },

    // ===== EMAIL SETTINGS =====
    emailSettings: {
      signature: {
        type: String,
        default: "",
        maxlength: [500, "Chữ ký không được vượt quá 500 ký tự"],
        trim: true,
      },
      autoReply: {
        enabled: {
          type: Boolean,
          default: false,
        },
        subject: {
          type: String,
          default: "Tôi hiện không có mặt",
          trim: true,
        },
        message: {
          type: String,
          default: "",
          trim: true,
        },
        startDate: {
          type: Date,
        },
        endDate: {
          type: Date,
        },
      },
      notifications: {
        newMail: {
          type: Boolean,
          default: true,
        },
        mentions: {
          type: Boolean,
          default: true,
        },
        important: {
          type: Boolean,
          default: true,
        },
        sound: {
          type: Boolean,
          default: true,
        },
        newRequest: {
          type: Boolean,
          default: true,
        },
        requestApproved: {
          type: Boolean,
          default: true,
        },
        requestRejected: {
          type: Boolean,
          default: true,
        },
        requestComment: {
          type: Boolean,
          default: true,
        },
      },
      displaySettings: {
        emailsPerPage: {
          type: Number,
          default: 25,
          enum: [10, 25, 50, 100],
        },
        showAvatars: {
          type: Boolean,
          default: true,
        },
        conversationView: {
          type: Boolean,
          default: true,
        },
        showPreview: {
          type: Boolean,
          default: true,
        },
      },
      sendSettings: {
        confirmBeforeSend: {
          type: Boolean,
          default: false,
        },
        sendDelay: {
          type: Number,
          default: 0,
          min: 0,
          max: 30,
        },
        alwaysCcMyself: {
          type: Boolean,
          default: false,
        },
        defaultReplyAll: {
          type: Boolean,
          default: false,
        },
      },
      vacationResponder: {
        enabled: {
          type: Boolean,
          default: false,
        },
        subject: {
          type: String,
          default: "Tôi đang trong kỳ nghỉ",
          trim: true,
        },
        message: {
          type: String,
          trim: true,
        },
        startDate: {
          type: Date,
        },
        endDate: {
          type: Date,
        },
        contactsOnly: {
          type: Boolean,
          default: false,
        },
      },
    },

    // ===== MAIL STATISTICS =====
    mailStats: {
      totalSent: {
        type: Number,
        default: 0,
      },
      totalReceived: {
        type: Number,
        default: 0,
      },
      storageUsed: {
        type: Number,
        default: 0,
      },
      lastActivityAt: {
        type: Date,
      },
    },

    // ===== REQUEST STATISTICS =====
    requestStats: {
      totalSubmitted: {
        type: Number,
        default: 0,
      },
      totalApproved: {
        type: Number,
        default: 0,
      },
      totalRejected: {
        type: Number,
        default: 0,
      },
      totalPending: {
        type: Number,
        default: 0,
      },
      totalApprovalRequired: {
        type: Number,
        default: 0,
      },
      totalApprovalCompleted: {
        type: Number,
        default: 0,
      },
      lastRequestAt: {
        type: Date,
      },
      lastApprovalAt: {
        type: Date,
      },
    },

    // ===== FACE ID - Giống iPhone Face ID =====
    faceId: {
      // Có đăng ký Face ID chưa
      enrolled: {
        type: Boolean,
        default: false,
      },
      // Lưu nhiều face descriptors (từ nhiều góc)
      descriptors: [{
        type: [Number], // Array of 128 hoặc 512 numbers
      }],
      // Thời gian đăng ký lần cuối
      enrolledAt: {
        type: Date,
      },
      // Thời gian có thể đăng ký lại (1 tháng sau)
      nextEnrollmentDate: {
        type: Date,
      },
      // Số lần đăng ký (để tracking)
      enrollmentCount: {
        type: Number,
        default: 0,
      },
      // Lưu ảnh mẫu (optional - để admin check)
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

// Lấy danh sách nhân viên dưới quyền
userSchema.methods.getSubordinates = async function () {
  return await this.model("User").find({ manager_id: this._id });
};

// Kiểm tra xem user có phải là manager của targetUser không
userSchema.methods.isManagerOf = function (targetUserId) {
  return this._id.equals(targetUserId);
};

// ===== EMAIL METHODS =====

// Cập nhật mail stats
userSchema.methods.updateMailStats = async function (stats) {
  if (stats.sentCount) this.mailStats.totalSent += stats.sentCount;
  if (stats.receivedCount) this.mailStats.totalReceived += stats.receivedCount;
  if (stats.storageUsed) this.mailStats.storageUsed += stats.storageUsed;

  this.mailStats.lastActivityAt = new Date();
  await this.save();
  return this;
};

// ===== REQUEST METHODS =====

// Cập nhật request stats
userSchema.methods.updateRequestStats = async function (action) {
  if (action === "submit") {
    this.requestStats.totalSubmitted += 1;
    this.requestStats.totalPending += 1;
    this.requestStats.lastRequestAt = new Date();
  } else if (action === "approve") {
    this.requestStats.totalApprovalCompleted += 1;
    this.requestStats.lastApprovalAt = new Date();
  } else if (action === "approved") {
    this.requestStats.totalApproved += 1;
    this.requestStats.totalPending -= 1;
  } else if (action === "rejected") {
    this.requestStats.totalRejected += 1;
    this.requestStats.totalPending -= 1;
  } else if (action === "cancelled") {
    this.requestStats.totalPending -= 1;
  }

  await this.save();
  return this;
};

// Lấy danh sách người có thể approve request
userSchema.methods.getAvailableApprovers = async function () {
  const approvers = [];

  // Manager trực tiếp
  if (this.manager_id) {
    const manager = await this.model("User").findById(this.manager_id);
    if (manager && manager.status === "Active") {
      approvers.push(manager);
    }
  }

  // Admins và Managers trong cùng department
  if (this.department && this.department.department_id) {
    const departmentApprovers = await this.model("User").find({
      "department.department_id": this.department.department_id,
      role: { $in: ["Admin", "Manager"] },
      status: "Active",
      _id: { $ne: this._id },
    });

    approvers.push(...departmentApprovers);
  }

  // Loại bỏ duplicate
  const uniqueApprovers = approvers.filter(
    (approver, index, self) =>
      index ===
      self.findIndex((a) => a._id.toString() === approver._id.toString())
  );

  return uniqueApprovers;
};

// Kiểm tra user có quyền approve request không
userSchema.methods.canApproveRequest = function (request) {
  const isApprover = request.approvalFlow.some(
    (a) =>
      a.approverId.toString() === this._id.toString() &&
      a.role === "Approver" &&
      a.status === "Pending"
  );

  return isApprover;
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

// Kiểm tra user có phải subordinate của managerId không
userSchema.methods.isSubordinateOf = function (managerId) {
  if (!this.manager_id) return false;
  return this.manager_id.toString() === managerId.toString();
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
userSchema.index({ "requestStats.totalPending": 1 });
userSchema.index({ "requestStats.totalApprovalRequired": 1 });
userSchema.index({ full_name: "text" });

const User = mongoose.model("User", userSchema, "User");

module.exports = User;
