const User = require("../models/User");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

// Cấu hình gửi mail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// Sinh OTP
function generateOtp() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

module.exports = {
  // Forgot password
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ message: "Email không tồn tại" });

      const otp = generateOtp();
      user.otp = otp;
      user.otpExpires = Date.now() + 5 * 60 * 1000;
      await user.save();

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "OTP đổi mật khẩu",
        text: `Mã OTP: ${otp}`,
      });

      const resetToken = jwt.sign(
        { id: user._id, email: user.email, type: "reset" },
        process.env.JWT_SECRET,
        { expiresIn: "5m" }
      );

      res.json({ message: "OTP đã gửi về email", resetToken });
    } catch (err) {
      res.status(500).json({ message: "Lỗi server", error: err.message });
    }
  },

  // Verify OTP
  async verifyOtp(req, res) {
    try {
      const decoded = req.user;
      const { otp } = req.body;

      const user = await User.findById(decoded.id).select("+otp +otpExpires");
      if (!user) return res.status(400).json({ message: "Người dùng không tồn tại" });
      if (!user.otp || user.otp !== otp) return res.status(400).json({ message: "OTP không hợp lệ" });
      if (user.otpExpires < Date.now()) return res.status(400).json({ message: "OTP hết hạn" });

      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();

      const newResetToken = jwt.sign(
        { id: user._id, email: user.email, type: "reset" },
        process.env.JWT_SECRET,
        { expiresIn: "5m" }
      );

      res.json({ message: "OTP hợp lệ", resetToken: newResetToken });
    } catch (err) {
      res.status(500).json({ message: "Lỗi server", error: err.message });
    }
  },

  // Reset password
  async resetPassword(req, res) {
    try {
      const { newPassword, confirmPassword } = req.body;
      const decoded = req.user;

      if (decoded.type !== "reset")
        return res.status(403).json({ message: "Token không hợp lệ" });
      if (!newPassword || !confirmPassword)
        return res.status(400).json({ message: "Thiếu mật khẩu mới hoặc xác nhận" });
      if (newPassword !== confirmPassword)
        return res.status(400).json({ message: "Mật khẩu xác nhận không khớp" });

      const user = await User.findById(decoded.id).select("+passwordHash");
      if (!user) return res.status(400).json({ message: "Người dùng không tồn tại" });

      user.passwordHash = newPassword;
      await user.save();

      res.json({ message: "Đổi mật khẩu thành công" });
    } catch (err) {
      res.status(500).json({ message: "Lỗi server", error: err.message });
    }
  },

  // Login
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select("+passwordHash");
      if (!user) return res.status(400).json({ message: "Email hoặc mật khẩu không đúng" });

      const isMatch = await user.comparePassword(password);
      if (!isMatch) return res.status(400).json({ message: "Email hoặc mật khẩu không đúng" });

      if (user.status !== "Active")
        return res.status(403).json({ message: "Tài khoản đã bị khóa hoặc vô hiệu hóa" });

      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role, departmentId: user.departmentId, type: "login" },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.json({
        message: "Đăng nhập thành công",
        token,
        user: { id: user._id, email: user.email, full_name: user.full_name, role: user.role },
      });
    } catch (err) {
      res.status(500).json({ message: "Lỗi server", error: err.message });
    }
  },
};
