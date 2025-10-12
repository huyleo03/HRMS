import React from "react";

const requestTypes = [
  { value: "Leave", label: "Nghỉ phép", icon: "🏖️" },
  { value: "Overtime", label: "Tăng ca", icon: "⏰" },
  { value: "RemoteWork", label: "Làm từ xa", icon: "💻" },
  { value: "Resignation", label: "Nghỉ việc", icon: "👋" },
  { value: "BusinessTrip", label: "Công tác", icon: "✈️" },
  { value: "Equipment", label: "Thiết bị", icon: "🖥️" },
  { value: "ITSupport", label: "Hỗ trợ IT", icon: "🛠️" },
  { value: "HRDocument", label: "Tài liệu HR", icon: "📄" },
  { value: "Expense", label: "Chi phí", icon: "💰" },
  { value: "Other", label: "Khác", icon: "📝" },
];

const RequestTypeGrid = ({ selectedValue, onSelect }) => {
  return (
    <div className="request-type-grid">
      {requestTypes.map((type) => (
        <div
          key={type.value}
          className={`type-card ${selectedValue === type.value ? "active" : ""}`}
          onClick={() => onSelect(type.value)}
        >
          <span className="type-icon">{type.icon}</span>
          <span className="type-label">{type.label}</span>
        </div>
      ))}
    </div>
  );
};

export default RequestTypeGrid;