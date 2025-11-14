const SystemConfig = require("../models/SystemConfig");

// Get system config with caching
let cachedConfig = null;
let lastFetch = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getSystemConfig() {
  try {
    // Return cached config if still valid
    if (cachedConfig && lastFetch && Date.now() - lastFetch < CACHE_DURATION) {
      return cachedConfig;
    }

    // Fetch fresh config
    const config = await SystemConfig.findOne();

    if (!config) {
      // Return default config if not found
      return {
        overtime: {
          otRateWeekday: 1.5,
          otRateHoliday: 3.0,
        },
        workSchedule: {
          standardWorkHours: 8,
          standardWorkDays: 22,
        },
      };
    }

    // Cache the config
    cachedConfig = config;
    lastFetch = Date.now();

    return config;
  } catch (error) {
    console.error("Error fetching system config:", error);
    // Return default on error
    return {
      overtime: {
        otRateWeekday: 1.5,
        otRateHoliday: 3.0,
      },
      workSchedule: {
        standardWorkHours: 8,
        standardWorkDays: 22,
      },
    };
  }
}

// Clear cache (use when config is updated)
function clearConfigCache() {
  cachedConfig = null;
  lastFetch = null;
}

module.exports = {
  getSystemConfig,
  clearConfigCache,
};
