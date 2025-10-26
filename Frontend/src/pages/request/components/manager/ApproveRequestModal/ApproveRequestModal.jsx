import React, { useState } from "react";
import { X, CheckCircle } from "lucide-react";
import "./ApproveRequestModal.css"; 

const ApproveRequestModal = ({ isOpen, onClose, onConfirm, isSubmitting }) => {
  const [comment, setComment] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    onConfirm(comment.trim());
  };

  const handleClose = () => {
    setComment(""); 
    onClose();
  };

  return (
    <div className="approve-modal-overlay" onClick={handleClose}>
      <div className="approve-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="approve-modal-header">
          <div className="approve-modal-title">
            <CheckCircle size={24} className="approve-icon" />
            <h3>Xác nhận phê duyệt</h3>
          </div>
          <button
            className="approve-modal-close-btn"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="approve-modal-body">
          <p className="approve-modal-description">
            Bạn sắp phê duyệt đơn yêu cầu này. Hành động này sẽ chuyển đơn đến cấp phê duyệt tiếp theo hoặc hoàn tất quy trình.
          </p>

          <div className="approve-modal-form-group">
            <label htmlFor="approveComment">
              Nhận xét <span className="optional-text">(Tùy chọn)</span>
            </label>
            <textarea
              id="approveComment"
              className="approve-modal-textarea"
              rows="4"
              placeholder="Nhập nhận xét của bạn ở đây..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isSubmitting}
            />
            <div className="approve-modal-char-count">
              {comment.length} / 500 ký tự
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="approve-modal-footer">
          <button
            className="btn btn-secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Bỏ qua
          </button>
          <button
            className="btn btn-success"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Đang xử lý..." : "Xác nhận phê duyệt"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApproveRequestModal;