// API Configuration
export const API_CONFIG = {
  BASE_URL: "http://localhost:9999",
  ENDPOINTS: {
    // Auth
    LOGIN: "/api/auth/login",

    // Users
    GET_USERS: "/api/users",
    CREATE_USER: "/api/users/create",
    GET_USER_BY_ID: (id) => `/api/users/detail/${id}`,
    UPDATE_USER: (id) => `/api/users/update/${id}`,
    GET_CC_SUGGESTIONS: "/api/users/cc-suggestions",
    SEARCH_USERS_FOR_CC: "/api/users/search",
    GET_OWN_PROFILE: `/api/users/me`,
    UPDATE_OWN_PROFILE: `/api/users/me`,

    // Departments
    GET_DEPARTMENTS: "/api/departments",
    CREATE_DEPARTMENT: "/api/departments",
    SEARCH_DEPARTMENTS: "/api/departments/search",
    GET_DEPARTMENT_BY_ID: (id) => `/api/departments/${id}`,
    GET_DEPARTMENT_MEMBERS: (id) => `/api/departments/${id}/members`,
    GET_DEPARTMENT_OPTIONS: "/api/departments/options/all",
    CHECK_DEPARTMENT_MANAGER: (id) => `/api/departments/${id}/manager-check`,

    // REQUESTS
    CREATE_REQUEST: "/api/requests/create",
    GET_REQUESTS: "/api/requests",
    APPROVE_REQUEST: (id) => `/api/requests/${id}/approve`,

    // WORKFLOWS
    GET_WORKFLOWS: "/api/workflows",
    GET_WORKFLOW_TEMPLATE: "/api/workflows/template",
    CREATE_WORKFLOW: "/api/workflows",
    UPDATE_WORKFLOW: (id) => `/api/workflows/${id}`,
    DELETE_WORKFLOW: (id) => `/api/workflows/${id}`,
  },
};

// API Helper functions
export const apiCall = async (endpoint, options = {}) => {
  let url = `${API_CONFIG.BASE_URL}${endpoint}`;
  if (options.params) {
    const filteredParams = Object.entries(options.params).reduce(
      (acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = value;
        }
        return acc;
      },
      {}
    );
    const queryParams = new URLSearchParams(filteredParams).toString();
    if (queryParams) {
      url += `?${queryParams}`;
    }
    delete options.params;
  }

  const token = localStorage.getItem("auth_token");

  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.message || "Đã có lỗi xảy ra");
      error.response = { data, status: response.status };
      throw error;
    }

    return data;
  } catch (error) {
    console.error("API Call Error:", error?.response?.data || error.message);
    throw error;
  }
};

export default API_CONFIG;