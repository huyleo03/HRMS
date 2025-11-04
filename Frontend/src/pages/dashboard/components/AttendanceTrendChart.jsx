import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import DashboardService from '../../../service/DashboardService';
import '../css/AttendanceTrendChart.css';

const AttendanceTrendChart = () => {
    const [trendData, setTrendData] = useState(null);
    const [period, setPeriod] = useState('week'); // 'week' or 'month'
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTrendData = async (selectedPeriod) => {
        try {
            setLoading(true);
            setError(null);
            const data = await DashboardService.getAttendanceTrend(selectedPeriod);
            setTrendData(data);
        } catch (err) {
            console.error('Error fetching attendance trend:', err);
            setError('Không thể tải dữ liệu xu hướng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrendData(period);
    }, [period]);

    const handlePeriodChange = (newPeriod) => {
        setPeriod(newPeriod);
    };

    const formatDate = (dateString) => {
        if (period === 'month') {
            const [year, month] = dateString.split('-');
            return `${month}/${year}`;
        }
        const [, month, day] = dateString.split('-');
        return `${day}/${month}`;
    };

    if (loading) {
        return (
            <div className="attendance-trend-container">
                <div className="chart-loading">
                    <div className="loading-spinner"></div>
                    <p>Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="attendance-trend-container">
                <div className="chart-error">
                    <p>{error}</p>
                    <button onClick={() => fetchTrendData(period)}>Thử lại</button>
                </div>
            </div>
        );
    }

    return (
        <div className="attendance-trend-container">
            <div className="chart-header">
                <h2>📈 Xu Hướng Chấm Công</h2>
                <div className="period-selector">
                    <button
                        className={`period-btn ${period === 'week' ? 'active' : ''}`}
                        onClick={() => handlePeriodChange('week')}
                    >
                        7 Ngày
                    </button>
                    <button
                        className={`period-btn ${period === 'month' ? 'active' : ''}`}
                        onClick={() => handlePeriodChange('month')}
                    >
                        6 Tháng
                    </button>
                </div>
            </div>

            <div className="chart-content">
                {trendData?.data && trendData.data.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart
                            data={trendData.data}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={formatDate}
                                stroke="#64748b"
                                style={{ fontSize: '12px' }}
                            />
                            <YAxis
                                stroke="#64748b"
                                style={{ fontSize: '12px' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    padding: '12px'
                                }}
                                labelFormatter={(label) => `Ngày: ${formatDate(label)}`}
                            />
                            <Legend
                                wrapperStyle={{
                                    paddingTop: '20px'
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="present"
                                stroke="#10b981"
                                strokeWidth={2}
                                name="Có mặt"
                                dot={{ fill: '#10b981', r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="late"
                                stroke="#f59e0b"
                                strokeWidth={2}
                                name="Đi muộn"
                                dot={{ fill: '#f59e0b', r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="absent"
                                stroke="#ef4444"
                                strokeWidth={2}
                                name="Vắng mặt"
                                dot={{ fill: '#ef4444', r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="onLeave"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                                name="Nghỉ phép"
                                dot={{ fill: '#8b5cf6', r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="no-chart-data">
                        <p>Không có dữ liệu để hiển thị</p>
                    </div>
                )}
            </div>

            {/* Summary Stats */}
            {trendData?.data && trendData.data.length > 0 && (
                <div className="trend-summary">
                    <div className="summary-item">
                        <span className="summary-label">Trung bình có mặt:</span>
                        <span className="summary-value present">
                            {(trendData.data.reduce((sum, d) => sum + d.present, 0) / trendData.data.length).toFixed(0)}
                        </span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Trung bình đi muộn:</span>
                        <span className="summary-value late">
                            {(trendData.data.reduce((sum, d) => sum + d.late, 0) / trendData.data.length).toFixed(0)}
                        </span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Trung bình vắng mặt:</span>
                        <span className="summary-value absent">
                            {(trendData.data.reduce((sum, d) => sum + d.absent, 0) / trendData.data.length).toFixed(0)}
                        </span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Tỷ lệ có mặt TB:</span>
                        <span className="summary-value rate">
                            {(trendData.data.reduce((sum, d) => sum + (d.presentRate || 0), 0) / trendData.data.length).toFixed(1)}%
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceTrendChart;
