import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  DollarSign,
  Calendar,
  TrendingUp,
  TrendingDown,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import PayrollService from "../../service/PayrollService";
import "./EmployeePayroll.css";

const ITEMS_PER_PAGE = 6;

const EmployeePayroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [pagination, setPagination] = useState({});

  // Filters
  const [filters, setFilters] = useState({
    month: "",
    year: new Date().getFullYear(),
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
      const response = await PayrollService.getMyPayrolls(filters);
      console.log("Payrolls Response:", response);
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

  const handleDownloadPDF = async (payroll) => {
    try {
      // Tạo nội dung phiếu lương
      const content = `
===========================================
        PHIẾU LƯƠNG NHÂN VIÊN
===========================================

Kỳ lương: Tháng ${payroll.month}/${payroll.year}
Nhân viên: ${payroll.employeeId?.full_name || "N/A"}
Mã NV: ${payroll.employeeId?.employeeId || "N/A"}
Trạng thái: ${payroll.status}

-------------------------------------------
             THU NHẬP
-------------------------------------------
Lương cơ bản:           ${formatCurrency(payroll.baseSalary)}
Số ngày làm việc:       ${payroll.workingDays}/${payroll.standardWorkingDays}
Lương thực tế:          ${formatCurrency(payroll.actualBaseSalary)}
Tăng ca:                ${formatCurrency(payroll.overtimeAmount)}

-------------------------------------------
             KHẤU TRỪ
-------------------------------------------
${payroll.deductions.map(d => `${d.description}:  -${formatCurrency(d.amount)}`).join('\n')}

-------------------------------------------
             TỔNG KẾT
-------------------------------------------
THỰC LĨNH:              ${formatCurrency(payroll.netSalary)}

===========================================
      `;

      // Tạo blob và download
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `phieu-luong-${payroll.month}-${payroll.year}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Đã tải phiếu lương");
    } catch (error) {
      toast.error("Không thể tải phiếu lương");
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
      Draft: { label: "Nháp", className: "status-draft" },
      Pending: { label: "Chờ duyệt", className: "status-pending" },
      Approved: { label: "Đã duyệt", className: "status-approved" },
      Paid: { label: "Đã trả", className: "status-paid" },
      Rejected: { label: "Từ chối", className: "status-rejected" },
    };

    const s = statusMap[status] || { label: status, className: "" };
    return <span className={`status-badge ${s.className}`}>{s.label}</span>;
  };

  return (
    <div className="employee-payroll">
      <div className="payroll-header">
        <div className="header-content">
          <div>
            <h1>Lương của tôi</h1>
            <p>Xem lịch sử lương và chi tiết phiếu lương</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="emp-payroll-filters">
        <div className="emp-filter-group">
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

        <div className="emp-filter-group">
          <label>
            <Calendar size={16} />
            Năm
          </label>
          <select
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value), page: 1 })}
          >
            {[2023, 2024, 2025, 2026].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Payroll Cards */}
      {isLoading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải...</p>
        </div>
      ) : payrolls.length === 0 ? (
        <div className="empty-state">
          <DollarSign size={64} />
          <h3>Chưa có dữ liệu lương</h3>
          <p>Bạn chưa có phiếu lương nào cho tháng này</p>
        </div>
      ) : (
        <>
          <div className="payroll-grid">
            {payrolls.map((payroll) => (
              <div key={payroll._id} className="payroll-card">
                <div className="card-header">
                  <div className="period">
                    <Calendar size={20} />
                    <span>Tháng {payroll.month}/{payroll.year}</span>
                  </div>
                  {getStatusBadge(payroll.status)}
                </div>

                <div className="card-body">
                  <div className="salary-amount">
                    <span className="label">Thực lĩnh</span>
                    <span className={`amount ${payroll.netSalary < 0 ? 'negative' : ''}`}>
                      {formatCurrency(payroll.netSalary)}
                    </span>
                  </div>

                  {payroll.netSalary < 0 && (
                    <div style={{
                      backgroundColor: '#fee2e2',
                      border: '1px solid #ef4444',
                      borderRadius: '8px',
                      padding: '10px',
                      margin: '12px 0',
                      fontSize: '12px',
                      color: '#991b1b'
                    }}>
                      ⚠️ <strong>Lưu ý:</strong> Bạn đang nợ công ty {formatCurrency(Math.abs(payroll.netSalary))} 
                      do khấu trừ lớn hơn thu nhập. Vui lòng liên hệ HR để thanh toán.
                    </div>
                  )}

                  <div className="salary-breakdown">
                    <div className="breakdown-item">
                      <TrendingUp size={16} className="icon-up" />
                      <span className="label">Tổng thu nhập</span>
                      <span className="value positive">
                        {formatCurrency(payroll.actualBaseSalary + payroll.overtimeAmount)}
                      </span>
                    </div>

                    <div className="breakdown-item">
                      <TrendingDown size={16} className="icon-down" />
                      <span className="label">Tổng khấu trừ</span>
                      <span className="value negative">
                        -{formatCurrency(
                          payroll.deductions.reduce((sum, d) => sum + d.amount, 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="card-footer">
                  <button className="btn-view" onClick={() => handleViewDetail(payroll)}>
                    <Eye size={18} />
                    Xem chi tiết
                  </button>
                  <button className="btn-download" onClick={() => handleDownloadPDF(payroll)}>
                    <Download size={18} />
                    Tải PDF
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                <ChevronLeft size={18} />
              </button>

              <span className="page-info">
                Trang {pagination.page} / {pagination.totalPages}
              </span>

              <button
                className="page-btn"
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
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chi tiết phiếu lương</h2>
              <button className="btn-close" onClick={() => setShowDetailModal(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h3>Thông tin chung</h3>
                <div className="detail-row">
                  <span>Kỳ lương:</span>
                  <strong>Tháng {selectedPayroll.month}/{selectedPayroll.year}</strong>
                </div>
                <div className="detail-row">
                  <span>Trạng thái:</span>
                  {getStatusBadge(selectedPayroll.status)}
                </div>
              </div>

              <div className="detail-section">
                <h3>Thu nhập</h3>
                <div className="detail-row">
                  <span>Lương cơ bản:</span>
                  <strong>{formatCurrency(selectedPayroll.baseSalary)}</strong>
                </div>
                <div className="detail-row">
                  <span>Số ngày làm việc:</span>
                  <strong>{selectedPayroll.workingDays}/{selectedPayroll.standardWorkingDays} ngày</strong>
                </div>
                <div className="detail-row">
                  <span>Lương thực tế:</span>
                  <strong className="text-success">{formatCurrency(selectedPayroll.actualBaseSalary)}</strong>
                </div>
                <div className="detail-row">
                  <span>Tăng ca:</span>
                  <strong className="text-success">{formatCurrency(selectedPayroll.overtimeAmount)}</strong>
                </div>
                
                {/* OT Pending Warning */}
                {selectedPayroll.overtimePending && 
                 (selectedPayroll.overtimePending.weekday > 0 || 
                  selectedPayroll.overtimePending.weekend > 0 || 
                  selectedPayroll.overtimePending.holiday > 0) && (
                  <div className="detail-row warning-message" style={{
                    backgroundColor: '#fff3cd',
                    padding: '12px',
                    borderRadius: '6px',
                    marginTop: '10px',
                    border: '1px solid #ffc107'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <strong style={{ color: '#856404', fontSize: '14px' }}>
                        ⚠️ Bạn có {' '}
                        {(selectedPayroll.overtimePending.weekday + 
                          selectedPayroll.overtimePending.weekend + 
                          selectedPayroll.overtimePending.holiday).toFixed(1)} giờ OT chưa được duyệt
                      </strong>
                      <span style={{ color: '#856404', fontSize: '12px' }}>
                        Vui lòng tạo đơn "Tăng ca" trong phần Request để được duyệt và tính lương OT.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="detail-section">
                <h3>Khấu trừ</h3>
                {selectedPayroll.deductions.length > 0 ? (
                  selectedPayroll.deductions.map((ded, idx) => (
                    <div key={idx} className="detail-row">
                      <span>{ded.description}:</span>
                      <strong className="text-danger">-{formatCurrency(ded.amount)}</strong>
                    </div>
                  ))
                ) : (
                  <p className="text-muted">Không có khấu trừ</p>
                )}
              </div>

              <div className="detail-section highlight">
                <div className="detail-row large">
                  <span>THỰC LĨNH:</span>
                  <strong className={`text-primary ${selectedPayroll.netSalary < 0 ? 'negative' : ''}`}>
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
                    ⚠️ <strong>Lưu ý:</strong> Bạn đang nợ công ty {formatCurrency(Math.abs(selectedPayroll.netSalary))}.
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDetailModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeePayroll;
