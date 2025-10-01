// src/services/user.service.js
import axios from "axios";

const API = process.env.REACT_APP_API_URL_BACKEND;

// Lấy danh sách users (GET /api/users)
export const getUsers = async (
  {
    page = 1,
    limit = 10,
    sortBy = "created_at",
    sortOrder = "asc",
    name,
    role,
    status,
    department,
  },
  token
) => {
  try {
    const res = await axios.get(`${API}/users`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        page,
        limit,
        sortBy,
        sortOrder,
        name,
        role,
        status,
        department,
      },
    });
    return res.data;
  } catch (error) {
    console.error("getUsers error:", error?.response?.data || error.message);
    throw error;
  }
};

// Tạo user (POST /api/users/create)
export const createUser = async (payload, token) => {
  try {
    const res = await axios.post(`${API}/users/create`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data; // { message, user, temporaryPassword }
  } catch (error) {
    console.error("createUser error:", error?.response?.data || error.message);
    throw error;
  }
};

// Đổi trạng thái (PUT /api/users/status/:id)
export const changeUserStatus = async (id, status, token) => {
  try {
    const res = await axios.put(
      `${API}/users/status/${id}`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data; // { message, user }
  } catch (error) {
    console.error(
      "changeUserStatus error:",
      error?.response?.data || error.message
    );
    throw error;
  }
};

// Đổi vai trò (PUT /api/users/role/:id)
export const changeUserRole = async (id, role, token) => {
  try {
    const res = await axios.put(
      `${API}/users/role/${id}`,
      { role },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data; // { message, user }
  } catch (error) {
    console.error(
      "changeUserRole error:",
      error?.response?.data || error.message
    );
    throw error;
  }
};

// Cập nhật thông tin user (PUT /api/users/update/:id)
export const updateUser = async (id, userData, token) => {
  try {
    const res = await axios.put(
      `${API}/users/update/${id}`,
      userData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data; // { message, user }
  } catch (error) {
    console.error(
      "updateUser error:",
      error?.response?.data || error.message
    );
    throw error;
  }
};

// Xoá user (DELETE /api/users/:id)
export const deleteUser = async (id, token) => {
  try {
    const res = await axios.delete(`${API}/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data; // { message }
  } catch (error) {
    console.error("deleteUser error:", error?.response?.data || error.message);
    throw error;
  }
};

// Lấy chi tiết user (GET /api/users/detail/:id) 
export const getUserById = async (id, token) => {
  try {
    const res = await axios.get(`${API}/users/detail/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data; // { user }
  } catch (error) {
    console.error("getUserById error:", error?.response?.data || error.message);
    throw error;
  }
};

// Lấy own profile (GET /api/users/:id)
export const getOwnProfile = async (userId, token) => {
  try {
    console.log('getOwnProfile API call:', {
      url: `${API}/users/${userId}`,
      hasToken: !!token
    });
    
    const res = await axios.get(`${API}/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    console.log('getOwnProfile response:', res.data);
    return res.data; // { user }
  } catch (error) {
    console.error("getOwnProfile error:", error?.response?.data || error.message);
    console.error("Full error:", error);
    throw error;
  }
};

// Cập nhật own profile (PUT /api/users/:id)
export const updateOwnProfile = async (userId, userData, token) => {
  try {
    console.log('updateOwnProfile API call:', {
      url: `${API}/users/${userId}`,
      userData,
      hasToken: !!token
    });
    
    const res = await axios.put(`${API}/users/${userId}`, userData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    console.log('updateOwnProfile response:', res.data);
    return res.data; // { message, user }
  } catch (error) {
    console.error("updateOwnProfile error:", error?.response?.data || error.message);
    console.error("Full error:", error);
    throw error;
  }
};
