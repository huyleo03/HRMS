// src/service/DepartmentService.js
import axios from "axios";
const API = process.env.REACT_APP_API_URL_BACKEND;

export const getDepartments = async ({ page = 1, limit = 6, q = "", sortBy = "created_at", sortOrder = "asc" } = {}, token) => {
  const res = await axios.get(`${API}/departments`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    params: { page, limit, q, sortBy, sortOrder },
  });
  return res.data;
};

// Dùng nếu cần search riêng
export const searchDepartments = async (keyword, token) => {
  const res = await axios.get(`${API}/departments/search`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { keyword },
  });
  return res.data;
};

// LẤY CHI TIẾT PHÒNG BAN (full members - không phân trang)
export const getDepartmentById = async (id, token) => {
  const res = await axios.get(`${API}/departments/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data; // {success, data:{ department fields..., members: [] }}
};

// VIEW ALL MEMBERS (phân trang tại server)
export const getDepartmentMembers = async (id, params = {}, token) => {
  const res = await axios.get(`${API}/departments/${id}/members`, {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return res.data; // <<< QUAN TRỌNG: phải return
};

// options (đổi path khớp backend)
export const getDepartmentOptions = async (token) => {
  const res = await axios.get(`${API}/departments/options/all`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return res.data;
};
