export const getStatusInfo = (status) => {
  const statusMap = {
    Pending: {
      label: "Chờ duyệt",
      color: "warning",
      icon: "Clock",
    },
    Approved: {
      label: "Đã duyệt",
      color: "success",
      icon: "CheckCircle",
    },
    Rejected: {
      label: "Từ chối",
      color: "danger",
      icon: "XCircle",
    },
    NeedsReview: {
      label: "Cần chỉnh sửa",
      color: "info",
      icon: "AlertCircle",
    },
    Cancelled: {
      label: "Đã hủy",
      color: "secondary",
      icon: "Ban",
    },
    Draft: {
      label: "Bản nháp",
      color: "secondary",
      icon: "FileText",
    },
    Manager_Approved: {
      label: "Quản lý đã duyệt",
      color: "info",
      icon: "CheckCircle",
    },
    Completed: {
      label: "Hoàn thành",
      color: "success",
      icon: "CheckCircle2",
    },
  };
  return statusMap[status] || statusMap.Pending;
};

export const getPriorityColor = (priority) => {
  const priorityMap = {
    Low: "priority-low",
    Normal: "priority-normal",
    High: "priority-high",
    Urgent: "priority-urgent",
  };
  return priorityMap[priority] || "priority-normal";
};

export const formatDate = (dateString) => {
  if (!dateString) {
    return "";
  }
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    console.error("Không thể phân tích chuỗi ngày tháng:", dateString);
    return "Ngày không hợp lệ";
  }

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const diffTime = startOfToday.getTime() - startOfDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "Hôm qua";
  if (diffDays > 1 && diffDays < 7) return `${diffDays} ngày trước`;

  // 4. Định dạng ngày tháng theo chuẩn Việt Nam
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Thời gian không hợp lệ";

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};
