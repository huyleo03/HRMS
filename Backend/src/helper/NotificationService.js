const Notification = require("../models/Notification");

/**
 * Tạo thông báo cho một user
 */
const createNotificationForUser = async ({
  userId,
  userName,
  senderId,
  senderName,
  senderAvatar,
  type,
  message,
  relatedId,
  metadata = {},
}) => {
  try {
    const notification = await Notification.create({
      targetAudience: "Individual",
      userId,
      userName,
      senderId,
      senderName,
      senderAvatar,
      type,
      message,
      relatedId,
      metadata,
      isRead: false,
    });
    return notification;
  } catch (error) {
    console.error("❌ Lỗi tạo thông báo:", error);
    throw error;
  }
};

/**
 * Tạo thông báo cho nhiều users
 */
const createNotificationForMultipleUsers = async (
  userIds,
  {
    senderId,
    senderName,
    senderAvatar,
    type,
    message,
    relatedId,
    metadata = {},
  }
) => {
  try {
    const notifications = userIds.map((userId) => ({
      targetAudience: "Individual",
      userId,
      senderId,
      senderName,
      senderAvatar,
      type,
      message,
      relatedId,
      metadata,
      isRead: false,
    }));

    return await Notification.insertMany(notifications);
  } catch (error) {
    console.error("❌ Lỗi tạo thông báo cho nhiều users:", error);
    throw error;
  }
};

/**
 * Tạo thông báo cho phòng ban
 */
const createNotificationForDepartment = async ({
  departmentId,
  departmentName,
  senderId,
  senderName,
  senderAvatar,
  type,
  message,
  relatedId,
  metadata = {},
}) => {
  try {
    return await Notification.create({
      targetAudience: "Department",
      departmentId,
      departmentName,
      senderId,
      senderName,
      senderAvatar,
      type,
      message,
      relatedId,
      metadata,
      readBy: [],
    });
  } catch (error) {
    console.error("❌ Lỗi tạo thông báo cho phòng ban:", error);
    throw error;
  }
};

/**
 * Tạo thông báo cho tất cả users
 */
const createNotificationForAll = async ({
  senderId,
  senderName,
  senderAvatar,
  type,
  message,
  relatedId,
  metadata = {},
}) => {
  try {
    return await Notification.create({
      targetAudience: "All",
      senderId,
      senderName,
      senderAvatar,
      type,
      message,
      relatedId,
      metadata,
      readBy: [],
    });
  } catch (error) {
    console.error("❌ Lỗi tạo thông báo cho tất cả:", error);
    throw error;
  }
};

module.exports = {
  createNotificationForUser,
  createNotificationForMultipleUsers,
  createNotificationForDepartment,
  createNotificationForAll,
};