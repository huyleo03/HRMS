const User = require("../models/User");
const Department = require("../models/Department");
const crypto = require("crypto");
const sendEmail = require("../utils/email");

// Create a new user by Admin
exports.createUserByAdmin = async (req, res) => {
  const { email, full_name, role, department, jobTitle, salary, avatar } =
    req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email này đã được sử dụng." });
    }

    if (role === "Manager" && department && department.department_id) {
      const existingManager = await User.findOne({
        "department.department_id": department.department_id,
        role: "Manager",
      });

      if (existingManager) {
        return res.status(400).json({
          message: `Phòng ban "${department.department_name}" đã có Manager là "${existingManager.full_name}". Không thể thêm Manager mới.`,
        });
      }
    }

    const temporaryPassword = crypto.randomBytes(8).toString("hex");

    const newUser = new User({
      email,
      full_name,
      passwordHash: temporaryPassword,
      role: role || "Employee",
      department,
      jobTitle,
      salary,
      avatar: avatar || "https://i.pravatar.cc/150", // Use provided avatar or default
    });

    const savedUser = await newUser.save();
    // ===== THÊM LOGIC ĐỒng BỘ MANAGER VÀO DEPARTMENT =====
    if (role === "Manager" && department && department.department_id) {
      try {
        await Department.findByIdAndUpdate(
          department.department_id,
          { managerId: savedUser._id },
          { new: true }
        );
        console.log(
          `✅ Đã cập nhật managerId cho phòng ban ${department.department_name}`
        );
      } catch (deptError) {
        console.error("❌ Lỗi khi cập nhật managerId:", deptError);
        // Rollback: xóa user vừa tạo nếu không cập nhật được department
        await User.findByIdAndDelete(savedUser._id);
        return res.status(500).json({
          message:
            "Không thể đồng bộ thông tin quản lý với phòng ban. Đã hủy tạo nhân viên.",
          error: deptError.message,
        });
      }
    }
    // ===== KẾT THÚC LOGIC ĐỒNG BỘ =====
    const userResponse = savedUser.toObject();
    delete userResponse.passwordHash;

    try {
      const loginUrl = `http://localhost:3000/login`;
      const html = `
        <h1>Chào mừng bạn đến với hệ thống HRMS</h1>
        <p>Xin chào ${full_name},</p>
        <p>Tài khoản của bạn đã được tạo thành công. Dưới đây là thông tin đăng nhập tạm thời:</p>
        <ul>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Mật khẩu tạm thời:</strong> ${temporaryPassword}</li>
        </ul>
        <p>Vui lòng đăng nhập và đổi mật khẩu ngay lập tức.</p>
        <a href="${loginUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Đăng nhập ngay</a>
        <p>Trân trọng,</p>
        <p>Phòng Nhân sự</p>
      `;

      await sendEmail({
        email: savedUser.email,
        subject: "Thông tin tài khoản HRMS của bạn",
        html: html,
      });
    } catch (emailError) {
      console.error("Lỗi gửi email:", emailError);
    }
    // ------------------------------------------------

    res.status(201).json({
      message: "Tạo người dùng thành công.",
      user: userResponse,
      temporaryPassword: temporaryPassword,
    });
  } catch (error) {
    console.error("❌ Lỗi server khi tạo người dùng:", error);
    
    // Xử lý các loại lỗi cụ thể
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: "Dữ liệu không hợp lệ.",
        error: error.message,
        details: error.errors
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Email đã tồn tại trong hệ thống.",
        error: error.message,
      });
    }
    
    res.status(500).json({
      message: "Lỗi server khi tạo người dùng.",
      error: error.message,
    });
  }
};

// List all users with pagination (for Admin)
exports.getAllUsers = async (req, res) => {
  try {
    // Lấy tất cả các tham số từ query
    const {
      page = 1,
      limit = 10,
      sortBy = "created_at",
      sortOrder = "asc",
      name,
      role,
      status,
      department,
    } = req.query;

    const query = {
      role: { $in: ["Manager", "Employee"] },
    };
    
    // Nếu là Manager, chỉ lấy employees thuộc department của mình
    if (req.user.role === "Manager" && req.user.department && req.user.department.department_id) {
      query["department.department_id"] = req.user.department.department_id;
    }
    
    if (name) query.full_name = { $regex: name.trim(), $options: "i" };
    if (role) query.role = role;
    if (status) query.status = status;
    if (department)
      query["department.department_name"] = {
        $regex: department.trim(),
        $options: "i",
      };

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const users = await User.find(query)
      .select("-passwordHash")
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      users,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server khi lấy danh sách người dùng.",
      error: error.message,
    });
  }
};

// Change user status (Active, Inactive, Suspended) by Admin
exports.changeUserStatus = async (req, res) => {
  const userId = req.params.id;
  const { status } = req.body;
  const validStatuses = ["Active", "Inactive", "Suspended"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Trạng thái không hợp lệ." });
  }
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }
    user.status = status;
    await user.save();
    res.status(200).json({ message: "Cập nhật trạng thái thành công.", user });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server khi cập nhật trạng thái người dùng.",
      error: error.message,
    });
  }
};

// Change user role by Admin
exports.changeUserRole = async (req, res) => {
  const userId = req.params.id;
  const { role } = req.body;
  const validRoles = ["Manager", "Employee"];

  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: "Vai trò không hợp lệ." });
  }

  try {
    const userToUpdate = await User.findById(userId);
    if (!userToUpdate) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }
    
    const Department = require("../models/Department");
    
    // Nếu đổi từ Manager sang Employee
    if (userToUpdate.role === "Manager" && role === "Employee") {
      // Cập nhật managerId của Department về null
      if (userToUpdate.department && userToUpdate.department.department_id) {
        await Department.findByIdAndUpdate(
          userToUpdate.department.department_id,
          { managerId: null }
        );
      }
    }
    
    // Nếu đổi sang Manager
    if (role === "Manager") {
      if (!userToUpdate.department || !userToUpdate.department.department_id) {
        return res.status(400).json({
          message:
            "Không thể gán vai trò Manager cho người dùng chưa thuộc phòng ban nào.",
        });
      }

      const existingManager = await User.findOne({
        "department.department_id": userToUpdate.department.department_id,
        role: "Manager",
        _id: { $ne: userId },
      });

      if (existingManager) {
        return res.status(400).json({
          message: `Phòng ban "${userToUpdate.department.department_name}" đã có Manager là "${existingManager.full_name}".`,
        });
      }
      
      // Cập nhật managerId của Department
      await Department.findByIdAndUpdate(
        userToUpdate.department.department_id,
        { managerId: userId }
      );
    }
    
    userToUpdate.role = role;
    await userToUpdate.save();
    res
      .status(200)
      .json({ message: "Cập nhật vai trò thành công.", user: userToUpdate });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server khi cập nhật vai trò người dùng.",
      error: error.message,
    });
  }
};

// Update user by Admin
exports.updateUserByAdmin = async (req, res) => {
  const userId = req.params.id;
  const { full_name, jobTitle, role, department, salary, avatar } = req.body;

  try {
    const userToUpdate = await User.findById(userId);
    if (!userToUpdate) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }

    const Department = require("../models/Department");
    const oldRole = userToUpdate.role;
    const oldDepartmentId = userToUpdate.department?.department_id;

    // Validate if user is being promoted to Manager (only when role is changing TO Manager)
    // OR if existing Manager is moving to a different department
    if (role === "Manager" && department && department.department_id) {
      const isNewManager = userToUpdate.role !== "Manager";
      const isDepartmentChange =
        userToUpdate.department?.department_id !== department.department_id;

      if (isNewManager || isDepartmentChange) {
        // Check if there's already a manager in this department (excluding current user)
        const existingManager = await User.findOne({
          _id: { $ne: userId }, // Exclude current user from check
          "department.department_id": department.department_id,
          role: "Manager",
        });

        if (existingManager) {
          return res.status(400).json({
            message: `Phòng ban "${department.department_name}" đã có Manager là "${existingManager.full_name}". Không thể thay đổi role thành Manager.`,
          });
        }
      }
    }

    // Xử lý khi đổi role từ Manager sang Employee
    if (oldRole === "Manager" && role === "Employee") {
      if (oldDepartmentId) {
        await Department.findByIdAndUpdate(oldDepartmentId, { managerId: null });
      }
    }

    // Xử lý khi đổi sang Manager hoặc Manager đổi phòng ban
    if (role === "Manager" && department && department.department_id) {
      const isDepartmentChange = oldDepartmentId !== department.department_id;
      
      // Nếu Manager đổi phòng ban, xóa managerId ở phòng ban cũ
      if (oldRole === "Manager" && isDepartmentChange && oldDepartmentId) {
        await Department.findByIdAndUpdate(oldDepartmentId, { managerId: null });
      }
      
      // Cập nhật managerId cho phòng ban mới
      await Department.findByIdAndUpdate(department.department_id, { managerId: userId });
    }

    // Update fields (removed status field)
    if (full_name) userToUpdate.full_name = full_name;
    if (jobTitle) userToUpdate.jobTitle = jobTitle;
    if (role) userToUpdate.role = role;
    if (department) userToUpdate.department = department;
    if (salary) userToUpdate.salary = salary;

    // Handle avatar - allow null/empty to reset to default
    if (avatar !== undefined) {
      userToUpdate.avatar = avatar || "https://i.pravatar.cc/150";
    }

    await userToUpdate.save();

    const userResponse = userToUpdate.toObject();
    delete userResponse.passwordHash;

    res.status(200).json({
      message: "Cập nhật thông tin người dùng thành công.",
      user: userResponse,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server khi cập nhật thông tin người dùng.",
      error: error.message,
    });
  }
};

// Get user details by ID (for Admin and Manager)
exports.getUserById = async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await User.findById(userId).select(
      "-passwordHash -otp -otpExpires"
    );
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server khi lấy thông tin người dùng.",
      error: error.message,
    });
  }
};

// Delete user by Admin
exports.deleteUser = async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }
    res.status(200).json({ message: "Xóa người dùng thành công." });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server khi xóa người dùng.",
      error: error.message,
    });
  }
};

// Get own profile (for all roles)
exports.getOwnProfile = async (req, res) => {
  const userId = req.user._id;
  try {
    const user = await User.findById(userId).select(
      "-passwordHash -otp -otpExpires"
    );
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server khi lấy thông tin hồ sơ.",
      error: error.message,
    });
  }
};

// Update own profile (for all roles)
exports.updateOwnProfile = async (req, res) => {
  const userId = req.user._id;
  const { full_name, jobTitle, phone, address, avatar, gender } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }

    if (full_name) user.full_name = full_name;
    if (jobTitle) user.jobTitle = jobTitle;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (avatar) user.avatar = avatar;
    if (gender) user.gender = gender;

    user.profileCompleted = true;

    const updatedUser = await user.save();

    const userResponse = updatedUser.toObject();
    delete userResponse.passwordHash;

    res
      .status(200)
      .json({ message: "Cập nhật hồ sơ thành công.", user: userResponse });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Dữ liệu không hợp lệ.", errors: error.errors });
    }
    res.status(500).json({
      message: "Lỗi server khi cập nhật hồ sơ.",
      error: error.message,
    });
  }
};

// Change own password (for all roles)
exports.changeOwnPassword = async (req, res) => {
  const userId = req.user._id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Cần cung cấp mật khẩu hiện tại và mật khẩu mới." });
  }
  const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({
      message:
        "Mật khẩu mới không đủ mạnh. Mật khẩu phải dài ít nhất 8 ký tự, chứa ít nhất một chữ hoa và một ký tự đặc biệt (!@#$%^&*).",
    });
  }

  try {
    const user = await User.findById(userId).select("+passwordHash");
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu hiện tại không đúng." });
    }

    user.passwordHash = newPassword;
    await user.save();

    res.status(200).json({ message: "Đổi mật khẩu thành công." });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server khi đổi mật khẩu.",
      error: error.message,
    });
  }
};
