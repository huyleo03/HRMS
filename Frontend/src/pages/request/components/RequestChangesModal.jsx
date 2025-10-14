import React, { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import "../css/RequestChangesModal.css"; // Sẽ tạo file CSS này ở bước 2

const RequestChangesModal = ({ isOpen, onClose, onConfirm, isSubmitting }) => {
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!comment.trim()) {
      setError("Nội dung yêu cầu chỉnh sửa là bắt buộc.");
      return;
    }
    setError("");
    onConfirm(comment.trim());
  };

  const handleClose = () => {
    setComment("");
    setError("");
    onClose();
  };

  return (
    <div className="req-changes-modal-overlay" onClick={handleClose}>
      <div className="req-changes-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="req-changes-modal-header">
          <div className="req-changes-modal-title">
            <AlertCircle size={24} className="req-changes-icon" />
            <h3>Yêu cầu chỉnh sửa</h3>
          </div>
          <button
            className="req-changes-modal-close-btn"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="req-changes-modal-body">
          <p className="req-changes-modal-description">
            Đơn sẽ được trả lại cho người gửi với trạng thái "Cần chỉnh sửa". Vui lòng ghi rõ những nội dung cần thay đổi.
          </p>

          <div className="req-changes-modal-form-group">
            <label htmlFor="changesReason">
              Nội dung cần chỉnh sửa <span className="required-text">*</span>
            </label>
            <textarea
              id="changesReason"
              className={`req-changes-modal-textarea ${error ? 'is-invalid' : ''}`}
              rows="4"
              placeholder="Ví dụ: Vui lòng đính kèm giấy khám sức khỏe..."
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                if (error) setError("");
              }}
              disabled={isSubmitting}
            />
            {error && <div className="req-changes-modal-error-text">{error}</div>}
          </div>
        </div>

        {/* Footer */}
        <div className="req-changes-modal-footer">
          <button
            className="btn btn-secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Bỏ qua
          </button>
          <button
            className="btn btn-info"
            onClick={handleSubmit}
            disabled={isSubmitting || !comment.trim()}
          >
            {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestChangesModal;