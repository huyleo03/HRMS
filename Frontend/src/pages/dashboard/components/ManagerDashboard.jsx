import React, { useState, useEffect } from 'react';
import DashboardService from '../../../service/DashboardService';
import RequestsAnalysis from './RequestsAnalysis';
import AttendanceTrendChart from './AttendanceTrendChart';
import LateEmployeesTable from './LateEmployeesTable';
import RecentRequestsTable from './RecentRequestsTable';
import '../css/ManagerDashboard.css';

const ManagerDashboard = () => {
    const [stats, setStats] = useState(null);
    const [requestsDetails, setRequestsDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Fetch manager-specific data
            const [overviewData, requestsData] = await Promise.all([
                DashboardService.getManagerOverview(),
                DashboardService.getManagerRequestsDetails()
            ]);
            
            setStats(overviewData);
            setRequestsDetails(requestsData);
        } catch (err) {
            console.error('Error fetching manager dashboard stats:', err);
            setError(err.response?.data?.message || 'Không thể tải dữ liệu thống kê');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardStats();
        
        // Auto-refresh every 5 minutes
        const interval = setInterval(fetchDashboardStats, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="manager-dashboard">
                <div className="dashboard-loading">
                    <div className="loading-spinner"></div>
                    <p>Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="manager-dashboard">
                <div className="dashboard-error">
                    <p className="error-message">{error}</p>
                    <button className="retry-button" onClick={fetchDashboardStats}>
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    const { departmentInfo, employees, attendance, requests, payroll } = stats || {};

    return (
        <div className="manager-dashboard">
            {/* Header */}
            <div className="dashboard-header">
                <h1>Dashboard Quản Lý - {departmentInfo?.departmentName || 'Phòng Ban'}</h1>
                <p>Tổng quan phòng ban của bạn</p>
            </div>

            {/* Main Stats Cards */}
            <div className="manager-stats-grid">
                {/* Total Employees in Department */}
                <div className="manager-stat-card">
                    <div className="manager-stat-card-header">
                        <span className="manager-stat-card-title">Nhân Viên Phòng Ban</span>
                        <div className="manager-stat-card-icon blue">
                            👥
                        </div>
                    </div>
                    <div className="manager-stat-card-value">{employees?.total || 0}</div>
                    <div className="manager-stat-card-details">
                        <div className="manager-stat-detail-row">
                            <span className="manager-stat-detail-label">Đang làm việc</span>
                            <span className="manager-stat-detail-value positive">{employees?.active || 0}</span>
                        </div>
                        <div className="manager-stat-detail-row">
                            <span className="manager-stat-detail-label">Không hoạt động</span>
                            <span className="manager-stat-detail-value">{employees?.inactive || 0}</span>
                        </div>
                        <div className="manager-stat-detail-row">
                            <span className="manager-stat-detail-label">Mới tháng này</span>
                            <span className="manager-stat-detail-value positive">+{employees?.newThisMonth || 0}</span>
                        </div>
                    </div>
                </div>

                {/* Attendance Today */}
                <div className="manager-stat-card">
                    <div className="manager-stat-card-header">
                        <span className="manager-stat-card-title">Chấm Công Hôm Nay</span>
                        <div className="manager-stat-card-icon green">
                            ✓
                        </div>
                    </div>
                    <div className="manager-stat-card-value">{attendance?.todayPresent || 0}</div>
                    <div className="manager-stat-card-details">
                        <div className="manager-stat-detail-row">
                            <span className="manager-stat-detail-label">Đi muộn</span>
                            <span className="manager-stat-detail-value">{attendance?.todayLate || 0}</span>
                        </div>
                        <div className="manager-stat-detail-row">
                            <span className="manager-stat-detail-label">Vắng mặt</span>
                            <span className="manager-stat-detail-value negative">{attendance?.todayAbsent || 0}</span>
                        </div>
                        <div className="manager-stat-detail-row">
                            <span className="manager-stat-detail-label">Nghỉ phép</span>
                            <span className="manager-stat-detail-value">{attendance?.todayOnLeave || 0}</span>
                        </div>
                        <div className="manager-stat-detail-row">
                            <span className="manager-stat-detail-label">Tỷ lệ đúng giờ</span>
                            <span className="manager-stat-detail-value positive">{attendance?.punctualityRate || 0}%</span>
                        </div>
                    </div>
                </div>

                {/* Pending Requests */}
                <div className="manager-stat-card">
                    <div className="manager-stat-card-header">
                        <span className="manager-stat-card-title">Đơn Từ Chờ Duyệt</span>
                        <div className="manager-stat-card-icon yellow">
                            ⏱
                        </div>
                    </div>
                    <div className="manager-stat-card-value">{requests?.totalPending || 0}</div>
                    <div className="manager-stat-card-details">
                        <div className="manager-stat-detail-row">
                            <span className="manager-stat-detail-label">Đã duyệt</span>
                            <span className="manager-stat-detail-value positive">{requests?.totalApproved || 0}</span>
                        </div>
                        <div className="manager-stat-detail-row">
                            <span className="manager-stat-detail-label">Từ chối</span>
                            <span className="manager-stat-detail-value negative">{requests?.totalRejected || 0}</span>
                        </div>
                        <div className="manager-stat-detail-row">
                            <span className="manager-stat-detail-label">Tỷ lệ duyệt</span>
                            <span className="manager-stat-detail-value">{requests?.approvalRate || 0}%</span>
                        </div>
                        <div className="manager-stat-detail-row">
                            <span className="manager-stat-detail-label">Thời gian xử lý TB</span>
                            <span className="manager-stat-detail-value">{requests?.avgProcessingTime || 0}h</span>
                        </div>
                    </div>
                </div>

                {/* Payroll This Month */}
                <div className="manager-stat-card">
                    <div className="manager-stat-card-header">
                        <span className="manager-stat-card-title">Lương Tháng Này</span>
                        <div className="manager-stat-card-icon purple">
                            💰
                        </div>
                    </div>
                    <div className="manager-stat-card-value">
                        {payroll?.totalThisMonth?.toLocaleString('vi-VN') || 0} đ
                    </div>
                    <div className="manager-stat-card-details">
                        <div className="manager-stat-detail-row">
                            <span className="manager-stat-detail-label">Chi phí OT</span>
                            <span className="manager-stat-detail-value">
                                {payroll?.overtimeCost?.toLocaleString('vi-VN') || 0} đ
                            </span>
                        </div>
                        <div className="manager-stat-detail-row">
                            <span className="manager-stat-detail-label">So với tháng trước</span>
                            <span className={`manager-stat-detail-value ${payroll?.comparedToLastMonth >= 0 ? 'positive' : 'negative'}`}>
                                {payroll?.comparedToLastMonth >= 0 ? '+' : ''}{payroll?.comparedToLastMonth || 0}%
                            </span>
                        </div>
                        <div className="manager-stat-detail-row">
                            <span className="manager-stat-detail-label">Chờ thanh toán</span>
                            <span className="manager-stat-detail-value">{payroll?.pendingPayrolls || 0}</span>
                        </div>
                        <div className="manager-stat-detail-row">
                            <span className="manager-stat-detail-label">Đã thanh toán</span>
                            <span className="manager-stat-detail-value positive">{payroll?.paidPayrolls || 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Secondary Stats Section */}
            <div className="manager-dashboard-sections">
                {/* Attendance Details */}
                <div className="manager-section-card">
                    <h3 className="manager-section-card-title">
                        📊 Thống Kê Chấm Công Phòng Ban
                    </h3>
                    <div className="manager-section-stats">
                        <div className="manager-section-stat-item">
                            <div className="manager-section-stat-label">Trung bình giờ làm/nhân viên</div>
                            <div className="manager-section-stat-value">
                                {attendance?.avgWorkHoursPerEmployee || 0}h
                            </div>
                        </div>
                        <div className="manager-section-stat-item">
                            <div className="manager-section-stat-label">Tỷ lệ đúng giờ</div>
                            <div className="manager-section-stat-value">
                                {attendance?.punctualityRate || 0}%
                            </div>
                        </div>
                        <div className="manager-section-stat-item">
                            <div className="manager-section-stat-label">Có mặt hôm nay</div>
                            <div className="manager-section-stat-value">
                                {attendance?.todayPresent || 0}
                            </div>
                        </div>
                        <div className="manager-section-stat-item">
                            <div className="manager-section-stat-label">Vắng mặt hôm nay</div>
                            <div className="manager-section-stat-value">
                                {attendance?.todayAbsent || 0}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Team Performance Summary */}
                <div className="manager-section-card">
                    <h3 className="manager-section-card-title">
                        📈 Hiệu Suất Đội Ngũ
                    </h3>
                    <div className="manager-section-stats">
                        <div className="manager-section-stat-item">
                            <div className="manager-section-stat-label">Tổng số nhân viên</div>
                            <div className="manager-section-stat-value">
                                {employees?.total || 0}
                            </div>
                        </div>
                        <div className="manager-section-stat-item">
                            <div className="manager-section-stat-label">Đơn chờ xử lý</div>
                            <div className="manager-section-stat-value">
                                {requests?.totalPending || 0}
                            </div>
                        </div>
                        <div className="manager-section-stat-item">
                            <div className="manager-section-stat-label">Tỷ lệ chấm công</div>
                            <div className="manager-section-stat-value">
                                {employees?.total > 0 
                                    ? Math.round((attendance?.todayPresent || 0) / employees.total * 100) 
                                    : 0}%
                            </div>
                        </div>
                        <div className="manager-section-stat-item">
                            <div className="manager-section-stat-label">Nhân viên mới</div>
                            <div className="manager-section-stat-value">
                                {employees?.newThisMonth || 0}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Requests Analysis Section */}
            {requestsDetails && <RequestsAnalysis data={requestsDetails} />}

            {/* Attendance Trend Chart */}
            <AttendanceTrendChart isManager={true} />

            {/* Late Employees Table */}
            <div className="manager-dashboard-sections">
                <LateEmployeesTable isManager={true} />
            </div>

            {/* Recent Requests */}
            {requestsDetails?.recentRequests && (
                <RecentRequestsTable requests={requestsDetails.recentRequests} />
            )}
        </div>
    );
};

export default ManagerDashboard;
