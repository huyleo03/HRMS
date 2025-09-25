// API Service for connecting Frontend with Backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9999';

class ApiService {
  // Helper method for making requests
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth APIs
  async login(email, password, rememberMe = false) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, rememberMe }),
    });
  }

  async forgotPassword(email) {
    return this.request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
  }

  async verifyOtp(otp, resetToken) {
    return this.request('/api/auth/verify-otp', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resetToken}`,
      },
      body: JSON.stringify({ otp }),
    });
  }

  async resetPassword(newPassword, confirmPassword, resetToken) {
    return this.request('/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resetToken}`,
      },
      body: JSON.stringify({ newPassword, confirmPassword }),
    });
  }

  // User APIs
  async createUser(userData, token) {
    return this.request('/api/users/create-user', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });
  }

  async updateProfile(profileData, token) {
    return this.request('/api/users/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });
  }

  // Department APIs
  async getDepartments() {
    return this.request('/api/departments');
  }

  async getDepartmentById(id) {
    return this.request(`/api/departments/${id}`);
  }

  async createDepartment(departmentData) {
    return this.request('/api/departments', {
      method: 'POST',
      body: JSON.stringify(departmentData),
    });
  }

  async searchDepartments(query) {
    return this.request(`/api/departments/search/query?q=${encodeURIComponent(query)}`);
  }

  async addEmployeeToDepartment(employeeData) {
    return this.request('/api/departments/add-employee', {
      method: 'POST',
      body: JSON.stringify(employeeData),
    });
  }

  // Token management
  getToken() {
    return localStorage.getItem('auth_token');
  }

  setToken(token) {
    localStorage.setItem('auth_token', token);
  }

  removeToken() {
    localStorage.removeItem('auth_token');
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getToken();
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;
