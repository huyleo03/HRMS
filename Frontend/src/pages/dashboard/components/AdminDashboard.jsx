import React, { useState, useEffect } from 'react';
import DashboardService from '../../../service/DashboardService';
import RequestsAnalysis from './RequestsAnalysis';
import AttendanceTrendChart from './AttendanceTrendChart';
import RecentRequestsTable from './RecentRequestsTable';
import '../css/AdminDashboard.css';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [requestsDetails, setRequestsDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Fetch both overview and requests details in parallel
            const [overviewData, requestsData] = await Promise.all([
                DashboardService.getOverviewStats(),
                DashboardService.getRequestsDetails()
            ]);
            
            setStats(overviewData);
            setRequestsDetails(requestsData);
        } catch (err) {
            console.error('Error fetching dashboard stats:', err);
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
            <div className="admin-dashboard">
                <div className="dashboard-loading">
                    <div className="loading-spinner"></div>
                    <p>Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-dashboard">
                <div className="dashboard-error">
                    <p className="error-message">{error}</p>
                    <button className="retry-button" onClick={fetchDashboardStats}>
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    const { employees, attendance, requests, payroll, roles } = stats || {};

    return (
        <div className="admin-dashboard">
            {/* Header */}
            <div className="dashboard-header">
                <h1>Dashboard Quản Trị</h1>
                <p>Tổng quan hệ thống quản lý nhân sự</p>
            </div>

            {/* Main Stats Cards */}
            <div className="stats-grid-huyleo">
                {/* Total Employees */}
                <div className="stat-card-huyleo">
                    <div className="stat-card-huyleo-header">
                        <span className="stat-card-huyleo-title">Tổng Nhân Viên</span>
                        <div className="stat-card-huyleo-icon blue">
                            👥
                        </div>
                    </div>
                    <div className="stat-card-huyleo-value">{employees?.total || 0}</div>
                    <div className="stat-card-huyleo-details">
                        <div className="stat-detail-row">
                            <span className="stat-detail-label">Đang làm việc</span>
                            <span className="stat-detail-value positive">{employees?.active || 0}</span>
                        </div>
                        <div className="stat-detail-row">
                            <span className="stat-detail-label">Không hoạt động</span>
                            <span className="stat-detail-value">{employees?.inactive || 0}</span>
                        </div>
                        <div className="stat-detail-row">
                            <span className="stat-detail-label">Mới tháng này</span>
                            <span className="stat-detail-value positive">+{employees?.newThisMonth || 0}</span>
                        </div>
                    </div>
                </div>

                {/* Attendance Today */}
                <div className="stat-card-huyleo">
                    <div className="stat-card-huyleo-header">
                        <span className="stat-card-huyleo-title">Chấm Công Hôm Nay</span>
                        <div className="stat-card-huyleo-icon green">
                            ✓
                        </div>
                    </div>
                    <div className="stat-card-huyleo-value">{attendance?.todayPresent || 0}</div>
                    <div className="stat-card-huyleo-details">
                        <div className="stat-detail-row">
                            <span className="stat-detail-label">Đi muộn</span>
                            <span className="stat-detail-value">{attendance?.todayLate || 0}</span>
                        </div>
                        <div className="stat-detail-row">
                            <span className="stat-detail-label">Vắng mặt</span>
                            <span className="stat-detail-value negative">{attendance?.todayAbsent || 0}</span>
                        </div>
                        <div className="stat-detail-row">
                            <span className="stat-detail-label">Nghỉ phép</span>
                            <span className="stat-detail-value">{attendance?.todayOnLeave || 0}</span>
                        </div>
                        <div className="stat-detail-row">
                            <span className="stat-detail-label">Tỷ lệ đúng giờ</span>
                            <span className="stat-detail-value positive">{attendance?.punctualityRate || 0}%</span>
                        </div>
                    </div>
                </div>

                {/* Pending Requests */}
                <div className="stat-card-huyleo">
                    <div className="stat-card-huyleo-header">
                        <span className="stat-card-huyleo-title">Đơn Từ Chờ Duyệt</span>
                        <div className="stat-card-huyleo-icon yellow">
                            ⏱
                        </div>
                    </div>
                    <div className="stat-card-huyleo-value">{requests?.totalPending || 0}</div>
                    <div className="stat-card-huyleo-details">
                        <div className="stat-detail-row">
                            <span className="stat-detail-label">Đã duyệt</span>
                            <span className="stat-detail-value positive">{requests?.totalApproved || 0}</span>
                        </div>
                        <div className="stat-detail-row">
                            <span className="stat-detail-label">Từ chối</span>
                            <span className="stat-detail-value negative">{requests?.totalRejected || 0}</span>
                        </div>
                        <div className="stat-detail-row">
                            <span className="stat-detail-label">Tỷ lệ duyệt</span>
                            <span className="stat-detail-value">{requests?.approvalRate || 0}%</span>
                        </div>
                        <div className="stat-detail-row">
                            <span className="stat-detail-label">Thời gian xử lý TB</span>
                            <span className="stat-detail-value">{requests?.avgProcessingTime || 0}h</span>
                        </div>
                    </div>
                </div>

                {/* Payroll This Month */}
                <div className="stat-card-huyleo">
                    <div className="stat-card-huyleo-header">
                        <span className="stat-card-huyleo-title">Lương Tháng Này</span>
                        <div className="stat-card-huyleo-icon purple">
                            💰
                        </div>
                    </div>
                    <div className="stat-card-huyleo-value">
                        {payroll?.totalThisMonth?.toLocaleString('vi-VN') || 0} đ
                    </div>
                    <div className="stat-card-huyleo-details">
                        <div className="stat-detail-row">
                            <span className="stat-detail-label">Chi phí OT</span>
                            <span className="stat-detail-value">
                                {payroll?.overtimeCost?.toLocaleString('vi-VN') || 0} đ
                            </span>
                        </div>
                        <div className="stat-detail-row">
                            <span className="stat-detail-label">So với tháng trước</span>
                            <span className={`stat-detail-value ${payroll?.comparedToLastMonth >= 0 ? 'positive' : 'negative'}`}>
                                {payroll?.comparedToLastMonth >= 0 ? '+' : ''}{payroll?.comparedToLastMonth || 0}%
                            </span>
                        </div>
                        <div className="stat-detail-row">
                            <span className="stat-detail-label">Chờ thanh toán</span>
                            <span className="stat-detail-value">{payroll?.pendingPayrolls || 0}</span>
                        </div>
                        <div className="stat-detail-row">
                            <span className="stat-detail-label">Đã thanh toán</span>
                            <span className="stat-detail-value positive">{payroll?.paidPayrolls || 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Secondary Stats Sections */}
            <div className="dashboard-sections">
                {/* Attendance Details */}
                <div className="section-card">
                    <h3 className="section-card-title">
                        📊 Thống Kê Chấm Công
                    </h3>
                    <div className="section-stats">
                        <div className="section-stat-item">
                            <div className="section-stat-label">Trung bình giờ làm/nhân viên</div>
                            <div className="section-stat-value">
                                {attendance?.avgWorkHoursPerEmployee || 0}h
                            </div>
                        </div>
                        <div className="section-stat-item">
                            <div className="section-stat-label">Tỷ lệ đúng giờ</div>
                            <div className="section-stat-value">
                                {attendance?.punctualityRate || 0}%
                            </div>
                        </div>
                        <div className="section-stat-item">
                            <div className="section-stat-label">Có mặt hôm nay</div>
                            <div className="section-stat-value">
                                {attendance?.todayPresent || 0}
                            </div>
                        </div>
                        <div className="section-stat-item">
                            <div className="section-stat-label">Vắng mặt hôm nay</div>
                            <div className="section-stat-value">
                                {attendance?.todayAbsent || 0}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Roles Distribution */}
                <div className="section-card">
                    <h3 className="section-card-title">
                        👔 Phân Bổ Vai Trò
                    </h3>
                    <div className="section-stats">
                        <div className="section-stat-item">
                            <div className="section-stat-label">Quản trị viên</div>
                            <div className="section-stat-value">
                                {roles?.admin || 0}
                            </div>
                        </div>
                        <div className="section-stat-item">
                            <div className="section-stat-label">Quản lý</div>
                            <div className="section-stat-value">
                                {roles?.manager || 0}
                            </div>
                        </div>
                        <div className="section-stat-item">
                            <div className="section-stat-label">Nhân viên</div>
                            <div className="section-stat-value">
                                {roles?.employee || 0}
                            </div>
                        </div>
                        <div className="section-stat-item">
                            <div className="section-stat-label">Tổng cộng</div>
                            <div className="section-stat-value">
                                {(roles?.admin || 0) + (roles?.manager || 0) + (roles?.employee || 0)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Requests Analysis Section */}
            {requestsDetails && <RequestsAnalysis data={requestsDetails} />}

            {/* Attendance Trend Chart */}
            <AttendanceTrendChart />

            {/* Recent Requests */}
            {requestsDetails?.recentRequests && (
                <RecentRequestsTable requests={requestsDetails.recentRequests} />
            )}
        </div>
    );
};

export default AdminDashboard;