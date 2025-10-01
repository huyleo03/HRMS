import axios from "axios";
const API = process.env.REACT_APP_API_URL_BACKEND;

export const getDepartmentOptions = async (token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const response = await axios.get(`${API}/departments/options/list`, config);
    return response.data;
  } catch (error) {
    console.error(
      "getDepartmentOptions error:",
      error?.response?.data || error.message
    );
    throw error;
  }
};

export const checkDepartmentManager = async (departmentId, token) => {
  if (!departmentId || !token) {
    throw new Error("Department ID and token are required.");
  }
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const response = await axios.get(
      `${API}/departments/${departmentId}/manager-check`,
      config 
    );
    return response.data; 
  } catch (error) {
    console.error(
      "checkDepartmentManager error:",
      error?.response?.data || error.message
    );
    throw error;
  }
};
