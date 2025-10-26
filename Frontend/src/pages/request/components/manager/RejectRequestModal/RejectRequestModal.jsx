import React, { useState } from "react";
import { X, XCircle } from "lucide-react";
import "./RejectRequestModal.css"; 

const RejectRequestModal = ({ isOpen, onClose, onConfirm, isSubmitting }) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!reason.trim()) {
      setError("Lý do từ chối là bắt buộc.");
      return;
    }
    setError("");
    onConfirm(reason.trim());
  };

  const handleClose = () => {
    setReason(""); // Reset form khi đóng
    setError("");
    onClose();
  };

  return (
    <div className="reject-modal-overlay" onClick={handleClose}>
      <div className="reject-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="reject-modal-header">
          <div className="reject-modal-title">
            <XCircle size={24} className="reject-icon" />
            <h3>Xác nhận từ chối</h3>
          </div>
          <button
            className="reject-modal-close-btn"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="reject-modal-body">
          <p className="reject-modal-description">
            Bạn sắp từ chối đơn yêu cầu này. Vui lòng cung cấp lý do rõ ràng. Hành động này sẽ kết thúc quy trình phê duyệt.
          </p>

          <div className="reject-modal-form-group">
            <label htmlFor="rejectReason">
              Lý do từ chối <span className="required-text">*</span>
            </label>
            <textarea
              id="rejectReason"
              className={`reject-modal-textarea ${error ? 'is-invalid' : ''}`}
              rows="4"
              placeholder="Nhập lý do từ chối ở đây..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError("");
              }}
              disabled={isSubmitting}
            />
            {error && <div className="reject-modal-error-text">{error}</div>}
          </div>
        </div>

        {/* Footer */}
        <div className="reject-modal-footer">
          <button
            className="btn btn-secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Bỏ qua
          </button>
          <button
            className="btn btn-danger"
            onClick={handleSubmit}
            disabled={isSubmitting || !reason.trim()}
          >
            {isSubmitting ? "Đang xử lý..." : "Xác nhận từ chối"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectRequestModal;