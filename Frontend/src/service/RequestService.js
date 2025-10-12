import { apiCall, API_CONFIG } from "./api";

// Tạo request mới (POST /api/requests/create)
export const createRequest = async (payload) => {
  try {
    return await apiCall(API_CONFIG.ENDPOINTS.CREATE_REQUEST, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Lỗi khi tạo đơn (RequestService):", error);
    throw error;
  }
};
