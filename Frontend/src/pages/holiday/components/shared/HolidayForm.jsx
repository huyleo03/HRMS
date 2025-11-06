import React from "react";
import "../../css/HolidayModal.css";

/**
 * HolidayForm - Reusable form fields for holiday creation and editing
 * Used in both QuickAdd and Edit modes
 */
const HolidayForm = ({ formData, onChange, mode = "create" }) => {
  const handleChange = (field, value) => {
    onChange({ ...formData, [field]: value });
  };

  return (
    <>
      <div className="form-group">
        <label>Tên ngày lễ *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder={mode === "create" ? "Ví dụ: Tết Nguyên Đán" : ""}
          required
        />
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label>Ngày bắt đầu *</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => handleChange("date", e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Ngày kết thúc{mode === "create" ? " (nếu có)" : ""}</label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => handleChange("endDate", e.target.value)}
            min={formData.date}
          />
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label>Loại ngày lễ *</label>
          <select
            value={formData.type}
            onChange={(e) => handleChange("type", e.target.value)}
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
            onChange={(e) => handleChange("isPaid", e.target.value === "true")}
          >
            <option value="true">✅ {mode === "create" ? "Có lương" : "Có"}</option>
            <option value="false">❌ {mode === "create" ? "Không lương" : "Không"}</option>
          </select>
        </div>
      </div>
      
      <div className="form-group">
        <label>Mô tả{mode === "create" ? " (không bắt buộc)" : ""}</label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder={mode === "create" ? "Thêm mô tả về ngày lễ này..." : ""}
          rows={3}
        />
      </div>
    </>
  );
};

export default HolidayForm;
