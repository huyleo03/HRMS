import React, { useState } from "react";
import "../css/HolidayModal.css";

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
    // View mode
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content modal-content--large" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>📅 {holiday.name}</h2>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
          
          <div className="modal-body holiday-detail">
            <div className="detail-row">
              <span className="detail-label">📅 Ngày:</span>
              <span className="detail-value">
                {new Date(holiday.date).toLocaleDateString("vi-VN")}
                {holiday.endDate && ` - ${new Date(holiday.endDate).toLocaleDateString("vi-VN")}`}
              </span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">🏷️ Loại:</span>
              <span className={`badge badge--${holiday.type.toLowerCase()}`}>
                {getHolidayIcon(holiday.type)} {holiday.type}
              </span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">💰 Trả lương:</span>
              <span className="detail-value">{holiday.isPaid ? "✅ Có" : "❌ Không"}</span>
            </div>
            
            {holiday.description && (
              <div className="detail-row">
                <span className="detail-label">📝 Mô tả:</span>
                <p className="detail-value">{holiday.description}</p>
              </div>
            )}
            
            <div className="detail-row">
              <span className="detail-label">👤 Tạo bởi:</span>
              <span className="detail-value">
                {holiday.createdBy?.full_name || "Unknown"} - {new Date(holiday.createdAt).toLocaleDateString("vi-VN")}
              </span>
            </div>
          </div>
          
          <div className="modal-footer">
            <button className="btn btn--danger" onClick={handleDelete} disabled={loading}>
              {loading ? "Deleting..." : "🗑️ Delete"}
            </button>
            <button className="btn btn--primary" onClick={() => setIsEditing(true)}>
              ✏️ Edit
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Edit mode
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>✏️ Edit Holiday</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <form onSubmit={handleUpdate} className="modal-body">
          <div className="form-group">
            <label>Tên ngày lễ *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Ngày bắt đầu *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Ngày kết thúc</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                min={formData.date}
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Loại ngày lễ *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <option value="National">🎆 National</option>
                <option value="Company">🎉 Company</option>
                <option value="Optional">⭐ Optional</option>
                <option value="Regional">🏖️ Regional</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Có lương?</label>
              <select
                value={formData.isPaid}
                onChange={(e) => setFormData({...formData, isPaid: e.target.value === "true"})}
              >
                <option value="true">✅ Có</option>
                <option value="false">❌ Không</option>
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label>Mô tả</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
            />
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn--secondary" onClick={() => setIsEditing(false)} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? "Saving..." : "✅ Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

function getHolidayIcon(type) {
  const icons = {
    National: "🎆",
    Company: "🎉",
    Optional: "⭐",
    Regional: "🏖️",
  };
  return icons[type] || "📅";
}

export default HolidayDetailModal;
