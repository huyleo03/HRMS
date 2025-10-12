const User = require("../models/User");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
require("dotenv").config();
// Config gửi mail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Hàm tạo OTP ngẫu nhiên 5 số
function generateOtp() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

module.exports = {
  // 1. Gửi OTP
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });
      if (!user)
        return res.status(400).json({ message: "Email không tồn tại" });

      const otp = generateOtp();
      user.otp = otp;
      user.otpExpires = Date.now() + 5 * 60 * 1000; // 5 phút
      await user.save();

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "OTP đổi mật khẩu",
        text: `Mã OTP của bạn là: ${otp}`,
      });

      res.json({
        message: "Mã OTP để đặt lại mật khẩu đã được gửi đến email của bạn.",
      });
    } catch (err) {
      res.status(500).json({ message: "Lỗi server", error: err.message });
    }
  },

  // 2. Xác thực OTP
  async verifyOtp(req, res) {
    try {
      // Nhận email và otp từ body, không cần token
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res
          .status(400)
          .json({ message: "Vui lòng cung cấp email và OTP." });
      }

      // Tìm user bằng email
      const user = await User.findOne({ email }).select("+otp +otpExpires");
      if (!user)
        return res.status(400).json({ message: "Email không tồn tại" });

      if (!user.otp || user.otp !== otp)
        return res.status(400).json({ message: "OTP không hợp lệ" });
      if (user.otpExpires < Date.now())
        return res.status(400).json({ message: "OTP đã hết hạn" });

      // OTP đúng → xoá OTP
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();

      // Tạo resetToken để sử dụng cho bước tiếp theo
      const payload = {
        sub: user._id,
        aud: "app:reset", // Audience là 'reset'
      };
      const resetToken = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "10m", // Cho phép 10 phút để đổi mật khẩu
      });

      res.json({
        message: "OTP hợp lệ, bạn có thể đổi mật khẩu",
        resetToken: resetToken, // Trả về token này cho frontend
      });
    } catch (err) {
      res.status(500).json({ message: "Lỗi server", error: err.message });
    }
  },

  // 3. Đặt lại mật khẩu
async resetPassword(req, res) {
  try {
    const { newPassword, confirmPassword } = req.body;
    const decoded = req.user; // Middleware authenticate sẽ giải mã resetToken

    // ✅ Kiểm tra token reset có hợp lệ không
    if (decoded.aud !== "app:reset") {
      return res
        .status(403)
        .json({ message: "Token không hợp lệ cho việc reset mật khẩu" });
    }

    // ✅ Kiểm tra nhập đủ trường
    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Vui lòng nhập đầy đủ mật khẩu mới và xác nhận mật khẩu.",
      });
    }

    // ✅ Kiểm tra mật khẩu mới và xác nhận có khớp không
    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ message: "Mật khẩu mới và xác nhận mật khẩu không khớp." });
    }

    // ✅ Kiểm tra độ mạnh của mật khẩu mới (giống changePassword)
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message:
          "Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm 1 chữ hoa, 1 chữ thường và 1 ký tự đặc biệt.",
      });
    }

    // ✅ Tìm user theo decoded.sub trong token reset
    const user = await User.findById(decoded.sub).select("+passwordHash");
    if (!user) {
      return res.status(400).json({ message: "Người dùng không tồn tại." });
    }

    // ✅ Gán mật khẩu mới (pre('save') sẽ tự hash)
    user.passwordHash = newPassword;
    await user.save();

    res.json({ message: "Đặt lại mật khẩu thành công, vui lòng đăng nhập lại." });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
},


  // 4. Đăng nhập
  async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email }).select("+passwordHash");
      if (!user)
        return res
          .status(400)
          .json({ message: "Email hoặc mật khẩu không đúng" });

      const isMatch = await user.comparePassword(password);
      if (!isMatch)
        return res
          .status(400)
          .json({ message: "Email hoặc mật khẩu không đúng" });

      const payload = {
        sub: user._id,
        aud: "app:login",
        role: user.role,
        name: user.full_name,
        email: user.email,
        profileCompleted: user.profileCompleted,
      };
      
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      res.json({
        message: "Đăng nhập thành công",
        token: token,
        user: {
          id: user._id,
          name: user.full_name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          profileCompleted: user.profileCompleted,
        }
      });
    } catch (err) {
      res.status(500).json({ message: "Lỗi server", error: err.message });
    }
  },

  // 5. Đổi mật khẩu (cho người dùng đã đăng nhập)
async changePassword(req, res) {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const user = req.user; // lấy từ middleware authenticate

    // Kiểm tra đủ trường
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập đầy đủ 3 trường mật khẩu." });
    }

    // Kiểm tra mật khẩu cũ
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu cũ không đúng." });
    }

    // Kiểm tra mật khẩu mới và xác nhận
    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ message: "Mật khẩu mới và xác nhận mật khẩu không khớp." });
    }

    // ✅ Kiểm tra độ mạnh của mật khẩu mới
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message:
          "Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm 1 chữ hoa, 1 chữ thường và 1 ký tự đặc biệt.",
      });
    }

    // Gán mật khẩu mới (tự hash nhờ pre('save'))
    user.passwordHash = newPassword;
    await user.save();

    res.json({ message: "Đổi mật khẩu thành công." });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
}

};
