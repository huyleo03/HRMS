import React, { useState } from "react";
import { toast } from "react-toastify";
import { manualAdjust } from "../../../service/AttendanceService";
import "../css/AttendanceAdjustModal.css";

const AttendanceAdjustModal = ({ record, onClose, onSuccess }) => {
  // Helper function to get time only (HH:mm format)
  const toTimeString = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Get the date from record (this will be fixed, user can only change time)
  const recordDate = new Date(record.date);
  recordDate.setHours(0, 0, 0, 0);

  const [formData, setFormData] = useState({
    clockInTime: toTimeString(record.clockIn),
    clockOutTime: toTimeString(record.clockOut),
    reason: record.adjustmentReason || "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Helper to combine date with time
  const combineDateTime = (timeString) => {
    if (!timeString) return null;
    const [hours, minutes] = timeString.split(':');
    const dateTime = new Date(recordDate);
    dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return dateTime;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.reason.trim()) {
      toast.error("Vui lòng nhập lý do điều chỉnh!");
      return;
    }

    // Combine date with time
    const clockInDate = formData.clockInTime ? combineDateTime(formData.clockInTime) : null;
    const clockOutDate = formData.clockOutTime ? combineDateTime(formData.clockOutTime) : null;

    // Validate dates - không cho phép thời gian trong tương lai
    const now = new Date();
    
    if (clockInDate && clockInDate > now) {
      toast.error("Giờ vào không được trong tương lai!");
      return;
    }
    
    if (clockOutDate && clockOutDate > now) {
      toast.error("Giờ ra không được trong tương lai!");
      return;
    }

    // Validate clockOut phải sau clockIn
    if (clockInDate && clockOutDate && clockOutDate <= clockInDate) {
      toast.error("Giờ ra phải sau giờ vào!");
      return;
    }

    setLoading(true);
    try {
      const adjustData = {
        // Send combined datetime as ISO string (không gửi status, để backend tự tính)
        clockIn: clockInDate ? clockInDate.toISOString() : undefined,
        clockOut: clockOutDate ? clockOutDate.toISOString() : undefined,
        reason: formData.reason,
      };

      await manualAdjust(record._id, adjustData);
      toast.success("Điều chỉnh thành công!");
      onSuccess();
    } catch (error) {
      console.error("Adjust error:", error);
      toast.error(error.response?.data?.message || "Không thể điều chỉnh");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content adjust-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Điều chỉnh thủ công</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="#16151C"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Employee Info */}
            <div className="adjust-section">
              <div className="adjust-employee-info">
                <div className="adjust-employee-avatar">
                  {record.userId?.avatar && record.userId.avatar !== "https://i.pravatar.cc/150" ? (
                    <img src={record.userId.avatar} alt={record.userId.full_name} />
                  ) : (
                    <span className="avatar-initials">
                      {record.userId?.full_name
                        ? record.userId.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)
                        : "U"}
                    </span>
                  )}
                </div>
                <div className="adjust-employee-detail">
                  <div className="adjust-employee-name">{record.userId?.full_name || "N/A"}</div>
                  <div className="adjust-employee-meta">
                    {record.userId?.employeeId || "N/A"} • {record.userId?.department?.department_name || "N/A"}
                  </div>
                </div>
              </div>
              <div className="time-only-notice">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 8V13M21 12C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12Z" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M11.995 16H12.004" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Lưu ý: Chỉ được phép chỉnh sửa giờ, ngày giữ nguyên là {recordDate.toLocaleDateString('vi-VN')}
              </div>
            </div>

            {/* Form Fields */}
            <div className="adjust-section">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2C17.52 2 22 6.48 22 12Z" stroke="#10B981" strokeWidth="1.5"/>
                      <path d="M15.71 15.18L12.61 13.33C12.07 13.01 11.63 12.24 11.63 11.61V7.51001" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    Giờ vào
                  </label>
                  <input
                    type="time"
                    name="clockInTime"
                    className="form-input"
                    value={formData.clockInTime}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2C17.52 2 22 6.48 22 12Z" stroke="#EF4444" strokeWidth="1.5"/>
                      <path d="M15.71 15.18L12.61 13.33C12.07 13.01 11.63 12.24 11.63 11.61V7.51001" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    Giờ ra
                  </label>
                  <input
                    type="time"
                    name="clockOutTime"
                    className="form-input"
                    value={formData.clockOutTime}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label required">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 9V14M12 21.41H5.94C2.47 21.41 1.02 18.93 2.7 15.9L5.82 10.28L8.76 5C10.54 1.79 13.46 1.79 15.24 5L18.18 10.29L21.3 15.91C22.98 18.94 21.52 21.42 18.06 21.42H12V21.41Z" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M11.995 17H12.004" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Lý do điều chỉnh
                </label>
                <textarea
                  name="reason"
                  className="form-textarea"
                  rows="4"
                  placeholder="Nhập lý do điều chỉnh..."
                  value={formData.reason}
                  onChange={handleChange}
                  required
                />
                <div className="form-note">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M12 8V13M21 12C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12Z" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M11.995 16H12.004" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Trạng thái sẽ tự động tính lại dựa trên giờ vào/ra và cấu hình công ty
                </div>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="modal-btn-cancel" onClick={onClose} disabled={loading}>
              Hủy
            </button>
            <button type="submit" className="modal-btn-submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="btn-spinner"></div>
                  Đang xử lý...
                </>
              ) : (
                "Xác nhận điều chỉnh"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AttendanceAdjustModal;
