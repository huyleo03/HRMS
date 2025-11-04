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
      avatar: avatar || "https://i.pravatar.cc/150",
    });

    const savedUser = await newUser.save();
    if (role === "Manager" && department && department.department_id) {
      try {

        const dept = await Department.findById(department.department_id);
        if (!dept) {
          await User.findByIdAndDelete(savedUser._id);
          return res.status(404).json({
            message: "Không tìm thấy phòng ban.",
          });
        }

        dept.managerId = savedUser._id;
        await dept.save(); 

      } catch (deptError) {
        console.error("❌ Lỗi khi cập nhật managerId:", deptError);
        await User.findByIdAndDelete(savedUser._id);
        return res.status(500).json({
          message:
            "Không thể đồng bộ thông tin quản lý với phòng ban. Đã hủy tạo nhân viên.",
          error: deptError.message,
        });
      }
    }
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
    res.status(201).json({
      message: "Tạo người dùng thành công.",
      user: userResponse,
      temporaryPassword: temporaryPassword,
    });
  } catch (error) {
    console.error("❌ Lỗi server khi tạo người dùng:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Dữ liệu không hợp lệ.",
        error: error.message,
        details: error.errors,
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
    let query = {};
    
    // Filter by role từ query params (có thể query Admin)
    if (role) {
      query.role = role;
    } else {
      // Nếu không có role params, apply default filter theo user role
      if (req.user.role === "Manager") {
        query.role = "Employee";
        if (req.user.department && req.user.department.department_id) {
          query["department.department_id"] = req.user.department.department_id;
        }
      } else if (req.user.role === "Admin") {
        query.role = { $in: ["Manager", "Employee"] };
      }
    }
    
    if (name) query.full_name = { $regex: name.trim(), $options: "i" };
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

// Get approvers (Admin + Manager) for workflow configuration
exports.getApprovers = async (req, res) => {
  try {
    // Only get Admin and Manager roles, no pagination
    const approvers = await User.find({ 
      role: { $in: ["Admin", "Manager"] },
      status: "Active"
    })
      .select("_id full_name email role department jobTitle avatar")
      .sort({ role: -1, full_name: 1 }); // Admin first, then Manager, sorted by name

    res.status(200).json({
      success: true,
      data: approvers,
      total: approvers.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách người duyệt.",
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

    // Validate if user is being promoted to Manager
    if (role === "Manager" && department && department.department_id) {
      const isNewManager = userToUpdate.role !== "Manager";
      const isDepartmentChange =
        userToUpdate.department?.department_id !== department.department_id;

      if (isNewManager || isDepartmentChange) {
        const existingManager = await User.findOne({
          _id: { $ne: userId },
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
        // ✅ DÙNG find + save ĐỂ TRIGGER HOOK
        const dept = await Department.findById(oldDepartmentId);
        if (dept) {
          dept.managerId = null;
          await dept.save(); // ✅ Trigger hook → Set manager_id = null cho tất cả Employee
        }
      }

      // Tự động gán manager mới cho user này
      if (department && department.department_id) {
        const newDepartment = await Department.findById(
          department.department_id
        );
        if (newDepartment && newDepartment.managerId) {
          userToUpdate.manager_id = newDepartment.managerId;
        } else {
          userToUpdate.manager_id = null;
        }
      }
    }

    // Xử lý khi đổi sang Manager hoặc Manager đổi phòng ban
    if (role === "Manager" && department && department.department_id) {
      const isDepartmentChange = oldDepartmentId !== department.department_id;

      // Nếu Manager đổi phòng ban, xóa managerId ở phòng ban cũ
      if (oldRole === "Manager" && isDepartmentChange && oldDepartmentId) {
        // ✅ DÙNG find + save ĐỂ TRIGGER HOOK
        const oldDept = await Department.findById(oldDepartmentId);
        if (oldDept) {
          oldDept.managerId = null;
          await oldDept.save(); // ✅ Trigger hook
        }
      }

      // ✅ DÙNG find + save ĐỂ TRIGGER HOOK
      const newDept = await Department.findById(department.department_id);
      if (newDept) {
        newDept.managerId = userId;
        await newDept.save(); // ✅ Trigger hook → Cập nhật manager_id cho tất cả Employee
      }

      // Manager không có manager_id
      userToUpdate.manager_id = null;
    }

    // Xử lý khi Employee đổi phòng ban
    if (
      role === "Employee" &&
      department &&
      department.department_id &&
      oldDepartmentId !== department.department_id
    ) {
      const newDepartment = await Department.findById(department.department_id);
      if (newDepartment && newDepartment.managerId) {
        userToUpdate.manager_id = newDepartment.managerId;
      } else {
        userToUpdate.manager_id = null;
      }
    }

    // Update fields
    if (full_name) userToUpdate.full_name = full_name;
    if (jobTitle) userToUpdate.jobTitle = jobTitle;
    if (role) userToUpdate.role = role;
    if (department) userToUpdate.department = department;
    if (salary) userToUpdate.salary = salary;

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
  const { full_name, jobTitle, phone, address, avatar, gender, dateOfBirth } = req.body;

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
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;

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

// Get list of users in the same department for CC (for all roles)
exports.getCcUserList = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id).select("department");
    if (!currentUser || !currentUser.department?.department_id) {
      return res.status(200).json([]);
    }
    const usersInDepartment = await User.find({
      "department.department_id": currentUser.department.department_id,
      _id: { $ne: req.user.id },
    }).select("full_name email avatar");
    res.status(200).json(usersInDepartment);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách người dùng" });
  }
};

// Search users for cc
exports.searchUsersForCc = async (req, res) => {
  try {
    const { q } = req.query;
    const currentUserId = req.user.id;
    if (!q || q.trim().length < 2) {
      return res.status(200).json([]);
    }
    const searchTerm = q.trim();
    const query = {
      _id: { $ne: currentUserId },
      $or: [
        { full_name: { $regex: searchTerm, $options: "i" } },
        { email: { $regex: searchTerm, $options: "i" } },
      ],
    };
    const users = await User.find(query)
      .select("_id full_name email avatar")
      .limit(15); 
    res.status(200).json(users);
  } catch (error) {
    console.error("Lỗi khi tìm kiếm người dùng CC:", error);
    res.status(500).json({ message: "Lỗi server khi tìm kiếm người dùng." });
  }
};

// ===== DEACTIVATE USER =====
// Admin vô hiệu hóa tài khoản (chuyển status từ Active → Inactive)
exports.deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    // ✅ Chỉ Admin mới được deactivate
    if (currentUser.role !== "Admin") {
      return res.status(403).json({ 
        message: "Chỉ Admin mới có quyền vô hiệu hóa tài khoản" 
      });
    }

    // ✅ Tìm user cần deactivate
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    // ✅ Không cho phép Admin tự deactivate chính mình
    if (user._id.toString() === currentUser.id) {
      return res.status(400).json({ 
        message: "Bạn không thể vô hiệu hóa tài khoản của chính mình" 
      });
    }

    // ✅ Kiểm tra user đã bị deactivate chưa
    if (user.status === "Inactive") {
      return res.status(400).json({ 
        message: "Tài khoản này đã bị vô hiệu hóa rồi" 
      });
    }

    // ✅ Cập nhật status sang Inactive
    user.status = "Inactive";
    await user.save();

    res.status(200).json({
      success: true,
      message: `Đã vô hiệu hóa tài khoản của ${user.full_name}`,
      data: {
        userId: user._id,
        full_name: user.full_name,
        email: user.email,
        status: user.status,
        deactivatedAt: new Date()
      }
    });
  } catch (error) {
    console.error("❌ Lỗi khi vô hiệu hóa tài khoản:", error);
    res.status(500).json({ 
      message: "Lỗi server khi vô hiệu hóa tài khoản",
      error: error.message 
    });
  }
};

// ===== REACTIVATE USER =====
// Admin kích hoạt lại tài khoản (chuyển status từ Inactive → Active)
exports.reactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    // ✅ Chỉ Admin mới được reactivate
    if (currentUser.role !== "Admin") {
      return res.status(403).json({ 
        message: "Chỉ Admin mới có quyền kích hoạt lại tài khoản" 
      });
    }

    // ✅ Tìm user cần reactivate
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    // ✅ Kiểm tra user có đang bị deactivate không
    if (user.status !== "Inactive") {
      return res.status(400).json({ 
        message: `Tài khoản này đang ở trạng thái "${user.status}", không thể kích hoạt lại`,
        currentStatus: user.status
      });
    }

    // ✅ Cập nhật status sang Active
    user.status = "Active";
    await user.save();

    res.status(200).json({
      success: true,
      message: `Đã kích hoạt lại tài khoản của ${user.full_name}`,
      data: {
        userId: user._id,
        full_name: user.full_name,
        email: user.email,
        status: user.status,
        reactivatedAt: new Date()
      }
    });
  } catch (error) {
    console.error("❌ Lỗi khi kích hoạt lại tài khoản:", error);
    res.status(500).json({ 
      message: "Lỗi server khi kích hoạt lại tài khoản",
      error: error.message 
    });
  }
};