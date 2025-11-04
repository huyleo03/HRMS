import React, { useState, useEffect } from 'react';
import DashboardService from '../../../service/DashboardService';
import '../css/DepartmentComparison.css';

const DepartmentComparison = () => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortBy, setSortBy] = useState('employeeCount'); // employeeCount, attendanceRate, requestCount, totalPayroll

    const fetchDepartments = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await DashboardService.getDepartmentComparison();
            setDepartments(data.departments || []);
        } catch (err) {
            console.error('Error fetching department comparison:', err);
            setError('Không thể tải dữ liệu phòng ban');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    const handleSort = (field) => {
        setSortBy(field);
        const sorted = [...departments].sort((a, b) => b[field] - a[field]);
        setDepartments(sorted);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="department-comparison-container">
                <h3 className="section-title">🏢 So Sánh Phòng Ban</h3>
                <div className="dept-loading">Đang tải...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="department-comparison-container">
                <h3 className="section-title">🏢 So Sánh Phòng Ban</h3>
                <div className="dept-error">
                    <p>{error}</p>
                    <button onClick={fetchDepartments}>Thử lại</button>
                </div>
            </div>
        );
    }

    return (
        <div className="department-comparison-container">
            <div className="dept-header">
                <h3 className="section-title">🏢 So Sánh Phòng Ban</h3>
                <div className="sort-buttons">
                    <button
                        className={`sort-btn ${sortBy === 'employeeCount' ? 'active' : ''}`}
                        onClick={() => handleSort('employeeCount')}
                        title="Sắp xếp theo số nhân viên"
                    >
                        👥
                    </button>
                    <button
                        className={`sort-btn ${sortBy === 'attendanceRate' ? 'active' : ''}`}
                        onClick={() => handleSort('attendanceRate')}
                        title="Sắp xếp theo tỷ lệ chấm công"
                    >
                        ✓
                    </button>
                    <button
                        className={`sort-btn ${sortBy === 'requestCount' ? 'active' : ''}`}
                        onClick={() => handleSort('requestCount')}
                        title="Sắp xếp theo số đơn"
                    >
                        📄
                    </button>
                    <button
                        className={`sort-btn ${sortBy === 'totalPayroll' ? 'active' : ''}`}
                        onClick={() => handleSort('totalPayroll')}
                        title="Sắp xếp theo lương"
                    >
                        💰
                    </button>
                </div>
            </div>

            {departments.length > 0 ? (
                <div className="dept-table-container">
                    <table className="dept-table">
                        <thead>
                            <tr>
                                <th>Phòng Ban</th>
                                <th>Nhân Viên</th>
                                <th>Chấm Công</th>
                                <th>Giờ TB</th>
                                <th>Đơn Từ</th>
                                <th>Lương</th>
                                <th>OT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {departments.map((dept, index) => (
                                <tr key={dept.departmentId} className={index < 3 ? 'top-dept' : ''}>
                                    <td className="dept-name">
                                        {index < 3 && <span className="rank-badge">#{index + 1}</span>}
                                        {dept.departmentName}
                                    </td>
                                    <td className="dept-employees">{dept.employeeCount}</td>
                                    <td>
                                        <div className="attendance-cell">
                                            <span className={`rate ${dept.attendanceRate >= 95 ? 'excellent' : dept.attendanceRate >= 90 ? 'good' : 'normal'}`}>
                                                {dept.attendanceRate.toFixed(1)}%
                                            </span>
                                            <div className="progress-bar">
                                                <div 
                                                    className="progress-fill"
                                                    style={{ width: `${dept.attendanceRate}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="dept-hours">{dept.avgWorkHours.toFixed(1)}h</td>
                                    <td className="dept-requests">{dept.requestCount}</td>
                                    <td className="dept-payroll">{formatCurrency(dept.totalPayroll)}</td>
                                    <td className="dept-overtime">{formatCurrency(dept.totalOvertime)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="no-data">Không có dữ liệu phòng ban</div>
            )}
        </div>
    );
};

export default DepartmentComparison;
