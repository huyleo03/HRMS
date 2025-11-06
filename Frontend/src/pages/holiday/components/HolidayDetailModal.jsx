import React, { useState } from "react";
import ModalWrapper from "./shared/ModalWrapper";
import DetailRow from "./shared/DetailRow";
import HolidayForm from "./shared/HolidayForm";
import { getHolidayIcon, formatShortDate } from "../utils/holidayUtils";
import "../css/HolidayModal.css";

/**
 * HolidayDetailModal - View and edit company holidays (Admin only)
 * Refactored to use shared components
 */
const HolidayDetailModal = ({ holiday, onClose, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: holiday.name,
    date: new Date(holiday.date).toISOString().split("T")[0],
    endDate: holiday.endDate ? new Date(holiday.endDate).toISOString().split("T")[0] : "",
    type: holiday.type,
    isPaid: holiday.isPaid,
    description: holiday.description || "",
  });
  
  const [loading, setLoading] = useState(false);
  
  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onUpdate(holiday._id, formData);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async () => {
    if (!window.confirm("Bạn có chắc muốn xóa ngày lễ này?")) return;
    setLoading(true);
    try {
      await onDelete(holiday._id);
    } finally {
      setLoading(false);
    }
  };
  
  if (!isEditing) {
    // View mode - Using shared components
    const viewFooter = (
      <>
        <button className="btn btn--danger" onClick={handleDelete} disabled={loading}>
          {loading ? "Deleting..." : "🗑️ Delete"}
        </button>
        <button className="btn btn--primary" onClick={() => setIsEditing(true)}>
          ✏️ Edit
        </button>
      </>
    );

    return (
      <ModalWrapper 
        title={`📅 ${holiday.name}`}
        onClose={onClose}
        footer={viewFooter}
        size="large"
      >
        <div className="holiday-detail">
          <DetailRow label="📅 Ngày:">
            <span className="detail-value">
              {formatShortDate(holiday.date)}
              {holiday.endDate && ` - ${formatShortDate(holiday.endDate)}`}
            </span>
          </DetailRow>
          
          <DetailRow label="🏷️ Loại:">
            <span className={`badge badge--${holiday.type.toLowerCase()}`}>
              {getHolidayIcon(holiday.type)} {holiday.type}
            </span>
          </DetailRow>
          
          <DetailRow 
            label="💰 Trả lương:" 
            value={holiday.isPaid ? "✅ Có" : "❌ Không"}
          />
          
          {holiday.description && (
            <DetailRow label="📝 Mô tả:">
              <p className="detail-value">{holiday.description}</p>
            </DetailRow>
          )}
          
          <DetailRow label="👤 Tạo bởi:">
            <span className="detail-value">
              {holiday.createdBy?.full_name || "Unknown"} - {formatShortDate(holiday.createdAt)}
            </span>
          </DetailRow>
        </div>
      </ModalWrapper>
    );
  }
  
  // Edit mode - Using shared form component
  return (
    <ModalWrapper 
      title="✏️ Edit Holiday"
      onClose={onClose}
    >
      <form onSubmit={handleUpdate}>
        <HolidayForm 
          formData={formData} 
          onChange={setFormData}
          mode="edit"
        />
        
        <div className="modal-footer">
          <button type="button" className="btn btn--secondary" onClick={() => setIsEditing(false)} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={loading}>
            {loading ? "Saving..." : "✅ Save Changes"}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};

export default HolidayDetailModal;
