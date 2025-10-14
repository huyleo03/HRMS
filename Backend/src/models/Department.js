const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    department_name: {
      type: String,
      required: [true, "Tên phòng ban là bắt buộc"],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// ===== TỰ ĐỘNG CẬP NHẬT MANAGER CHO TẤT CẢ EMPLOYEE TRONG PHÒNG BAN =====
departmentSchema.post("save", async function (doc) {
  if (this.isModified("managerId")) {
    try {
      const User = mongoose.model("User");

      // Tìm tất cả Employee trong phòng ban này
      const employees = await User.find({
        "department.department_id": doc._id,
        role: "Employee",
      });

      if (employees.length === 0) {
        console.log(
          `⚠️ Không có Employee nào trong phòng ban "${doc.department_name}"`
        );
        return;
      }

      // Cập nhật manager_id cho tất cả Employee
      const updatePromises = employees.map((employee) => {
        employee.manager_id = doc.managerId;
        return employee.save();
      });
      await Promise.all(updatePromises);
    } catch (error) {
      console.error("❌ Lỗi khi tự động cập nhật manager cho Employee:", error);
    }
  }
});

// ===== XỬ LÝ CHO findOneAndUpdate =====
departmentSchema.pre("findOneAndUpdate", function (next) {
  // Đánh dấu field managerId đã modified để post hook biết
  const update = this.getUpdate();
  if (update.$set && update.$set.managerId !== undefined) {
    this._updatedManagerId = true;
  }
  next();
});

departmentSchema.post("findOneAndUpdate", async function (doc) {
  // Chỉ chạy nếu managerId được update
  if (this._updatedManagerId && doc) {
    try {
      const User = mongoose.model("User");

      const employees = await User.find({
        "department.department_id": doc._id,
        role: "Employee",
      });

      if (employees.length === 0) {
        console.log(
          `⚠️ Không có Employee nào trong phòng ban "${doc.department_name}"`
        );
        return;
      }

      const updatePromises = employees.map((employee) => {
        employee.manager_id = doc.managerId;
        return employee.save();
      });

      await Promise.all(updatePromises);
    } catch (error) {
      console.error("❌ Lỗi khi tự động cập nhật manager cho Employee:", error);
    }
  }
});

// ===== TỰ ĐỘNG CẬP NHẬT KHI MANAGER BỊ XÓA =====
departmentSchema.post("findOneAndUpdate", async function (doc) {
  if (doc && doc.managerId === null) {
    try {
      const User = mongoose.model("User");

      // Set manager_id = null cho tất cả Employee
      await User.updateMany(
        {
          "department.department_id": doc._id,
          role: "Employee",
        },
        { $set: { manager_id: null } }
      );
    } catch (error) {
      console.error("❌ Lỗi khi xóa manager_id:", error);
    }
  }
});

departmentSchema.index({ department_name: 1 }, { unique: true });

const Department = mongoose.model("Department", departmentSchema, "Department");

module.exports = Department;
