import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  DollarSign,
  Calendar,
  Users,
  Filter,
  CheckCircle,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  RefreshCw,
  Edit3,
} from "lucide-react";
import PayrollService from "../../service/PayrollService";
import { getUsers } from "../../service/UserService";
import "./AdminPayroll.css";

const ITEMS_PER_PAGE = 10;

const AdminPayroll = () => {
  const [activeTab, setActiveTab] = useState("list"); // 'list' | 'calculate'
  const [payrolls, setPayrolls] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPayrolls, setSelectedPayrolls] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [employees, setEmployees] = useState([]);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    actualBaseSalary: 0,
    overtimeAmount: 0,
    allowances: [],
    bonuses: [],
    deductions: [],
    notes: "",
  });
  
  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    status: "",
    search: "",
    page: 1,
    limit: ITEMS_PER_PAGE,
  });

  // Pagination
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });

  // Calculate state
  const [calculateForm, setCalculateForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    employeeId: "",
  });

  // ============ EFFECTS ============

  useEffect(() => {
    fetchPayrolls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    // Fetch employees once on mount
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (e) => {
      if (!e.target.closest(".employee-search-wrapper")) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ============ API CALLS ============

  const fetchPayrolls = async () => {
    setIsLoading(true);
    try {
      const response = await PayrollService.getAllPayrolls(filters);
      setPayrolls(response.data || []);
      setSummary(response.summary || null);
      setPagination(response.pagination || {});
    } catch (error) {
      toast.error(error.message || "Không thể tải danh sách payroll");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await getUsers();
      console.log("Fetch employees response:", response);
      
      // getUsers returns { users: [...], total: X }
      if (response && response.users && Array.isArray(response.users)) {
        const filtered = response.users.filter((u) => u.role !== "Admin" && u.status === "Active");
        console.log("All users:", response.users.length);
        console.log("Filtered employees (non-Admin, Active):", filtered.length);
        console.log("Employees list:", filtered);
        setEmployees(filtered);
      } else if (response && response.data && Array.isArray(response.data)) {
        // Fallback if response has .data property
        const filtered = response.data.filter((u) => u.role !== "Admin" && u.status === "Active");
        console.log("All users (from .data):", response.data.length);
        console.log("Filtered employees:", filtered.length);
        setEmployees(filtered);
      } else {
        console.warn("Invalid response format:", response);
        setEmployees([]);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      setEmployees([]);
    }
  };

  const handleCalculateAll = async () => {
    if (
      !window.confirm(
        `Tính lương cho tất cả nhân viên tháng ${calculateForm.month}/${calculateForm.year}?`
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await PayrollService.calculateAllPayroll(
        calculateForm.month,
        calculateForm.year
      );
      toast.success(response.message || "Tính lương thành công!");
      setActiveTab("list");
      fetchPayrolls();
    } catch (error) {
      toast.error(error.message || "Không thể tính lương");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCalculateSingle = async () => {
    if (!calculateForm.employeeId) {
      toast.error("Vui lòng chọn nhân viên");
      return;
    }

    setIsLoading(true);
    try {
      await PayrollService.calculatePayroll(
        calculateForm.employeeId,
        calculateForm.month,
        calculateForm.year
      );
      toast.success("Tính lương thành công!");
      setCalculateForm({ ...calculateForm, employeeId: "" });
      setActiveTab("list");
      fetchPayrolls();
    } catch (error) {
      toast.error(error.message || "Không thể tính lương");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Xác nhận duyệt payroll này?")) return;

    try {
      await PayrollService.approvePayroll(id);
      toast.success("Đã duyệt payroll!");
      fetchPayrolls();
    } catch (error) {
      toast.error(error.message || "Không thể duyệt payroll");
    }
  };

  const handleBulkApprove = async () => {
    if (selectedPayrolls.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 payroll");
      return;
    }

    if (
      !window.confirm(`Xác nhận duyệt ${selectedPayrolls.length} payrolls?`)
    ) {
      return;
    }

    try {
      await PayrollService.bulkApprovePayrolls(selectedPayrolls);
      toast.success("Đã duyệt payrolls!");
      setSelectedPayrolls([]);
      fetchPayrolls();
    } catch (error) {
      toast.error(error.message || "Không thể duyệt payrolls");
    }
  };

  const handleMarkPaid = async (id) => {
    const paymentDetails = {
      paymentMethod: "BankTransfer",
      transactionId: `TXN${Date.now()}`,
      notes: "Đã chuyển khoản",
    };

    if (!window.confirm("Xác nhận đã thanh toán payroll này?")) return;

    try {
      await PayrollService.markAsPaid(id, paymentDetails);
      toast.success("Đã đánh dấu thanh toán!");
      fetchPayrolls();
    } catch (error) {
      toast.error(error.message || "Không thể đánh dấu thanh toán");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xác nhận xóa payroll này?")) return;

    try {
      await PayrollService.deletePayroll(id);
      toast.success("Đã xóa payroll!");
      fetchPayrolls();
    } catch (error) {
      toast.error(error.message || "Không thể xóa payroll");
    }
  };

  const handleViewDetail = async (payroll) => {
    setSelectedPayroll(payroll);
    setShowDetailModal(true);
  };

  const handleEdit = (payroll) => {
    setSelectedPayroll(payroll);
    setEditForm({
      actualBaseSalary: payroll.actualBaseSalary || 0,
      overtimeAmount: payroll.overtimeAmount || 0,
      allowances: payroll.allowances || [],
      bonuses: payroll.bonuses || [],
      deductions: payroll.deductions || [],
      notes: payroll.notes || "",
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      await PayrollService.updatePayroll(selectedPayroll._id, editForm);
      toast.success("Đã cập nhật phiếu lương thành công!");
      setShowEditModal(false);
      fetchPayrolls();
    } catch (error) {
      toast.error(error.message || "Không thể cập nhật");
    }
  };

  const handleSelectPayroll = (id) => {
    setSelectedPayrolls((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedPayrolls.length === payrolls.length) {
      setSelectedPayrolls([]);
    } else {
      setSelectedPayrolls(payrolls.map((p) => p._id));
    }
  };

  // ============ UTILS ============

  const getInitials = (name) => {
    if (!name) return "NA";
    const words = name.trim().split(" ");
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const getAvatarColor = (name) => {
    // Use same color as All Employees page
    return "#eef"; // Light blue-gray background
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
    const statusInfo = statusMap[status] || statusMap.Draft;
    return <span className={`status-badge ${statusInfo.className}`}>{statusInfo.label}</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  // ============ RENDER ============

  return (
    <div className="admin-payroll-container">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <DollarSign size={32} className="page-icon" />
          <div>
            <h1 className="page-title">Quản lý lương</h1>
            <p className="page-subtitle">Tính toán và quản lý lương nhân viên</p>
          </div>
        </div>
        <div className="header-actions">
          <button
            className={`tab-button ${activeTab === "list" ? "active" : ""}`}
            onClick={() => setActiveTab("list")}
          >
            <Users size={18} />
            Danh sách
          </button>
          <button
            className={`tab-button ${activeTab === "calculate" ? "active" : ""}`}
            onClick={() => setActiveTab("calculate")}
          >
            <RefreshCw size={18} />
            Tính lương
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && activeTab === "list" && (
        <div className="summary-cards">
          <div className="summary-card">
            <div className="card-icon total">
              <Users size={24} />
            </div>
            <div className="card-content">
              <p className="card-label">Tổng số bảng lương</p>
              <p className="card-value">{summary.totalPayrolls || 0}</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon cost">
              <DollarSign size={24} />
            </div>
            <div className="card-content">
              <p className="card-label">Tổng chi phí</p>
              <p className="card-value">{formatCurrency(summary.totalCost || 0)}</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon pending">
              <Clock size={24} />
            </div>
            <div className="card-content">
              <p className="card-label">Chờ duyệt</p>
              <p className="card-value">{summary.byStatus?.Pending || 0}</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon approved">
              <CheckCircle size={24} />
            </div>
            <div className="card-content">
              <p className="card-label">Đã duyệt</p>
              <p className="card-value">{summary.byStatus?.Approved || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* List Tab */}
      {activeTab === "list" && (
        <>
          {/* Filters */}
          <div className="filters-section">
            <div className="filter-group">
              <label>
                <Calendar size={16} />
                Tháng
              </label>
              <select
                value={filters.month}
                onChange={(e) =>
                  setFilters({ ...filters, month: parseInt(e.target.value) })
                }
              >
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
                onChange={(e) =>
                  setFilters({ ...filters, year: parseInt(e.target.value) })
                }
              >
                {[2023, 2024, 2025, 2026].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>
                <Filter size={16} />
                Trạng thái
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">Tất cả</option>
                <option value="Draft">Nháp</option>
                <option value="Pending">Chờ duyệt</option>
                <option value="Approved">Đã duyệt</option>
                <option value="Paid">Đã trả</option>
              </select>
            </div>

            <div className="filter-group search-group">
              <label>
                <Search size={16} />
                Tìm kiếm
              </label>
              <input
                type="text"
                placeholder="Tên nhân viên..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>

            {selectedPayrolls.length > 0 && (
              <button className="btn-bulk-approve" onClick={handleBulkApprove}>
                <CheckCircle size={18} />
                Duyệt ({selectedPayrolls.length})
              </button>
            )}
          </div>

          {/* Payrolls Table */}
          <div className="table-container">
            {isLoading ? (
              <div className="loading-state">
                <RefreshCw size={32} className="spin" />
                <p>Đang tải...</p>
              </div>
            ) : payrolls.length === 0 ? (
              <div className="empty-state">
                <DollarSign size={64} />
                <p>Chưa có bảng lương nào</p>
              </div>
            ) : (
              <table className="payroll-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={
                          selectedPayrolls.length === payrolls.length &&
                          payrolls.length > 0
                        }
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th>Nhân viên</th>
                    <th>Tháng/Năm</th>
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
                        <input
                          type="checkbox"
                          checked={selectedPayrolls.includes(payroll._id)}
                          onChange={() => handleSelectPayroll(payroll._id)}
                          disabled={payroll.status === "Paid"}
                        />
                      </td>
                      <td>
                        <div className="employee-info">
                          {payroll.employeeId?.avatar && 
                           payroll.employeeId.avatar.trim() !== "" &&
                           !payroll.employeeId.avatar.includes("placeholder") &&
                           !payroll.employeeId.avatar.includes("pravatar") ? (
                            <img
                              src={payroll.employeeId.avatar}
                              alt={payroll.employeeId?.full_name}
                              className="employee-avatar"
                            />
                          ) : (
                            <div
                              className="employee-avatar-initials"
                              style={{
                                backgroundColor: getAvatarColor(
                                  payroll.employeeId?.full_name
                                ),
                              }}
                            >
                              {getInitials(payroll.employeeId?.full_name)}
                            </div>
                          )}
                          <div>
                            <p className="employee-name">
                              {payroll.employeeId?.full_name}
                              {payroll.rejectedByManager && (
                                <span className="rejection-badge" title="Phiếu lương này đã bị Manager từ chối">
                                  ⚠️
                                </span>
                              )}
                            </p>
                            <p className="employee-id">
                              {payroll.employeeId?.employeeId}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        {payroll.month}/{payroll.year}
                      </td>
                      <td>{formatCurrency(payroll.baseSalary)}</td>
                      <td className={`net-salary ${payroll.netSalary < 0 ? 'negative-salary' : ''}`}>
                        {formatCurrency(payroll.netSalary)}
                        {payroll.netSalary < 0 && (
                          <span className="negative-badge" title="Nhân viên nợ công ty">⚠️</span>
                        )}
                      </td>
                      <td>{getStatusBadge(payroll.status)}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-action view"
                            onClick={() => handleViewDetail(payroll)}
                            title="Xem chi tiết"
                          >
                            <Eye size={18} />
                          </button>

                          {(payroll.status === "Draft" || payroll.status === "Pending") && (
                            <button
                              className="btn-action approve"
                              onClick={() => handleApprove(payroll._id)}
                              title="Duyệt lương"
                            >
                              <CheckCircle size={18} />
                            </button>
                          )}

                          {payroll.status === "Approved" && (
                            <button
                              className="btn-action paid"
                              onClick={() => handleMarkPaid(payroll._id)}
                              title="Đánh dấu đã thanh toán"
                            >
                              <DollarSign size={18} />
                            </button>
                          )}

                          {payroll.status === "Draft" && (
                            <>
                              <button
                                className="btn-action edit"
                                onClick={() => handleEdit(payroll)}
                                title="Chỉnh sửa thủ công"
                              >
                                <Edit3 size={18} />
                              </button>
                              <button
                                className="btn-action delete"
                                onClick={() => handleDelete(payroll._id)}
                                title="Xóa bảng lương"
                              >
                                <Trash2 size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn-page"
                disabled={pagination.currentPage === 1}
                onClick={() =>
                  setFilters({ ...filters, page: pagination.currentPage - 1 })
                }
              >
                <ChevronLeft size={18} />
                Trước
              </button>
              <span className="page-info">
                Trang {pagination.currentPage} / {pagination.totalPages}
              </span>
              <button
                className="btn-page"
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() =>
                  setFilters({ ...filters, page: pagination.currentPage + 1 })
                }
              >
                Sau
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Calculate Tab */}
      {activeTab === "calculate" && (
        <div className="calculate-section">
          <div className="calculate-card">
            <h2>Tính lương tất cả nhân viên</h2>
            <p>Tính lương tự động cho tất cả nhân viên dựa trên dữ liệu chấm công</p>

            <div className="form-group">
              <label>Tháng</label>
              <select
                value={calculateForm.month}
                onChange={(e) =>
                  setCalculateForm({
                    ...calculateForm,
                    month: parseInt(e.target.value),
                  })
                }
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Tháng {i + 1}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Năm</label>
              <select
                value={calculateForm.year}
                onChange={(e) =>
                  setCalculateForm({
                    ...calculateForm,
                    year: parseInt(e.target.value),
                  })
                }
              >
                {[2023, 2024, 2025, 2026].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="btn-calculate-all"
              onClick={handleCalculateAll}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw size={18} className="spin" />
                  Đang tính...
                </>
              ) : (
                <>
                  <RefreshCw size={18} />
                  Tính lương tất cả
                </>
              )}
            </button>
          </div>

          <div className="calculate-card">
            <h2>Tính lương cho nhân viên cụ thể</h2>
            <p>Tính lương cho một nhân viên riêng lẻ</p>

            <div className="form-group">
              <label>Tìm kiếm nhân viên</label>
              <div className="employee-search-wrapper">
                <input
                  type="text"
                  className="employee-search-input"
                  placeholder="Nhập tên hoặc mã nhân viên..."
                  value={searchQuery}
                  onChange={(e) => {
                    const query = e.target.value;
                    setSearchQuery(query);
                    setShowDropdown(true);
                    
                    if (query.trim() === "") {
                      setFilteredEmployees([]);
                      setCalculateForm({ ...calculateForm, employeeId: "" });
                    } else {
                      const filtered = employees.filter((emp) => {
                        const nameMatch = emp.full_name?.toLowerCase().includes(query.toLowerCase());
                        const idMatch = emp.employeeId?.toLowerCase().includes(query.toLowerCase());
                        return nameMatch || idMatch;
                      });
                      console.log("Search query:", query);
                      console.log("Total employees:", employees.length);
                      console.log("Filtered results:", filtered);
                      setFilteredEmployees(filtered);
                    }
                  }}
                  onFocus={() => setShowDropdown(true)}
                />
                <Search size={18} className="search-icon" />
                
                {showDropdown && searchQuery.trim() !== "" && (
                  <div className="employee-dropdown">
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map((emp) => (
                        <div
                          key={emp._id}
                          className="employee-dropdown-item"
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevent input blur
                            setCalculateForm({ ...calculateForm, employeeId: emp._id });
                            setSearchQuery(`${emp.full_name} (${emp.employeeId})`);
                            setShowDropdown(false);
                            setFilteredEmployees([]);
                          }}
                        >
                          {emp.avatar && 
                           emp.avatar.trim() !== "" &&
                           !emp.avatar.includes("placeholder") &&
                           !emp.avatar.includes("pravatar") ? (
                            <img
                              src={emp.avatar}
                              alt={emp.full_name}
                              className="dropdown-avatar"
                            />
                          ) : (
                            <div
                              className="dropdown-avatar-initials"
                              style={{ backgroundColor: getAvatarColor(emp.full_name) }}
                            >
                              {getInitials(emp.full_name)}
                            </div>
                          )}
                          <div className="dropdown-info">
                            <span className="dropdown-name">{emp.full_name}</span>
                            <span className="dropdown-id">{emp.employeeId}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="employee-dropdown-empty">
                        Không tìm thấy nhân viên
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Tháng</label>
              <select
                value={calculateForm.month}
                onChange={(e) =>
                  setCalculateForm({
                    ...calculateForm,
                    month: parseInt(e.target.value),
                  })
                }
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Tháng {i + 1}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Năm</label>
              <select
                value={calculateForm.year}
                onChange={(e) =>
                  setCalculateForm({
                    ...calculateForm,
                    year: parseInt(e.target.value),
                  })
                }
              >
                {[2023, 2024, 2025, 2026].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="btn-calculate-single"
              onClick={handleCalculateSingle}
              disabled={isLoading || !calculateForm.employeeId}
            >
              {isLoading ? (
                <>
                  <RefreshCw size={18} className="spin" />
                  Đang tính...
                </>
              ) : (
                <>
                  <RefreshCw size={18} />
                  Tính lương
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedPayroll && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chi tiết bảng lương</h2>
              <button
                className="btn-close"
                onClick={() => setShowDetailModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {/* Manager Rejection Warning */}
              {selectedPayroll.rejectedByManager && (
                <div className="manager-rejection-warning" style={{
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ fontSize: '24px' }}>⚠️</div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 8px 0', color: '#856404', fontSize: '16px', fontWeight: 600 }}>
                        Phiếu lương đã bị Manager từ chối
                      </h4>
                      {selectedPayroll.managerRejectionHistory && 
                       selectedPayroll.managerRejectionHistory.length > 0 && (
                        <div style={{ fontSize: '13px', color: '#856404' }}>
                          {selectedPayroll.managerRejectionHistory.map((rejection, index) => (
                            <div key={index} style={{ 
                              marginTop: index > 0 ? '8px' : '0',
                              paddingTop: index > 0 ? '8px' : '0',
                              borderTop: index > 0 ? '1px solid #ffc107' : 'none'
                            }}>
                              <p style={{ margin: '0 0 4px 0' }}>
                                <strong>{rejection.rejectedByName}</strong> đã từ chối lúc{' '}
                                {new Date(rejection.rejectedAt).toLocaleString('vi-VN')}
                              </p>
                              <p style={{ margin: '0', fontStyle: 'italic' }}>
                                "{rejection.reason}"
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                      <div style={{ 
                        marginTop: '12px', 
                        padding: '12px', 
                        backgroundColor: '#fff', 
                        borderRadius: '4px',
                        border: '1px solid #ffc107'
                      }}>
                        <div style={{ fontSize: '12px', color: '#856404', marginBottom: '10px' }}>
                          💡 <strong>Hành động được đề xuất:</strong>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            onClick={async () => {
                              if (!window.confirm('Bạn chắc chắn muốn duyệt phiếu lương này? Điều này sẽ bỏ qua ý kiến từ chối của Manager.')) {
                                return;
                              }
                              try {
                                await PayrollService.approvePayroll(selectedPayroll._id);
                                toast.success("Đã duyệt phiếu lương (Override Manager rejection)!");
                                setShowDetailModal(false);
                                fetchPayrolls();
                              } catch (error) {
                                toast.error(error.message || "Không thể duyệt");
                              }
                            }}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.3s'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
                            onMouseOut={(e) => e.target.style.backgroundColor = '#10b981'}
                          >
                            ✅ Duyệt luôn (Override)
                          </button>
                        </div>
                        <div style={{ 
                          marginTop: '10px', 
                          fontSize: '11px', 
                          color: '#856404',
                          fontStyle: 'italic'
                        }}>
                          💬 <strong>Gợi ý xử lý:</strong><br/>
                          • Nếu cần điều chỉnh: Đóng modal → Click nút ✏️ Edit → Sửa thủ công<br/>
                          • Nếu Manager sai: Click "Duyệt luôn" để override và tiếp tục workflow<br/>
                          • Nếu chưa chắc: Đóng modal → Kiểm tra attendance/requests trước khi quyết định
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Employee Info */}
              <div className="detail-section">
                <h3>Thông tin nhân viên</h3>
                <div className="detail-row">
                  <span>Tên:</span>
                  <strong>{selectedPayroll.employeeId?.full_name}</strong>
                </div>
                <div className="detail-row">
                  <span>Mã NV:</span>
                  <strong>{selectedPayroll.employeeId?.employeeId}</strong>
                </div>
                <div className="detail-row">
                  <span>Email:</span>
                  <strong>{selectedPayroll.employeeId?.email}</strong>
                </div>
              </div>

              {/* Salary Breakdown */}
              <div className="detail-section">
                <h3>Chi tiết lương</h3>
                <div className="detail-row">
                  <span>Lương cơ bản:</span>
                  <strong>{formatCurrency(selectedPayroll.baseSalary)}</strong>
                </div>
                <div className="detail-row">
                  <span>Số ngày công:</span>
                  <strong>
                    {selectedPayroll.workingDays}/{selectedPayroll.standardWorkingDays}
                  </strong>
                </div>
                <div className="detail-row">
                  <span>Lương thực tế:</span>
                  <strong>{formatCurrency(selectedPayroll.actualBaseSalary)}</strong>
                </div>
                <div className="detail-row">
                  <span>Overtime:</span>
                  <strong>{formatCurrency(selectedPayroll.overtimeAmount)}</strong>
                </div>
                
                {/* OT Pending Warning */}
                {selectedPayroll.overtimePending && 
                 (selectedPayroll.overtimePending.weekday > 0 || 
                  selectedPayroll.overtimePending.weekend > 0 || 
                  selectedPayroll.overtimePending.holiday > 0) && (
                  <div className="detail-row" style={{
                    backgroundColor: '#fff3cd',
                    padding: '12px',
                    borderRadius: '6px',
                    marginTop: '10px',
                    border: '1px solid #ffc107',
                    display: 'block'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <strong style={{ color: '#856404', fontSize: '14px' }}>
                        ⚠️ Nhân viên có {' '}
                        {(selectedPayroll.overtimePending.weekday + 
                          selectedPayroll.overtimePending.weekend + 
                          selectedPayroll.overtimePending.holiday).toFixed(1)} giờ OT chưa được duyệt
                      </strong>
                      <span style={{ color: '#856404', fontSize: '12px' }}>
                        OT này chưa được tính vào lương. Nhân viên cần tạo đơn "Tăng ca" và được duyệt.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Allowances */}
              {selectedPayroll.allowances?.length > 0 && (
                <div className="detail-section">
                  <h3>Phụ cấp</h3>
                  {selectedPayroll.allowances.map((item, idx) => (
                    <div key={idx} className="detail-row">
                      <span>{item.type}:</span>
                      <strong>{formatCurrency(item.amount)}</strong>
                    </div>
                  ))}
                </div>
              )}

              {/* Deductions */}
              {selectedPayroll.deductions?.length > 0 && (
                <div className="detail-section">
                  <h3>Khấu trừ</h3>
                  {selectedPayroll.deductions.map((item, idx) => (
                    <div key={idx} className="detail-row">
                      <span>{item.type}:</span>
                      <strong className="deduction">
                        -{formatCurrency(item.amount)}
                      </strong>
                    </div>
                  ))}
                </div>
              )}

              {/* Total */}
              <div className="detail-section total-section">
                <div className="detail-row total-row">
                  <span>Tổng thực lĩnh:</span>
                  <strong className={`net-salary-large ${selectedPayroll.netSalary < 0 ? 'negative-salary' : ''}`}>
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
                    Có thể do khấu trừ (đi muộn, vắng mặt) lớn hơn lương thực tế + OT.
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="detail-section">
                <div className="detail-row">
                  <span>Trạng thái:</span>
                  {getStatusBadge(selectedPayroll.status)}
                </div>
                {selectedPayroll.approvedAt && (
                  <div className="detail-row">
                    <span>Ngày duyệt:</span>
                    <strong>{formatDate(selectedPayroll.approvedAt)}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedPayroll && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content modal-edit" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Chỉnh sửa phiếu lương</h2>
              <button
                className="btn-close"
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {selectedPayroll.rejectedByManager && (
                <div style={{
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '20px',
                  fontSize: '13px',
                  color: '#856404'
                }}>
                  ⚠️ <strong>Lưu ý:</strong> Phiếu lương này đã bị Manager từ chối. 
                  Sau khi chỉnh sửa, hãy gửi lại cho Manager duyệt.
                </div>
              )}

              <div className="form-group">
                <label>Lương thực tế (VND)</label>
                <input
                  type="number"
                  value={editForm.actualBaseSalary}
                  onChange={(e) => setEditForm({...editForm, actualBaseSalary: Number(e.target.value)})}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Tiền tăng ca (VND)</label>
                <input
                  type="number"
                  value={editForm.overtimeAmount}
                  onChange={(e) => setEditForm({...editForm, overtimeAmount: Number(e.target.value)})}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Ghi chú</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                  className="form-control"
                  rows="3"
                  placeholder="Ghi chú về các thay đổi..."
                />
              </div>

              <div style={{fontSize: '12px', color: '#6b7280', marginTop: '12px'}}>
                💡 <strong>Gợi ý:</strong> Để thêm/sửa Allowances, Bonuses, Deductions chi tiết, 
                vui lòng sử dụng tính năng nâng cao (đang phát triển).
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowEditModal(false)}
              >
                Hủy
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveEdit}
              >
                💾 Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayroll;
