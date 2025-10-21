const Notification = require("../models/Notification");
const User = require("../models/User");

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
        // Department notifications
        {
          targetAudience: "Department",
          departmentId: req.user.department?.department_id,
        },
        // All users notifications
        { targetAudience: "All" },
        // Specific users notifications
        { targetAudience: "SpecificUsers", targetUserIds: userId },
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
              targetAudience: { $in: ["All", "Department", "SpecificUsers"] },
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
        // Department/All/SpecificUsers chưa đọc
        {
          targetAudience: { $in: ["All", "Department", "SpecificUsers"] },
          $or: [
            { departmentId: req.user.department?.department_id },
            { targetAudience: "All" },
            { targetUserIds: userId },
          ],
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
        // Department/All/SpecificUsers chưa đọc
        {
          targetAudience: { $in: ["All", "Department", "SpecificUsers"] },
          $or: [
            { departmentId: req.user.department?.department_id },
            { targetAudience: "All" },
            { targetUserIds: userId },
          ],
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
      // Department, All, SpecificUsers
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

    // Update Department/All/SpecificUsers notifications
    await Notification.updateMany(
      {
        targetAudience: { $in: ["All", "Department", "SpecificUsers"] },
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
