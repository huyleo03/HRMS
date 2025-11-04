import { apiCall } from "./api";

// Payroll API endpoints
const PAYROLL_ENDPOINTS = {
  CALCULATE_ALL: "/api/payroll/calculate-all",
  CALCULATE: "/api/payroll/calculate",
  GET_ALL: "/api/payroll/all",
  GET_ANALYTICS: "/api/payroll/analytics",
  GET_BY_ID: (id) => `/api/payroll/${id}`,
  UPDATE: (id) => `/api/payroll/${id}`,
  APPROVE: (id) => `/api/payroll/${id}/approve`,
  BULK_APPROVE: "/api/payroll/bulk-approve",
  MARK_PAID: (id) => `/api/payroll/${id}/mark-paid`,
  DELETE: (id) => `/api/payroll/${id}`,
  MY_PAYROLLS: "/api/payroll/my-payrolls",
};

const PayrollService = {
  // Calculate payroll for all employees
  calculateAllPayroll: async (month, year) => {
    return apiCall(PAYROLL_ENDPOINTS.CALCULATE_ALL, {
      method: "POST",
      body: JSON.stringify({ month, year }),
    });
  },

  // Calculate payroll for specific employee
  calculatePayroll: async (employeeId, month, year) => {
    return apiCall(PAYROLL_ENDPOINTS.CALCULATE, {
      method: "POST",
      body: JSON.stringify({ employeeId, month, year }),
    });
  },

  // Get all payrolls with filters
  getAllPayrolls: async (filters = {}) => {
    return apiCall(PAYROLL_ENDPOINTS.GET_ALL, {
      method: "GET",
      params: filters,
    });
  },

  // Get payroll by ID
  getPayrollById: async (id) => {
    return apiCall(PAYROLL_ENDPOINTS.GET_BY_ID(id), {
      method: "GET",
    });
  },

  // Update payroll (manual adjustment)
  updatePayroll: async (id, updates) => {
    return apiCall(PAYROLL_ENDPOINTS.UPDATE(id), {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  // Approve single payroll
  approvePayroll: async (id) => {
    return apiCall(PAYROLL_ENDPOINTS.APPROVE(id), {
      method: "POST",
    });
  },

  // Bulk approve payrolls
  bulkApprovePayrolls: async (payrollIds) => {
    return apiCall(PAYROLL_ENDPOINTS.BULK_APPROVE, {
      method: "POST",
      body: JSON.stringify({ payrollIds }),
    });
  },

  // Mark payroll as paid
  markAsPaid: async (id, paymentDetails) => {
    return apiCall(PAYROLL_ENDPOINTS.MARK_PAID(id), {
      method: "POST",
      body: JSON.stringify(paymentDetails),
    });
  },

  // Delete payroll (only Draft)
  deletePayroll: async (id) => {
    return apiCall(PAYROLL_ENDPOINTS.DELETE(id), {
      method: "DELETE",
    });
  },

  // Get analytics
  getAnalytics: async (year) => {
    return apiCall(PAYROLL_ENDPOINTS.GET_ANALYTICS, {
      method: "GET",
      params: { year },
    });
  },

  // Get my payrolls (for employee/manager)
  getMyPayrolls: async (params = {}) => {
    return apiCall(PAYROLL_ENDPOINTS.MY_PAYROLLS, {
      method: "GET",
      params,
    });
  },
};

export default PayrollService;
