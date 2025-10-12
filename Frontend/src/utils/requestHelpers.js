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
// ...existing code...

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
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "Hôm qua";
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString("vi-VN");
};

export const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};