import { apiCall } from './api';

/**
 * Dashboard Service
 * Handles all dashboard-related API calls
 */
const DashboardService = {
    /**
     * Get overview statistics for Admin dashboard
     * @returns {Promise} Dashboard statistics data
     */
    getOverviewStats: async () => {
        try {
            const data = await apiCall('/api/dashboard/stats/overview', {
                method: 'GET'
            });
            return data;
        } catch (error) {
            console.error('Error fetching overview stats:', error);
            throw error;
        }
    },

    /**
     * Get employee statistics
     * @returns {Promise} Employee statistics data
     */
    getEmployeeStats: async () => {
        try {
            const data = await apiCall('/api/dashboard/stats/employees', {
                method: 'GET'
            });
            return data;
        } catch (error) {
            console.error('Error fetching employee stats:', error);
            throw error;
        }
    },

    /**
     * Get attendance statistics
     * @param {Object} params - Query parameters (startDate, endDate, etc.)
     * @returns {Promise} Attendance statistics data
     */
    getAttendanceStats: async (params = {}) => {
        try {
            const data = await apiCall('/api/dashboard/stats/attendance', {
                method: 'GET',
                params
            });
            return data;
        } catch (error) {
            console.error('Error fetching attendance stats:', error);
            throw error;
        }
    },

    /**
     * Get request statistics
     * @param {Object} params - Query parameters (startDate, endDate, status, etc.)
     * @returns {Promise} Request statistics data
     */
    getRequestStats: async (params = {}) => {
        try {
            const data = await apiCall('/api/dashboard/stats/requests', {
                method: 'GET',
                params
            });
            return data;
        } catch (error) {
            console.error('Error fetching request stats:', error);
            throw error;
        }
    },

    /**
     * Get payroll statistics
     * @param {Object} params - Query parameters (month, year, etc.)
     * @returns {Promise} Payroll statistics data
     */
    getPayrollStats: async (params = {}) => {
        try {
            const data = await apiCall('/api/dashboard/stats/payroll', {
                method: 'GET',
                params
            });
            return data;
        } catch (error) {
            console.error('Error fetching payroll stats:', error);
            throw error;
        }
    },

    /**
     * Get department statistics
     * @returns {Promise} Department statistics data
     */
    getDepartmentStats: async () => {
        try {
            const data = await apiCall('/api/dashboard/stats/departments', {
                method: 'GET'
            });
            return data;
        } catch (error) {
            console.error('Error fetching department stats:', error);
            throw error;
        }
    },

    /**
     * Get role distribution statistics
     * @returns {Promise} Role distribution data
     */
    getRoleStats: async () => {
        try {
            const data = await apiCall('/api/dashboard/stats/roles', {
                method: 'GET'
            });
            return data;
        } catch (error) {
            console.error('Error fetching role stats:', error);
            throw error;
        }
    },

    /**
     * Get trend data for charts
     * @param {string} type - Type of trend (attendance, requests, payroll, etc.)
     * @param {Object} params - Query parameters (period, startDate, endDate, etc.)
     * @returns {Promise} Trend data
     */
    getTrendData: async (type, params = {}) => {
        try {
            const data = await apiCall(`/api/dashboard/trends/${type}`, {
                method: 'GET',
                params
            });
            return data;
        } catch (error) {
            console.error(`Error fetching ${type} trend data:`, error);
            throw error;
        }
    },

    /**
     * Get detailed requests statistics
     * @returns {Promise} Requests details data
     */
    getRequestsDetails: async () => {
        try {
            const data = await apiCall('/api/dashboard/stats/requests-details', {
                method: 'GET'
            });
            return data;
        } catch (error) {
            console.error('Error fetching requests details:', error);
            throw error;
        }
    },

    /**
     * Get attendance trend (7 days or 6 months)
     * @param {string} period - 'week' or 'month'
     * @returns {Promise} Attendance trend data
     */
    getAttendanceTrend: async (period = 'week') => {
        try {
            const data = await apiCall('/api/dashboard/stats/attendance-trend', {
                method: 'GET',
                params: { period }
            });
            return data;
        } catch (error) {
            console.error('Error fetching attendance trend:', error);
            throw error;
        }
    },

    /**
     * Get department comparison
     * @returns {Promise} Department comparison data
     */
    getDepartmentComparison: async () => {
        try {
            const data = await apiCall('/api/dashboard/stats/department-comparison', {
                method: 'GET'
            });
            return data;
        } catch (error) {
            console.error('Error fetching department comparison:', error);
            throw error;
        }
    },

    /**
     * Get late employees today
     * @returns {Promise} Late employees data
     */
    getLateEmployeesToday: async () => {
        try {
            const data = await apiCall('/api/dashboard/stats/late-employees-today', {
                method: 'GET'
            });
            return data;
        } catch (error) {
            console.error('Error fetching late employees:', error);
            throw error;
        }
    }
};

export default DashboardService;
