import { apiCall, API_CONFIG } from "./api";

// Lấy danh sách users (GET /api/users)
export const getUsers = async (params = {}) => {
  try {
    return await apiCall(API_CONFIG.ENDPOINTS.GET_USERS, {
      method: "GET",
      params: params,
    });
  } catch (error) {
    console.error("getUsers service error:", error);
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

// Đổi trạng thái (PUT /api/users/status/:id)
export const changeUserStatus = async (id, status) => {
  try {
    return await apiCall(API_CONFIG.ENDPOINTS.CHANGE_USER_STATUS(id), {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  } catch (error) {
    console.error("changeUserStatus service error:", error);
    throw error;
  }
};

// Đổi vai trò (PUT /api/users/role/:id)
export const changeUserRole = async (id, role) => {
  try {
    return await apiCall(API_CONFIG.ENDPOINTS.CHANGE_USER_ROLE(id), {
      method: "PUT",
      body: JSON.stringify({ role }),
    });
  } catch (error) {
    console.error("changeUserRole service error:", error);
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

// Xoá user (DELETE /api/users/:id)
export const deleteUser = async (id) => {
  try {
    return await apiCall(API_CONFIG.ENDPOINTS.DELETE_USER(id), {
      method: "DELETE",
    });
  } catch (error) {
    console.error("deleteUser service error:", error);
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