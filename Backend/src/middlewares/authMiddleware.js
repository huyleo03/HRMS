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

    // QUAN TRỌNG: Không kiểm tra trạng thái tài khoản
    // Cho phép reset mật khẩu ngay cả khi tài khoản bị vô hiệu hóa

    // Gắn thông tin user và decoded token vào request
    req.user = decoded; // Chỉ truyền decoded, không phải currentUser
    req.currentUser = currentUser; // Truyền currentUser riêng để sử dụng trong controller
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

// Middleware phân quyền
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Bạn không có quyền truy cập tính năng này.",
      });
    }
    next();
  };
};

// Middleware kiểm tra user có phải chính chủ tài khoản không
exports.isOwnerOrAdmin = (req, res, next) => {
  const userId = req.params.userId || req.params.id;

  if (req.user.role === "Admin" || req.user._id.toString() === userId) {
    return next();
  }

  return res.status(403).json({
    message: "Bạn chỉ có thể truy cập thông tin của chính mình.",
  });
};

// Middleware kiểm tra Manager có quyền quản lý employee không
exports.canManageEmployee = async (req, res, next) => {
  try {
    const employeeId = req.params.employeeId || req.params.id;

    // Admin có quyền quản lý tất cả
    if (req.user.role === "Admin") {
      return next();
    }

    // Manager chỉ có thể quản lý employee trong department của mình
    if (req.user.role === "Manager") {
      const employee = await User.findById(employeeId);

      if (!employee) {
        return res.status(404).json({
          message: "Không tìm thấy nhân viên.",
        });
      }

      // Kiểm tra cùng department
      if (
        employee.department.department_id?.toString() ===
        req.user.department.department_id?.toString()
      ) {
        return next();
      }
    }

    return res.status(403).json({
      message: "Bạn không có quyền quản lý nhân viên này.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server khi kiểm tra quyền.",
      error: error.message,
    });
  }
};

// Middleware kiểm tra profile đã hoàn thành chưa
exports.requireCompleteProfile = (req, res, next) => {
  if (!req.user.profileCompleted && req.user.role !== "Admin") {
    return res.status(400).json({
      message:
        "Vui lòng hoàn thành thông tin cá nhân trước khi sử dụng hệ thống.",
      requireProfileUpdate: true,
    });
  }
  next();
};
