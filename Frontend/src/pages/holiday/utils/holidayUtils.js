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
    // Holiday types (Unified)
    National: "� Ngày lễ quốc gia",
    Company: "� Ngày nghỉ công ty",
    Optional: "⭐ Ngày lễ tùy chọn",
    Regional: "�️ Ngày lễ địa phương",

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
