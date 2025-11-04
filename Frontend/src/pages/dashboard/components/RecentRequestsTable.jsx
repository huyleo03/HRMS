import React from 'react';
import '../css/RecentRequestsTable.css';

const RecentRequestsTable = ({ requests }) => {
    const getStatusBadge = (status) => {
        const statusConfig = {
            Pending: { text: 'Chờ duyệt', class: 'pending' },
            Approved: { text: 'Đã duyệt', class: 'approved' },
            Rejected: { text: 'Từ chối', class: 'rejected' },
            ChangeRequested: { text: 'Yêu cầu sửa', class: 'change' },
            Cancelled: { text: 'Đã hủy', class: 'cancelled' }
        };
        const config = statusConfig[status] || { text: status, class: 'default' };
        return <span className={`status-badge ${config.class}`}>{config.text}</span>;
    };

    const getPriorityBadge = (priority) => {
        const priorityConfig = {
            Low: { text: 'Thấp', class: 'low' },
            Medium: { text: 'Trung bình', class: 'medium' },
            High: { text: 'Cao', class: 'high' },
            Urgent: { text: 'Khẩn cấp', class: 'urgent' }
        };
        const config = priorityConfig[priority] || { text: priority, class: 'default' };
        return <span className={`priority-badge ${config.class}`}>{config.text}</span>;
    };

    const getTypeLabel = (type) => {
        const typeLabels = {
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
        return typeLabels[type] || type;
    };

    const getTimeAgo = (hours) => {
        if (hours < 1) return 'Vừa xong';
        if (hours < 24) return `${hours} giờ trước`;
        const days = Math.floor(hours / 24);
        return `${days} ngày trước`;
    };

    return (
        <div className="recent-requests-container">
            <div className="recent-header">
                <h2>🕒 Đơn Từ Gần Đây</h2>
                <span className="recent-count">{requests.length} đơn</span>
            </div>

            {requests && requests.length > 0 ? (
                <div className="requests-table-container">
                    <table className="requests-table">
                        <thead>
                            <tr>
                                <th>Mã Đơn</th>
                                <th>Loại</th>
                                <th>Người Gửi</th>
                                <th>Phòng Ban</th>
                                <th>Ưu Tiên</th>
                                <th>Trạng Thái</th>
                                <th>Thời Gian</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map((request) => (
                                <tr key={request.requestId}>
                                    <td className="request-id">{request.requestId}</td>
                                    <td className="request-type">{getTypeLabel(request.type)}</td>
                                    <td className="request-submitter">
                                        <div className="submitter-cell">
                                            {request.submittedBy?.avatar ? (
                                                <img 
                                                    src={request.submittedBy.avatar} 
                                                    alt={request.submittedBy.name}
                                                    className="submitter-avatar"
                                                />
                                            ) : (
                                                <div className="submitter-avatar-placeholder">
                                                    {request.submittedBy?.name?.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <span className="submitter-name">{request.submittedBy?.name}</span>
                                        </div>
                                    </td>
                                    <td className="request-department">{request.submittedBy?.department}</td>
                                    <td className="request-priority">{getPriorityBadge(request.priority)}</td>
                                    <td className="request-status">{getStatusBadge(request.status)}</td>
                                    <td className="request-time">{getTimeAgo(request.hoursSinceCreated)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="no-requests">Không có đơn nào gần đây</div>
            )}
        </div>
    );
};

export default RecentRequestsTable;
