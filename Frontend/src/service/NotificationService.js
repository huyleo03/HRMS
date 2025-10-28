import { apiCall, API_CONFIG } from "./api";

/**
 * Lấy danh sách notifications
 * GET /api/notifications
 */
export const getNotifications = async (params = {}) => {
  try {
    return await apiCall(API_CONFIG.ENDPOINTS.GET_NOTIFICATIONS, {
      method: "GET",
      params: params, // { limit, skip, unreadOnly }
    });
  } catch (error) {
    console.error("getNotifications error:", error);
    throw error;
  }
};

/**
 * Đếm số notifications chưa đọc
 * GET /api/notifications/unread-count
 */
export const getUnreadCount = async () => {
  try {
    return await apiCall(API_CONFIG.ENDPOINTS.GET_UNREAD_COUNT, {
      method: "GET",
    });
  } catch (error) {
    console.error("getUnreadCount error:", error);
    throw error;
  }
};

/**
 * Đánh dấu 1 notification đã đọc
 * PUT /api/notifications/:id/read
 */
export const markAsRead = async (notificationId) => {
  try {
    return await apiCall(API_CONFIG.ENDPOINTS.MARK_AS_READ(notificationId), {
      method: "PUT",
    });
  } catch (error) {
    console.error("markAsRead error:", error);
    throw error;
  }
};

/**
 * Đánh dấu tất cả notifications đã đọc
 * PUT /api/notifications/read-all
 */
export const markAllAsRead = async () => {
  try {
    return await apiCall(API_CONFIG.ENDPOINTS.MARK_ALL_AS_READ, {
      method: "PUT",
    });
  } catch (error) {
    console.error("markAllAsRead error:", error);
    throw error;
  }
};

/**
 * Xóa 1 notification
 * DELETE /api/notifications/:id
 */
export const deleteNotification = async (notificationId) => {
  try {
    return await apiCall(
      API_CONFIG.ENDPOINTS.DELETE_NOTIFICATION(notificationId),
      {
        method: "DELETE",
      }
    );
  } catch (error) {
    console.error("deleteNotification error:", error);
    throw error;
  }
};

/**
 * Xóa tất cả notifications đã đọc
 * DELETE /api/notifications/read
 */
export const deleteAllReadNotifications = async () => {
  try {
    return await apiCall(API_CONFIG.ENDPOINTS.DELETE_ALL_READ, {
      method: "DELETE",
    });
  } catch (error) {
    console.error("deleteAllReadNotifications error:", error);
    throw error;
  }
};

/**
 * Gửi thông báo (Admin/Manager only)
 * POST /api/notifications/send
 * 
 * @param {Object} payload
 * @param {string} payload.message - Nội dung thông báo
 * @param {string} payload.type - Loại thông báo (default: "General")
 * @param {string} payload.targetType - "all" | "department" | "specific"
 * @param {string[]} [payload.targetUserIds] - Array userId (for specific users)
 */
export const sendNotification = async (payload) => {
  try {
    return await apiCall(API_CONFIG.ENDPOINTS.SEND_NOTIFICATION, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("sendNotification error:", error);
    throw error;
  }
};
