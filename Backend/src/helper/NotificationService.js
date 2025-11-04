const Notification = require("../models/Notification");

/**
 * Tạo thông báo cho một user
 */
const createNotificationForUser = async ({
  userId,
  senderId,
  senderName,
  senderAvatar,
  type,
  message,
  relatedId,
  metadata = {},
}) => {
  try {
    console.log(`📧 Tạo notification: type=${type}, userId=${userId}, message=${message.substring(0, 50)}...`);
    
    const notification = await Notification.create({
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
    });
    
    console.log(`✅ Notification đã tạo thành công: ID=${notification._id}`);
    
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
    
    
    
    return createdNotifications;
  } catch (error) {
    console.error("❌ Lỗi tạo thông báo cho nhiều users:", error);
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
  
    
    return notification;
  } catch (error) {
    console.error("❌ Lỗi tạo thông báo cho tất cả:", error);
    throw error;
  }
};

module.exports = {
  createNotificationForUser,
  createNotificationForMultipleUsers,
  createNotificationForAll,
};