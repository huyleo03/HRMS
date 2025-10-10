import { apiCall, API_CONFIG } from "./api";

// Lấy danh sách phòng ban (có phân trang, tìm kiếm, sắp xếp)
export const getDepartments = async (params = {}) => {
  try {
    return await apiCall(API_CONFIG.ENDPOINTS.GET_DEPARTMENTS, {
      method: "GET",
      params: params, // e.g., { page: 1, limit: 10, q: "IT" }
    });
  } catch (error) {
    console.error("getDepartments service error:", error);
    throw error;
  }
};

// Tạo phòng ban mới
export const createDepartment = async (data) => {
  try {
    return await apiCall(API_CONFIG.ENDPOINTS.CREATE_DEPARTMENT, {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error("createDepartment service error:", error);
    throw error;
  }
};

// Tìm kiếm phòng ban 
export const searchDepartments = async (keyword) => {
  try {
    return await apiCall(API_CONFIG.ENDPOINTS.SEARCH_DEPARTMENTS, {
      method: "GET",
      params: { keyword },
    });
  } catch (error) {
    console.error("searchDepartments service error:", error);
    throw error;
  }
};

// Lấy chi tiết phòng ban (bao gồm cả thành viên)
export const getDepartmentById = async (id) => {
  try {
    return await apiCall(API_CONFIG.ENDPOINTS.GET_DEPARTMENT_BY_ID(id), {
      method: "GET",
    });
  } catch (error) {
    console.error("getDepartmentById service error:", error);
    throw error;
  }
};

// Lấy danh sách thành viên của phòng ban (có phân trang)
export const getDepartmentMembers = async (id, params = {}) => {
  try {
    return await apiCall(API_CONFIG.ENDPOINTS.GET_DEPARTMENT_MEMBERS(id), {
      method: "GET",
      params: params,
    });
  } catch (error) {
    console.error("getDepartmentMembers service error:", error);
    throw error;
  }
};

// Lấy danh sách phòng ban dưới dạng options (chỉ id và tên)
export const getDepartmentOptions = async () => {
  try {
    return await apiCall(API_CONFIG.ENDPOINTS.GET_DEPARTMENT_OPTIONS, {
      method: "GET",
    });
  } catch (error) {
    console.error("getDepartmentOptions service error:", error);
    throw error;
  }
};

// Kiểm tra xem một user có phải là trưởng phòng của phòng ban đó không
export const checkDepartmentManager = async (departmentId) => {
  try {
    return await apiCall(
      API_CONFIG.ENDPOINTS.CHECK_DEPARTMENT_MANAGER(departmentId),
      {
        method: "GET",
      }
    );
  } catch (error) {
    console.error("checkDepartmentManager service error:", error);
    throw error;
  }
};