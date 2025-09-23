const User = require("../models/User");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

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
      if (!user) return res.status(400).json({ message: "Email không tồn tại" });

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

      const payload = { id: user._id, email: user.email, type: "reset" };
      const resetToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "5m" });

      res.json({ message: "OTP đã gửi về email", resetToken });
    } catch (err) {
      res.status(500).json({ message: "Lỗi server", error: err.message });
    }
  },

  // 2. Xác thực OTP
  async verifyOtp(req, res) {
    try {
      const decoded = req.user; // từ middleware auth
      const { otp } = req.body;

      const user = await User.findById(decoded.id).select("+otp +otpExpires");
      if (!user) return res.status(400).json({ message: "Người dùng không tồn tại" });

      if (!user.otp || user.otp !== otp) return res.status(400).json({ message: "OTP không hợp lệ" });
      if (user.otpExpires < Date.now()) return res.status(400).json({ message: "OTP đã hết hạn" });

      // OTP đúng → xoá OTP
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();

      const payload = { id: user._id, email: user.email, type: "reset" };
      const newResetToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "5m" });

      res.json({ message: "OTP hợp lệ, bạn có thể đổi mật khẩu", resetToken: newResetToken });
    } catch (err) {
      res.status(500).json({ message: "Lỗi server", error: err.message });
    }
  },

  // 3. Đặt lại mật khẩu
  async resetPassword(req, res) {
    try {
      const { newPassword, confirmPassword } = req.body;
      const decoded = req.user;

      if (decoded.type !== "reset") return res.status(403).json({ message: "Token không hợp lệ cho reset password" });
      if (!newPassword || !confirmPassword) return res.status(400).json({ message: "Vui lòng nhập đầy đủ mật khẩu mới và xác nhận mật khẩu" });
      if (newPassword !== confirmPassword) return res.status(400).json({ message: "Mật khẩu xác nhận không khớp" });

      const user = await User.findById(decoded.id).select("+passwordHash");
      if (!user) return res.status(400).json({ message: "Người dùng không tồn tại" });

      // ✅ Chỉ gán mật khẩu mới, pre-save hook tự hash
      user.passwordHash = newPassword;
      await user.save();

      res.json({ message: "Đổi mật khẩu thành công, vui lòng đăng nhập lại" });
    } catch (err) {
      res.status(500).json({ message: "Lỗi server", error: err.message });
    }
  },

  // 4. Đăng nhập
  async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email }).select("+passwordHash");
      if (!user) return res.status(400).json({ message: "Email hoặc mật khẩu không đúng" });

      const isMatch = await user.comparePassword(password);
      if (!isMatch) return res.status(400).json({ message: "Email hoặc mật khẩu không đúng" });

      const payload = { id: user._id, email: user.email, role: user.role, type: "login" };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

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
