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

// Lấy danh sách request của user (GET /api/requests)
export const getUserRequests = async (params) => {
  try {
    return await apiCall(API_CONFIG.ENDPOINTS.GET_REQUESTS, {
      method: "GET",
      params, 
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đơn (RequestService):", error);
    throw error;
  }
};

// Hủy đơn (PUT /api/requests/:id/cancel)
export const cancelRequest = async (requestId, comment = "") => {
  try {
    return await apiCall(`${API_CONFIG.ENDPOINTS.GET_REQUESTS}/${requestId}/cancel`, {
      method: "PUT",
      body: JSON.stringify({ comment }),
    });
  } catch (error) {
    console.error("Lỗi khi hủy đơn (RequestService):", error);
    throw error;
  }
};


// Phê duyệt đơn (PUT /api/requests/:id/approve)
export const approveRequest = async (requestId, comment = "") => {
  try {
    return await apiCall(`${API_CONFIG.ENDPOINTS.APPROVE_REQUEST(requestId)}`, {
      method: "PUT",
      body: JSON.stringify({ comment }),
    });
  } catch (error) {
    console.error("Lỗi khi phê duyệt đơn (RequestService):", error);
    throw error;
  }
};

// Từ chối đơn (PUT /api/requests/:id/reject)
export const rejectRequest = async (requestId, comment = "") => {
  try {
    return await apiCall(`${API_CONFIG.ENDPOINTS.REJECT_REQUEST(requestId)}`, {
      method: "PUT",
      body: JSON.stringify({ comment }),
    });
  } catch (error) {
    console.error("Lỗi khi từ chối đơn (RequestService):", error);
    throw error;
  }
};

// Yêu cầu chỉnh sửa đơn (PUT /api/requests/:id/change-request)
export const requestChanges = async (requestId, comment) => {
  try {
    return await apiCall(`${API_CONFIG.ENDPOINTS.REQUEST_CHANGE(requestId)}`, {
      method: "PUT",
      body: JSON.stringify({ comment }),
    });
  } catch (error) {
    console.error("Lỗi khi yêu cầu chỉnh sửa đơn (RequestService):", error);
    throw error;
  }
};

// Lấy chi tiết một đơn (GET /api/requests/:id)
export const getRequestById = async (requestId) => {
  try {
    return await apiCall(API_CONFIG.ENDPOINTS.GET_REQUEST_BY_ID(requestId));
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết đơn (RequestService):", error);
    throw error;
  }
};

// Gửi lại đơn sau khi chỉnh sửa (PUT /api/requests/:id/resubmit)
export const resubmitRequest = async (requestId, payload) => {
  try {
    return await apiCall(API_CONFIG.ENDPOINTS.RESUBMIT_REQUEST(requestId), {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Lỗi khi gửi lại đơn (RequestService):", error);
    throw error;
  }
};

// ============ ADMIN SERVICES ============

// Lấy tất cả requests (Admin only)
export const getAdminRequests = async (params) => {
  try {
    return await apiCall(`${API_CONFIG.ENDPOINTS.GET_REQUESTS}/admin/all`, {
      method: "GET",
      params,
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đơn (Admin):", error);
    throw error;
  }
};

// Force approve request (Admin only)
export const forceApproveRequest = async (requestId, comment = "") => {
  try {
    return await apiCall(`${API_CONFIG.ENDPOINTS.GET_REQUESTS}/admin/${requestId}/force-approve`, {
      method: "PUT",
      body: JSON.stringify({ comment }),
    });
  } catch (error) {
    console.error("Lỗi khi phê duyệt đơn (Admin):", error);
    throw error;
  }
};

// Force reject request (Admin only)
export const forceRejectRequest = async (requestId, comment) => {
  try {
    return await apiCall(`${API_CONFIG.ENDPOINTS.GET_REQUESTS}/admin/${requestId}/force-reject`, {
      method: "PUT",
      body: JSON.stringify({ comment }),
    });
  } catch (error) {
    console.error("Lỗi khi từ chối đơn (Admin):", error);
    throw error;
  }
};

// Override request (Admin only - can change Approved/Rejected status)
export const overrideRequest = async (requestId, newStatus, comment) => {
  try {
    return await apiCall(`${API_CONFIG.ENDPOINTS.OVERRIDE_REQUEST(requestId)}`, {
      method: "PUT",
      body: JSON.stringify({ newStatus, comment }),
    });
  } catch (error) {
    console.error("Lỗi khi override đơn (Admin):", error);
    throw error;
  }
};

// ===== COMMENTS =====
// Get comments of a request
export const getRequestComments = async (requestId) => {
  try {
    return await apiCall(`${API_CONFIG.ENDPOINTS.GET_REQUESTS}/${requestId}/comments`, {
      method: "GET",
    });
  } catch (error) {
    console.error("Lỗi khi lấy comments:", error);
    throw error;
  }
};

// Add comment to a request
export const addCommentToRequest = async (requestId, content) => {
  try {
    return await apiCall(`${API_CONFIG.ENDPOINTS.GET_REQUESTS}/${requestId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  } catch (error) {
    console.error("Lỗi khi thêm comment:", error);
    throw error;
  }
};

// Get admin statistics
export const getAdminStats = async (params) => {
  try {
    return await apiCall(`${API_CONFIG.ENDPOINTS.GET_REQUESTS}/admin/stats`, {
      method: "GET",
      params,
    });
  } catch (error) {
    console.error("Lỗi khi lấy thống kê (Admin):", error);
    throw error;
  }
};

// Get request counts for sidebar badges
export const getRequestCounts = async () => {
  try {
    console.log("📡 [RequestService] Calling API:", `${API_CONFIG.ENDPOINTS.GET_REQUESTS}/counts`);
    const response = await apiCall(`${API_CONFIG.ENDPOINTS.GET_REQUESTS}/counts`, {
      method: "GET",
    });
    console.log("📡 [RequestService] API Response:", response);
    return response;
  } catch (error) {
    console.error("❌ [RequestService] Lỗi khi lấy counts:", error);
    throw error;
  }
};





