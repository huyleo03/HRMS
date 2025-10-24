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
    
    console.log(`✅ Notification created for user ${userId}`);
    
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

    const createdNotifications = await Notification.insertMany(notifications);
    
    console.log(`✅ ${createdNotifications.length} notifications created`);
    
    return createdNotifications;
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
    const notification = await Notification.create({
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
    
    console.log(`✅ Department notification created for department ${departmentName}`);
    
    return notification;
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
    const notification = await Notification.create({
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
    
    console.log('✅ Notification created for all users');
    
    return notification;
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