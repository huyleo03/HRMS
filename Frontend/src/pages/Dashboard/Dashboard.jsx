import React from 'react';

const Dashboard = () => {
    return (
        <div className="content-wrapper">
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: '24px',
                marginBottom: '24px'
                }}>
                    {/* Stats Cards */}
                    <div style={{
                        background: '#ffffff',
                        padding: '24px',
                        borderRadius: '12px',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                        border: '1px solid #e2e8f0'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                background: '#f0f4ff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 12.25C13.748 12.25 15.3677 12.6028 16.5781 13.208C17.7436 13.7908 18.75 14.7345 18.75 16C18.75 17.2655 17.7436 18.2092 16.5781 18.792C15.3677 19.3972 13.748 19.75 12 19.75C10.252 19.75 8.63225 19.3972 7.42188 18.792C6.25641 18.2092 5.25 17.2655 5.25 16C5.25 14.7345 6.25641 13.7908 7.42188 13.208C8.63225 12.6028 10.252 12.25 12 12.25Z" fill="#7152F3"/>
                                </svg>
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#1e293b' }}>
                                    142
                                </h3>
                                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                                    Tổng nhân viên
                                </p>
                            </div>
                        </div>
                    </div>

                    <div style={{
                        background: '#ffffff',
                        padding: '24px',
                        borderRadius: '12px',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                        border: '1px solid #e2e8f0'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                background: '#f0fdf4',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M9 15L10.7528 16.4023C11.1707 16.7366 11.7777 16.6826 12.1301 16.2799L15 13" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round"/>
                                </svg>
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#1e293b' }}>
                                    98%
                                </h3>
                                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                                    Tỷ lệ có mặt
                                </p>
                            </div>
                        </div>
                    </div>

                    <div style={{
                        background: '#ffffff',
                        padding: '24px',
                        borderRadius: '12px',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                        border: '1px solid #e2e8f0'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                background: '#fefce8',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="#eab308" strokeWidth="1.5"/>
                                    <path d="M12 6.5V8" stroke="#eab308" strokeWidth="1.5"/>
                                    <path d="M12 16V17.5" stroke="#eab308" strokeWidth="1.5"/>
                                </svg>
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#1e293b' }}>
                                    12
                                </h3>
                                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                                    Đơn xin nghỉ
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Welcome Message */}
                <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '32px',
                    borderRadius: '16px',
                    color: 'white',
                    marginBottom: '24px'
                }}>
                    <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '600' }}>
                        Chào mừng đến với HRMS!
                    </h2>
                    <p style={{ margin: 0, fontSize: '16px', opacity: 0.9 }}>
                        Hệ thống quản lý nhân sự hiện đại và toàn diện cho doanh nghiệp của bạn.
                    </p>
                </div>

                {/* Quick Actions */}
                <div style={{
                    background: '#ffffff',
                    padding: '24px',
                    borderRadius: '12px',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e2e8f0'
                }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                        Thao tác nhanh
                    </h3>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button style={{
                            background: '#7152f3',
                            color: 'white',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease'
                        }}>
                            Thêm nhân viên mới
                        </button>
                        <button style={{
                            background: '#ffffff',
                            color: '#7152f3',
                            border: '1px solid #7152f3',
                            padding: '12px 24px',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}>
                            Xem báo cáo
                        </button>
                        <button style={{
                            background: '#ffffff',
                            color: '#7152f3',
                            border: '1px solid #7152f3',
                            padding: '12px 24px',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}>
                            Quản lý chấm công
                        </button>
                    </div>
                </div>
            </div>
    );
};

export default Dashboard;