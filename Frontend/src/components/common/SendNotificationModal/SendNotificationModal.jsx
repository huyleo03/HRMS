import React, { useState } from "react";
import { X, Send, Users, Building2 } from "lucide-react";
import { sendNotification } from "../../../service/NotificationService";
import { toast } from "react-toastify";
import { useAuth } from "../../../contexts/AuthContext";
import "./SendNotificationModal.css";

const SendNotificationModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error("Vui lòng nhập nội dung thông báo");
      return;
    }

    // Validation cho Manager
    if (user?.role === "Manager" && !user?.department?.department_id) {
      toast.error("Không tìm thấy thông tin phòng ban của bạn");
      return;
    }

    try {
      setLoading(true);

      // Xây dựng payload dựa trên role
      const payload = {
        message: message.trim(),
        type: "General", // Luôn là General
      };

      if (user?.role === "Admin") {
        // Admin: Gửi cho tất cả (trừ Admin)
        payload.targetType = "all";
      } else if (user?.role === "Manager") {
        // Manager: Gửi cho department của mình
        payload.targetType = "department";
        payload.departmentId = user.department.department_id;
      }

      const response = await sendNotification(payload);

      // Xử lý hiển thị số người nhận
      let recipientCount;
      if (typeof response.affectedUsers === "string") {
        // Backend trả về string trực tiếp (ví dụ: "50 users")
        recipientCount = response.affectedUsers;
      } else if (Array.isArray(response.affectedUsers)) {
        // Backend trả về mảng
        if (response.affectedUsers.length === 1 && typeof response.affectedUsers[0] === "string" && response.affectedUsers[0].includes("users")) {
          // Trường hợp: ["50 users (tất cả Manager và Employee)"]
          recipientCount = response.affectedUsers[0];
        } else {
          // Trường hợp: ["User 1", "User 2", ...] - mảng tên người dùng
          recipientCount = `${response.affectedUsers.length} người`;
        }
      } else {
        recipientCount = "nhiều người";
      }

      toast.success(`✅ Gửi thông báo thành công đến ${recipientCount}`);

      // Reset form
      setMessage("");
      onClose();
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error(
        error?.response?.data?.message || "Có lỗi xảy ra khi gửi thông báo"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setMessage("");
      onClose();
    }
  };

  if (!isOpen) return null;

  const isManager = user?.role === "Manager";
  const isAdmin = user?.role === "Admin";

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content send-notification-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>
            <Send size={24} />
            Gửi Thông Báo
          </h2>
          <button className="btn-close" onClick={handleClose} disabled={loading}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Message */}
          <div className="form-group">
            <label className="form-label required">
              Nội dung thông báo
              <span className="char-count">{message.length}/1000</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Nhập nội dung thông báo..."
              rows={6}
              maxLength={1000}
              required
              className="form-textarea"
              disabled={loading}
            />
          </div>

          {/* Recipient Info Box */}
          <div className="info-box recipient-info">
            {isAdmin ? (
              <>
                <Users size={18} />
                <div>
                  <strong>Thông báo sẽ gửi đến:</strong>
                  <p>Tất cả người dùng (trừ Admin khác)</p>
                </div>
              </>
            ) : isManager ? (
              <>
                <Building2 size={18} />
                <div>
                  <strong>Thông báo sẽ gửi đến:</strong>
                  {user?.department?.department_name ? (
                    <p>
                      Tất cả Employee trong phòng ban{" "}
                      <strong>{user.department.department_name}</strong>
                    </p>
                  ) : (
                    <p style={{ color: '#d73a49' }}>
                      ⚠️ Bạn chưa được gán vào phòng ban nào. Vui lòng liên hệ Admin.
                    </p>
                  )}
                </div>
              </>
            ) : null}
          </div>

          {/* Submit Buttons */}
          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Hủy
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading || (isManager && !user?.department?.department_id)}
            >
              {loading ? (
                <>
                  <div className="spinner-small"></div>
                  <span>Đang gửi...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>Gửi thông báo</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SendNotificationModal;
