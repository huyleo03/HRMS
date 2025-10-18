import { apiCall, API_CONFIG } from "./api";

// Attendance API Endpoints
const ATTENDANCE_ENDPOINTS = {
  PING: "/api/attendance/ping",
  CLOCK_IN: "/api/attendance/clock-in",
  CLOCK_OUT: "/api/attendance/clock-out",
  TODAY_STATUS: "/api/attendance/today",
  MY_HISTORY: "/api/attendance/my-history",
  DEPARTMENT: "/api/attendance/department",
  DEPARTMENT_REPORT: "/api/attendance/department/report",
  ALL_ATTENDANCE: "/api/attendance/all",
  COMPANY_REPORT: "/api/attendance/company/report",
  MANUAL_ADJUST: (id) => `/api/attendance/${id}/adjust`,
  MARK_ABSENT: "/api/attendance/mark-absent",
  EXPORT: "/api/attendance/export",
};

// ============ EMPLOYEE SERVICES ============

/**
 * Ping để kiểm tra intranet
 */
export const pingIntranet = async () => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${ATTENDANCE_ENDPOINTS.PING}`);
    return { success: response.status === 204 };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Clock-in (chấm công vào)
 * @param {Object} data - { photo: base64ImageString }
 */
export const clockIn = async (data) => {
  return apiCall(ATTENDANCE_ENDPOINTS.CLOCK_IN, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

/**
 * Clock-out (chấm công ra)
 * @param {Object} data - { photo: base64ImageString }
 */
export const clockOut = async (data) => {
  return apiCall(ATTENDANCE_ENDPOINTS.CLOCK_OUT, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

/**
 * Lấy trạng thái chấm công hôm nay
 */
export const getTodayStatus = async () => {
  return apiCall(ATTENDANCE_ENDPOINTS.TODAY_STATUS, {
    method: "GET",
  });
};

/**
 * Lấy lịch sử chấm công của mình
 * @param {Object} params - { page, limit, startDate, endDate, status }
 */
export const getMyHistory = async (params = {}) => {
  return apiCall(ATTENDANCE_ENDPOINTS.MY_HISTORY, {
    method: "GET",
    params,
  });
};

// ============ MANAGER SERVICES ============

/**
 * Xem tổng quan chấm công phòng ban (Manager)
 * @param {Object} params - { page, limit, date, startDate, endDate, status }
 */
export const getDepartmentOverview = async (params = {}) => {
  return apiCall(ATTENDANCE_ENDPOINTS.DEPARTMENT, {
    method: "GET",
    params,
  });
};

/**
 * Báo cáo chấm công phòng ban (Manager)
 * @param {Object} params - { startDate, endDate }
 */
export const getDepartmentReport = async (params = {}) => {
  return apiCall(ATTENDANCE_ENDPOINTS.DEPARTMENT_REPORT, {
    method: "GET",
    params,
  });
};

// ============ ADMIN SERVICES ============

/**
 * Xem tất cả chấm công (Admin)
 * @param {Object} params - { page, limit, startDate, endDate, status, departmentId, employeeId }
 */
export const getAllAttendance = async (params = {}) => {
  return apiCall(ATTENDANCE_ENDPOINTS.ALL_ATTENDANCE, {
    method: "GET",
    params,
  });
};

/**
 * Báo cáo toàn công ty (Admin)
 * @param {Object} params - { startDate, endDate, departmentId }
 */
export const getCompanyReport = async (params = {}) => {
  return apiCall(ATTENDANCE_ENDPOINTS.COMPANY_REPORT, {
    method: "GET",
    params,
  });
};

/**
 * Chỉnh sửa thủ công bản ghi chấm công (Admin)
 * @param {String} attendanceId
 * @param {Object} data - { clockIn, clockOut, status, reason }
 */
export const manualAdjust = async (attendanceId, data) => {
  return apiCall(ATTENDANCE_ENDPOINTS.MANUAL_ADJUST(attendanceId), {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

/**
 * Đánh dấu vắng tự động (Admin)
 */
export const markAbsent = async () => {
  return apiCall(ATTENDANCE_ENDPOINTS.MARK_ABSENT, {
    method: "POST",
  });
};

/**
 * Xuất dữ liệu Excel (Admin)
 * @param {Object} params - { startDate, endDate, departmentId, format }
 */
export const exportData = async (params = {}) => {
  const token = localStorage.getItem("auth_token");
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_CONFIG.BASE_URL}${ATTENDANCE_ENDPOINTS.EXPORT}?${queryString}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Không thể xuất dữ liệu");
    }

    // Lấy tên file từ header
    const contentDisposition = response.headers.get("Content-Disposition");
    let fileName = "BangCong.xlsx";
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (fileNameMatch) {
        fileName = fileNameMatch[1];
      }
    }

    // Download file
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);

    return { success: true };
  } catch (error) {
    console.error("Export Error:", error);
    throw error;
  }
};

export default {
  pingIntranet,
  clockIn,
  clockOut,
  getTodayStatus,
  getMyHistory,
  getDepartmentOverview,
  getDepartmentReport,
  getAllAttendance,
  getCompanyReport,
  manualAdjust,
  markAbsent,
  exportData,
};
