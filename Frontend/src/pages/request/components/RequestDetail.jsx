import React, { useState, useEffect } from "react";
import {
  MoreVertical,
  Paperclip,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  X,
  Trash2,
  Ban,
  FileText,
  CheckCircle2,
  XOctagon,
} from "lucide-react";
import {
  getStatusInfo,
  getPriorityColor,
  formatDate,
  formatFileSize,
} from "../../../utils/requestHelpers";
import { useAuth } from "../../../contexts/AuthContext";
import { cancelRequest, approveRequest } from "../../../service/RequestService";
import { toast } from "react-toastify";
import CancelRequestModal from "./CancelRequestModal";
import ApproveRequestModal from "./ApproveRequestModal";

const RequestDetail = ({ request, onClose, onActionSuccess }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  useEffect(() => {}, [request?.status]);

  if (!request) return null;
  const pendingStep = request.approvalFlow.find(
    (step) => step.status === "Pending"
  );
  const isCurrentUserApprover =
    pendingStep &&
    (typeof pendingStep.approverId === "object"
      ? pendingStep.approverId._id === user.id
      : pendingStep.approverId === user.id);
  const isCurrentUserSubmitter = request.submittedBy._id === user.id;
  const canCancel =
    isCurrentUserSubmitter &&
    ["Pending", "Manager_Approved"].includes(request.status);

  const StatusIcon = {
    CheckCircle,
    XCircle,
    AlertCircle,
    Clock,
    Ban,
    FileText,
    CheckCircle2,
    XOctagon,
  };

  const handleConfirmCancel = async (cancelReason) => {
    setIsSubmitting(true);
    try {
      const response = await cancelRequest(request._id, cancelReason);
      toast.success(response.message || "Đã hủy đơn thành công!");
      setIsCancelModalOpen(false);
      if (onActionSuccess) {
        onActionSuccess(response.request);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Có lỗi xảy ra khi hủy đơn.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmApprove = async (comment) => {
    setIsSubmitting(true);
    try {
      const response = await approveRequest(request._id, comment);
      toast.success(response.message || "Phê duyệt đơn thành công!");

      if (onActionSuccess) {
        onActionSuccess(response.request);
      }
      setIsApproveModalOpen(false); // Đóng modal sau khi thành công
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Có lỗi xảy ra khi phê duyệt đơn.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="request-detail">
      <div className="detail-header">
        <div className="detail-title">
          <h2>{request.subject}</h2>
          <span
            className={`badge-priority ${getPriorityColor(request.priority)}`}
          >
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
        <div className="detail-sender">
          <img
            src={request.submittedBy.avatar}
            alt={request.submittedBy.full_name || request.submittedBy.name}
            className="sender-avatar"
          />
          <div className="sender-info">
            <div className="sender-name">
              {request.submittedBy.full_name || request.submittedBy.name}
            </div>
            <div className="sender-email">{request.submittedBy.email}</div>
          </div>
          <div className="detail-date">{formatDate(request.createdAt)}</div>
        </div>

        {/* Body */}
        <div className="detail-body">
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
          {isCurrentUserApprover && (
            <>
              <button
                className="btn btn-success"
                onClick={() => setIsApproveModalOpen(true)}
                disabled={isSubmitting}
              >
                <CheckCircle size={18} />
                {isSubmitting ? "Đang xử lý..." : "Phê duyệt"}
              </button>
              <button className="btn btn-danger">
                <XCircle size={18} />
                Từ chối
              </button>
              <button className="btn btn-info">
                <AlertCircle size={18} />
                Yêu cầu chỉnh sửa
              </button>
            </>
          )}

          {canCancel && (
            <button
              className="btn btn-outline-danger"
              onClick={() => setIsCancelModalOpen(true)}
              disabled={isSubmitting}
            >
              <Trash2 size={18} />
              {isSubmitting ? "Đang hủy..." : "Hủy đơn"}
            </button>
          )}
        </div>
      </div>

      {/* Cancel Request Modal */}
      <CancelRequestModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        isSubmitting={isSubmitting}
      />

      <ApproveRequestModal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        onConfirm={handleConfirmApprove}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default RequestDetail;
