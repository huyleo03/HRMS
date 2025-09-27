const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    full_name: { type: String, required: true, trim: true },
    phone: String,
    avatar: { type: String, default: "https://i.pravatar.cc/150" },
    address: String,
    gender: { type: String, enum: ["Male", "Female"] },
    role: { type: String, enum: ["Admin", "Manager", "Employee"], default: "Employee" },

    // Lưu object department trực tiếp
    department: {
      department_id: { type: mongoose.Schema.Types.ObjectId, ref: "Department", default: null },
      department_name: { type: String, trim: true }
    },

    jobTitle: String,
    startDate: { type: Date, default: Date.now },
    salary: { type: Number, min: 0 },
    manager_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["Active", "Inactive", "Suspended"], default: "Active" },
    profileCompleted: { type: Boolean, default: false },

    // OTP
    otp: { type: String, select: false },
    otpExpires: { type: Date, select: false }
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);


// Hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash")) return next();
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

const User = mongoose.model("User", userSchema, "User");
module.exports = User;
