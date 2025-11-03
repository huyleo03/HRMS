import React, { useState } from "react";
import "../css/HolidayModal.css";

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>➕ Add New Holiday</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Tên ngày lễ *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Ví dụ: Tết Nguyên Đán"
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
              <label>Ngày kết thúc (nếu có)</label>
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
                <option value="National">🎆 National Holiday</option>
                <option value="Company">🎉 Company Holiday</option>
                <option value="Optional">⭐ Optional Holiday</option>
                <option value="Regional">🏖️ Regional Holiday</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Có lương?</label>
              <select
                value={formData.isPaid}
                onChange={(e) => setFormData({...formData, isPaid: e.target.value === "true"})}
              >
                <option value="true">✅ Có lương</option>
                <option value="false">❌ Không lương</option>
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label>Mô tả (không bắt buộc)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Thêm mô tả về ngày lễ này..."
              rows={3}
            />
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn--secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? "Creating..." : "✅ Create Holiday"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickAddModal;
