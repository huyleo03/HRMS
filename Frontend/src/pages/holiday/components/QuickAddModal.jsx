import React, { useState } from "react";
import ModalWrapper from "./shared/ModalWrapper";
import HolidayForm from "./shared/HolidayForm";
import "../css/HolidayModal.css";

/**
 * QuickAddModal - Quick create holiday from calendar
 * Refactored to use shared components
 */
const QuickAddModal = ({ date, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: "",
    date: date.toISOString().split("T")[0],
    endDate: "",
    type: "National",
    isPaid: true,
    description: "",
  });
  
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper 
      title="➕ Add New Holiday"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <HolidayForm 
          formData={formData} 
          onChange={setFormData}
          mode="create"
        />
        
        <div className="modal-footer">
          <button type="button" className="btn btn--secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={loading}>
            {loading ? "Creating..." : "✅ Create Holiday"}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};

export default QuickAddModal;
