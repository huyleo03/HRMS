import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  DollarSign,
  Calendar,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import PayrollService from "../../service/PayrollService";
import "./ManagerPayroll.css";

const ITEMS_PER_PAGE = 6;

const ManagerPayroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
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

  const handleViewBreakdown = (payroll) => {
    setSelectedPayroll(payroll);
    setShowBreakdownModal(true);
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
      "Nháp": { label: "Nháp", className: "status-draft" },
      "Chờ duyệt": { label: "Chờ duyệt", className: "status-pending" },
      "Đã duyệt": { label: "Đã duyệt", className: "status-approved" },
      "Đã thanh toán": { label: "Đã thanh toán", className: "status-paid" },
      "Từ chối": { label: "Từ chối", className: "status-rejected" },
    };

    const s = statusMap[status] || { label: status, className: "" };
    return <span className={`status-badge ${s.className}`}>{s.label}</span>;
  };

  const getDayOfWeek = (dateString) => {
    const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const date = new Date(dateString);
    return days[date.getDay()];
  };

  return (
    <div className="manager-payroll-wrapper">
      <div className="payroll-header">
        <div className="header-content">
          <div>
            <h1>💼 Lương của tôi</h1>
            <p>Xem lịch sử lương và chi tiết phiếu lương</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
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

        <div className="filter-group">
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
        <div className="loading-container">
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
          <div className="payroll-cards-grid">
            {payrolls.map((payroll) => (
              <div key={payroll._id} className="payroll-card">
                <div className="card-header">
                  <div className="card-period">
                    <Calendar size={20} />
                    <span>Tháng {payroll.month}/{payroll.year}</span>
                  </div>
                  {getStatusBadge(payroll.status)}
                </div>

                <div className="card-body">
                  <div className="salary-main">
                    <span className="label">Thực lĩnh</span>
                    <span className={`amount ${payroll.netSalary < 0 ? 'negative' : ''}`}>
                      {formatCurrency(payroll.netSalary)}
                    </span>
                  </div>

                  {payroll.netSalary < 0 && (
                    <div className="warning-box negative-salary-warning">
                      <span>⚠️</span>
                      <p>
                        <strong>Lưu ý:</strong> Bạn đang nợ công ty {formatCurrency(Math.abs(payroll.netSalary))} 
                        do khấu trừ lớn hơn thu nhập. Vui lòng liên hệ HR để thanh toán.
                      </p>
                    </div>
                  )}

                  <div className="card-details">
                    <div className="detail-row">
                      <span>Tổng thu nhập:</span>
                      <span className="positive">
                        {formatCurrency(payroll.actualBaseSalary + payroll.overtimeAmount)}
                      </span>
                    </div>

                    <div className="detail-row">
                      <span>Tổng khấu trừ:</span>
                      <span className="negative">
                        -{formatCurrency(
                          payroll.deductions.reduce((sum, d) => sum + d.amount, 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="card-actions">
                  <button className="btn-action view" onClick={() => handleViewDetail(payroll)}>
                    <Eye size={18} />
                    Xem chi tiết
                  </button>
                  <button className="btn-action breakdown" onClick={() => handleViewBreakdown(payroll)}>
                    <Calendar size={18} />
                    Chi tiết từng ngày
                  </button>

                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn-page"
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                <ChevronLeft size={18} />
                Trước
              </button>

              <span className="page-info">
                Trang {pagination.page} / {pagination.totalPages}
              </span>

              <button
                className="btn-page"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                Sau
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Detail Modal - Summary */}
      {showDetailModal && selectedPayroll && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chi tiết phiếu lương</h2>
              <button
                className="btn-close"
                onClick={() => setShowDetailModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h3>Thông tin chung</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Kỳ lương:</span>
                    <span className="value">Tháng {selectedPayroll.month}/{selectedPayroll.year}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Trạng thái:</span>
                    <span className="value">{getStatusBadge(selectedPayroll.status)}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Thu nhập</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Lương cơ bản:</span>
                    <span className="value">{formatCurrency(selectedPayroll.baseSalary)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Số ngày làm việc:</span>
                    <span className="value">{selectedPayroll.workingDays}/{selectedPayroll.standardWorkingDays} ngày</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Lương thực tế:</span>
                    <span className="value positive">{formatCurrency(selectedPayroll.actualBaseSalary)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Tăng ca:</span>
                    <span className="value positive">{formatCurrency(selectedPayroll.overtimeAmount)}</span>
                  </div>
                </div>
                
                {selectedPayroll.overtimePending && 
                (selectedPayroll.overtimePending.weekday > 0 || 
                  selectedPayroll.overtimePending.weekend > 0 || 
                  selectedPayroll.overtimePending.holiday > 0) && (
                  <div className="warning-box">
                    <span>⚠️</span>
                    <p>
                      <strong>Bạn có {(selectedPayroll.overtimePending.weekday + selectedPayroll.overtimePending.weekend + selectedPayroll.overtimePending.holiday).toFixed(1)} giờ OT chưa được duyệt</strong>
                      <br/>Vui lòng tạo đơn "Tăng ca" trong phần Request để được duyệt và tính lương OT.
                    </p>
                  </div>
                )}
              </div>

              <div className="detail-section">
                <h3>Khấu trừ</h3>
                {selectedPayroll.deductions.length > 0 ? (
                  <div className="deductions-list">
                    {selectedPayroll.deductions.map((ded, idx) => (
                      <div key={idx} className="deduction-item">
                        <div className="deduction-info">
                          <div className="deduction-type">{ded.type}</div>
                          <div className="deduction-desc">{ded.description}</div>
                        </div>
                        <div className="deduction-amount negative">
                          -{formatCurrency(ded.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>Không có khấu trừ</p>
                )}
              </div>

              <div className="total-section">
                <div className="total-breakdown">
                  <div className="total-row">
                    <span>Tổng thu nhập:</span>
                    <span className="positive">{formatCurrency(selectedPayroll.actualBaseSalary + selectedPayroll.overtimeAmount)}</span>
                  </div>
                  <div className="total-row">
                    <span>Tổng khấu trừ:</span>
                    <span className="negative">-{formatCurrency(selectedPayroll.deductions.reduce((sum, d) => sum + d.amount, 0))}</span>
                  </div>
                  <div className="total-row final">
                    <span>THỰC LĨNH:</span>
                    <span className={`text-primary ${selectedPayroll.netSalary < 0 ? 'negative' : ''}`}>
                      {formatCurrency(selectedPayroll.netSalary)}
                    </span>
                  </div>
                </div>
                {selectedPayroll.netSalary < 0 && (
                  <div className="warning-box negative-salary-warning" style={{ marginTop: '1rem' }}>
                    <span>⚠️</span>
                    <p>
                      <strong>Lưu ý:</strong> Bạn đang nợ công ty {formatCurrency(Math.abs(selectedPayroll.netSalary))}.
                    </p>
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

      {/* Daily Breakdown Modal */}
      {showBreakdownModal && selectedPayroll && (
        <div className="modal-overlay" onClick={() => setShowBreakdownModal(false)}>
          <div className="modal-content breakdown-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📅 Chi tiết từng ngày - Tháng {selectedPayroll.month}/{selectedPayroll.year}</h2>
              <button className="btn-close" onClick={() => setShowBreakdownModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="daily-breakdown-table-wrapper">
                <table className="daily-breakdown-table">
                  <thead>
                    <tr>
                      <th>Ngày</th>
                      <th>Thứ</th>
                      <th>Trạng thái</th>
                      <th>Giờ vào</th>
                      <th>Giờ ra</th>
                      <th>Đi muộn (phút)</th>
                      <th>Về sớm (phút)</th>
                      <th>Giờ làm</th>
                      <th>OT (giờ)</th>
                      <th>Lương ngày</th>
                      <th>Lương OT</th>
                      <th>Khấu trừ muộn</th>
                      <th>Khấu trừ về sớm</th>
                      <th>Tổng ngày</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPayroll.dailyBreakdown && selectedPayroll.dailyBreakdown.length > 0 ? (
                      selectedPayroll.dailyBreakdown.map((day, idx) => (
                        <tr key={idx} className={!day.isWorkingDay ? 'non-working-day' : ''}>
                          <td>{day.date}</td>
                          <td>{getDayOfWeek(day.fullDate)}</td>
                          <td>
                            <span className={`status-badge ${day.isWorkingDay ? 'working' : 'not-working'}`}>
                              {day.isWorkingDay ? 'Làm việc' : 'Nghỉ'}
                            </span>
                            {day.isHoliday && <span className="ot-badge approved">Lễ</span>}
                          </td>
                          <td>{day.checkIn || '-'}</td>
                          <td>{day.checkOut || '-'}</td>
                          <td className={day.lateMinutes > 0 ? 'negative' : ''}>{day.lateMinutes || 0}</td>
                          <td className={day.earlyLeaveMinutes > 0 ? 'negative' : ''}>{day.earlyLeaveMinutes || 0}</td>
                          <td>{day.workHours ? day.workHours.toFixed(1) : '-'}</td>
                          <td>
                            {day.otHours > 0 ? (
                              <>
                                {day.otHours.toFixed(1)}
                                {day.otApproved && <span className="ot-badge approved">✓</span>}
                                {!day.otApproved && day.otHours > 0 && <span className="ot-badge pending">?</span>}
                              </>
                            ) : '-'}
                          </td>
                          <td className={day.dailySalary > 0 ? 'positive' : ''}>
                            {day.dailySalary > 0 ? formatCurrency(day.dailySalary) : '-'}
                          </td>
                          <td className={day.otSalary > 0 ? 'positive' : ''}>
                            {day.otSalary > 0 ? formatCurrency(day.otSalary) : '-'}
                          </td>
                          <td className={day.lateDeduction > 0 ? 'negative' : ''}>
                            {day.lateDeduction > 0 ? `-${formatCurrency(day.lateDeduction)}` : '-'}
                          </td>
                          <td className={day.earlyLeaveDeduction > 0 ? 'negative' : ''}>
                            {day.earlyLeaveDeduction > 0 ? `-${formatCurrency(day.earlyLeaveDeduction)}` : '-'}
                          </td>
                          <td className="day-total">
                            {formatCurrency(day.dayTotal || 0)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="14" style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                          Không có dữ liệu chi tiết từng ngày
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="summary-row">
                      <td colSpan="5"><strong>TỔNG CỘNG</strong></td>
                      <td><strong>{selectedPayroll.dailyBreakdown?.reduce((sum, d) => sum + (d.lateMinutes || 0), 0) || 0} phút</strong></td>
                      <td><strong>{selectedPayroll.dailyBreakdown?.reduce((sum, d) => sum + (d.earlyLeaveMinutes || 0), 0) || 0} phút</strong></td>
                      <td><strong>{selectedPayroll.dailyBreakdown?.reduce((sum, d) => sum + (d.workHours || 0), 0).toFixed(1) || 0} giờ</strong></td>
                      <td><strong>{selectedPayroll.dailyBreakdown?.reduce((sum, d) => sum + (d.otHours || 0), 0).toFixed(1) || 0} giờ</strong></td>
                      <td><strong>{formatCurrency(selectedPayroll.dailyBreakdown?.reduce((sum, d) => sum + (d.dailySalary || 0), 0) || 0)}</strong></td>
                      <td><strong>{formatCurrency(selectedPayroll.dailyBreakdown?.reduce((sum, d) => sum + (d.otSalary || 0), 0) || 0)}</strong></td>
                      <td><strong>-{formatCurrency(selectedPayroll.dailyBreakdown?.reduce((sum, d) => sum + (d.lateDeduction || 0), 0) || 0)}</strong></td>
                      <td><strong>-{formatCurrency(selectedPayroll.dailyBreakdown?.reduce((sum, d) => sum + (d.earlyLeaveDeduction || 0), 0) || 0)}</strong></td>
                      <td><strong>{formatCurrency(selectedPayroll.netSalary)}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowBreakdownModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerPayroll;
