import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import '../css/RequestsAnalysis.css';

const RequestsAnalysis = ({ data }) => {
    const { byType, byPriority, monthComparison, byDepartment } = data;

    // Prepare data for pie chart
    const typeData = Object.entries(byType || {}).map(([type, count]) => ({
        name: getTypeLabel(type),
        value: count
    }));

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];

    const priorityColors = {
        Low: '#10b981',
        Medium: '#f59e0b',
        High: '#f97316',
        Urgent: '#ef4444'
    };

    function getTypeLabel(type) {
        const labels = {
            Leave: 'Nghỉ phép',
            Overtime: 'Tăng ca',
            RemoteWork: 'Làm từ xa',
            BusinessTrip: 'Công tác',
            Resignation: 'Nghỉ việc',
            Equipment: 'Thiết bị',
            ITSupport: 'Hỗ trợ IT',
            HRDocument: 'Tài liệu HR',
            Expense: 'Chi phí',
            Other: 'Khác'
        };
        return labels[type] || type;
    }

    const getChangeIcon = (value) => {
        if (value > 0) return '↑';
        if (value < 0) return '↓';
        return '→';
    };

    const getChangeClass = (value) => {
        if (value > 0) return 'positive';
        if (value < 0) return 'negative';
        return 'neutral';
    };

    return (
        <div className="requests-analysis-container">
            <div className="analysis-header">
                <h2>📊 Phân Tích Đơn Từ</h2>
            </div>

            <div className="analysis-grid">
                {/* Requests by Type - Pie Chart */}
                <div className="analysis-card chart-card">
                    <h3 className="card-title">Phân Loại Đơn</h3>
                    {typeData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={typeData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {typeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="no-data">Không có dữ liệu</div>
                    )}
                </div>

                {/* Requests by Priority - Badges */}
                <div className="analysis-card">
                    <h3 className="card-title">Theo Mức Độ Ưu Tiên</h3>
                    <div className="priority-grid">
                        {Object.entries(byPriority || {}).map(([priority, count]) => (
                            <div key={priority} className="priority-item">
                                <span 
                                    className="priority-badge" 
                                    style={{ backgroundColor: priorityColors[priority] }}
                                >
                                    {priority}
                                </span>
                                <span className="priority-count">{count}</span>
                            </div>
                        ))}
                    </div>
                    {Object.keys(byPriority || {}).length === 0 && (
                        <div className="no-data">Không có dữ liệu</div>
                    )}
                </div>

                {/* Month Comparison */}
                <div className="analysis-card">
                    <h3 className="card-title">So Sánh Tháng</h3>
                    <div className="comparison-grid">
                        <div className="comparison-row">
                            <span className="comparison-label">Tổng đơn:</span>
                            <span className="comparison-value">
                                {monthComparison?.thisMonth?.total || 0}
                                <span className={`change ${getChangeClass(monthComparison?.change?.total)}`}>
                                    {getChangeIcon(monthComparison?.change?.total)} {Math.abs(monthComparison?.change?.total || 0)}%
                                </span>
                            </span>
                        </div>
                        <div className="comparison-row">
                            <span className="comparison-label">Đã duyệt:</span>
                            <span className="comparison-value">
                                {monthComparison?.thisMonth?.approved || 0}
                                <span className={`change ${getChangeClass(monthComparison?.change?.approved)}`}>
                                    {getChangeIcon(monthComparison?.change?.approved)} {Math.abs(monthComparison?.change?.approved || 0)}%
                                </span>
                            </span>
                        </div>
                        <div className="comparison-row">
                            <span className="comparison-label">Từ chối:</span>
                            <span className="comparison-value">
                                {monthComparison?.thisMonth?.rejected || 0}
                                <span className={`change ${getChangeClass(monthComparison?.change?.rejected)}`}>
                                    {getChangeIcon(monthComparison?.change?.rejected)} {Math.abs(monthComparison?.change?.rejected || 0)}%
                                </span>
                            </span>
                        </div>
                        <div className="comparison-row">
                            <span className="comparison-label">Chờ duyệt:</span>
                            <span className="comparison-value">
                                {monthComparison?.thisMonth?.pending || 0}
                                <span className={`change ${getChangeClass(monthComparison?.change?.pending)}`}>
                                    {getChangeIcon(monthComparison?.change?.pending)} {Math.abs(monthComparison?.change?.pending || 0)}%
                                </span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Top Departments */}
                <div className="analysis-card">
                    <h3 className="card-title">Top Phòng Ban</h3>
                    <div className="department-list">
                        {(byDepartment || []).slice(0, 5).map((dept, index) => (
                            <div key={dept.departmentId} className="department-item">
                                <span className="department-rank">#{index + 1}</span>
                                <div className="department-info">
                                    <span className="department-name">{dept.departmentName}</span>
                                    <div className="department-stats">
                                        <span className="dept-stat">Tổng: {dept.total}</span>
                                        <span className="dept-stat pending">Chờ: {dept.pending}</span>
                                        <span className="dept-stat approved">Duyệt: {dept.approved}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(!byDepartment || byDepartment.length === 0) && (
                            <div className="no-data">Không có dữ liệu</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RequestsAnalysis;
