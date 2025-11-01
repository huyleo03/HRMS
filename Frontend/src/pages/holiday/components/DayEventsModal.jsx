import React from "react";
import "../css/DayEventsModal.css";

/**
 * DayEventsModal - Modal hiển thị tất cả events (holidays + leaves) của 1 ngày
 * @param {Object} day - Day object chứa date và holidays array
 * @param {Function} onClose - Callback khi đóng modal
 * @param {Function} onEventClick - Callback khi click vào 1 event để xem chi tiết
 */
const DayEventsModal = ({ day, onClose, onEventClick }) => {
  const formatDate = (date) => {
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    if (days === 1) {
      return "1 ngày";
    }
    
    return `${days} ngày (${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1})`;
  };

  const getHolidayIcon = (type) => {
    const icons = {
      National: "🎆",
      Company: "🎉",
      Optional: "⭐",
      Regional: "🏖️",
    };
    return icons[type] || "📅";
  };

  const getHolidayTypeBadge = (type) => {
    const labels = {
      National: "Quốc gia",
      Company: "Công ty",
      Optional: "Tùy chọn",
      Regional: "Khu vực",
    };
    return labels[type] || type;
  };

  // Phân loại events
  const companyHolidays = day.holidays.filter(h => h.itemType === 'holiday');
  const employeeLeaves = day.holidays.filter(h => h.itemType === 'leave');

  return (
    <div className="day-events-modal-overlay" onClick={onClose}>
      <div className="day-events-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="day-events-modal-header">
          <h2>📅 Lịch nghỉ - {formatDate(day.date)}</h2>
          <button className="day-events-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Body */}
        <div className="day-events-modal-body">
          {day.holidays.length === 0 ? (
            <div className="no-events">
              <p>Không có sự kiện nào trong ngày này</p>
            </div>
          ) : (
            <>
              {/* Company Holidays Section */}
              {companyHolidays.length > 0 && (
                <div className="events-section">
                  <h3 className="section-title">🎉 Ngày lễ công ty ({companyHolidays.length})</h3>
                  <div className="events-list">
                    {companyHolidays.map((holiday) => (
                      <div
                        key={holiday._id}
                        className="event-card event-card--holiday"
                        onClick={() => onEventClick(holiday)}
                      >
                        <div className="event-card-header">
                          <div className="event-icon">{getHolidayIcon(holiday.type)}</div>
                          <div className="event-info">
                            <h4 className="event-name">{holiday.name}</h4>
                            <div className="event-badges">
                              <span className={`badge badge--${holiday.type?.toLowerCase()}`}>
                                {getHolidayTypeBadge(holiday.type)}
                              </span>
                              {holiday.isPaid && (
                                <span className="badge badge--paid">💰 Có lương</span>
                              )}
                              {holiday.isRecurring && (
                                <span className="badge badge--recurring">🔄 Hàng năm</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {holiday.description && (
                          <p className="event-description">{holiday.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Employee Leaves Section */}
              {employeeLeaves.length > 0 && (
                <div className="events-section">
                  <h3 className="section-title">👥 Nghỉ phép & Công tác ({employeeLeaves.length})</h3>
                  <div className="events-list">
                    {employeeLeaves.map((leave) => (
                      <div
                        key={leave._id}
                        className="event-card event-card--leave"
                        onClick={() => onEventClick(leave)}
                      >
                        <div className="event-card-header">
                          <div className="employee-avatar-container">
                            {leave.employeeAvatar ? (
                              <img
                                src={leave.employeeAvatar}
                                alt={leave.employeeName}
                                className="employee-avatar"
                              />
                            ) : (
                              <div className="employee-avatar employee-avatar--placeholder">
                                {leave.employeeName?.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="event-info">
                            <h4 className="event-name">
                              {leave.employeeName}
                              {leave.employeeRole === 'Manager' && (
                                <span className="role-badge role-badge--manager">👔 Manager</span>
                              )}
                            </h4>
                            <div className="event-badges">
                              <span className={`badge badge--${leave.requestType === 'BusinessTrip' ? 'trip' : 'leave'}`}>
                                {leave.requestType === 'BusinessTrip' ? '✈️ Công tác' : '👤 Nghỉ phép'}
                              </span>
                              <span className="badge badge--duration">
                                {formatDateRange(leave.startDate, leave.endDate)}
                              </span>
                            </div>
                          </div>
                        </div>
                        {leave.subject && (
                          <p className="event-subject">{leave.subject}</p>
                        )}
                        {leave.reason && (
                          <p className="event-reason">
                            <strong>Lý do:</strong> {leave.reason}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="day-events-modal-footer">
          <button className="btn btn--secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default DayEventsModal;
