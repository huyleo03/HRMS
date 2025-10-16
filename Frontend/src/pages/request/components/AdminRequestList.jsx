import React, { useState, useEffect, useCallback } from "react";
import { 
  Shield, Search, Filter, Calendar, User, Eye
} from "lucide-react";
import { getAdminRequests } from "../../../service/RequestService";
import "../css/AdminRequestList.css";

const AdminRequestList = ({ onSelectRequest }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 20,
  });

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    priority: "all",
    department: "",
    startDate: "",
    endDate: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const [showFilters, setShowFilters] = useState(false);

  const fetchAdminRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      };

      // Remove empty filters
      Object.keys(params).forEach((key) => {
        if (!params[key] || params[key] === "all") {
          delete params[key];
        }
      });

      const response = await getAdminRequests(params);
      setRequests(response.requests);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Lỗi khi tải danh sách đơn:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetchAdminRequests();
  }, [fetchAdminRequests]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      Pending: { label: "Chờ duyệt", className: "status-pending" },
      Manager_Approved: { label: "Quản lý đã duyệt", className: "status-manager-approved" },
      Approved: { label: "Đã duyệt", className: "status-approved" },
      Rejected: { label: "Từ chối", className: "status-rejected" },
      NeedsReview: { label: "Cần chỉnh sửa", className: "status-needs-review" },
      Cancelled: { label: "Đã hủy", className: "status-cancelled" },
    };

    const config = statusConfig[status] || { label: status, className: "status-default" };
    return <span className={`status-badge ${config.className}`}>{config.label}</span>;
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      Low: { label: "Thấp", className: "priority-low" },
      Normal: { label: "Bình thường", className: "priority-normal" },
      High: { label: "Cao", className: "priority-high" },
      Urgent: { label: "Khẩn cấp", className: "priority-urgent" },
    };

    const config = priorityConfig[priority] || { label: priority, className: "priority-default" };
    return <span className={`priority-badge ${config.className}`}>{config.label}</span>;
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="admin-request-list">
      <div className="admin-header">
        <div className="admin-title">
          <Shield className="icon" />
          <h2>Quản lý tất cả đơn</h2>
        </div>
        <button 
          className="filter-toggle-btn"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="icon" />
          {showFilters ? "Ẩn bộ lọc" : "Hiện bộ lọc"}
        </button>
      </div>

      {showFilters && (
        <div className="admin-filters">
          <div className="filter-row">
            <div className="filter-item">
              <label>
                <Search className="icon" />
                Tìm kiếm
              </label>
              <input
                type="text"
                placeholder="Tiêu đề, lý do, người gửi..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>

            <div className="filter-item">
              <label>Trạng thái</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <option value="all">Tất cả</option>
                <option value="Pending">Chờ duyệt</option>
                <option value="Manager_Approved">Quản lý đã duyệt</option>
                <option value="Approved">Đã duyệt</option>
                <option value="Rejected">Từ chối</option>
                <option value="NeedsReview">Cần chỉnh sửa</option>
                <option value="Cancelled">Đã hủy</option>
              </select>
            </div>

            <div className="filter-item">
              <label>Độ ưu tiên</label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange("priority", e.target.value)}
              >
                <option value="all">Tất cả</option>
                <option value="Low">Thấp</option>
                <option value="Normal">Bình thường</option>
                <option value="High">Cao</option>
                <option value="Urgent">Khẩn cấp</option>
              </select>
            </div>
          </div>

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
              <label>Sắp xếp theo</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
              >
                <option value="createdAt">Ngày tạo</option>
                <option value="priority">Độ ưu tiên</option>
                <option value="status">Trạng thái</option>
              </select>
            </div>

            <div className="filter-item">
              <label>Thứ tự</label>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange("sortOrder", e.target.value)}
              >
                <option value="desc">Mới nhất</option>
                <option value="asc">Cũ nhất</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results Info */}
      <div className="results-info">
        <p>
          Hiển thị {requests.length} trong tổng số {pagination.total} đơn
        </p>
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <Shield className="empty-icon" />
          <p>Không có đơn nào</p>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Người gửi</th>
                <th>Phòng ban</th>
                <th>Trạng thái</th>
                <th>Độ ưu tiên</th>
                <th>Ngày tạo</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request._id}>
                  <td>
                    <div className="request-subject">
                      <strong>{request.subject}</strong>
                      <span className="request-type">{request.requestType}</span>
                    </div>
                  </td>
                  <td>
                    <div className="user-info">
                      {request.submittedBy?.avatar ? (
                        <img
                          src={request.submittedBy.avatar}
                          alt={request.submittedBy.full_name}
                          className="user-avatar"
                        />
                      ) : (
                        <div className="user-avatar-placeholder">
                          <User className="icon" />
                        </div>
                      )}
                      <span>{request.submittedBy?.full_name || "N/A"}</span>
                    </div>
                  </td>
                  <td>{request.department?.department_name || "N/A"}</td>
                  <td>{getStatusBadge(request.status)}</td>
                  <td>{getPriorityBadge(request.priority)}</td>
                  <td>{formatDate(request.created_at)}</td>
                  <td>
                    <button
                      className="action-btn view-btn"
                      onClick={() => onSelectRequest(request)}
                      title="Xem chi tiết"
                    >
                      <Eye className="icon" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="pagination-btn"
          >
            Trước
          </button>
          <span className="pagination-info">
            Trang {pagination.page} / {pagination.pages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
            className="pagination-btn"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminRequestList;
