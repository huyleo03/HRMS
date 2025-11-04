import React from "react";
import "../css/AttendanceDetailModal.css";

const AttendanceDetailModal = ({ record, onClose }) => {
  if (!record) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "--:--";
    const date = new Date(dateString);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getStatusClass = (status) => {
    const classes = {
      Present: "status-present",
      Late: "status-late",
      "Early Leave": "status-late",
      "Late & Early Leave": "status-absent",
      Absent: "status-absent",
      "On Leave": "status-leave",
    };
    return classes[status] || "";
  };

  const getStatusText = (status) => {
    const texts = {
      Present: "Đúng giờ",
      Late: "Đi muộn",
      "Early Leave": "Về sớm",
      "Late & Early Leave": "Muộn & Về sớm",
      Absent: "Vắng mặt",
      "On Leave": "Nghỉ phép",
    };
    return texts[status] || status;
  };

  return (
    <div className="attendance-detail-modal-wrapper">
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Chi tiết chấm công</h2>
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
        <div className="modal-body">
          {/* Employee Info */}
          <div className="detail-section">
            <h3 className="section-title">Thông tin nhân viên</h3>
            <div className="employee-detail">
              <div className="employee-avatar-large">
                {record.userId?.avatar &&
                record.userId.avatar !== "https://i.pravatar.cc/150" ? (
                  <img
                    src={record.userId.avatar}
                    alt={record.userId.full_name}
                  />
                ) : (
                  <div className="avatar-fallback-large">
                    {record.userId?.full_name
                      ? record.userId.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)
                      : "U"}
                  </div>
                )}
              </div>
              <div className="employee-detail-info">
                <div className="detail-row">
                  <span className="detail-label">Họ tên:</span>
                  <span className="detail-value">
                    {record.userId?.full_name || "N/A"}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Mã nhân viên:</span>
                  <span className="detail-value">
                    {record.userId?.employeeId || "N/A"}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">
                    {record.userId?.email || "N/A"}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Phòng ban:</span>
                  <span className="detail-value">
                    {record.userId?.department?.department_name || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Info */}
          <div className="detail-section">
            <h3 className="section-title">Thông tin chấm công</h3>
            <div className="detail-grid">
              <div className="detail-row">
                <span className="detail-label">Ngày:</span>
                <span className="detail-value">{formatDate(record.date)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Trạng thái:</span>
                <span
                  className={`status-badge ${getStatusClass(record.status)}`}
                >
                  {getStatusText(record.status)}
                </span>
              </div>
            </div>
          </div>

          {/* Clock In/Out */}
          <div className="detail-section">
            <h3 className="section-title">Giờ vào/ra</h3>
            <div className="clock-grid">
              <div className="clock-card">
                <div className="clock-icon clock-in-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 8V12L15 15M22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2C17.52 2 22 6.48 22 12Z"
                      stroke="#10B981"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="clock-info">
                  <div className="clock-label">Giờ vào</div>
                  <div className="clock-time">
                    {formatTime(record.clockIn)}
                  </div>
                  {record.clockInIP && (
                    <div className="clock-ip">IP: {record.clockInIP}</div>
                  )}
                </div>
              </div>

              <div className="clock-card">
                <div className="clock-icon clock-out-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 8V12L15 15M22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2C17.52 2 22 6.48 22 12Z"
                      stroke="#EF4444"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="clock-info">
                  <div className="clock-label">Giờ ra</div>
                  <div className="clock-time">
                    {formatTime(record.clockOut)}
                  </div>
                  {record.clockOutIP && (
                    <div className="clock-ip">IP: {record.clockOutIP}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Work Hours */}
          <div className="detail-section">
            <h3 className="section-title">Thời gian làm việc</h3>
            <div className="work-hours-grid">
              <div className="work-hour-card">
                <div className="work-hour-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2C17.52 2 22 6.48 22 12Z"
                      stroke="#7152F3"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M15.71 15.18L12.61 13.33C12.07 13.01 11.63 12.24 11.63 11.61V7.51001"
                      stroke="#7152F3"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div className="work-hour-info">
                  <div className="work-hour-label">Giờ làm việc</div>
                  <div className="work-hour-value">
                    {record.workHours || 0} giờ
                  </div>
                </div>
              </div>

              <div className="work-hour-card">
                <div className="work-hour-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M9.5 13.75C9.5 14.72 10.25 15.5 11.17 15.5H13.05C13.85 15.5 14.5 14.82 14.5 13.97C14.5 13.06 14.1 12.73 13.51 12.52L10.5 11.47C9.91 11.26 9.51001 10.94 9.51001 10.02C9.51001 9.17999 10.16 8.48999 10.96 8.48999H12.84C13.76 8.48999 14.51 9.26999 14.51 10.24"
                      stroke="#F59E0B"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M12 7.5V16.5"
                      stroke="#F59E0B"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2C17.52 2 22 6.48 22 12Z"
                      stroke="#F59E0B"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
                <div className="work-hour-info">
                  <div className="work-hour-label">Làm thêm giờ</div>
                  <div className="work-hour-value">
                    {record.overtimeHours || 0} giờ
                  </div>
                </div>
              </div>

              {record.isLate && (
                <div className="work-hour-card">
                  <div className="work-hour-icon warning">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M12 9V14M12 21.41H5.94C2.47 21.41 1.02 18.93 2.7 15.9L5.82 10.28L8.76 5C10.54 1.79 13.46 1.79 15.24 5L18.18 10.29L21.3 15.91C22.98 18.94 21.52 21.42 18.06 21.42H12V21.41Z"
                        stroke="#F59E0B"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M11.995 17H12.004"
                        stroke="#F59E0B"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <div className="work-hour-info">
                    <div className="work-hour-label">Đi muộn</div>
                    <div className="work-hour-value warning-text">
                      {record.lateMinutes || 0} phút
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Photos */}
          {(record.clockInPhoto || record.clockOutPhoto) && (
            <div className="detail-section">
              <h3 className="section-title">Ảnh chấm công</h3>
              <div className="photos-grid">
                {record.clockInPhoto && (
                  <div className="photo-card">
                    <div className="photo-label">Ảnh check-in</div>
                    <img
                      src={record.clockInPhoto}
                      alt="Clock In"
                      className="attendance-photo"
                    />
                  </div>
                )}
                {record.clockOutPhoto && (
                  <div className="photo-card">
                    <div className="photo-label">Ảnh check-out</div>
                    <img
                      src={record.clockOutPhoto}
                      alt="Clock Out"
                      className="attendance-photo"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Manual Adjustment */}
          {record.isManuallyAdjusted && (
            <div className="detail-section">
              <h3 className="section-title">Điều chỉnh thủ công</h3>
              <div className="adjustment-info">
                <div className="adjustment-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 9V14M12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12C21 16.97 16.97 21 12 21Z"
                      stroke="#F59E0B"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M11.995 17H12.004"
                      stroke="#F59E0B"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  Đã chỉnh sửa thủ công
                </div>
                {record.adjustmentReason && (
                  <div className="adjustment-reason">
                    <strong>Lý do:</strong> {record.adjustmentReason}
                  </div>
                )}
                {record.adjustedAt && (
                  <div className="adjustment-time">
                    Chỉnh sửa lúc: {formatTime(record.adjustedAt)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Remarks */}
          {record.remarks && (
            <div className="detail-section">
              <h3 className="section-title">Ghi chú</h3>
              <div className="remarks-box">{record.remarks}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="modal-btn-close" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
    </div>
  );
};

export default AttendanceDetailModal;
