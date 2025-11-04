import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Clock,
  DollarSign,
  FileText,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  LogIn,
  LogOut,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getTodayStatus } from "../../../service/AttendanceService";
import PayrollService from "../../../service/PayrollService";
import { getMyRequests } from "../../../service/RequestService";
import "../css/EmployeeDashboard.css";

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [latestPayroll, setLatestPayroll] = useState(null);
  const [requestStats, setRequestStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch attendance today
      try {
        const attendanceRes = await getTodayStatus();
        setTodayAttendance(attendanceRes.data);
      } catch (err) {
        console.error("Error fetching attendance:", err);
        setTodayAttendance(null);
      }

      // Fetch latest payroll (current month)
      try {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        const payrollRes = await PayrollService.getMyPayrolls({
          month: currentMonth,
          year: currentYear,
          limit: 1,
        });
        setLatestPayroll(payrollRes.data?.[0] || null);
      } catch (err) {
        console.error("Error fetching payroll:", err);
        setLatestPayroll(null);
      }

      // Fetch request stats
      try {
        const requestRes = await getMyRequests({ limit: 100 });
        const requests = Array.isArray(requestRes.data) ? requestRes.data : [];
        setRequestStats({
          pending: requests.filter((r) => r.status === "Pending").length,
          approved: requests.filter((r) => r.status === "Approved").length,
          rejected: requests.filter((r) => r.status === "Rejected").length,
        });
      } catch (err) {
        console.error("Error fetching requests:", err);
        setRequestStats({ pending: 0, approved: 0, rejected: 0 });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Không thể tải một số dữ liệu dashboard");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatTime = (date) => {
    if (!date) return "--:--";
    return new Date(date).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAttendanceStatus = () => {
    if (!todayAttendance) return { icon: XCircle, label: "Chưa chấm công", color: "gray" };
    if (todayAttendance.clockOut) return { icon: CheckCircle, label: "Đã check-out", color: "green" };
    if (todayAttendance.clockIn) return { icon: Clock, label: "Đang làm việc", color: "blue" };
    return { icon: AlertCircle, label: "Chưa check-in", color: "orange" };
  };

  if (loading) {
    return (
      <div className="employee-dashboard-wrapper">
        <div className="emp-dash-loading">
          <div className="emp-dash-spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  const attendanceStatus = getAttendanceStatus();
  const StatusIcon = attendanceStatus.icon;

  return (
    <div className="employee-dashboard-wrapper">
      <div className="emp-dash-container">
        {/* Header */}
        <div className="emp-dash-header">
          <div className="emp-dash-header-content">
            <h1>👋 Xin chào!</h1>
            <p>Chúc bạn một ngày làm việc hiệu quả</p>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="emp-dash-stats-grid">
          {/* Attendance Card */}
          <div className={`emp-dash-stat-card attendance-${attendanceStatus.color}`}>
            <div className="emp-dash-stat-icon">
              <StatusIcon size={24} />
            </div>
            <div className="emp-dash-stat-content">
              <div className="emp-dash-stat-label">Chấm công hôm nay</div>
              <div className="emp-dash-stat-value">{attendanceStatus.label}</div>
              {todayAttendance?.clockIn && (
                <div className="emp-dash-stat-detail">
                  Vào: {formatTime(todayAttendance.clockIn)}
                  {todayAttendance.clockOut && ` • Ra: ${formatTime(todayAttendance.clockOut)}`}
                </div>
              )}
            </div>
          </div>

          {/* Salary Card */}
          <div className="emp-dash-stat-card salary">
            <div className="emp-dash-stat-icon">
              <DollarSign size={24} />
            </div>
            <div className="emp-dash-stat-content">
              <div className="emp-dash-stat-label">Lương tháng này</div>
              <div className="emp-dash-stat-value">
                {latestPayroll
                  ? formatCurrency(latestPayroll.netSalary)
                  : "Chưa có dữ liệu"}
              </div>
              {latestPayroll && (
                <div className="emp-dash-stat-detail">
                  Trạng thái: {latestPayroll.status}
                </div>
              )}
            </div>
          </div>

          {/* Requests Card */}
          <div className="emp-dash-stat-card requests">
            <div className="emp-dash-stat-icon">
              <FileText size={24} />
            </div>
            <div className="emp-dash-stat-content">
              <div className="emp-dash-stat-label">Đơn từ</div>
              <div className="emp-dash-stat-value">{requestStats.pending} đang chờ</div>
              <div className="emp-dash-stat-detail">
                {requestStats.approved} đã duyệt • {requestStats.rejected} từ chối
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="emp-dash-section">
          <h2 className="emp-dash-section-title">Thao tác nhanh</h2>
          <div className="emp-dash-quick-actions">
            <button
              className="emp-dash-action-btn checkin"
              onClick={() => navigate("/employee/attendance")}
            >
              <LogIn size={20} />
              <span>Chấm công</span>
            </button>
            <button
              className="emp-dash-action-btn request"
              onClick={() => navigate("/employee/requests")}
            >
              <FileText size={20} />
              <span>Tạo đơn từ</span>
            </button>
            <button
              className="emp-dash-action-btn profile"
              onClick={() => navigate("/my-profile")}
            >
              <User size={20} />
              <span>Hồ sơ</span>
            </button>
          </div>
        </div>

        {/* Monthly Summary */}
        {latestPayroll && (
          <div className="emp-dash-section">
            <h2 className="emp-dash-section-title">📊 Tổng kết tháng này</h2>
            <div className="emp-dash-summary-grid">
              <div className="emp-dash-summary-item">
                <div className="emp-dash-summary-label">Ngày làm việc</div>
                <div className="emp-dash-summary-value">
                  {latestPayroll.workingDays}/{latestPayroll.standardWorkingDays}
                </div>
              </div>
              <div className="emp-dash-summary-item">
                <div className="emp-dash-summary-label">Giờ làm việc</div>
                <div className="emp-dash-summary-value">
                  {(latestPayroll.workingDays * 8).toFixed(1)}h
                </div>
              </div>
              <div className="emp-dash-summary-item">
                <div className="emp-dash-summary-label">Tăng ca</div>
                <div className="emp-dash-summary-value positive">
                  {formatCurrency(latestPayroll.overtimeAmount)}
                </div>
              </div>
              <div className="emp-dash-summary-item">
                <div className="emp-dash-summary-label">Khấu trừ</div>
                <div className="emp-dash-summary-value negative">
                  {formatCurrency(
                    latestPayroll.deductions.reduce((sum, d) => sum + d.amount, 0)
                  )}
                </div>
              </div>
              <div className="emp-dash-summary-item">
                <div className="emp-dash-summary-label">Thực lĩnh</div>
                <div className="emp-dash-summary-value highlight">
                  {formatCurrency(latestPayroll.netSalary)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Today Attendance Detail */}
        {todayAttendance && (
          <div className="emp-dash-section">
            <h2 className="emp-dash-section-title">⏰ Chấm công hôm nay</h2>
            <div className="emp-dash-attendance-card">
              <div className="emp-dash-attendance-timeline">
                <div className="emp-dash-timeline-item">
                  <div className={`emp-dash-timeline-dot ${todayAttendance.clockIn ? 'completed' : 'pending'}`}>
                    <LogIn size={16} />
                  </div>
                  <div className="emp-dash-timeline-content">
                    <div className="emp-dash-timeline-label">Check-in</div>
                    <div className="emp-dash-timeline-time">
                      {formatTime(todayAttendance.clockIn)}
                    </div>
                    {todayAttendance.isLate && (
                      <div className="emp-dash-late-badge">
                        Muộn {todayAttendance.lateMinutes} phút
                      </div>
                    )}
                  </div>
                </div>

                <div className="emp-dash-timeline-item">
                  <div className={`emp-dash-timeline-dot ${todayAttendance.clockOut ? 'completed' : 'pending'}`}>
                    <LogOut size={16} />
                  </div>
                  <div className="emp-dash-timeline-content">
                    <div className="emp-dash-timeline-label">Check-out</div>
                    <div className="emp-dash-timeline-time">
                      {formatTime(todayAttendance.clockOut)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="emp-dash-attendance-summary">
                <div className="emp-dash-attendance-item">
                  <Clock size={18} />
                  <div>
                    <div className="emp-dash-attendance-item-label">Giờ làm việc</div>
                    <div className="emp-dash-attendance-item-value">
                      {todayAttendance.workHours || 0}h
                    </div>
                  </div>
                </div>
                <div className="emp-dash-attendance-item">
                  <TrendingUp size={18} />
                  <div>
                    <div className="emp-dash-attendance-item-label">Tăng ca</div>
                    <div className="emp-dash-attendance-item-value">
                      {todayAttendance.overtimeHours || 0}h
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;
