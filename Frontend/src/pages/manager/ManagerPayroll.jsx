import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Users,
  Calendar,
  Eye,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import PayrollService from "../../service/PayrollService";
import "./ManagerPayroll.css";

const ITEMS_PER_PAGE = 10;

const ManagerPayroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [approveNotes, setApproveNotes] = useState("");
  const [pagination, setPagination] = useState({});

  // Filters
  const [filters, setFilters] = useState({
    month: "",
    year: new Date().getFullYear(),
    status: "",
    page: 1,
    limit: ITEMS_PER_PAGE,
  });

  useEffect(() => {
    fetchPayrolls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchPayrolls = async () => {
    setIsLoading(true);
    try {
      const response = await PayrollService.getDepartmentPayrolls(filters);
      console.log("Department Payrolls:", response);
      setPayrolls(response.data || []);
      setPagination(response.pagination || {});
    } catch (error) {
      console.error("Payrolls Error:", error);
      toast.error(error.message || "Không thể tải danh sách lương");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetail = (payroll) => {
    setSelectedPayroll(payroll);
    setShowDetailModal(true);
  };

  const handleApproveClick = (payroll) => {
    setSelectedPayroll(payroll);
    setApproveNotes("");
    setShowApproveModal(true);
  };

  const handleRejectClick = (payroll) => {
    setSelectedPayroll(payroll);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleApprove = async () => {
    if (!selectedPayroll) return;

    try {
      await PayrollService.managerApprovePayroll(selectedPayroll._id, approveNotes);
      toast.success("Đã duyệt phiếu lương");
      setShowApproveModal(false);
      fetchPayrolls();
    } catch (error) {
      toast.error(error.message || "Không thể duyệt phiếu lương");
    }
  };

  const handleReject = async () => {
    if (!selectedPayroll) return;

    if (!rejectReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }

    try {
      await PayrollService.managerRejectPayroll(selectedPayroll._id, rejectReason);
      toast.success("Đã từ chối phiếu lương");
      setShowRejectModal(false);
      fetchPayrolls();
    } catch (error) {
      toast.error(error.message || "Không thể từ chối phiếu lương");
    }
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      Draft: { label: "Nháp", className: "mgr-status-draft" },
      Pending: { label: "Chờ duyệt", className: "mgr-status-pending" },
      Approved: { label: "Đã duyệt", className: "mgr-status-approved" },
      Paid: { label: "Đã trả", className: "mgr-status-paid" },
      Rejected: { label: "Từ chối", className: "mgr-status-rejected" },
    };

    const s = statusMap[status] || { label: status, className: "" };
    return <span className={`mgr-status-badge ${s.className}`}>{s.label}</span>;
  };

  const getInitials = (fullName) => {
    if (!fullName) return "??";
    const parts = fullName.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  const hasValidAvatar = (avatar) => {
    return (
      avatar &&
      avatar.trim() !== "" &&
      !avatar.includes("placeholder") &&
      !avatar.includes("pravatar")
    );
  };

  return (
    <div className="manager-payroll-wrapper">
      <div className="mgr-payroll-header">
        <div className="mgr-header-content">
          <div>
            <h1>Quản lý lương phòng ban</h1>
            <p>Xem và duyệt phiếu lương của nhân viên trong phòng ban</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mgr-payroll-filters">
        <div className="mgr-filter-group">
          <label>
            <Calendar size={16} />
            Tháng
          </label>
          <select
            value={filters.month}
            onChange={(e) => setFilters({ ...filters, month: e.target.value, page: 1 })}
          >
            <option value="">Tất cả</option>
            {[...Array(12)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                Tháng {i + 1}
              </option>
            ))}
          </select>
        </div>

        <div className="mgr-filter-group">
          <label>
            <Calendar size={16} />
            Năm
          </label>
          <select
            value={filters.year}
            onChange={(e) =>
              setFilters({ ...filters, year: parseInt(e.target.value), page: 1 })
            }
          >
            {[2023, 2024, 2025, 2026].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="mgr-filter-group">
          <label>
            <Filter size={16} />
            Trạng thái
          </label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
          >
            <option value="">Tất cả</option>
            <option value="Draft">Nháp</option>
            <option value="Pending">Chờ duyệt</option>
            <option value="Approved">Đã duyệt</option>
            <option value="Paid">Đã trả</option>
            <option value="Rejected">Từ chối</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="mgr-loading-state">
          <div className="mgr-spinner"></div>
          <p>Đang tải...</p>
        </div>
      ) : payrolls.length === 0 ? (
        <div className="mgr-empty-state">
          <Users size={64} />
          <h3>Chưa có dữ liệu lương</h3>
          <p>Không có phiếu lương nào trong phòng ban</p>
        </div>
      ) : (
        <>
          <div className="mgr-table-container">
            <table className="mgr-payroll-table">
              <thead>
                <tr>
                  <th>Nhân viên</th>
                  <th>Kỳ lương</th>
                  <th>Lương cơ bản</th>
                  <th>Thực lĩnh</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {payrolls.map((payroll) => (
                  <tr key={payroll._id}>
                    <td>
                      <div className="mgr-employee-cell">
                        {hasValidAvatar(payroll.employeeId?.avatar) ? (
                          <img
                            src={payroll.employeeId.avatar}
                            alt={payroll.employeeId?.full_name}
                            className="mgr-avatar-img"
                          />
                        ) : (
                          <div className="mgr-avatar-initials">
                            {getInitials(payroll.employeeId?.full_name)}
                          </div>
                        )}
                        <div>
                          <div className="mgr-employee-name">
                            {payroll.employeeId?.full_name || "N/A"}
                          </div>
                          <div className="mgr-employee-id">
                            {payroll.employeeId?.employeeId || "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      Tháng {payroll.month}/{payroll.year}
                    </td>
                    <td>{formatCurrency(payroll.baseSalary)}</td>
                    <td className={`mgr-net-salary ${payroll.netSalary < 0 ? 'negative' : ''}`}>
                      {formatCurrency(payroll.netSalary)}
                      {payroll.netSalary < 0 && <span className="negative-badge">⚠️</span>}
                    </td>
                    <td>{getStatusBadge(payroll.status)}</td>
                    <td>
                      <div className="mgr-action-buttons">
                        <button
                          className="mgr-btn-icon mgr-btn-view"
                          onClick={() => handleViewDetail(payroll)}
                          title="Xem chi tiết"
                        >
                          <Eye size={18} />
                        </button>
                        {payroll.status === "Draft" && !payroll.rejectedByManager && (
                          <>
                            <button
                              className="mgr-btn-icon mgr-btn-approve"
                              onClick={() => handleApproveClick(payroll)}
                              title="Duyệt (chuyển sang Pending)"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              className="mgr-btn-icon mgr-btn-reject"
                              onClick={() => handleRejectClick(payroll)}
                              title="Từ chối"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                        {payroll.status === "Draft" && payroll.rejectedByManager && (
                          <span className="mgr-rejected-badge" title="Đã từ chối - Admin đang xử lý">
                            ⚠️ Đã từ chối
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mgr-pagination">
              <button
                className="mgr-page-btn"
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                <ChevronLeft size={18} />
              </button>

              <span className="mgr-page-info">
                Trang {pagination.page} / {pagination.totalPages}
              </span>

              <button
                className="mgr-page-btn"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedPayroll && (
        <div className="mgr-modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="mgr-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="mgr-modal-header">
              <h2>Chi tiết phiếu lương</h2>
              <button
                className="mgr-btn-close"
                onClick={() => setShowDetailModal(false)}
              >
                ×
              </button>
            </div>

            <div className="mgr-modal-body">
              <div className="mgr-detail-section">
                <h3>Thông tin nhân viên</h3>
                <div className="mgr-detail-row">
                  <span>Họ tên:</span>
                  <strong>{selectedPayroll.employeeId?.full_name || "N/A"}</strong>
                </div>
                <div className="mgr-detail-row">
                  <span>Mã NV:</span>
                  <strong>{selectedPayroll.employeeId?.employeeId || "N/A"}</strong>
                </div>
                <div className="mgr-detail-row">
                  <span>Kỳ lương:</span>
                  <strong>
                    Tháng {selectedPayroll.month}/{selectedPayroll.year}
                  </strong>
                </div>
                <div className="mgr-detail-row">
                  <span>Trạng thái:</span>
                  {getStatusBadge(selectedPayroll.status)}
                </div>
              </div>

              <div className="mgr-detail-section">
                <h3>Thu nhập</h3>
                <div className="mgr-detail-row">
                  <span>Lương cơ bản:</span>
                  <strong>{formatCurrency(selectedPayroll.baseSalary)}</strong>
                </div>
                <div className="mgr-detail-row">
                  <span>Số ngày làm việc:</span>
                  <strong>
                    {selectedPayroll.workingDays}/{selectedPayroll.standardWorkingDays} ngày
                  </strong>
                </div>
                <div className="mgr-detail-row">
                  <span>Lương thực tế:</span>
                  <strong className="mgr-text-success">
                    {formatCurrency(selectedPayroll.actualBaseSalary)}
                  </strong>
                </div>
                <div className="mgr-detail-row">
                  <span>Tăng ca:</span>
                  <strong className="mgr-text-success">
                    {formatCurrency(selectedPayroll.overtimeAmount)}
                  </strong>
                </div>
                
                {/* OT Pending Warning */}
                {selectedPayroll.overtimePending && 
                 (selectedPayroll.overtimePending.weekday > 0 || 
                  selectedPayroll.overtimePending.weekend > 0 || 
                  selectedPayroll.overtimePending.holiday > 0) && (
                  <div className="mgr-detail-row mgr-warning-message" style={{
                    backgroundColor: '#fff3cd',
                    padding: '12px',
                    borderRadius: '6px',
                    marginTop: '10px',
                    border: '1px solid #ffc107'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <strong style={{ color: '#856404', fontSize: '14px' }}>
                        ⚠️ Nhân viên có {' '}
                        {(selectedPayroll.overtimePending.weekday + 
                          selectedPayroll.overtimePending.weekend + 
                          selectedPayroll.overtimePending.holiday).toFixed(1)} giờ OT chưa được duyệt
                      </strong>
                      <span style={{ color: '#856404', fontSize: '12px' }}>
                        Nhân viên cần tạo đơn "Tăng ca" để OT được tính vào lương.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mgr-detail-section">
                <h3>Khấu trừ</h3>
                {selectedPayroll.deductions.length > 0 ? (
                  selectedPayroll.deductions.map((ded, idx) => (
                    <div key={idx} className="mgr-detail-row">
                      <span>{ded.description}:</span>
                      <strong className="mgr-text-danger">
                        -{formatCurrency(ded.amount)}
                      </strong>
                    </div>
                  ))
                ) : (
                  <p className="mgr-text-muted">Không có khấu trừ</p>
                )}
              </div>

              <div className="mgr-detail-section mgr-highlight">
                <div className="mgr-detail-row mgr-large">
                  <span>THỰC LĨNH:</span>
                  <strong className={`mgr-text-primary ${selectedPayroll.netSalary < 0 ? 'negative' : ''}`}>
                    {formatCurrency(selectedPayroll.netSalary)}
                  </strong>
                </div>
                {selectedPayroll.netSalary < 0 && (
                  <div style={{
                    backgroundColor: '#fee2e2',
                    border: '1px solid #ef4444',
                    borderRadius: '8px',
                    padding: '12px',
                    marginTop: '12px',
                    fontSize: '13px',
                    color: '#991b1b'
                  }}>
                    ⚠️ <strong>Lương âm:</strong> Nhân viên nợ công ty {formatCurrency(Math.abs(selectedPayroll.netSalary))}.
                  </div>
                )}
              </div>

              {selectedPayroll.notes && (
                <div className="mgr-detail-section">
                  <h3>Ghi chú</h3>
                  <p>{selectedPayroll.notes}</p>
                </div>
              )}
            </div>

            <div className="mgr-modal-footer">
              <button
                className="mgr-btn-secondary"
                onClick={() => setShowDetailModal(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedPayroll && (
        <div className="mgr-modal-overlay" onClick={() => setShowApproveModal(false)}>
          <div
            className="mgr-modal-content mgr-modal-small"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mgr-modal-header">
              <h2>Xác nhận duyệt</h2>
              <button
                className="mgr-btn-close"
                onClick={() => setShowApproveModal(false)}
              >
                ×
              </button>
            </div>

            <div className="mgr-modal-body">
              <p>
                Bạn có chắc muốn duyệt phiếu lương của{" "}
                <strong>{selectedPayroll.employeeId?.full_name}</strong> cho tháng{" "}
                {selectedPayroll.month}/{selectedPayroll.year}?
              </p>
              <p className="mgr-note-text">
                <strong>Lưu ý:</strong> Phiếu lương sẽ chuyển sang trạng thái <strong>Pending</strong> và cần Admin phê duyệt cuối cùng.
              </p>

              <div className="mgr-form-group">
                <label>Ghi chú (tùy chọn)</label>
                <textarea
                  className="mgr-textarea"
                  rows="3"
                  placeholder="Nhập ghi chú nếu có..."
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="mgr-modal-footer">
              <button
                className="mgr-btn-secondary"
                onClick={() => setShowApproveModal(false)}
              >
                Hủy
              </button>
              <button className="mgr-btn-success" onClick={handleApprove}>
                <CheckCircle size={18} />
                Xác nhận duyệt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedPayroll && (
        <div className="mgr-modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div
            className="mgr-modal-content mgr-modal-small"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mgr-modal-header">
              <h2>Xác nhận từ chối</h2>
              <button
                className="mgr-btn-close"
                onClick={() => setShowRejectModal(false)}
              >
                ×
              </button>
            </div>

            <div className="mgr-modal-body">
              <p>
                Bạn có chắc muốn từ chối phiếu lương của{" "}
                <strong>{selectedPayroll.employeeId?.full_name}</strong> cho tháng{" "}
                {selectedPayroll.month}/{selectedPayroll.year}?
              </p>

              <div className="mgr-form-group">
                <label>
                  Lý do từ chối <span className="mgr-required">*</span>
                </label>
                <textarea
                  className="mgr-textarea"
                  rows="4"
                  placeholder="Nhập lý do từ chối..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mgr-modal-footer">
              <button
                className="mgr-btn-secondary"
                onClick={() => setShowRejectModal(false)}
              >
                Hủy
              </button>
              <button className="mgr-btn-danger" onClick={handleReject}>
                <XCircle size={18} />
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerPayroll;
