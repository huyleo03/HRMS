import axios from "axios";
const API = process.env.REACT_APP_API_URL_BACKEND;

export const getDepartmentOptions = async () => {
  try {
    const response = await axios.get(`${API}/departments/options/list`);
    return response.data;
  } catch (error) {
    console.error(
      "getDepartmentOptions error:",
      error?.response?.data || error.message
    );
    throw error;
  }
};
