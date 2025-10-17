const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.authenticate = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        message: "Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Tìm user theo id trong token
    const currentUser = await User.findById(decoded.sub).select(
      "+passwordHash"
    );

    if (!currentUser) {
      return res.status(401).json({
        message: "Người dùng không tồn tại.",
      });
    }

    // Kiểm tra trạng thái user
    if (currentUser.status !== "Active") {
      return res.status(401).json({
        message: "Tài khoản của bạn đã bị vô hiệu hóa.",
      });
    }

    // Gắn thông tin user vào request
    req.user = currentUser;
    // Thêm thuộc tính userId để dễ truy cập
    req.user.userId = currentUser._id;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Token không hợp lệ.",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token đã hết hạn. Vui lòng đăng nhập lại.",
      });
    }

    return res.status(500).json({
      message: "Lỗi server khi xác thực.",
      error: error.message,
    });
  }
};

exports.authenticateReset = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        message: "Thiếu token để reset mật khẩu.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Kiểm tra audience của token
    if (decoded.aud !== "app:reset") {
      return res.status(403).json({
        message: "Token không hợp lệ cho việc reset mật khẩu",
      });
    }

    // Tìm user theo id trong token
    const currentUser = await User.findById(decoded.sub).select(
      "+passwordHash"
    );

    if (!currentUser) {
      return res.status(401).json({
        message: "Người dùng không tồn tại.",
      });
    }

    req.user = decoded;
    req.currentUser = currentUser;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Token không hợp lệ.",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token reset đã hết hạn. Vui lòng yêu cầu reset mật khẩu mới.",
      });
    }

    return res.status(500).json({
      message: "Lỗi server khi xác thực token reset.",
      error: error.message,
    });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Kiểm tra user có tồn tại không
    if (!req.user) {
      console.log("❌ No user in request");
      return res.status(401).json({
        message: "Unauthorized",
      });
    }
    // Kiểm tra user có role không
    if (!req.user.role) {
      return res.status(403).json({
        message: "Người dùng không có vai trò.",
      });
    }
    // Kiểm tra role có khớp không
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Bạn không có quyền truy cập tính năng này.",
      });
    }
    next();
  };
};
