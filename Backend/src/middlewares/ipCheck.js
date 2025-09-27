const mongoose = require("mongoose");
const User = require("../models/User");
const Config = require("../models/Config");
const ipRangeCheck = require("ip-range-check");

/**
 * Lấy IP client từ request
 */
function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  let ip =
    forwarded?.split(",")[0].trim() ||  // dùng header X-Forwarded-For trước
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    "";

  // xử lý IPv6 dạng ::ffff:127.0.0.1
  if (ip.startsWith("::ffff:")) ip = ip.replace("::ffff:", "");
  if (ip === "::1") ip = "127.0.0.1";

  return ip;
}

/**
 * Middleware kiểm tra IP/WiFi cho phép
 */
exports.checkAllowedIP = async (req, res, next) => {
  try {
    const clientIp = getClientIp(req);
    let config;

    // 1️⃣ Nếu user đã đăng nhập, lấy department_id từ user.department
    if (req.user?.department?.department_id) {
      config = await Config.findOne({
        departmentId: mongoose.Types.ObjectId(req.user.department.department_id),
      });
    }
    // 2️⃣ Nếu chưa login, lấy theo email gửi lên body
    else if (req.body?.email) {
      const user = await User.findOne({ email: req.body.email });
      const departmentId = user?.department?.department_id;
      if (departmentId) {
        config = await Config.findOne({
          departmentId: new mongoose.Types.ObjectId(departmentId),
        });
      }
    }

    // 3️⃣ fallback: Global config
    if (!config) {
      config = await Config.findOne({ departmentId: null });
    }

    const allowedList = config?.wifiList || [];

    console.log("Client IP:", clientIp);
    console.log("Allowed WiFi List:", allowedList);

    if (!allowedList.length) {
      return res.status(403).json({
        message: "Chưa cấu hình danh sách WiFi/IP cho phép. Liên hệ admin.",
        clientIp,
      });
    }

    const ok = ipRangeCheck(clientIp, allowedList);
    console.log("IP check result:", ok ? "PASS" : "FAIL");

    if (!ok) {
      return res.status(403).json({
        message: "Bạn không được phép truy cập từ mạng này. Vui lòng dùng WiFi công ty.",
        clientIp,
        allowedList,
      });
    }

    // IP hợp lệ → tiếp tục request
    next();
  } catch (err) {
    console.error("IP check error:", err);
    res.status(500).json({ message: "Lỗi khi kiểm tra IP.", error: err.message });
  }
};
