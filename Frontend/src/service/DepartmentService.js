import axios from "axios";
const API = process.env.REACT_APP_API_URL_BACKEND;

export const getDepartments = async (token) => {
  const res = await axios.get(`${API}/api/departments`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data; // { success, data: [...] }
};

export const searchDepartments = async (keyword, token) => {
  const res = await axios.get(`${API}/api/departments/search`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { keyword },
  });
  return res.data; // { success, data: { departments, users } }
};
