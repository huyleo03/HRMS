import React from 'react';
import "../css/ManagerDashboard.css";

const ManagerDashboard = () => {
  return (
    <div className="manager-dashboard">
      <div className="dashboard-header">
        <h1>Manager Dashboard</h1>
        <p>Welcome back! Here's your team overview</p>
      </div>

      <div className="dashboard-content">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#E3F2FD' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="#2196F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="#2196F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-info">
              <p className="stat-label">Total Employees</p>
              <h2 className="stat-value">--</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#E8F5E9' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7088 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.76489 14.1003 1.98232 16.07 2.86" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 4L12 14.01L9 11.01" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-info">
              <p className="stat-label">Active</p>
              <h2 className="stat-value">--</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#FFF3E0' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#FF9800" strokeWidth="2"/>
                <path d="M12 6V12L16 14" stroke="#FF9800" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="stat-info">
              <p className="stat-label">On Leave</p>
              <h2 className="stat-value">--</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#FFEBEE' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#F44336" strokeWidth="2"/>
                <path d="M15 9L9 15M9 9L15 15" stroke="#F44336" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="stat-info">
              <p className="stat-label">Inactive</p>
              <h2 className="stat-value">--</h2>
            </div>
          </div>
        </div>

        <div className="info-message">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#7152F3" strokeWidth="2"/>
            <path d="M12 16V12M12 8H12.01" stroke="#7152F3" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p>Navigate to <strong>All Employees</strong> to view and manage your team members</p>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
