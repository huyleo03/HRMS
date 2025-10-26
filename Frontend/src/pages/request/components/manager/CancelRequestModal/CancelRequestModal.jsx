import React, { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import "./CancelRequestModal.css";

const CancelRequestModal = ({ isOpen, onClose, onConfirm, isSubmitting }) => {
  const [cancelReason, setCancelReason] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    onConfirm(cancelReason.trim());
  };

  const handleClose = () => {
    setCancelReason(""); // Reset form khi đóng
    onClose();
  };

  return (
    <div className="cancel-modal-overlay" onClick={handleClose}>
      <div className="cancel-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cancel-modal-header">
          <div className="cancel-modal-title">
            <AlertTriangle size={24} className="cancel-icon" />
            <h3>Xác nhận hủy đơn</h3>
          </div>
          <button 
            className="cancel-modal-close-btn" 
            onClick={handleClose}
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="cancel-modal-body">
          <p className="cancel-modal-description">
            Bạn có chắc chắn muốn hủy đơn yêu cầu này không? Hành động này không thể hoàn tác.
          </p>
          
          <div className="cancel-modal-form-group">
            <label htmlFor="cancelReason">
              Lý do hủy đơn <span className="optional-text">(Tùy chọn)</span>
            </label>
            <textarea
              id="cancelReason"
              className="cancel-modal-textarea"
              rows="4"
              placeholder="Nhập lý do bạn muốn hủy đơn này..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              disabled={isSubmitting}
            />
            <div className="cancel-modal-char-count">
              {cancelReason.length} / 500 ký tự
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="cancel-modal-footer">
          <button 
            className="btn btn-secondary" 
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Không, giữ lại đơn
          </button>
          <button 
            className="btn btn-danger" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Đang xử lý..." : "Xác nhận hủy đơn"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelRequestModal;
