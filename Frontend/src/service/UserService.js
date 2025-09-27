// src/services/user.service.js
import axios from "axios";

const API = process.env.REACT_APP_API_URL_BACKEND; 

// Lấy danh sách users (GET /api/users)
export const getUsers = async (
  { page = 1, limit = 10, sortBy = "created_at", sortOrder = "asc", name, role, status, department },
  token
) => {
  try {
    const res = await axios.get(`${API}/api/users`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page, limit, sortBy, sortOrder, name, role, status, department },
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
    const res = await axios.post(`${API}/api/users/create`, payload, {
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
      `${API}/api/users/status/${id}`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data; // { message, user }
  } catch (error) {
    console.error("changeUserStatus error:", error?.response?.data || error.message);
    throw error;
  }
};

// Đổi vai trò (PUT /api/users/role/:id)
export const changeUserRole = async (id, role, token) => {
  try {
    const res = await axios.put(
      `${API}/api/users/role/${id}`,
      { role },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data; // { message, user }
  } catch (error) {
    console.error("changeUserRole error:", error?.response?.data || error.message);
    throw error;
  }
};

// Xoá user (DELETE /api/users/:id)
export const deleteUser = async (id, token) => {
  try {
    const res = await axios.delete(`${API}/api/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data; // { message }
  } catch (error) {
    console.error("deleteUser error:", error?.response?.data || error.message);
    throw error;
  }
};

// (Tuỳ chọn) Lấy chi tiết user (GET /api/users/:id) — nếu bạn thêm route này
export const getUserById = async (id, token) => {
  try {
    const res = await axios.get(`${API}/api/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data; // { user }
  } catch (error) {
    console.error("getUserById error:", error?.response?.data || error.message);
    throw error;
  }
};
