import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { 
  getAllAttendance, 
  getCompanyReport, 
  markAbsent,
  exportAttendanceData 
} from "../../service/AttendanceService";
import { getDepartmentOptions } from "../../service/DepartmentService";
import AttendanceDetailModal from "./components/AttendanceDetailModal";
import AttendanceAdjustModal from "./components/AttendanceAdjustModal";
import "./css/AdminAttendance.css";

const AdminAttendancePage = () => {
  // States
  const [loading, setLoading] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [departments, setDepartments] = useState([]);

  // Filter states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");

  // Modal states
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  // Format time for display
  const formatTime = (dateString) => {
    if (!dateString) return "--:--";
    const date = new Date(dateString);
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      const response = await getDepartmentOptions();
      setDepartments(response.data || []);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  // Fetch data
  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 50,
      };

      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (statusFilter) params.status = statusFilter;
      if (departmentFilter) params.departmentId = departmentFilter;
      if (employeeSearch) params.search = employeeSearch; // Search by name or ID

      // Fetch attendance records
      const attendanceResponse = await getAllAttendance(params);
      setAttendanceData(attendanceResponse.data || []);
      setPagination(attendanceResponse.pagination || { total: 0, page: 1, pages: 1 });

      // Fetch stats
      const statsParams = {};
      if (startDate) statsParams.startDate = startDate;
      if (endDate) statsParams.endDate = endDate;
      if (departmentFilter) statsParams.departmentId = departmentFilter;
      const statsResponse = await getCompanyReport(statsParams);
      setStats(statsResponse.data || null);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error(error.response?.data?.message || "Không thể tải dữ liệu chấm công");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDepartments();
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle apply filters
  const handleApplyFilters = () => {
    fetchData(1);
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setStartDate("");
    setEndDate("");
    setStatusFilter("");
    setDepartmentFilter("");
    setEmployeeSearch("");
    fetchData(1);
  };

  // Handle export
  const handleExport = async () => {
    try {
      const params = { format: "excel" };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (statusFilter) params.status = statusFilter;
      if (departmentFilter) params.departmentId = departmentFilter;
      if (employeeSearch) params.search = employeeSearch;

      await exportAttendanceData(params);
      toast.success("Xuất dữ liệu thành công!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Không thể xuất dữ liệu");
    }
  };

  // Handle mark absent
  const handleMarkAbsent = async () => {
    if (!window.confirm("Bạn có chắc muốn đánh dấu vắng mặt cho tất cả nhân viên chưa check-in hôm nay?")) {
      return;
    }

    try {
      const response = await markAbsent();
      toast.success(response.message || "Đã đánh dấu vắng mặt thành công!");
      fetchData(pagination.page);
    } catch (error) {
      console.error("Mark absent error:", error);
      toast.error(error.response?.data?.message || "Không thể đánh dấu vắng mặt");
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchData(newPage);
    }
  };

  // Handle view details
  const handleViewDetails = (record) => {
    setSelectedRecord(record);
    setShowDetailModal(true);
  };

  // Handle adjust
  const handleAdjust = (record) => {
    setSelectedRecord(record);
    setShowAdjustModal(true);
  };

  // Handle close modals
  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedRecord(null);
  };

  const handleCloseAdjustModal = () => {
    setShowAdjustModal(false);
    setSelectedRecord(null);
  };

  // Handle adjust success
  const handleAdjustSuccess = () => {
    fetchData(pagination.page);
    handleCloseAdjustModal();
  };

  // Get status badge class
  const getStatusBadge = (status) => {
    const badges = {
      Present: "status-present",
      Late: "status-late",
      Absent: "status-absent",
      "On Leave": "status-leave",
    };
    return badges[status] || "";
  };

  // Get status text in Vietnamese
  const getStatusText = (status) => {
    const texts = {
      Present: "Hiện diện",
      Late: "Đi muộn",
      Absent: "Vắng mặt",
      "On Leave": "Nghỉ phép",
    };
    return texts[status] || status;
  };

  return (
    <div className="admin-attendance-page">
      {/* Filters */}
      <div className="filters-section">
        <div className="filter-row">
          <div className="filter-group-admin filter-group-date">
            <label className="filter-label-admin">Khoảng ngày</label>
            <div className="date-range-picker">
              <input
                type="date"
                className="date-input-admin"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Từ ngày"
              />
              <span className="date-separator-admin">-</span>
              <input
                type="date"
                className="date-input-admin"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="Đến ngày"
              />
            </div>
          </div>

          <div className="filter-group-admin">
            <label className="filter-label-admin">Phòng ban</label>
            <select
              className="filter-select-admin"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="">Tất cả</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.department_name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group-admin">
            <label className="filter-label-admin">Nhân viên</label>
            <input
              type="text"
              className="filter-input-admin"
              value={employeeSearch}
              onChange={(e) => setEmployeeSearch(e.target.value)}
              placeholder="Tìm theo tên hoặc mã NV..."
            />
          </div>

          <div className="filter-group-admin">
            <label className="filter-label-admin">Trạng thái</label>
            <select
              className="filter-select-admin"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Tất cả</option>
              <option value="Present">Hiện diện</option>
              <option value="Late">Đi muộn</option>
              <option value="Absent">Vắng mặt</option>
              <option value="On Leave">Nghỉ phép</option>
            </select>
          </div>

          <div className="filter-actions">
            <button className="apply-btn-admin" onClick={handleApplyFilters}>
              Áp dụng
            </button>
            <button className="reset-btn-admin" onClick={handleResetFilters}>
              Đặt lại
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-grid-admin">
          <div className="stat-card-admin">
            <div className="stat-icon-admin">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z" stroke="#7152F3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content-admin">
              <div className="stat-label-admin">Tổng bản ghi</div>
              <div className="stat-value-admin">{stats.totalRecords}</div>
            </div>
          </div>

          <div className="stat-card-admin">
            <div className="stat-icon stat-icon-success">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.49 2 2 6.49 2 12C2 17.51 6.49 22 12 22C17.51 22 22 17.51 22 12C22 6.49 17.51 2 12 2ZM16.78 9.7L11.11 15.37C10.97 15.51 10.78 15.59 10.58 15.59C10.38 15.59 10.19 15.51 10.05 15.37L7.22 12.54C6.93 12.25 6.93 11.77 7.22 11.48C7.51 11.19 7.99 11.19 8.28 11.48L10.58 13.78L15.72 8.64C16.01 8.35 16.49 8.35 16.78 8.64C17.07 8.93 17.07 9.4 16.78 9.7Z" fill="#10B981"/>
              </svg>
            </div>
            <div className="stat-content-admin">
              <div className="stat-label-admin">Hiện diện</div>
              <div className="stat-value stat-value-success">{stats.present}</div>
            </div>
          </div>

          <div className="stat-card-admin">
            <div className="stat-icon stat-icon-warning">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 9V14M12 21.41H5.94C2.47 21.41 1.02 18.93 2.7 15.9L5.82 10.28L8.76 5C10.54 1.79 13.46 1.79 15.24 5L18.18 10.29L21.3 15.91C22.98 18.94 21.52 21.42 18.06 21.42H12V21.41Z" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M11.995 17H12.004" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content-admin">
              <div className="stat-label-admin">Đi muộn</div>
              <div className="stat-value stat-value-warning">{stats.late}</div>
            </div>
          </div>

          <div className="stat-card-admin">
            <div className="stat-icon stat-icon-danger">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.49 2 2 6.49 2 12C2 17.51 6.49 22 12 22C17.51 22 22 17.51 22 12C22 6.49 17.51 2 12 2ZM15.36 14.3C15.65 14.59 15.65 15.07 15.36 15.36C15.21 15.51 15.02 15.58 14.83 15.58C14.64 15.58 14.45 15.51 14.3 15.36L12 13.06L9.7 15.36C9.55 15.51 9.36 15.58 9.17 15.58C8.98 15.58 8.79 15.51 8.64 15.36C8.35 15.07 8.35 14.59 8.64 14.3L10.94 12L8.64 9.7C8.35 9.41 8.35 8.93 8.64 8.64C8.93 8.35 9.41 8.35 9.7 8.64L12 10.94L14.3 8.64C14.59 8.35 15.07 8.35 15.36 8.64C15.65 8.93 15.65 9.41 15.36 9.7L13.06 12L15.36 14.3Z" fill="#EF4444"/>
              </svg>
            </div>
            <div className="stat-content-admin">
              <div className="stat-label-admin">Vắng mặt</div>
              <div className="stat-value stat-value-danger">{stats.absent}</div>
            </div>
          </div>

          <div className="stat-card-admin">
            <div className="stat-icon stat-icon-info">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 8V13M21 12C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12Z" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M11.995 16H12.004" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content-admin">
              <div className="stat-label-admin">Nghỉ phép</div>
              <div className="stat-value stat-value-info">{stats.onLeave}</div>
            </div>
          </div>

          <div className="stat-card-admin">
            <div className="stat-icon-admin">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2C17.52 2 22 6.48 22 12Z" stroke="#7152F3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15.71 15.18L12.61 13.33C12.07 13.01 11.63 12.24 11.63 11.61V7.51001" stroke="#7152F3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content-admin">
              <div className="stat-label-admin">Giờ làm trung bình</div>
              <div className="stat-value-admin">{stats.avgWorkHours} giờ</div>
            </div>
          </div>

          <div className="stat-card-admin">
            <div className="stat-icon-admin">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9.5 13.75C9.5 14.72 10.25 15.5 11.17 15.5H13.05C13.85 15.5 14.5 14.82 14.5 13.97C14.5 13.06 14.1 12.73 13.51 12.52L10.5 11.47C9.91 11.26 9.51001 10.94 9.51001 10.02C9.51001 9.17999 10.16 8.48999 10.96 8.48999H12.84C13.76 8.48999 14.51 9.26999 14.51 10.24" stroke="#7152F3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 7.5V16.5" stroke="#7152F3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2C17.52 2 22 6.48 22 12Z" stroke="#7152F3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content-admin">
              <div className="stat-label-admin">Tổng làm thêm giờ</div>
              <div className="stat-value-admin">{stats.totalOT} giờ</div>
            </div>
          </div>

          <div className="stat-card-admin">
            <div className="stat-icon stat-icon-success">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M10.75 2.45001C11.44 1.86001 12.57 1.86001 13.27 2.45001L14.85 3.81001C15.15 4.07001 15.71 4.28001 16.11 4.28001H17.81C18.87 4.28001 19.74 5.15001 19.74 6.21001V7.91001C19.74 8.30001 19.95 8.87001 20.21 9.17001L21.57 10.75C22.16 11.44 22.16 12.57 21.57 13.27L20.21 14.85C19.95 15.15 19.74 15.71 19.74 16.11V17.81C19.74 18.87 18.87 19.74 17.81 19.74H16.11C15.72 19.74 15.15 19.95 14.85 20.21L13.27 21.57C12.58 22.16 11.45 22.16 10.75 21.57L9.17001 20.21C8.87001 19.95 8.31001 19.74 7.91001 19.74H6.18001C5.12001 19.74 4.25001 18.87 4.25001 17.81V16.1C4.25001 15.71 4.04001 15.15 3.79001 14.85L2.44001 13.26C1.86001 12.57 1.86001 11.45 2.44001 10.76L3.79001 9.17001C4.04001 8.87001 4.25001 8.31001 4.25001 7.92001V6.20001C4.25001 5.14001 5.12001 4.27001 6.18001 4.27001H7.91001C8.30001 4.27001 8.87001 4.06001 9.17001 3.80001L10.75 2.45001Z" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8.38 12L10.79 14.42L15.62 9.57999" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content-admin">
              <div className="stat-label-admin">Tỷ lệ đúng giờ</div>
              <div className="stat-value stat-value-success">{stats.onTimeRate}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="table-header">
        <h2 className="table-title">Chi tiết chấm công</h2>
        <div className="header-actions">
          <button className="export-btn" onClick={handleExport}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 11V17L11 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 17L7 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 10V15C22 20 20 22 15 22H9C4 22 2 20 2 15V9C2 4 4 2 9 2H14" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 10H18C15 10 14 9 14 6V2L22 10Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Xuất Excel
          </button>
          <button className="danger-btn" onClick={handleMarkAbsent}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.49 2 2 6.49 2 12C2 17.51 6.49 22 12 22C17.51 22 22 17.51 22 12C22 6.49 17.51 2 12 2ZM15.36 14.3C15.65 14.59 15.65 15.07 15.36 15.36C15.21 15.51 15.02 15.58 14.83 15.58C14.64 15.58 14.45 15.51 14.3 15.36L12 13.06L9.7 15.36C9.55 15.51 9.36 15.58 9.17 15.58C8.98 15.58 8.79 15.51 8.64 15.36C8.35 15.07 8.35 14.59 8.64 14.3L10.94 12L8.64 9.7C8.35 9.41 8.35 8.93 8.64 8.64C8.93 8.35 9.41 8.35 9.7 8.64L12 10.94L14.3 8.64C14.59 8.35 15.07 8.35 15.36 8.64C15.65 8.93 15.65 9.41 15.36 9.7L13.06 12L15.36 14.3Z" fill="white"/>
            </svg>
            Đánh dấu vắng mặt
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container-admin">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : attendanceData.length === 0 ? (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <path d="M22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2C17.52 2 22 6.48 22 12Z" stroke="#A2A1A8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8.47 8.47L15.53 15.53M15.53 8.47L8.47 15.53" stroke="#A2A1A8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p>Không có dữ liệu chấm công</p>
          </div>
        ) : (
          <table className="attendance-table-admin">
            <thead>
              <tr>
                <th>Nhân viên</th>
                <th>Phòng ban</th>
                <th>Ngày</th>
                <th>Giờ vào</th>
                <th>Giờ ra</th>
                <th>Trạng thái</th>
                <th>Giờ làm việc</th>
                <th>Làm thêm</th>
                <th>Đi muộn (phút)</th>
                <th>Điều chỉnh thủ công</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.map((record) => (
                <tr key={record._id}>
                  <td>
                    <div className="employee-cell-admin">
                      {record.userId?.avatar && record.userId.avatar !== 'https://i.pravatar.cc/150' ? (
                        <img src={record.userId.avatar} alt={record.userId.full_name} className="employee-avatar-admin" />
                      ) : (
                        <div className="employee-avatar-fallback">
                          {record.userId?.full_name ? record.userId.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                        </div>
                      )}
                      <div className="employee-info-admin">
                        <div className="employee-name-admin">{record.userId?.full_name || "N/A"}</div>
                        <div className="employee-id-admin">{record.userId?.employeeId || "N/A"}</div>
                      </div>
                    </div>
                  </td>
                  <td>{record.userId?.department?.department_name || "N/A"}</td>
                  <td>{formatDate(record.date)}</td>
                  <td>{formatTime(record.clockIn)}</td>
                  <td>{formatTime(record.clockOut)}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadge(record.status)}`}>
                      {getStatusText(record.status)}
                    </span>
                  </td>
                  <td>{record.workHours ? `${record.workHours} giờ` : "0 giờ"}</td>
                  <td>{record.overtimeHours ? `${record.overtimeHours} giờ` : "0 giờ"}</td>
                  <td>{record.lateMinutes || 0}</td>
                  <td>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={record.isManuallyAdjusted || false}
                        readOnly
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="action-btn action-btn-info" 
                        onClick={() => handleViewDetails(record)}
                        title="Chi tiết"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M15.58 12C15.58 13.98 13.98 15.58 12 15.58C10.02 15.58 8.42004 13.98 8.42004 12C8.42004 10.02 10.02 8.42004 12 8.42004C13.98 8.42004 15.58 10.02 15.58 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 20.27C15.53 20.27 18.82 18.19 21.11 14.59C22.01 13.18 22.01 10.81 21.11 9.39997C18.82 5.79997 15.53 3.71997 12 3.71997C8.46997 3.71997 5.17997 5.79997 2.88997 9.39997C1.98997 10.81 1.98997 13.18 2.88997 14.59C5.17997 18.19 8.46997 20.27 12 20.27Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button 
                        className="action-btn action-btn-edit" 
                        onClick={() => handleAdjust(record)}
                        title="Điều chỉnh"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M11 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22H15C20 22 22 20 22 15V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M16.04 3.02001L8.16 10.9C7.86 11.2 7.56 11.79 7.5 12.22L7.07 15.23C6.91 16.32 7.68 17.08 8.77 16.93L11.78 16.5C12.2 16.44 12.79 16.14 13.1 15.84L20.98 7.96001C22.34 6.60001 22.98 5.02001 20.98 3.02001C18.98 1.02001 17.4 1.66001 16.04 3.02001Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M14.91 4.1499C15.58 6.5399 17.45 8.4099 19.85 9.0899" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination-admin">
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            ‹ Previous
          </button>
          
          {[...Array(pagination.pages)].map((_, index) => {
            const pageNum = index + 1;
            if (
              pageNum === 1 ||
              pageNum === pagination.pages ||
              (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)
            ) {
              return (
                <button
                  key={pageNum}
                  className={`pagination-number ${pageNum === pagination.page ? "active" : ""}`}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </button>
              );
            } else if (pageNum === pagination.page - 2 || pageNum === pagination.page + 2) {
              return <span key={pageNum} className="pagination-ellipsis">...</span>;
            }
            return null;
          })}
          
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
          >
            Next ›
          </button>
        </div>
      )}

      {/* Modals */}
      {showDetailModal && (
        <AttendanceDetailModal
          record={selectedRecord}
          onClose={handleCloseDetailModal}
        />
      )}

      {showAdjustModal && (
        <AttendanceAdjustModal
          record={selectedRecord}
          onClose={handleCloseAdjustModal}
          onSuccess={handleAdjustSuccess}
        />
      )}
    </div>
  );
};

export default AdminAttendancePage;

