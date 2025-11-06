import React from "react";
import "../../css/HolidayModal.css";

/**
 * ModalWrapper - Reusable modal shell component
 * Provides consistent overlay, header, body, and footer structure
 */
const ModalWrapper = ({ 
  isOpen = true,
  title, 
  onClose, 
  children, 
  footer,
  size = "default" // "default" or "large"
}) => {
  if (!isOpen) return null;

  const modalClass = size === "large" 
    ? "modal-content modal-content--large" 
    : "modal-content";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={modalClass} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body">
          {children}
        </div>
        
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export default ModalWrapper;
