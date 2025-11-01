import { apiCall } from "./api";

const HOLIDAYS_ENDPOINT = "/api/holidays";

// ===== 1. CREATE HOLIDAY (Admin only) =====
export const createHoliday = async (holidayData) => {
  try {
    const response = await apiCall(HOLIDAYS_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(holidayData)
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ===== 2. UPDATE HOLIDAY (Admin only) =====
export const updateHoliday = async (id, holidayData) => {
  try {
    const response = await apiCall(`${HOLIDAYS_ENDPOINT}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(holidayData)
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ===== 3. DELETE HOLIDAY (Admin only) =====
export const deleteHoliday = async (id) => {
  try {
    console.log('🗑️ Deleting holiday with ID:', id);
    const response = await apiCall(`${HOLIDAYS_ENDPOINT}/${id}`, { method: 'DELETE' });
    console.log('✅ Delete response:', response);
    return response;
  } catch (error) {
    console.error('❌ Delete error:', error);
    throw error.response?.data || error;
  }
};

// ===== 4. GET CALENDAR HOLIDAYS (for calendar view) =====
export const getCalendarHolidays = async ({ year, month }) => {
  try {
    const response = await apiCall(`${HOLIDAYS_ENDPOINT}/calendar?year=${year}&month=${month}`, { method: 'GET' });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ===== 5. BULK CREATE HOLIDAYS (Admin only) =====
export const bulkCreateHolidays = async (holidays) => {
  try {
    const response = await apiCall(`${HOLIDAYS_ENDPOINT}/bulk`, {
      method: 'POST',
      body: JSON.stringify({ holidays })
    });
    return response;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ===== 6. GENERATE RECURRING HOLIDAYS (Admin only) =====
export const generateRecurringHolidays = async (sourceYear, targetYear) => {
  try {
    const response = await apiCall(`${HOLIDAYS_ENDPOINT}/generate-recurring`, {
      method: 'POST',
      body: JSON.stringify({ sourceYear, targetYear })
    });
    return response;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ===== 7. CHECK IF DATE IS HOLIDAY =====
export const checkHoliday = async (date) => {
  try {
    const response = await apiCall(`${HOLIDAYS_ENDPOINT}/check?date=${date}`, { method: 'GET' });
    return response;
  } catch (error) {
    throw error.response?.data || error;
  }
};
