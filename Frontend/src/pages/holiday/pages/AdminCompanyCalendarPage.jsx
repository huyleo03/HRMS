import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCalendarHolidays } from "../../../service/HolidayService";
import { getAllCompanyLeavesForCalendar } from "../../../service/RequestService";
import HolidayCalendarGrid from "../components/HolidayCalendarGrid";
import HolidayViewModal from "../components/HolidayViewModal";
import "../css/DepartmentCalendarPage.css";

const AdminCompanyCalendarPage = () => {
  const navigate = useNavigate();
  const currentDate = new Date();

  // State
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [companyHolidays, setCompanyHolidays] = useState([]);
  const [companyLeaves, setCompanyLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter states
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [searchEmployee, setSearchEmployee] = useState("");
  const [uniqueDepartments, setUniqueDepartments] = useState([]);

  // Fetch calendar data
  const fetchCalendarData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [holidaysData, leavesData] = await Promise.all([
        getCalendarHolidays({ year, month }),
        getAllCompanyLeavesForCalendar({ year, month })
      ]);

      setCompanyHolidays(holidaysData || []);
      setCompanyLeaves(leavesData || []);

      // Extract unique departments
      const depts = [...new Set(leavesData.map(leave => leave.departmentName))].filter(Boolean);
      setUniqueDepartments(depts.sort());

    } catch (error) {
      console.error("❌ Lỗi khi tải dữ liệu calendar:", error);
      alert("Không thể tải dữ liệu lịch nghỉ. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  // Filter leaves by department and search
  const filteredLeaves = React.useMemo(() => {
    return companyLeaves.filter(leave => {
      const matchDepartment = selectedDepartment === "all" || leave.departmentName === selectedDepartment;
      const matchSearch = searchEmployee === "" || 
        leave.employeeName.toLowerCase().includes(searchEmployee.toLowerCase());
      return matchDepartment && matchSearch;
    });
  }, [companyLeaves, selectedDepartment, searchEmployee]);

  // Group by department for stats
  const departmentStats = React.useMemo(() => {
    const stats = {};
    filteredLeaves.forEach(leave => {
      const dept = leave.departmentName || "Chưa có phòng ban";
      if (!stats[dept]) {
        stats[dept] = { count: 0, employees: new Set() };
      }
      stats[dept].count++;
      stats[dept].employees.add(leave.employeeId);
    });
    return Object.entries(stats).map(([dept, data]) => ({
      department: dept,
      leaveCount: data.count,
      employeeCount: data.employees.size
    }));
  }, [filteredLeaves]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(month + 1);
    }
  };

  const handleGoToday = () => {
    const today = new Date();
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
  };

  const handleDateClick = (dateStr, events) => {
    if (events && events.length > 0) {
      setSelectedHoliday({
        date: dateStr,
        events: events
      });
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedHoliday(null);
  };

  return (
    <div className="department-calendar-page">
      {/* Header */}
      <div className="calendar-header">
        <div className="header-title-section">
          <button className="back-button" onClick={() => navigate("/holiday/admin")}>
            ← Quay lại
          </button>
          <h1 className="calendar-title">📅 Lịch nghỉ toàn công ty</h1>
          <p className="calendar-subtitle">
            Xem tất cả ngày nghỉ phép của nhân viên trong công ty - {month}/{year}
          </p>
        </div>
      </div>

      {/* Filters and Stats */}
      <div className="calendar-filters">
        <div className="filter-row">
          <div className="filter-group">
            <label>Phòng ban:</label>
            <select 
              value={selectedDepartment} 
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="filter-select"
            >
              <option value="all">Tất cả ({companyLeaves.length})</option>
              {uniqueDepartments.map(dept => (
                <option key={dept} value={dept}>
                  {dept} ({companyLeaves.filter(l => l.departmentName === dept).length})
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Tìm nhân viên:</label>
            <input
              type="text"
              placeholder="Nhập tên nhân viên..."
              value={searchEmployee}
              onChange={(e) => setSearchEmployee(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-stats">
            <span className="stat-badge stat-badge-primary">
              🏢 {filteredLeaves.length} ngày nghỉ
            </span>
            <span className="stat-badge stat-badge-secondary">
              👥 {new Set(filteredLeaves.map(l => l.employeeId)).size} nhân viên
            </span>
          </div>
        </div>
      </div>

      {/* Department Stats Table */}
      {departmentStats.length > 0 && (
        <div className="department-stats-section">
          <h3 className="stats-title">Thống kê theo phòng ban</h3>
          <div className="stats-grid">
            {departmentStats.map((stat, idx) => (
              <div key={idx} className="stat-card">
                <div className="stat-card-icon">🏢</div>
                <div className="stat-card-content">
                  <div className="stat-card-title">{stat.department}</div>
                  <div className="stat-card-values">
                    <span className="stat-value">{stat.leaveCount} ngày nghỉ</span>
                    <span className="stat-divider">•</span>
                    <span className="stat-value">{stat.employeeCount} người</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calendar Controls */}
      <div className="calendar-controls">
        <button className="control-btn" onClick={handlePrevMonth}>
          ← Tháng trước
        </button>
        <button className="control-btn control-btn-today" onClick={handleGoToday}>
          📅 Hôm nay
        </button>
        <button className="control-btn" onClick={handleNextMonth}>
          Tháng sau →
        </button>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : (
        <HolidayCalendarGrid
          year={year}
          month={month}
          holidays={companyHolidays}
          employeeLeaves={filteredLeaves}
          onDateClick={handleDateClick}
        />
      )}

      {/* View Modal */}
      {isModalOpen && selectedHoliday && (
        <HolidayViewModal
          holiday={selectedHoliday}
          onClose={handleCloseModal}
        />
      )}

      {/* Legend */}
      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-color legend-holiday"></span>
          <span>Ngày lễ công ty</span>
        </div>
        <div className="legend-item">
          <span className="legend-color legend-employee-leave"></span>
          <span>Nghỉ phép nhân viên</span>
        </div>
      </div>
    </div>
  );
};

export default AdminCompanyCalendarPage;
