import React from "react";
import {
  MoreVertical,
  Paperclip,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  X,
} from "lucide-react";
import {
  getStatusInfo,
  getPriorityColor,
  formatDate,
  formatFileSize,
} from "../../../utils/requestHelpers";

const RequestDetail = ({ request, onClose }) => {
  if (!request) return null;

  const StatusIcon = {
    CheckCircle,
    XCircle,
    AlertCircle,
    Clock,
  };

  return (
    <div className="request-detail">
      <div className="detail-header">
        <div className="detail-title">
          <h2>{request.subject}</h2>
          <span className={`badge-priority ${getPriorityColor(request.priority)}`}>
            {request.priority}
          </span>
        </div>
        <div className="detail-actions-header">
          <button className="btn-icon" title="Thêm tùy chọn">
            <MoreVertical size={20} />
          </button>
          <button className="btn-icon" onClick={onClose} title="Đóng">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="detail-content">
        {/* Sender Info */}
        <div className="detail-sender">
          <img
            src={request.submittedBy.avatar}
            alt={request.submittedBy.name}
            className="sender-avatar"
          />
          <div className="sender-info">
            <div className="sender-name">{request.submittedBy.name}</div>
            <div className="sender-email">{request.submittedBy.email}</div>
          </div>
          <div className="detail-date">{formatDate(request.createdAt)}</div>
        </div>

        {/* Body */}
        <div className="detail-body">
          {/* Info Grid */}
          <div className="info-grid">
            <div className="info-item">
              <label>Loại đơn:</label>
              <span className={`badge-type type-${request.type.toLowerCase()}`}>
                {request.type}
              </span>
            </div>

            <div className="info-item">
              <label>Trạng thái:</label>
              <span
                className={`status-badge status-${
                  getStatusInfo(request.status).color
                }`}
              >
                {React.createElement(
                  StatusIcon[getStatusInfo(request.status).icon],
                  { size: 14 }
                )}
                {getStatusInfo(request.status).label}
              </span>
            </div>

            <div className="info-item">
              <label>Ngày bắt đầu:</label>
              <span>
                {new Date(request.startDate).toLocaleDateString("vi-VN")}
              </span>
            </div>

            {request.endDate && (
              <div className="info-item">
                <label>Ngày kết thúc:</label>
                <span>
                  {new Date(request.endDate).toLocaleDateString("vi-VN")}
                </span>
              </div>
            )}

            {request.hour && (
              <div className="info-item">
                <label>Số giờ:</label>
                <span>{request.hour} giờ</span>
              </div>
            )}
          </div>

          {/* Reason */}
          <div className="reason-section">
            <h4>Lý do:</h4>
            <p>{request.reason}</p>
          </div>

          {/* Attachments */}
          {request.attachments.length > 0 && (
            <div className="attachments-section">
              <h4>File đính kèm:</h4>
              <div className="attachment-list">
                {request.attachments.map((file, index) => (
                  <div key={index} className="attachment-item">
                    <Paperclip size={16} />
                    <span className="file-name">{file.fileName}</span>
                    <span className="file-size">
                      {formatFileSize(file.fileSize)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approval Flow */}
          <div className="approval-flow-section">
            <h4>Quy trình phê duyệt:</h4>
            <div className="approval-timeline">
              {request.approvalFlow.map((approver, index) => {
                const Icon = StatusIcon[getStatusInfo(approver.status).icon];
                return (
                  <div key={index} className="timeline-item">
                    <div className="timeline-marker">
                      <Icon
                        size={20}
                        className={`text-${
                          getStatusInfo(approver.status).color
                        }`}
                      />
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-title">
                        Cấp {approver.level}: {approver.approverName}
                      </div>
                      <div className="timeline-status">
                        {getStatusInfo(approver.status).label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="detail-actions">
          <button className="btn btn-success">
            <CheckCircle size={18} />
            Phê duyệt
          </button>
          <button className="btn btn-danger">
            <XCircle size={18} />
            Từ chối
          </button>
          <button className="btn btn-info">
            <AlertCircle size={18} />
            Yêu cầu chỉnh sửa
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestDetail;