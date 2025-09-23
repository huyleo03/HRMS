const User = require("../models/User");
const crypto = require("crypto");

// Create a new user by Admin
exports.createUserByAdmin = async (req, res) => {
  const { email, full_name, role, department, jobTitle, salary } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email này đã được sử dụng." });
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
    });

    const savedUser = await newUser.save();
    const userResponse = savedUser.toObject();
    delete userResponse.passwordHash;

    res.status(201).json({
      message: "Tạo người dùng thành công.",
      user: userResponse,
      temporaryPassword: temporaryPassword,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server khi tạo người dùng.",
      error: error.message,
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  const userId = req.user._id;
  const { full_name, phone, address, gender, avatar } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        full_name,
        phone,
        address,
        gender,
        avatar,
        profileCompleted: true, 
      },
      { new: true, runValidators: true }
    ).select("-passwordHash");

    if (!updatedUser) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }

    res.status(200).json({
      message: "Cập nhật profile thành công.",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server khi cập nhật profile.",
      error: error.message,
    });
  }
};
