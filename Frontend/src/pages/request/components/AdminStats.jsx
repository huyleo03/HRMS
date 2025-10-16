import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Users,
  Calendar,
  Filter,
  Download,
  BarChart3,
  PieChart,
} from "lucide-react";
import { getAdminStats } from "../../../service/RequestService";
import "../css/AdminStats.css";

const AdminStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    department: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [filters]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.department) params.department = filters.department;

      const response = await getAdminStats(params);
      setStats(response.stats);
    } catch (error) {
      console.error("❌ Lỗi khi tải thống kê:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleExport = () => {
    // TODO: Implement export to Excel/PDF
    console.log("📊 Exporting statistics...");
  };

  if (loading) {
    return (
      <div className="admin-stats-loading">
        <div className="spinner"></div>
        <p>Đang tải thống kê...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="admin-stats-empty">
        <BarChart3 className="empty-icon" />
        <p>Không có dữ liệu thống kê</p>
      </div>
    );
  }

  const statusConfig = {
    Pending: { label: "Chờ duyệt", color: "#f59e0b", icon: Clock },
    Manager_Approved: {
      label: "Quản lý đã duyệt",
      color: "#3b82f6",
      icon: AlertCircle,
    },
    Approved: { label: "Đã duyệt", color: "#10b981", icon: CheckCircle },
    Rejected: { label: "Từ chối", color: "#ef4444", icon: XCircle },
    NeedsReview: {
      label: "Cần chỉnh sửa",
      color: "#8b5cf6",
      icon: AlertCircle,
    },
    Cancelled: { label: "Đã hủy", color: "#6b7280", icon: XCircle },
  };

  const priorityConfig = {
    Low: { label: "Thấp", color: "#3b82f6" },
    Normal: { label: "Bình thường", color: "#10b981" },
    High: { label: "Cao", color: "#f59e0b" },
    Urgent: { label: "Khẩn cấp", color: "#ef4444" },
  };

  return (
    <div className="admin-stats">
      {/* Header */}
      <div className="stats-header">
        <div className="stats-title">
          <BarChart3 className="icon" />
          <h2>Thống kê & Báo cáo</h2>
        </div>
        <div className="stats-actions">
          <button
            className="filter-toggle-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="icon" />
            {showFilters ? "Ẩn bộ lọc" : "Hiện bộ lọc"}
          </button>
          <button className="export-btn" onClick={handleExport}>
            <Download className="icon" />
            Xuất báo cáo
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="stats-filters">
          <div className="filter-row">
            <div className="filter-item">
              <label>
                <Calendar className="icon" />
                Từ ngày
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
              />
            </div>
            <div className="filter-item">
              <label>
                <Calendar className="icon" />
                Đến ngày
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
              />
            </div>
            <div className="filter-item">
              <label>Phòng ban</label>
              <select
                value={filters.department}
                onChange={(e) => handleFilterChange("department", e.target.value)}
              >
                <option value="">Tất cả</option>
                {/* TODO: Load departments from API */}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="stats-summary">
        <div className="summary-card total">
          <div className="card-icon">
            <FileText />
          </div>
          <div className="card-content">
            <p className="card-label">Tổng số đơn</p>
            <h3 className="card-value">{stats.total || 0}</h3>
          </div>
          <div className="card-trend up">
            <TrendingUp size={20} />
            <span>+12%</span>
          </div>
        </div>

        <div className="summary-card approved">
          <div className="card-icon">
            <CheckCircle />
          </div>
          <div className="card-content">
            <p className="card-label">Đã duyệt</p>
            <h3 className="card-value">{stats.byStatus?.Approved || 0}</h3>
          </div>
          <div className="card-trend up">
            <TrendingUp size={20} />
            <span>+8%</span>
          </div>
        </div>

        <div className="summary-card pending">
          <div className="card-icon">
            <Clock />
          </div>
          <div className="card-content">
            <p className="card-label">Chờ duyệt</p>
            <h3 className="card-value">{stats.byStatus?.Pending || 0}</h3>
          </div>
        </div>

        <div className="summary-card rejected">
          <div className="card-icon">
            <XCircle />
          </div>
          <div className="card-content">
            <p className="card-label">Từ chối</p>
            <h3 className="card-value">{stats.byStatus?.Rejected || 0}</h3>
          </div>
          <div className="card-trend down">
            <TrendingDown size={20} />
            <span>-5%</span>
          </div>
        </div>

        <div className="summary-card avg-time">
          <div className="card-icon">
            <Clock />
          </div>
          <div className="card-content">
            <p className="card-label">Thời gian duyệt TB</p>
            <h3 className="card-value">{stats.avgApprovalTimeHours || 0}h</h3>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="stats-charts">
        {/* Status Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>
              <PieChart className="icon" />
              Trạng thái đơn
            </h3>
          </div>
          <div className="chart-content">
            <div className="status-bars">
              {Object.entries(stats.byStatus || {}).map(([status, count]) => {
                const config = statusConfig[status];
                const Icon = config?.icon || FileText;
                const percentage = ((count / stats.total) * 100).toFixed(1);

                return (
                  <div key={status} className="status-bar-item">
                    <div className="status-bar-header">
                      <div className="status-bar-label">
                        <Icon size={18} style={{ color: config?.color }} />
                        <span>{config?.label || status}</span>
                      </div>
                      <div className="status-bar-value">
                        {count} ({percentage}%)
                      </div>
                    </div>
                    <div className="status-bar-track">
                      <div
                        className="status-bar-fill"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: config?.color,
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Priority Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>
              <AlertCircle className="icon" />
              Độ ưu tiên
            </h3>
          </div>
          <div className="chart-content">
            <div className="priority-bars">
              {Object.entries(stats.byPriority || {}).map(
                ([priority, count]) => {
                  const config = priorityConfig[priority];
                  const percentage = ((count / stats.total) * 100).toFixed(1);

                  return (
                    <div key={priority} className="priority-bar-item">
                      <div className="priority-bar-header">
                        <span className="priority-bar-label">
                          {config?.label || priority}
                        </span>
                        <span className="priority-bar-value">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="priority-bar-track">
                        <div
                          className="priority-bar-fill"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: config?.color,
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Type Distribution */}
      <div className="stats-section">
        <div className="section-header">
          <h3>
            <FileText className="icon" />
            Loại đơn
          </h3>
        </div>
        <div className="type-grid">
          {Object.entries(stats.byType || {}).map(([type, count]) => (
            <div key={type} className="type-card">
              <FileText className="type-icon" />
              <div className="type-info">
                <p className="type-name">{type}</p>
                <p className="type-count">{count} đơn</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Requests */}
      <div className="stats-section">
        <div className="section-header">
          <h3>
            <Clock className="icon" />
            Đơn gần đây
          </h3>
        </div>
        <div className="recent-requests">
          {stats.recentRequests?.length > 0 ? (
            <table className="recent-table">
              <thead>
                <tr>
                  <th>Tiêu đề</th>
                  <th>Người gửi</th>
                  <th>Phòng ban</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentRequests.map((request) => {
                  const config = statusConfig[request.status];
                  return (
                    <tr key={request._id}>
                      <td>
                        <div className="request-subject">
                          <strong>{request.subject}</strong>
                          <span className="request-type">{request.type}</span>
                        </div>
                      </td>
                      <td>
                        <div className="user-info">
                          {request.submittedBy?.avatar && (
                            <img
                              src={request.submittedBy.avatar}
                              alt={request.submittedBy.full_name}
                              className="user-avatar"
                            />
                          )}
                          <span>{request.submittedBy?.full_name || "N/A"}</span>
                        </div>
                      </td>
                      <td>
                        {request.department?.department_id?.department_name ||
                          "N/A"}
                      </td>
                      <td>
                        <span
                          className="status-badge"
                          style={{ backgroundColor: config?.color }}
                        >
                          {config?.label || request.status}
                        </span>
                      </td>
                      <td>
                        {new Date(request.created_at).toLocaleDateString(
                          "vi-VN"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="no-data">Không có đơn gần đây</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminStats;
