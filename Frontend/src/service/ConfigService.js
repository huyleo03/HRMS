import { apiCall, API_CONFIG } from "./api";

// Get company config
export const getCompanyConfig = async () => {
  try {
    return await apiCall(API_CONFIG.ENDPOINTS.GET_COMPANY_CONFIG, {
      method: "GET",
    });
  } catch (error) {
    console.error("getCompanyConfig service error:", error);
    throw error;
  }
};

// Update company config
export const updateCompanyConfig = async (data) => {
  try {
    return await apiCall(API_CONFIG.ENDPOINTS.UPDATE_COMPANY_CONFIG, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error("updateCompanyConfig service error:", error);
    throw error;
  }
};

// Test IP address
export const testIPAddress = async (ip) => {
  try {
    return await apiCall(API_CONFIG.ENDPOINTS.TEST_IP, {
      method: "POST",
      body: JSON.stringify({ ip }),
    });
  } catch (error) {
    console.error("testIPAddress service error:", error);
    throw error;
  }
};

// Reset to default
export const resetToDefault = async () => {
  try {
    return await apiCall(API_CONFIG.ENDPOINTS.RESET_CONFIG, {
      method: "POST",
    });
  } catch (error) {
    console.error("resetToDefault service error:", error);
    throw error;
  }
};

// Get current IP
export const getCurrentIP = async () => {
  try {
    return await apiCall(API_CONFIG.ENDPOINTS.GET_CURRENT_IP, {
      method: "GET",
    });
  } catch (error) {
    console.error("getCurrentIP service error:", error);
    throw error;
  }
};
