/**
 * Holiday utility functions
 * Shared across holiday components
 */

export const getHolidayIcon = (type) => {
  const icons = {
    National: "🎆",
    Company: "🎉",
    Optional: "⭐",
    Regional: "🏖️",
  };
  return icons[type] || "📅";
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
};

export const formatShortDate = (date) => {
  return new Date(date).toLocaleDateString("vi-VN");
};

export const getTypeLabel = (type) => {
  const types = {
    // Holiday types
    "Public Holiday": "🎊 Ngày lễ quốc gia",
    "National Holiday": "🇻🇳 Ngày lễ",
    "Company Holiday": "🏢 Ngày nghỉ công ty",
    "Optional Holiday": "⭐ Ngày lễ tùy chọn",
    "Regional Holiday": "🌏 Ngày lễ địa phương",
    National: "🎆 National",
    Company: "🎉 Company",
    Optional: "⭐ Optional",
    Regional: "🏖️ Regional",
    
    // Leave request types
    BusinessTrip: "✈️ Công tác",
    employee_leave: "🏖️ Nghỉ phép cá nhân",
  };
  return types[type] || type;
};

export const getApplicabilityLabel = (appliesTo) => {
  const labels = {
    "All Employees": "👥 Tất cả nhân viên",
    "Specific Departments": "🏢 Phòng ban cụ thể",
    "Specific Employees": "👤 Nhân viên cụ thể",
  };
  return labels[appliesTo] || appliesTo;
};

export const calculateDuration = (startDate, endDate) => {
  if (!endDate || endDate === startDate) return 1;
  return Math.ceil(
    (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
  ) + 1;
};
