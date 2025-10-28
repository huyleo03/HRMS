const Notification = require("../models/Notification");
const User = require("../models/User");
const mongoose = require("mongoose"); // 🔹 ADDED: For ObjectId type checking

/**
 * Lấy danh sách notifications của user hiện tại
 * GET /api/notifications
 */
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, skip = 0, unreadOnly = false } = req.query;

    // Build query
    const query = {
      $or: [
        // Individual notifications
        { targetAudience: "Individual", userId: userId },
        // All users notifications
        { targetAudience: "All" },
      ],
    };

    // Filter unread only
    if (unreadOnly === "true") {
      query.$and = [
        {
          $or: [
            // Individual: chưa đọc
            { targetAudience: "Individual", isRead: false },
            // Các loại khác: user chưa có trong readBy
            {
              targetAudience: { $in: ["All", "Department"] },
              readBy: { $nin: [userId] },
            },
          ],
        },
      ];
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate("senderId", "full_name avatar email")
      .populate("relatedId")
      .lean();

    // Đánh dấu isRead cho từng notification (để Frontend biết)
    const notificationsWithReadStatus = notifications.map((notif) => {
      let isReadByUser = false;

      if (notif.targetAudience === "Individual") {
        isReadByUser = notif.isRead;
      } else {
        isReadByUser = notif.readBy?.some(
          (id) => id.toString() === userId.toString()
        );
      }

      return {
        ...notif,
        isReadByCurrentUser: isReadByUser,
      };
    });

    // Đếm tổng số notifications
    const total = await Notification.countDocuments(query);

    // Đếm số unread
    const unreadQuery = {
      $or: [
        // Individual notifications chưa đọc
        { targetAudience: "Individual", userId: userId, isRead: false },
        // All chưa đọc
        {
          targetAudience: "All",
          readBy: { $nin: [userId] },
        },
      ],
    };

    const unreadCount = await Notification.countDocuments(unreadQuery);

    res.status(200).json({
      notifications: notificationsWithReadStatus,
      total,
      unreadCount,
      limit: parseInt(limit),
      skip: parseInt(skip),
    });
  } catch (error) {
    console.error("❌ Lỗi khi lấy notifications:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy notifications",
      error: error.message,
    });
  }
};

/**
 * Đếm số notifications chưa đọc
 * GET /api/notifications/unread-count
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadQuery = {
      $or: [
        // Individual notifications chưa đọc
        { targetAudience: "Individual", userId: userId, isRead: false },
        // All chưa đọc
        {
          targetAudience: "All",
          readBy: { $nin: [userId] },
        },
      ],
    };

    const unreadCount = await Notification.countDocuments(unreadQuery);

    res.status(200).json({
      unreadCount,
    });
  } catch (error) {
    console.error("❌ Lỗi khi đếm unread notifications:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
};

/**
 * Đánh dấu 1 notification đã đọc
 * PUT /api/notifications/:id/read
 */
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({ message: "Notification không tồn tại" });
    }

    // Kiểm tra quyền
    if (notification.targetAudience === "Individual") {
      if (notification.userId.toString() !== userId.toString()) {
        return res
          .status(403)
          .json({ message: "Bạn không có quyền đánh dấu notification này" });
      }
      notification.isRead = true;
    } else {
      // Department, All
      if (!notification.readBy.includes(userId)) {
        notification.readBy.push(userId);
      }
    }

    await notification.save();

    res.status(200).json({
      message: "Đã đánh dấu đã đọc",
      notification,
    });
  } catch (error) {
    console.error("❌ Lỗi khi đánh dấu notification:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
};

/**
 * Đánh dấu TẤT CẢ notifications đã đọc
 * PUT /api/notifications/read-all
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    // Update Individual notifications
    await Notification.updateMany(
      { targetAudience: "Individual", userId: userId, isRead: false },
      { isRead: true }
    );

    // Update All notifications
    await Notification.updateMany(
      {
        targetAudience: "All",
        readBy: { $nin: [userId] },
      },
      { $addToSet: { readBy: userId } }
    );

    res.status(200).json({
      message: "Đã đánh dấu tất cả notifications đã đọc",
    });
  } catch (error) {
    console.error("❌ Lỗi khi đánh dấu tất cả notifications:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
};

/**
 * Xóa 1 notification
 * DELETE /api/notifications/:id
 */
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({ message: "Notification không tồn tại" });
    }

    // Chỉ cho phép xóa Individual notifications của chính mình
    if (notification.targetAudience !== "Individual") {
      return res.status(403).json({
        message: "Chỉ có thể xóa notifications cá nhân",
      });
    }

    if (notification.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "Bạn không có quyền xóa notification này",
      });
    }

    await Notification.findByIdAndDelete(id);

    res.status(200).json({
      message: "Đã xóa notification",
    });
  } catch (error) {
    console.error("❌ Lỗi khi xóa notification:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
};

/**
 * Xóa TẤT CẢ notifications đã đọc
 * DELETE /api/notifications/read
 */
exports.deleteAllRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await Notification.deleteMany({
      targetAudience: "Individual",
      userId: userId,
      isRead: true,
    });

    res.status(200).json({
      message: `Đã xóa ${result.deletedCount} notifications đã đọc`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("❌ Lỗi khi xóa notifications đã đọc:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
};

/**
 * Gửi thông báo (Admin/Manager only)
 * POST /api/notifications/send
 * 
 * Body:
 * {
 *   "message": "Nội dung thông báo",
 *   "type": "General",
 *   "targetType": "all" | "department" | "specific",
 *   "targetUserIds": ["user1", "user2"] (optional, for specific users)
 * }
 */
exports.sendNotification = async (req, res) => {
  try {
    const senderId = req.user.id;
    const senderRole = req.user.role;
    const { message, type = "General", targetType, targetUserIds } = req.body;

    // Validate required fields
    if (!message || !message.trim()) {
      return res.status(400).json({ 
        message: "Nội dung thông báo không được để trống" 
      });
    }

    if (!targetType || !["all", "department", "specific"].includes(targetType)) {
      return res.status(400).json({ 
        message: "targetType phải là 'all', 'department', hoặc 'specific'" 
      });
    }

    // Get sender info
    const sender = await User.findById(senderId).select("full_name avatar email department");
    if (!sender) {
      return res.status(404).json({ message: "Sender không tồn tại" });
    }

    let notification;
    let affectedUsers = [];

    // ===== ADMIN: Gửi cho tất cả (trừ Admin) =====
    if (senderRole === "Admin") {
      if (targetType === "all") {
        // Tạo 1 broadcast notification
        notification = await Notification.create({
          targetAudience: "All",
          senderId: sender._id,
          senderName: sender.full_name,
          senderAvatar: sender.avatar,
          type,
          message: message.trim(),
          relatedId: null,
          readBy: [],
        });

        // Đếm số users sẽ nhận (exclude Admin)
        const userCount = await User.countDocuments({ 
          role: { $ne: "Admin" },
          status: "Active" // 🔹 FIXED: Capital "A"
        });
        
        affectedUsers = [`${userCount} users (tất cả Manager và Employee)`];

      } else if (targetType === "specific") {
        if (!targetUserIds || !Array.isArray(targetUserIds) || targetUserIds.length === 0) {
          return res.status(400).json({ 
            message: "targetUserIds là bắt buộc khi targetType='specific'" 
          });
        }

        // Tạo Individual notifications cho từng user
        const users = await User.find({ 
          _id: { $in: targetUserIds },
          status: "Active" // 🔹 FIXED: Capital "A"
        }).select("full_name");

        const notifications = targetUserIds.map(userId => ({
          targetAudience: "Individual",
          userId,
          senderId: sender._id,
          senderName: sender.full_name,
          senderAvatar: sender.avatar,
          type,
          message: message.trim(),
          relatedId: null,
          isRead: false,
        }));

        const createdNotifications = await Notification.insertMany(notifications);
        notification = { count: createdNotifications.length };
        affectedUsers = users.map(u => u.full_name);
      }

    // ===== MANAGER: Chỉ gửi cho Employee trong phòng ban =====
    } else if (senderRole === "Manager") {
      // Kiểm tra Manager có phòng ban không
      if (!sender.department || !sender.department.department_id) {
        return res.status(403).json({ 
          message: "Manager phải thuộc một phòng ban để gửi thông báo" 
        });
      }

      const managerDepartmentId = sender.department.department_id;

      if (targetType === "all") {
        return res.status(403).json({ 
          message: "Manager không có quyền gửi thông báo toàn hệ thống. Chỉ Admin mới có quyền này." 
        });
      }

      if (targetType === "department") {
        // Lấy danh sách Employee trong phòng ban
        const departmentEmployees = await User.find({
          "department.department_id": managerDepartmentId,
          role: "Employee",  // Chỉ Employee
          status: "Active" // 🔹 FIXED: Capital "A" to match database
        }).select("_id full_name");

        if (departmentEmployees.length === 0) {
          return res.status(400).json({ 
            message: "Không có Employee nào trong phòng ban của bạn" 
          });
        }

        // Tạo Individual notifications cho từng Employee
        const notifications = departmentEmployees.map(emp => ({
          targetAudience: "Individual",
          userId: emp._id,
          senderId: sender._id,
          senderName: sender.full_name,
          senderAvatar: sender.avatar,
          type,
          message: message.trim(),
          relatedId: null,
          isRead: false,
        }));

        const createdNotifications = await Notification.insertMany(notifications);
        notification = { count: createdNotifications.length };
        affectedUsers = departmentEmployees.map(u => u.full_name);

      } else if (targetType === "specific") {
        if (!targetUserIds || !Array.isArray(targetUserIds) || targetUserIds.length === 0) {
          return res.status(400).json({ 
            message: "targetUserIds là bắt buộc khi targetType='specific'" 
          });
        }

        // Kiểm tra tất cả targetUsers phải là Employee trong phòng ban
        const targetUsers = await User.find({ 
          _id: { $in: targetUserIds },
          "department.department_id": managerDepartmentId,
          role: "Employee",  // Chỉ Employee
          status: "Active" // 🔹 FIXED: Capital "A"
        }).select("_id full_name");

        if (targetUsers.length !== targetUserIds.length) {
          return res.status(403).json({ 
            message: "Manager chỉ có thể gửi thông báo cho Employee trong phòng ban của mình" 
          });
        }

        // Tạo Individual notifications
        const notifications = targetUsers.map(user => ({
          targetAudience: "Individual",
          userId: user._id,
          senderId: sender._id,
          senderName: sender.full_name,
          senderAvatar: sender.avatar,
          type,
          message: message.trim(),
          relatedId: null,
          isRead: false,
        }));

        const createdNotifications = await Notification.insertMany(notifications);
        notification = { count: createdNotifications.length };
        affectedUsers = targetUsers.map(u => u.full_name);
      }

    // ===== EMPLOYEE: Không có quyền gửi =====
    } else {
      return res.status(403).json({ 
        message: "Employee không có quyền gửi thông báo. Chỉ Admin và Manager mới có quyền này." 
      });
    }

    res.status(201).json({
      message: "Gửi thông báo thành công",
      notification,
      affectedUsers: affectedUsers.length <= 10 ? affectedUsers : `${affectedUsers.length} users`,
    });

  } catch (error) {
    console.error("❌ Lỗi khi gửi thông báo:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
};
