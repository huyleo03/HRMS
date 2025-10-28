import { apiCall, API_CONFIG } from "./api";

// Lấy danh sách users (GET /api/users)
export const getUsers = async (params = {}) => {
  try {
    return await apiCall(API_CONFIG.ENDPOINTS.GET_USERS, {
      method: "GET",
      params: params,
    });
  } catch (error) {
    console.error("searchUsersForCc service error:", error);
    throw error;
  }
};

// Lấy thông tin Admin user (GET /api/users?role=Admin&limit=1)
export const getAdminUser = async () => {
  try {
    const response = await apiCall(API_CONFIG.ENDPOINTS.GET_USERS, {
      method: "GET",
      params: { role: "Admin", limit: 1 },
    });
    return response?.users?.[0] || null;
  } catch (error) {
    console.error("getAdminUser service error:", error);
    throw error;
  }
};

// Lấy danh sách người duyệt (Admin + Manager) cho workflow (GET /api/users/approvers)
export const getApprovers = async () => {
  try {
    return await apiCall(`${API_CONFIG.ENDPOINTS.GET_USERS}/approvers`, {
      method: "GET",
    });
  } catch (error) {
    console.error("getApprovers service error:", error);
    throw error;
  }
};

// Tạo user (POST /api/users/create)
export const createUser = async (payload) => {
  try {
    return await apiCall(API_CONFIG.ENDPOINTS.CREATE_USER, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("createUser service error:", error);
    throw error;
  }
};

// Cập nhật thông tin user (PUT /api/users/update/:id)
export const updateUser = async (id, userData) => {
  try {
    return await apiCall(API_CONFIG.ENDPOINTS.UPDATE_USER(id), {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  } catch (error) {
    console.error("updateUser service error:", error);
    throw error;
  }
};

// Lấy chi tiết user (GET /api/users/detail/:id)
export const getUserById = async (id) => {
  try {
    return await apiCall(API_CONFIG.ENDPOINTS.GET_USER_BY_ID(id), {
      method: "GET",
    });
  } catch (error) {
    console.error("getUserById service error:", error);
    throw error;
  }
};

// Lấy own profile (GET /api/users/me)
export const getOwnProfile = async () => {
  try {
    return await apiCall(API_CONFIG.ENDPOINTS.GET_OWN_PROFILE, {
      method: "GET",
    });
  } catch (error) {
    console.error("getOwnProfile service error:", error);
    throw error;
  }
};

// Cập nhật own profile (PUT /api/users/me)
export const updateOwnProfile = async (userData) => {
  try {
    return await apiCall(API_CONFIG.ENDPOINTS.UPDATE_OWN_PROFILE, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  } catch (error) {
    console.error("updateOwnProfile service error:", error);
    throw error;
  }
};

// Lấy danh sách gợi ý CC (GET /api/users/cc-suggestions)
export const getCcSuggestions = async () => {
  try {
    return await apiCall(API_CONFIG.ENDPOINTS.GET_CC_SUGGESTIONS, {
      method: "GET",
    });
  } catch (error) {
    console.error("getCcSuggestions service error:", error);
    throw error;
  }
};

// Tìm kiếm người dùng để CC (GET /api/users/search?q=)
export const searchUsersForCc = async (query) => {
  try {
    if (!query || query.trim() === "") {
      return [];
    }
    return await apiCall(API_CONFIG.ENDPOINTS.SEARCH_USERS_FOR_CC, {
      method: "GET",
      params: { q: query },
    });
  } catch (error) {
    console.error("searchUsersForCc service error:", error);
    throw error;
  }
};