import React, { useState } from "react";
import { toast } from "react-toastify";
import { getCalendarHolidays } from "../../../service/HolidayService";
import { getApprovedLeaves } from "../../../service/RequestService";
import HolidayCalendarGrid from "../components/HolidayCalendarGrid";
import HolidayViewModal from "../components/HolidayViewModal";
import HolidayCheckWidget from "../components/HolidayCheckWidget";
import "../css/ManagerHolidayCalendar.css";
import { useAuth } from "../../../contexts/AuthContext";

/**
 * DepartmentCalendarPage - Unified calendar for Manager & Employee
 * Shows:
 * 1. Company Holidays (from Holiday module) - Created by Admin
 * 2. Employee Leaves (from Request module) - Approved leaves in same department
 * 
 * Both Manager and Employee have read-only access
 * They can only view leaves from their own department
 */
function DepartmentCalendarPage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [companyHolidays, setCompanyHolidays] = useState([]);
  const [employeeLeaves, setEmployeeLeaves] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null); 
  const [selectedItemType, setSelectedItemType] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const departmentId = user?.department?.department_id;
  const departmentName = user?.department?.department_name || "N/A";

  const fetchCalendarData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [holidaysData, leavesData] = await Promise.all([
        getCalendarHolidays({ year, month }),
        getApprovedLeaves({ departmentId, year, month })
      ]);
      setCompanyHolidays(holidaysData || []);
      setEmployeeLeaves(leavesData || []);
    } catch (err) {
      console.error("Error fetching calendar data:", err);
      setError("Không thể tải dữ liệu lịch");
      toast.error(err.response?.data?.message || "Lỗi khi tải lịch");
    } finally {
      setLoading(false);
    }
  }, [year, month, departmentId]);

  React.useEffect(() => {
    if (departmentId) {
      fetchCalendarData();
    } else {
      setError("Bạn chưa được gán vào phòng ban nào");
      setLoading(false);
    }
  }, [departmentId, fetchCalendarData]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleItemClick = (item, type) => {
    setSelectedItem(item);
    setSelectedItemType(type);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
    setSelectedItemType(null);
  };

  // Helper: Get label for leave type
  const getLeaveTypeLabel = (leave) => {
    // Check if leave has requestType field from backend
    if (leave.requestType === "BusinessTrip") {
      return "Công tác";
    }
    return "Nghỉ phép";
  };

  const getLeaveTypeIcon = (leave) => {
    if (leave.requestType === "BusinessTrip") {
      return "✈️";
    }
    return "👤";
  };

  // Get upcoming items (holidays + leaves)
  const getUpcomingItems = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next30Days = new Date(today);
    next30Days.setDate(today.getDate() + 30);

    const upcomingHolidays = companyHolidays
      .filter(h => {
        const holidayDate = new Date(h.date);
        return h.status === "Active" && holidayDate >= today && holidayDate <= next30Days;
      })
      .map(h => ({ ...h, itemType: 'holiday' }));

    const upcomingLeaves = employeeLeaves
      .filter(l => {
        const leaveStart = new Date(l.startDate);
        return leaveStart >= today && leaveStart <= next30Days;
      })
      .map(l => ({ ...l, itemType: 'leave' }));

    return [...upcomingHolidays, ...upcomingLeaves]
      .sort((a, b) => new Date(a.date || a.startDate) - new Date(b.date || b.startDate))
      .slice(0, 5);
  };

  const upcomingItems = getUpcomingItems();

  // Merge holidays and leaves for calendar display
  const mergedCalendarData = [
    ...companyHolidays.map(h => ({ ...h, itemType: 'holiday' })),
    ...employeeLeaves.map(l => ({ ...l, itemType: 'leave', date: l.startDate }))
  ];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  return (
    <div className="manager-holiday-container">
      <div className="calendar-header">
        <div>
          <h1>📅 Lịch nghỉ - {departmentName}</h1>
          <p className="subtitle">
            Xem lịch nghỉ lễ công ty và lịch nghỉ phép của phòng ban
          </p>
        </div>
      </div>
      
      {/* Holiday Check Widget - Compact Mode */}
      <HolidayCheckWidget compact={true} defaultCollapsed={true} />
      
      {/* Upcoming Section */}
      {upcomingItems.length > 0 && (
        <div className="upcoming-holidays-section">
          <h3>🔔 Sắp tới trong 30 ngày</h3>
          <div className="upcoming-holidays-list">
            {upcomingItems.map((item) => (
              <div
                key={`${item.itemType}-${item._id}`}
                className="upcoming-holiday-card"
                onClick={() => handleItemClick(item, item.itemType)}
              >
                <div 
                  className="holiday-color-bar" 
                  style={{ 
                    background: item.itemType === 'holiday' 
                      ? (item.color || '#3b82f6') 
                      : '#8b5cf6' // Purple for leaves
                  }}
                />
                <div className="upcoming-holiday-content">
                  <div className="upcoming-holiday-header">
                    <h4>
                      {item.itemType === 'holiday' 
                        ? item.name 
                        : `${item.employeeName} - ${getLeaveTypeLabel(item)}`
                      }
                    </h4>
                    <span className="upcoming-holiday-date">
                      {formatDate(item.date || item.startDate)}
                    </span>
                  </div>
                  <div className="upcoming-holiday-badges">
                    {item.itemType === 'holiday' ? (
                      <>
                        {item.isPaid && (
                          <span className="mini-badge mini-badge--success">
                            💰 Có lương
                          </span>
                        )}
                        {item.isRecurring && (
                          <span className="mini-badge mini-badge--info">
                            🔄 Hàng năm
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="mini-badge mini-badge--info">
                        {getLeaveTypeIcon(item)} {getLeaveTypeLabel(item)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Calendar Navigation */}
      <div className="calendar-controls">
        <button className="manager-btn manager-btn--secondary" onClick={handlePrevMonth}>
          ◀
        </button>
        <h2 className="current-month">
          {currentDate.toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}
        </h2>
        <button className="manager-btn manager-btn--secondary" onClick={handleNextMonth}>
          ▶
        </button>
        <button className="manager-btn manager-btn--primary" onClick={handleToday}>
          Hôm nay
        </button>
      </div>

      {/* Loading/Error States */}
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải lịch...</p>
        </div>
      )}

      {error && !loading && (
        <div className="error-state">
          <p>⚠️ {error}</p>
          <button className="manager-btn manager-btn--primary" onClick={fetchCalendarData}>
            Thử lại
          </button>
        </div>
      )}

      {/* Calendar Grid */}
      {!loading && !error && (
        <>
          <HolidayCalendarGrid
            currentDate={currentDate}
            holidays={mergedCalendarData}
            onHolidayClick={(item) => handleItemClick(item, item.itemType)}
            onDateClick={null} // Read-only, no quick add
          />

          {/* Info Section */}
          <div className="info-section">
            <div className="info-card">
              <h3>📝 Chú ý</h3>
              <ul>
                <li>
                  <strong>Lịch nghỉ công ty (màu đỏ/cam)</strong>: 
                  Ngày lễ, tết do Admin tạo. Hiển thị những ngày áp dụng cho toàn công ty hoặc phòng ban của bạn.
                </li>
                <li>
                  <strong>Lịch nghỉ cá nhân (màu tím)</strong>: 
                  Nghỉ phép & công tác đã được duyệt của các đồng nghiệp trong phòng ban <strong>{departmentName}</strong>.
                </li>
                <li>
                  Cả hai loại lịch được <strong>hiển thị lồng ghép (overlay)</strong> trên cùng một calendar.
                </li>
                <li>
                  Để tạo đơn nghỉ phép hoặc công tác mới, vui lòng vào module "Requests".
                </li>
              </ul>
            </div>

            <div className="info-card">
              <h3>🎨 Chú thích màu</h3>
              <div className="color-legend">
                <div className="legend-item">
                  <div className="legend-color" style={{ background: '#ef4444' }}></div>
                  <span>🏢 Ngày lễ công ty (Admin tạo)</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ background: '#8b5cf6' }}></div>
                  <span>👥 Nghỉ phép & Công tác (Request đã duyệt)</span>
                </div>
              </div>
              <p style={{ marginTop: '12px', fontSize: '13px', color: '#6b7280' }}>
                💡 Hai loại lịch hiển thị chung trên một giao diện
              </p>
            </div>
          </div>
        </>
      )}

      {/* Modal for viewing details */}
      {selectedItem && selectedItemType === 'holiday' && (
        <HolidayViewModal
          holiday={selectedItem}
          onClose={handleCloseModal}
        />
      )}

      {selectedItem && selectedItemType === 'leave' && (
        <LeaveViewModal
          leave={selectedItem}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

// Simple modal for viewing employee leave details
function LeaveViewModal({ leave, onClose }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const calculateDuration = () => {
    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return days;
  };

  const getTypeLabel = () => {
    return leave.requestType === "BusinessTrip" ? "Chi tiết công tác" : "Chi tiết nghỉ phép";
  };

  const getTypeIcon = () => {
    return leave.requestType === "BusinessTrip" ? "✈️" : "👤";
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{getTypeIcon()} {getTypeLabel()}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="holiday-detail-row">
            <span className="detail-label">Nhân viên:</span>
            <div className="employee-info">
              {leave.employeeAvatar && (
                <img 
                  src={leave.employeeAvatar} 
                  alt={leave.employeeName}
                  className="employee-avatar"
                  style={{ width: 32, height: 32, borderRadius: '50%', marginRight: 8 }}
                />
              )}
              <strong>{leave.employeeName}</strong>
            </div>
          </div>

          <div className="holiday-detail-row">
            <span className="detail-label">Ngày bắt đầu:</span>
            <span>{formatDate(leave.startDate)}</span>
          </div>

          <div className="holiday-detail-row">
            <span className="detail-label">Ngày kết thúc:</span>
            <span>{formatDate(leave.endDate)}</span>
          </div>

          <div className="holiday-detail-row">
            <span className="detail-label">Loại:</span>
            <span className="badge badge--info">
              {leave.requestType === "BusinessTrip" ? "✈️ Công tác" : "👤 Nghỉ phép"}
            </span>
          </div>

          <div className="holiday-detail-row">
            <span className="detail-label">Số ngày:</span>
            <span className="badge badge--info">{calculateDuration()} ngày</span>
          </div>

          {leave.subject && (
            <div className="holiday-detail-row">
              <span className="detail-label">Tiêu đề:</span>
              <span>{leave.subject}</span>
            </div>
          )}

          {leave.reason && (
            <div className="holiday-detail-section">
              <span className="detail-label">Lý do:</span>
              <p className="detail-text">{leave.reason}</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn--secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default DepartmentCalendarPage;
