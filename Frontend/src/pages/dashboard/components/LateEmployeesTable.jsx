import React, { useState, useEffect } from 'react';
import DashboardService from '../../../service/DashboardService';
import '../css/LateEmployeesTable.css';

const LateEmployeesTable = ({ isManager = false }) => {
    const [lateData, setLateData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchLateEmployees = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = isManager 
                ? await DashboardService.getManagerLateEmployeesToday()
                : await DashboardService.getLateEmployeesToday();
            setLateData(data);
        } catch (err) {
            console.error('Error fetching late employees:', err);
            setError('Không thể tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLateEmployees();
        
        // Refresh every 2 minutes (late employees change frequently)
        const interval = setInterval(fetchLateEmployees, 2 * 60 * 1000);
        return () => clearInterval(interval);
    }, [isManager]); // Add isManager to dependency array

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div className="late-employees-container">
                <h3 className="section-title">⏰ Nhân Viên Đi Muộn Hôm Nay</h3>
                <div className="late-loading">Đang tải...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="late-employees-container">
                <h3 className="section-title">⏰ Nhân Viên Đi Muộn Hôm Nay</h3>
                <div className="late-error">
                    <p>{error}</p>
                    <button onClick={fetchLateEmployees}>Thử lại</button>
                </div>
            </div>
        );
    }

    return (
        <div className="late-employees-container">
            <div className="late-header">
                <h3 className="section-title">⏰ Nhân Viên Đi Muộn Hôm Nay{isManager ? ' (Phòng Ban)' : ''}</h3>
                {lateData && lateData.total > 0 && (
                    <div className="late-badge-group">
                        <span className="late-badge total">{lateData.total} người</span>
                        {lateData.severe > 0 && (
                            <span className="late-badge severe">{lateData.severe} nghiêm trọng</span>
                        )}
                    </div>
                )}
            </div>

            {lateData && lateData.employees && lateData.employees.length > 0 ? (
                <div className="late-list">
                    {lateData.employees.map((employee) => (
                        <div 
                            key={employee.employeeId} 
                            className={`late-item ${employee.isSevere ? 'severe' : ''}`}
                        >
                            <div className="employee-avatar">
                                {employee.avatar ? (
                                    <img src={employee.avatar} alt={employee.employeeName} />
                                ) : (
                                    <div className="avatar-placeholder">
                                        {employee.employeeName?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            
                            <div className="employee-info">
                                <div className="employee-name">{employee.employeeName}</div>
                                {!isManager && employee.department && (
                                    <div className="employee-department">{employee.department}</div>
                                )}
                            </div>

                            <div className="late-details">
                                <div className="clock-in-time">
                                    <span className="time-icon">🕐</span>
                                    {formatTime(employee.clockInTime)}
                                </div>
                                <div className={`late-minutes ${employee.isSevere ? 'severe' : ''}`}>
                                    +{employee.lateMinutes} phút
                                </div>
                            </div>

                            {employee.isSevere && (
                                <div className="severe-indicator">
                                    <span title="Đi muộn quá 30 phút">⚠️</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="no-late-employees">
                    <div className="success-icon">✓</div>
                    <p>Tuyệt vời! Không có nhân viên nào đi muộn hôm nay</p>
                </div>
            )}
        </div>
    );
};

export default LateEmployeesTable;
