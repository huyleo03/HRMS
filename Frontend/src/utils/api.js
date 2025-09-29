// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:9999', // Change this to match your backend port
  ENDPOINTS: {
    CREATE_USER: '/api/users/create',
    GET_DEPARTMENTS: '/api/departments',
    LOGIN: '/api/auth/login'
  }
};

// API Helper functions
export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
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
    console.log('API Call:', url, config); // Debug log
    const response = await fetch(url, config);
    const data = await response.json();
    
    console.log('API Response:', { status: response.status, data }); // Debug log
    
    return {
      success: response.ok,
      status: response.status,
      data: data,
    };
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export default API_CONFIG;