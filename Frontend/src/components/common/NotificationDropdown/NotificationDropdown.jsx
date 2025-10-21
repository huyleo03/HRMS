import React, { useState, useEffect, useRef } from "react";
import "./NotificationDropdown.css";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../../../service/NotificationService";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all"); // 'all' or 'unread'
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = {
        limit: 20,
        skip: 0,
        unreadOnly: filter === "unread",
      };
      const response = await getNotifications(params);
      setNotifications(response.notifications || []);
      setUnreadCount(response.unreadCount || 0);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await getUnreadCount();
      setUnreadCount(response.unreadCount || 0);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchUnreadCount();
    // Refresh count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch when dropdown opens or filter changes
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, filter]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Mark as read and navigate
  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read if unread
      if (!notification.isReadByCurrentUser) {
        await markAsRead(notification._id);
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      // Navigate to related page
      if (notification.metadata?.actionUrl) {
        navigate(notification.metadata.actionUrl);
      }

      setIsOpen(false);
      fetchNotifications(); // Refresh list
    } catch (error) {
      console.error("Error handling notification click:", error);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setUnreadCount(0);
      fetchNotifications();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  // Delete notification
  const handleDelete = async (notificationId, e) => {
    e.stopPropagation(); // Prevent click event from bubbling
    try {
      await deleteNotification(notificationId);
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case "NewRequest":
        return "📝";
      case "RequestApproved":
        return "✅";
      case "RequestRejected":
        return "❌";
      case "RequestNeedsReview":
        return "🔍";
      case "RequestResubmitted":
        return "🔄";
      case "RequestCancelled":
        return "🚫";
      case "TaskAssigned":
        return "📋";
      case "AttendanceUpdate":
        return "⏰";
      default:
        return "🔔";
    }
  };

  // Format time
  const formatTime = (date) => {
    try {
      return formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: vi,
      });
    } catch (error) {
      return "Vừa xong";
    }
  };

  return (
    <div className="notification-dropdown-container" ref={dropdownRef}>
      {/* Bell Icon */}
      <div className="notification-bell" onClick={toggleDropdown}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M5.67964 8.79403C6.05382 5.49085 8.77095 3 12 3C15.2291 3 17.9462 5.49085 18.3204 8.79403L18.6652 11.8385C18.7509 12.595 19.0575 13.3069 19.5445 13.88C20.5779 15.0964 19.7392 17 18.1699 17H5.83014C4.26081 17 3.42209 15.0964 4.45549 13.88C4.94246 13.3069 5.24906 12.595 5.33476 11.8385L5.67964 8.79403Z"
            stroke="#16151C"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M15 19C14.5633 20.1652 13.385 21 12 21C10.615 21 9.43668 20.1652 9 19"
            stroke="#16151C"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </div>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="notification-dropdown-panel">
          {/* Header */}
          <div className="notification-header">
            <h3>Thông báo</h3>
            {notifications.length > 0 && (
              <button
                className="mark-all-read-btn"
                onClick={handleMarkAllAsRead}
              >
                Đánh dấu đã đọc
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="notification-filter">
            <button
              className={filter === "all" ? "active" : ""}
              onClick={() => setFilter("all")}
            >
              Tất cả
            </button>
            <button
              className={filter === "unread" ? "active" : ""}
              onClick={() => setFilter("unread")}
            >
              Chưa đọc ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">Đang tải...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ opacity: 0.3 }}
                >
                  <path
                    d="M5.67964 8.79403C6.05382 5.49085 8.77095 3 12 3C15.2291 3 17.9462 5.49085 18.3204 8.79403L18.6652 11.8385C18.7509 12.595 19.0575 13.3069 19.5445 13.88C20.5779 15.0964 19.7392 17 18.1699 17H5.83014C4.26081 17 3.42209 15.0964 4.45549 13.88C4.94246 13.3069 5.24906 12.595 5.33476 11.8385L5.67964 8.79403Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M15 19C14.5633 20.1652 13.385 21 12 21C10.615 21 9.43668 20.1652 9 19"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
                <p>Không có thông báo</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`notification-item ${
                    !notif.isReadByCurrentUser ? "unread" : ""
                  }`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="notification-content">
                    <p className="notification-message">{notif.message}</p>
                    <span className="notification-time">
                      {formatTime(notif.createdAt)}
                    </span>
                  </div>
                  {!notif.isReadByCurrentUser && (
                    <div className="notification-unread-dot"></div>
                  )}
                  <button
                    className="notification-delete-btn"
                    onClick={(e) => handleDelete(notif._id, e)}
                    title="Xóa"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
