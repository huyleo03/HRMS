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
  Edit3,
  Download,
  RefreshCw,
  History,
} from "lucide-react";
import {
  getStatusInfo,
  getPriorityColor,
  formatDate,
  formatFileSize,
  formatDateTime,
} from "../../../../../utils/requestHelpers";
import { useAuth } from "../../../../../contexts/AuthContext";
import {
  cancelRequest,
  approveRequest,
  rejectRequest,
  requestChanges,
} from "../../../../../service/RequestService";
import { toast } from "react-toastify";
import CancelRequestModal from "../../manager/CancelRequestModal/CancelRequestModal";
import ApproveRequestModal from "../../manager/ApproveRequestModal/ApproveRequestModal";
import RejectRequestModal from "../../manager/RejectRequestModal/RejectRequestModal";
import RequestChangesModal from "../../manager/RequestChangesModal/RequestChangesModal";
import EditRequestForm from "../EditRequestForm/EditRequestForm";
import AdminActions from "../../admin/AdminActions/AdminActions";
import RequestComments from "../RequestComments/RequestComments";

const RequestDetail = ({ request, onClose, onActionSuccess, isAdmin, viewMode = "employee" }) => {
  const { user } = useAuth();
  const [currentRequest, setCurrentRequest] = useState(request);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isRequestChangesModalOpen, setIsRequestChangesModalOpen] =
    useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (request) {
      setCurrentRequest(request);
    }
  }, [request]);

  if (!currentRequest) return null;
  const pendingStep = currentRequest.approvalFlow.find(
    (step) => step.status === "Pending"
  );
  const isCurrentUserApprover =
    pendingStep &&
    (typeof pendingStep.approverId === "object"
      ? pendingStep.approverId._id === user.id
      : pendingStep.approverId === user.id);
  const isCurrentUserSubmitter = currentRequest.submittedBy._id === user.id;
  const canCancel =
    isCurrentUserSubmitter &&
    ["Pending", "Manager_Approved"].includes(currentRequest.status);
  const canEdit = isCurrentUserSubmitter && currentRequest.status === "NeedsReview";

  // Logic hiển thị actions theo context
  const showApproverActions = isCurrentUserApprover && viewMode === "employee";
  const showAdminActions = isAdmin && viewMode === "admin";

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
      const response = await cancelRequest(currentRequest._id, cancelReason);
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
      const response = await approveRequest(currentRequest._id, comment);
      toast.success(response.message || "Phê duyệt đơn thành công!");

      if (onActionSuccess) {
        onActionSuccess(response.request);
      }
      setIsApproveModalOpen(false); 
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

  const handleConfirmReject = async (reason) => {
    setIsSubmitting(true);
    try {
      const response = await rejectRequest(currentRequest._id, reason);
      toast.success(response.message || "Đã từ chối đơn thành công!");
      setIsRejectModalOpen(false);
      if (onActionSuccess) {
        onActionSuccess(response.request);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Có lỗi xảy ra khi từ chối đơn.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmRequestChanges = async (comment) => {
    setIsSubmitting(true);
    try {
      const response = await requestChanges(currentRequest._id, comment);
      toast.success(response.message || "Đã gửi yêu cầu chỉnh sửa thành công!");
      setIsRequestChangesModalOpen(false);
      if (onActionSuccess) {
        onActionSuccess(response.request);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Có lỗi xảy ra khi gửi yêu cầu chỉnh sửa.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadFile = (fileUrl, fileName) => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="request-detail">
      <div className="detail-header">
        <div className="detail-title">
          <h2>{currentRequest.subject}</h2>
          <span
            className={`badge-priority ${getPriorityColor(currentRequest.priority)}`}
          >
            {currentRequest.priority}
          </span>
        </div>
        <div className="detail-actions-header">
          <button className="btn-icon" onClick={onClose} title="Đóng">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="detail-content">
        <div className="detail-sender">
          <img
            src={currentRequest.submittedBy.avatar}
            alt={currentRequest.submittedBy.full_name || currentRequest.submittedBy.name}
            className="sender-avatar"
          />
          <div className="sender-info">
            <div className="sender-name">
              {currentRequest.submittedBy.full_name || currentRequest.submittedBy.name}
            </div>
            <div className="sender-email">{currentRequest.submittedBy.email}</div>
          </div>
          <div className="detail-date">{formatDate(currentRequest.created_at)}</div>
        </div>

        {/* Body */}
        <div className="detail-body">
          <div className="info-grid">
            <div className="info-item">
              <label>Loại đơn:</label>
              <span className={`badge-type type-${currentRequest.type.toLowerCase()}`}>
                {currentRequest.type}
              </span>
            </div>

            <div className="info-item">
              <label>Trạng thái:</label>
              <span
                className={`status-badge status-${
                  getStatusInfo(currentRequest.status).color
                }`}
              >
                {React.createElement(
                  StatusIcon[getStatusInfo(currentRequest.status).icon],
                  { size: 14 }
                )}
                {getStatusInfo(currentRequest.status).label}
              </span>
            </div>

            <div className="info-item">
              <label>Ngày bắt đầu:</label>
              <span>
                {new Date(currentRequest.startDate).toLocaleDateString("vi-VN")}
              </span>
            </div>

            {currentRequest.endDate && (
              <div className="info-item">
                <label>Ngày kết thúc:</label>
                <span>
                  {new Date(currentRequest.endDate).toLocaleDateString("vi-VN")}
                </span>
              </div>
            )}

            {currentRequest.hour && (
              <div className="info-item">
                <label>Số giờ:</label>
                <span>{currentRequest.hour} giờ</span>
              </div>
            )}
          </div>

          {/* Reason */}
          <div className="reason-section">
            <h4>Lý do:</h4>
            <p>{currentRequest.reason}</p>
          </div>

          {/* Attachments */}
          {currentRequest.attachments.length > 0 && (
            <div className="attachments-section">
              <h4>File đính kèm:</h4>
              <div className="attachment-list">
                {currentRequest.attachments.map((file, index) => (
                  <div
                    key={index}
                    className="attachment-item attachment-item-clickable"
                    onClick={() =>
                      handleDownloadFile(file.fileUrl, file.fileName)
                    }
                    style={{ cursor: "pointer" }}
                    title="Click để tải xuống"
                  >
                    <Paperclip size={16} />
                    <span className="file-name">{file.fileName}</span>
                    <span className="file-size">
                      {formatFileSize(file.fileSize)}
                    </span>
                    <Download size={16} className="download-icon" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approval Flow */}
          <div className="approval-flow-section">
            <h4>Quy trình phê duyệt:</h4>
            <div className="approval-timeline">
              {currentRequest.approvalFlow.map((approver, index) => {
                const statusInfo = getStatusInfo(approver.status);
                const Icon = StatusIcon[statusInfo.icon] || Clock;
                return (
                  <div key={index} className="timeline-item">
                    <div className="timeline-marker">
                      <Icon size={20} className={`text-${statusInfo.color}`} />
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span className="timeline-title">
                          Cấp {approver.level}: {approver.approverName}
                        </span>
                        {approver.actionAt && (
                          <span className="timeline-action-time">
                            {formatDateTime(approver.actionAt)}
                          </span>
                        )}
                      </div>
                      <div
                        className={`timeline-status status-text-${statusInfo.color}`}
                      >
                        {statusInfo.label}
                      </div>
                      {approver.comment && (
                        <div className="timeline-comment">
                          <p>"{approver.comment}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* History - Admin Override Actions */}
          {currentRequest.history && currentRequest.history.length > 0 && (
            <div className="history-section">
              <h4>
                <History size={18} style={{ marginRight: "8px" }} />
                Lịch sử thay đổi
              </h4>
              <div className="history-timeline">
                {currentRequest.history.map((entry, index) => (
                  <div key={index} className="history-entry">
                    <div className="history-marker">
                      <RefreshCw size={18} className="history-icon" />
                    </div>
                    <div className="history-content">
                      <div className="history-header">
                        <span className="history-action">
                          <strong>{entry.performedByName || entry.performedBy?.full_name}</strong>
                          {" đã "}
                          {entry.action === "Override" && "ghi đè quyết định"}
                          {entry.action === "Escalate" && "chuyển lên cấp cao hơn"}
                          {entry.action === "Reopen" && "mở lại đơn"}
                        </span>
                        <span className="history-time">
                          {formatDateTime(entry.timestamp)}
                        </span>
                      </div>
                      <div className="history-change">
                        <span className="status-old">{entry.oldStatus}</span>
                        <span className="arrow">→</span>
                        <span className="status-new">{entry.newStatus}</span>
                      </div>
                      {entry.comment && (
                        <div className="history-comment">
                          <span className="comment-label">Lý do:</span>
                          <span className="comment-text">"{entry.comment}"</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Comments Section */}
        <RequestComments requestId={currentRequest._id} />

        {/* Admin Actions - Chỉ hiển thị khi viewMode = "admin" */}
        {showAdminActions && (
          <AdminActions request={currentRequest} onActionSuccess={onActionSuccess} />
        )}

        {/* Approver Actions - Chỉ hiển thị khi viewMode = "employee" */}
        <div className="detail-actions">
          {showApproverActions && (
            <>
              <button
                className="btn btn-success"
                onClick={() => setIsApproveModalOpen(true)}
                disabled={isSubmitting}
              >
                <CheckCircle size={18} />
                {isSubmitting ? "Đang xử lý..." : "Phê duyệt"}
              </button>
              <button
                className="btn btn-danger"
                onClick={() => setIsRejectModalOpen(true)}
                disabled={isSubmitting}
              >
                <XCircle size={18} />
                Từ chối
              </button>
              <button
                className="btn btn-info"
                onClick={() => setIsRequestChangesModalOpen(true)}
                disabled={isSubmitting}
              >
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

          {canEdit && (
            <button
              className="btn btn-primary"
              onClick={() => setIsEditModalOpen(true)}
              disabled={isSubmitting}
            >
              <Edit3 size={18} />
              Chỉnh sửa đơn
            </button>
          )}
        </div>
      </div>
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

      <RejectRequestModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirm={handleConfirmReject}
        isSubmitting={isSubmitting}
      />

      <RequestChangesModal
        isOpen={isRequestChangesModalOpen}
        onClose={() => setIsRequestChangesModalOpen(false)}
        onConfirm={handleConfirmRequestChanges}
        isSubmitting={isSubmitting}
      />

      <EditRequestForm
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        requestToEdit={currentRequest}
        onSuccess={onActionSuccess}
      />
    </div>
  );
};

export default RequestDetail;
