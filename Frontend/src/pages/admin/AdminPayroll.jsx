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
import { getDepartmentOptions } from "../../service/DepartmentService";
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
  const [departments, setDepartments] = useState([]);
  const [detailTab, setDetailTab] = useState("summary"); // 'summary' | 'daily'
  const [showOTDetailModal, setShowOTDetailModal] = useState(false);
  const [otRequests, setOTRequests] = useState([]);
  
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
    departmentId: "",
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
    fetchDepartments();
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

  const fetchDepartments = async () => {
    try {
      const response = await getDepartmentOptions();
      setDepartments(response.data || []);
    } catch (error) {
      console.error("Error fetching departments:", error);
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
      
      // Update filters to match the calculated month/year so the payrolls show up
      setFilters({
        ...filters,
        month: calculateForm.month,
        year: calculateForm.year,
        page: 1 // Reset to first page
      });
      
      setActiveTab("list");
      // fetchPayrolls() will be called automatically by useEffect when filters change
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
      
      // Update filters to match the calculated month/year so the payroll shows up
      setFilters({
        ...filters,
        month: calculateForm.month,
        year: calculateForm.year,
        page: 1 // Reset to first page
      });
      
      setActiveTab("list");
      // fetchPayrolls() will be called automatically by useEffect when filters change
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
      "Nháp": { label: "Nháp", className: "status-draft" },
      "Chờ duyệt": { label: "Chờ duyệt", className: "status-pending" },
      "Đã duyệt": { label: "Đã duyệt", className: "status-approved" },
      "Đã thanh toán": { label: "Đã thanh toán", className: "status-paid" },
      "Từ chối": { label: "Từ chối", className: "status-rejected" },
    };
    const statusInfo = statusMap[status] || statusMap["Nháp"];
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
              <p className="card-value">{summary.byStatus?.["Chờ duyệt"] || 0}</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon approved">
              <CheckCircle size={24} />
            </div>
            <div className="card-content">
              <p className="card-label">Đã duyệt</p>
              <p className="card-value">{summary.byStatus?.["Đã duyệt"] || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* List Tab */}
      {activeTab === "list" && (
        <>
          {/* Filters */}
          <div className="filters-section">
            <div className="filter-dat">
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

            <div className="filter-dat">
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

            <div className="filter-dat">
              <label>
                <Filter size={16} />
                Trạng thái
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">Tất cả</option>
                <option value="Nháp">Nháp</option>
                <option value="Chờ duyệt">Chờ duyệt</option>
                <option value="Đã duyệt">Đã duyệt</option>
                <option value="Đã thanh toán">Đã thanh toán</option>
              </select>
            </div>

            <div className="filter-dat">
              <label>
                <Users size={16} />
                Phòng ban
              </label>
              <select
                value={filters.departmentId}
                onChange={(e) => setFilters({ ...filters, departmentId: e.target.value, page: 1 })}
              >
                <option value="">Tất cả</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.department_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-dat search-group">
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
                    <th>Phòng ban</th>
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
                        <span className="department-badge">
                          {payroll.employeeId?.department?.department_id?.department_name || "N/A"}
                        </span>
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

                          {(payroll.status === "Nháp" || payroll.status === "Chờ duyệt") && (
                            <button
                              className="btn-action approve"
                              onClick={() => handleApprove(payroll._id)}
                              title="Duyệt lương"
                            >
                              <CheckCircle size={18} />
                            </button>
                          )}

                          {payroll.status === "Đã duyệt" && (
                            <button
                              className="btn-action paid"
                              onClick={() => handleMarkPaid(payroll._id)}
                              title="Đánh dấu đã thanh toán"
                            >
                              <DollarSign size={18} />
                            </button>
                          )}

                          {payroll.status === "Nháp" && (
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
        <div className="modal-overlay" onClick={() => {
          setShowDetailModal(false);
          setDetailTab("summary");
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chi tiết bảng lương</h2>
              <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', marginRight: '12px' }}>
                <button
                  onClick={() => setDetailTab("summary")}
                  style={{
                    padding: '8px 16px',
                    background: detailTab === "summary" ? '#10b981' : '#f3f4f6',
                    color: detailTab === "summary" ? 'white' : '#6b7280',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  📊 Tổng quan
                </button>
                <button
                  onClick={() => setDetailTab("daily")}
                  style={{
                    padding: '8px 16px',
                    background: detailTab === "daily" ? '#10b981' : '#f3f4f6',
                    color: detailTab === "daily" ? 'white' : '#6b7280',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  📅 Chi tiết từng ngày
                </button>
              </div>
              <button
                className="btn-close"
                onClick={() => {
                  setShowDetailModal(false);
                  setDetailTab("summary");
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {/* Tab: Summary */}
              {detailTab === "summary" && (
                <>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong>{formatCurrency(selectedPayroll.overtimeAmount)}</strong>
                    {selectedPayroll.overtimeAmount > 0 && (
                      <button
                        onClick={async () => {
                          try {
                            // Sử dụng endpoint employee-overtime (không cần Admin role)
                            const token = localStorage.getItem('auth_token');
                            const response = await fetch(
                              `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:9999'}/api/requests/employee-overtime?employeeId=${selectedPayroll.employeeId._id}&month=${selectedPayroll.month}&year=${selectedPayroll.year}&status=Approved`,
                              {
                                headers: {
                                  'Authorization': `Bearer ${token}`
                                }
                              }
                            );
                            
                            if (!response.ok) {
                              throw new Error('Không thể tải dữ liệu');
                            }
                            
                            const data = await response.json();
                            console.log('OT Requests:', data);
                            setOTRequests(data.data || data.requests || []);
                            setShowOTDetailModal(true);
                          } catch (error) {
                            console.error('Error fetching OT requests:', error);
                            toast.error('Không thể tải thông tin đơn tăng ca');
                          }
                        }}
                        style={{
                          padding: '4px 8px',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.background = '#2563eb'}
                        onMouseOut={(e) => e.target.style.background = '#3b82f6'}
                        title="Xem chi tiết đơn tăng ca đã duyệt"
                      >
                        <span>📋</span>
                        <span>Chi tiết</span>
                      </button>
                    )}
                  </div>
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
                </>
              )}

              {/* Tab: Daily Breakdown */}
              {detailTab === "daily" && selectedPayroll.dailyBreakdown && selectedPayroll.dailyBreakdown.length > 0 && (
                <div style={{ padding: 0 }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '16px 20px',
                    borderRadius: '12px 12px 0 0',
                    marginBottom: '20px',
                    color: 'white'
                  }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700 }}>
                      📅 Chi tiết từng ngày - Tháng {selectedPayroll.month}/{selectedPayroll.year}
                    </h3>
                  </div>

                  <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '13px',
                      minWidth: '1200px'
                    }}>
                      <thead>
                        <tr style={{
                          background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                          fontWeight: 600,
                          color: '#374151',
                          fontSize: '12px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '2px solid #d1d5db' }}>Ngày</th>
                          <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '2px solid #d1d5db' }}>Thứ</th>
                          <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '2px solid #d1d5db' }}>Vào</th>
                          <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '2px solid #d1d5db' }}>Ra</th>
                          <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '2px solid #d1d5db' }}>Trạng thái</th>
                          <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '2px solid #d1d5db' }}>Muộn (phút)</th>
                          <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '2px solid #d1d5db' }}>Về sớm (phút)</th>
                          <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '2px solid #d1d5db' }}>Giờ làm</th>
                          <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '2px solid #d1d5db' }}>OT</th>
                          <th style={{ padding: '12px 8px', textAlign: 'right', borderBottom: '2px solid #d1d5db' }}>Lương ngày</th>
                          <th style={{ padding: '12px 8px', textAlign: 'right', borderBottom: '2px solid #d1d5db' }}>Lương OT</th>
                          <th style={{ padding: '12px 8px', textAlign: 'right', borderBottom: '2px solid #d1d5db' }}>Trừ muộn</th>
                          <th style={{ padding: '12px 8px', textAlign: 'right', borderBottom: '2px solid #d1d5db' }}>Trừ về sớm</th>
                          <th style={{ padding: '12px 8px', textAlign: 'right', borderBottom: '2px solid #d1d5db', fontWeight: 700 }}>Tổng</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPayroll.dailyBreakdown.map((day, idx) => {
                          const dayOfWeek = new Date(day.fullDate).getDay();
                          const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                          const isHoliday = day.isHoliday;
                          
                          const rowBg = isHoliday 
                            ? '#fef3c7' 
                            : isWeekend 
                              ? '#f3f4f6' 
                              : idx % 2 === 0 
                                ? 'white' 
                                : '#fafafa';

                          return (
                            <tr key={idx} style={{
                              background: rowBg,
                              borderBottom: '1px solid #e5e7eb'
                            }}>
                              <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 600 }}>
                                {day.date}
                              </td>
                              <td style={{ 
                                padding: '10px 8px', 
                                textAlign: 'center',
                                color: isWeekend || isHoliday ? '#f59e0b' : '#6b7280',
                                fontWeight: isWeekend || isHoliday ? 600 : 400
                              }}>
                                {dayNames[dayOfWeek]}
                              </td>
                              <td style={{ padding: '10px 8px', textAlign: 'center', color: '#374151' }}>
                                {day.checkIn || '-'}
                              </td>
                              <td style={{ padding: '10px 8px', textAlign: 'center', color: '#374151' }}>
                                {day.checkOut || '-'}
                              </td>
                              <td style={{ padding: '10px 8px' }}>
                                <span style={{
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  background: 
                                    day.status === 'Present' ? '#d1fae5' :
                                    day.status === 'Late' ? '#fef3c7' :
                                    day.status === 'Absent' ? '#fee2e2' :
                                    day.status === 'Weekend' ? '#e5e7eb' :
                                    day.status === 'Holiday' ? '#fef3c7' :
                                    '#f3f4f6',
                                  color:
                                    day.status === 'Present' ? '#059669' :
                                    day.status === 'Late' ? '#d97706' :
                                    day.status === 'Absent' ? '#dc2626' :
                                    day.status === 'Weekend' ? '#6b7280' :
                                    day.status === 'Holiday' ? '#d97706' :
                                    '#6b7280'
                                }}>
                                  {day.holidayName || day.status}
                                </span>
                              </td>
                              <td style={{ 
                                padding: '10px 8px', 
                                textAlign: 'center',
                                color: day.lateMinutes > 0 ? '#dc2626' : '#6b7280',
                                fontWeight: day.lateMinutes > 0 ? 600 : 400
                              }}>
                                {day.lateMinutes || '-'}
                              </td>
                              <td style={{ 
                                padding: '10px 8px', 
                                textAlign: 'center',
                                color: day.earlyLeaveMinutes > 0 ? '#dc2626' : '#6b7280',
                                fontWeight: day.earlyLeaveMinutes > 0 ? 600 : 400
                              }}>
                                {day.earlyLeaveMinutes || '-'}
                              </td>
                              <td style={{ padding: '10px 8px', textAlign: 'center', color: '#374151' }}>
                                {day.workHours ? day.workHours.toFixed(1) : '-'}
                              </td>
                              <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                                {day.otHours > 0 ? (
                                  <span style={{
                                    color: '#2563eb',
                                    fontWeight: 600
                                  }}>
                                    {day.otHours.toFixed(1)}
                                    {day.otMultiplier > 1 && (
                                      <span style={{ fontSize: '10px', marginLeft: '2px' }}>
                                        (x{day.otMultiplier})
                                      </span>
                                    )}
                                  </span>
                                ) : '-'}
                              </td>
                              <td style={{ 
                                padding: '10px 8px', 
                                textAlign: 'right',
                                color: day.dailySalary > 0 ? '#059669' : '#9ca3af',
                                fontWeight: 500
                              }}>
                                {day.dailySalary > 0 ? formatCurrency(day.dailySalary) : '-'}
                              </td>
                              <td style={{ 
                                padding: '10px 8px', 
                                textAlign: 'right',
                                color: day.otSalary > 0 ? '#2563eb' : '#9ca3af',
                                fontWeight: 500
                              }}>
                                {day.otSalary > 0 ? formatCurrency(day.otSalary) : '-'}
                              </td>
                              <td style={{ 
                                padding: '10px 8px', 
                                textAlign: 'right',
                                color: day.lateDeduction > 0 ? '#dc2626' : '#9ca3af',
                                fontWeight: 500
                              }}>
                                {day.lateDeduction > 0 ? `-${formatCurrency(day.lateDeduction)}` : '-'}
                              </td>
                              <td style={{ 
                                padding: '10px 8px', 
                                textAlign: 'right',
                                color: day.earlyLeaveDeduction > 0 ? '#dc2626' : '#9ca3af',
                                fontWeight: 500
                              }}>
                                {day.earlyLeaveDeduction > 0 ? `-${formatCurrency(day.earlyLeaveDeduction)}` : '-'}
                              </td>
                              <td style={{ 
                                padding: '10px 8px', 
                                textAlign: 'right',
                                fontWeight: 700,
                                color: day.dayTotal >= 0 ? '#1f2937' : '#dc2626',
                                fontSize: '14px'
                              }}>
                                {formatCurrency(day.dayTotal)}
                              </td>
                            </tr>
                          );
                        })}
                        
                        {/* Total Row */}
                        <tr style={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '14px'
                        }}>
                          <td colSpan="5" style={{ padding: '14px 8px', textAlign: 'right' }}>
                            TỔNG CỘNG:
                          </td>
                          <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                            {selectedPayroll.dailyBreakdown?.reduce((sum, d) => sum + (d.lateMinutes || 0), 0) || 0} phút
                          </td>
                          <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                            {selectedPayroll.dailyBreakdown?.reduce((sum, d) => sum + (d.earlyLeaveMinutes || 0), 0) || 0} phút
                          </td>
                          <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                            {selectedPayroll.dailyBreakdown?.reduce((sum, d) => sum + (d.workHours || 0), 0).toFixed(1) || 0} giờ
                          </td>
                          <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                            {selectedPayroll.dailyBreakdown?.reduce((sum, d) => sum + (d.otHours || 0), 0).toFixed(1) || 0} giờ
                          </td>
                          <td style={{ padding: '14px 8px', textAlign: 'right' }}>
                            {formatCurrency(selectedPayroll.dailyBreakdown?.reduce((sum, d) => sum + (d.dailySalary || 0), 0) || 0)}
                          </td>
                          <td style={{ padding: '14px 8px', textAlign: 'right' }}>
                            {formatCurrency(selectedPayroll.dailyBreakdown?.reduce((sum, d) => sum + (d.otSalary || 0), 0) || 0)}
                          </td>
                          <td style={{ padding: '14px 8px', textAlign: 'right' }}>
                            -{formatCurrency(selectedPayroll.dailyBreakdown?.reduce((sum, d) => sum + (d.lateDeduction || 0), 0) || 0)}
                          </td>
                          <td style={{ padding: '14px 8px', textAlign: 'right' }}>
                            -{formatCurrency(selectedPayroll.dailyBreakdown?.reduce((sum, d) => sum + (d.earlyLeaveDeduction || 0), 0) || 0)}
                          </td>
                          <td style={{ padding: '14px 8px', textAlign: 'right', fontSize: '16px' }}>
                            {formatCurrency(selectedPayroll.dailyBreakdown?.reduce((sum, d) => sum + (d.dayTotal || 0), 0) || 0)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Cards Below Table */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginTop: '24px'
                  }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '2px solid #10b981'
                    }}>
                      <div style={{ fontSize: '13px', color: '#047857', fontWeight: 600, marginBottom: '6px' }}>
                        💰 Tổng lương ngày
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#065f46' }}>
                        {formatCurrency(selectedPayroll.actualBaseSalary || 0)}
                      </div>
                    </div>

                    <div style={{
                      background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '2px solid #3b82f6'
                    }}>
                      <div style={{ fontSize: '13px', color: '#1e40af', fontWeight: 600, marginBottom: '6px' }}>
                        ⏰ Tổng lương OT
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#1e3a8a' }}>
                        {formatCurrency(selectedPayroll.overtimeAmount || 0)}
                      </div>
                    </div>

                    <div style={{
                      background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '2px solid #ef4444'
                    }}>
                      <div style={{ fontSize: '13px', color: '#b91c1c', fontWeight: 600, marginBottom: '6px' }}>
                        ⚠️ Tổng khấu trừ
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#991b1b' }}>
                        -{formatCurrency(
                          (selectedPayroll.dailyBreakdown?.reduce((sum, d) => sum + (d.lateDeduction || 0), 0) || 0)
                        )}
                      </div>
                    </div>

                    <div style={{
                      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '2px solid #f59e0b'
                    }}>
                      <div style={{ fontSize: '13px', color: '#b45309', fontWeight: 600, marginBottom: '6px' }}>
                        🎯 Thực lĩnh
                      </div>
                      <div style={{ 
                        fontSize: '20px', 
                        fontWeight: 700, 
                        color: selectedPayroll.netSalary >= 0 ? '#78350f' : '#dc2626'
                      }}>
                        {formatCurrency(selectedPayroll.netSalary || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* OT Detail Modal */}
      {showOTDetailModal && (
        <div className="modal-overlay" onClick={() => setShowOTDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1000px' }}>
            <div className="modal-header">
              <h2>📋 Chi tiết OT đã duyệt - {selectedPayroll?.employeeId?.full_name}</h2>
              <button
                className="btn-close"
                onClick={() => setShowOTDetailModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {otRequests.length > 0 ? (
                <>
                  <div style={{
                    background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    border: '2px solid #3b82f6'
                  }}>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                      gap: '12px' 
                    }}>
                      <div style={{ fontSize: '14px', color: '#1e40af' }}>
                        <strong>Tháng:</strong> {selectedPayroll.month}/{selectedPayroll.year}
                      </div>
                      <div style={{ fontSize: '14px', color: '#1e40af' }}>
                        <strong>Số đơn OT:</strong> {otRequests.length} đơn
                      </div>
                      <div style={{ fontSize: '14px', color: '#1e40af' }}>
                        <strong>Tổng giờ OT:</strong>{' '}
                        {otRequests.reduce((sum, req) => {
                          const hours = parseFloat(req.hour) || 0;
                          return sum + hours;
                        }, 0).toFixed(1)} giờ
                      </div>
                    </div>
                  </div>

                  <div style={{ 
                    fontSize: '13px', 
                    color: '#6b7280', 
                    marginBottom: '16px',
                    padding: '12px',
                    background: '#f0fdf4',
                    borderRadius: '8px',
                    border: '1px solid #86efac'
                  }}>
                    💡 <strong>Lưu ý:</strong> Chỉ OT được duyệt mới được tính vào lương. 
                    Mỗi đơn có thể bao gồm nhiều ngày OT.
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '14px'
                    }}>
                      <thead>
                        <tr style={{
                          background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                          fontWeight: 600,
                          color: '#374151'
                        }}>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #d1d5db' }}>Mã đơn</th>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #d1d5db' }}>Khoảng thời gian</th>
                          <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #d1d5db' }}>Số giờ OT</th>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #d1d5db' }}>Lý do</th>
                          <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #d1d5db' }}>Người duyệt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {otRequests.map((request, idx) => {
                          const startDate = new Date(request.startDate);
                          
                          return (
                            <tr key={request._id || idx} style={{
                              background: idx % 2 === 0 ? 'white' : '#fafafa',
                              borderBottom: '1px solid #e5e7eb'
                            }}>
                              <td style={{ padding: '12px' }}>
                                <span style={{
                                  background: '#e0e7ff',
                                  color: '#4f46e5',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  fontFamily: 'monospace'
                                }}>
                                  {request.requestId || 'N/A'}
                                </span>
                              </td>
                              <td style={{ padding: '12px' }}>
                                <div style={{ fontWeight: 600, color: '#374151' }}>
                                  {startDate.toLocaleDateString('vi-VN', { 
                                    day: '2-digit', 
                                    month: '2-digit',
                                    year: 'numeric'
                                  })}
                                </div>
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center' }}>
                                <span style={{
                                  background: '#dbeafe',
                                  color: '#1e40af',
                                  padding: '6px 14px',
                                  borderRadius: '8px',
                                  fontWeight: 700,
                                  fontSize: '14px'
                                }}>
                                  {request.hour || 0}h
                                </span>
                              </td>
                              <td style={{ padding: '12px', color: '#374151', fontSize: '13px', maxWidth: '200px' }}>
                                {request.reason || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Không ghi lý do</span>}
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px' }}>
                                {(() => {
                                  const approver = request.approvalFlow?.find(a => a.status === 'Approved');
                                  if (approver?.approverId) {
                                    return (
                                      <div>
                                        <div style={{ 
                                          color: '#059669', 
                                          fontWeight: 600,
                                          marginBottom: '4px'
                                        }}>
                                          {approver.approverId.full_name}
                                        </div>
                                        <div style={{
                                          fontSize: '11px',
                                          color: '#6b7280',
                                          background: '#f3f4f6',
                                          padding: '2px 8px',
                                          borderRadius: '4px',
                                          display: 'inline-block'
                                        }}>
                                          {approver.approverId.role === 'Admin' ? 'Quản trị viên' : 
                                           approver.approverId.role === 'Manager' ? 'Quản lý' : 'Nhân viên'}
                                        </div>
                                        {approver.approverId.email && (
                                          <div style={{
                                            fontSize: '11px',
                                            color: '#9ca3af',
                                            marginTop: '4px'
                                          }}>
                                            {approver.approverId.email}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }
                                  return <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Chưa duyệt</span>;
                                })()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{
                          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          color: 'white',
                          fontWeight: 700
                        }}>
                          <td colSpan="2" style={{ padding: '14px', textAlign: 'right', fontSize: '15px' }}>
                            TỔNG CỘNG:
                          </td>
                          <td style={{ padding: '14px', textAlign: 'center', fontSize: '17px' }}>
                            {otRequests.reduce((sum, req) => sum + (parseFloat(req.hour) || 0), 0).toFixed(1)}h
                          </td>
                          <td colSpan="2" style={{ padding: '14px', fontSize: '13px', fontWeight: 500 }}>
                            {otRequests.length} đơn đã duyệt
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              ) : (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: '#9ca3af',
                  background: '#f9fafb',
                  borderRadius: '12px',
                  border: '2px dashed #e5e7eb'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                  <p style={{ fontSize: '16px', margin: 0 }}>
                    Không có đơn tăng ca nào được duyệt trong tháng này
                  </p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowOTDetailModal(false)}
              >
                Đóng
              </button>
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
