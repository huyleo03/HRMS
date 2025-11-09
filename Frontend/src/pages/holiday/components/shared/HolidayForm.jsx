import React, { useState, useEffect } from "react";
import { getDepartmentOptions } from "../../../../service/DepartmentService";
import "../../css/HolidayModal.css";

/**
 * HolidayForm - Reusable form fields for holiday creation and editing
 * Used in both QuickAdd and Edit modes
 */
const HolidayForm = ({ formData, onChange, mode = "create" }) => {
  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoadingDepts(true);
      const token = localStorage.getItem("token");
      const response = await getDepartmentOptions(token);
      if (response.success) {
        setDepartments(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    } finally {
      setLoadingDepts(false);
    }
  };

  const handleChange = (field, value) => {
    onChange({ ...formData, [field]: value });
  };

  const handleDepartmentToggle = (deptId) => {
    const currentDepts = formData.departments || [];
    const isSelected = currentDepts.includes(deptId);
    
    const newDepts = isSelected
      ? currentDepts.filter(id => id !== deptId)
      : [...currentDepts, deptId];
    
    handleChange("departments", newDepts);
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

      {/* Applicability - Áp dụng cho */}
      <div className="form-group">
        <label>Áp dụng cho *</label>
        <select
          value={formData.appliesTo || "All Employees"}
          onChange={(e) => {
            const newValue = e.target.value;
            onChange({ 
              ...formData, 
              appliesTo: newValue,
              departments: newValue === "All Employees" ? [] : formData.departments || []
            });
          }}
        >
          <option value="All Employees">👥 Tất cả nhân viên</option>
          <option value="Specific Departments">🏢 Phòng ban cụ thể</option>
        </select>
      </div>

      {/* Department Selection - Chỉ hiển thị khi chọn "Specific Departments" */}
      {formData.appliesTo === "Specific Departments" && (
        <div className="form-group">
          <label>Chọn phòng ban *</label>
          {loadingDepts ? (
            <div style={{ padding: "10px", color: "#666" }}>Đang tải danh sách phòng ban...</div>
          ) : (
            <div className="department-checkboxes" style={{
              border: "1px solid #ddd",
              borderRadius: "4px",
              padding: "10px",
              maxHeight: "200px",
              overflowY: "auto",
              backgroundColor: "#f9f9f9"
            }}>
              {departments.length === 0 ? (
                <div style={{ padding: "10px", color: "#666" }}>Không có phòng ban nào</div>
              ) : (
                departments.map((dept) => (
                  <label
                    key={dept._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "8px",
                      cursor: "pointer",
                      borderRadius: "4px",
                      transition: "background-color 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0f0f0"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <input
                      type="checkbox"
                      checked={(formData.departments || []).includes(dept._id)}
                      onChange={() => handleDepartmentToggle(dept._id)}
                      style={{ marginRight: "8px" }}
                    />
                    <span>{dept.department_name}</span>
                  </label>
                ))
              )}
            </div>
          )}
          {formData.appliesTo === "Specific Departments" && 
           (!formData.departments || formData.departments.length === 0) && (
            <small style={{ color: "#d32f2f", marginTop: "5px", display: "block" }}>
              Vui lòng chọn ít nhất một phòng ban
            </small>
          )}
        </div>
      )}
    </>
  );
};

export default HolidayForm;
