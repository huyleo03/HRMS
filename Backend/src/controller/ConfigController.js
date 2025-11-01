const SystemConfig = require("../models/SystemConfig");
const User = require("../models/User");

// ============ HELPER FUNCTIONS ============

// Get or create default config
async function getOrCreateConfig() {
  let config = await SystemConfig.findOne({ configType: "company" });
  
  if (!config) {
    // Create default config if not exists
    config = await SystemConfig.create({
      configType: "company",
      workSchedule: {
        workStartTime: "08:00",
        workEndTime: "17:00",
        gracePeriodMinutes: 15,
      },
      overtime: {
        otMinimumMinutes: 30,
        otRateWeekday: 1.5,
        otRateWeekend: 2.0,
        otRateHoliday: 3.0,
        requireApproval: true,
      },
      network: {
        allowedIPs: ["::1", "127.0.0.1", "::ffff:127.0.0.1"],
        allowRemoteCheckIn: false,
        requireVPN: false,
      },
      faceRecognition: {
        enabled: true,
        strictMode: false,
        savePhotos: true,
        photoRetentionDays: 90,
      },
      autoActions: {
        autoMarkAbsentTime: "09:30",
        enableAutoMarkAbsent: true,
      },
    });
  }
  
  return config;
}

// Validate time format (HH:mm)
function isValidTimeFormat(time) {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

// Validate IP address or CIDR
function isValidIP(ip) {
  // Simple validation for IPv4, IPv6, and CIDR notation
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
  const ipv6Regex = /^([\da-fA-F]{0,4}:){2,7}[\da-fA-F]{0,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip) || ip === "::1" || ip === "::ffff:127.0.0.1";
}

// ============ CONTROLLERS ============

// 1. Get company config
exports.getCompanyConfig = async (req, res) => {
  try {
    const config = await getOrCreateConfig();
    
    res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// 2. Update company config
exports.updateCompanyConfig = async (req, res) => {
  try {
    const userId = req.user._id;
    const userName = req.user.full_name;
    const updates = req.body;
    
    // Get existing config
    let config = await getOrCreateConfig();
    
    // Validate time formats if provided
    if (updates.workSchedule) {
      const { workStartTime, workEndTime, autoMarkAbsentTime } = updates.workSchedule;
      
      if (workStartTime && !isValidTimeFormat(workStartTime)) {
        return res.status(400).json({
          success: false,
          message: "Định dạng giờ vào không hợp lệ (HH:mm)",
        });
      }
      
      if (workEndTime && !isValidTimeFormat(workEndTime)) {
        return res.status(400).json({
          success: false,
          message: "Định dạng giờ ra không hợp lệ (HH:mm)",
        });
      }
      
      // Validate start time < end time
      if (workStartTime && workEndTime) {
        const [startH, startM] = workStartTime.split(":").map(Number);
        const [endH, endM] = workEndTime.split(":").map(Number);
        const startMins = startH * 60 + startM;
        const endMins = endH * 60 + endM;
        
        if (startMins >= endMins) {
          return res.status(400).json({
            success: false,
            message: "Giờ vào phải nhỏ hơn giờ ra",
          });
        }
      }
    }
    
    // Validate auto mark absent time
    if (updates.autoActions?.autoMarkAbsentTime) {
      if (!isValidTimeFormat(updates.autoActions.autoMarkAbsentTime)) {
        return res.status(400).json({
          success: false,
          message: "Định dạng giờ tự động đánh vắng không hợp lệ (HH:mm)",
        });
      }
    }
    
    // Validate IPs if provided
    if (updates.network?.allowedIPs) {
      const invalidIPs = updates.network.allowedIPs.filter(ip => !isValidIP(ip));
      if (invalidIPs.length > 0) {
        return res.status(400).json({
          success: false,
          message: `IP không hợp lệ: ${invalidIPs.join(", ")}`,
        });
      }
      
      if (updates.network.allowedIPs.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Phải có ít nhất 1 IP được phép",
        });
      }
    }
    
    // Update config fields
    if (updates.workSchedule) {
      config.workSchedule = { ...config.workSchedule, ...updates.workSchedule };
    }
    if (updates.overtime) {
      config.overtime = { ...config.overtime, ...updates.overtime };
    }
    if (updates.network) {
      config.network = { ...config.network, ...updates.network };
    }
    if (updates.faceRecognition) {
      config.faceRecognition = { ...config.faceRecognition, ...updates.faceRecognition };
    }
    if (updates.workingDays) {
      config.workingDays = { ...config.workingDays, ...updates.workingDays };
    }
    if (updates.autoActions) {
      config.autoActions = { ...config.autoActions, ...updates.autoActions };
    }
    
    // Update audit fields
    config.lastUpdatedBy = userId;
    config.lastUpdatedByName = userName;
    
    await config.save();
    
    // 🔄 Nếu thay đổi config auto mark absent, refresh cron job ngay lập tức
    if (updates.autoActions) {
      try {
        const autoMarkAbsentService = require('../services/autoMarkAbsentService');
        await autoMarkAbsentService.setupCronJob();
       
      } catch (error) {
        console.error('⚠️ Error refreshing cron job:', error.message);
      }
    }
    
    res.status(200).json({
      success: true,
      message: "Cập nhật cấu hình thành công",
      data: config,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// 3. Test IP address
exports.testIPAddress = async (req, res) => {
  try {
    const { ip } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (!ip) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp địa chỉ IP",
      });
    }
    
    // Validate IP format
    if (!isValidIP(ip)) {
      return res.status(400).json({
        success: false,
        message: "Định dạng IP không hợp lệ",
        data: { isValid: false },
      });
    }
    
    // Get current config
    const config = await getOrCreateConfig();
    
    // Check if IP is in allowed list
    const isAllowed = config.network.allowedIPs.some(allowedIP => {
      if (allowedIP === ip) return true;
      
      // Check CIDR notation
      if (allowedIP.includes("/")) {
        // Simple CIDR check (for basic cases)
        const [network] = allowedIP.split("/");
        return ip.startsWith(network.split(".").slice(0, 3).join("."));
      }
      
      return false;
    });
    
    res.status(200).json({
      success: true,
      data: {
        testedIP: ip,
        currentIP: clientIP,
        isValid: true,
        isAllowed: isAllowed,
        message: isAllowed 
          ? "IP này được phép chấm công" 
          : "IP này KHÔNG được phép chấm công",
      },
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// 4. Reset to default config
exports.resetToDefault = async (req, res) => {
  try {
    const userId = req.user._id;
    const userName = req.user.full_name;
    
    // Delete existing config and create new default
    await SystemConfig.deleteOne({ configType: "company" });
    
    const config = await SystemConfig.create({
      configType: "company",
      workSchedule: {
        workStartTime: "08:00",
        workEndTime: "17:00",
        standardWorkHours: 8,
        gracePeriodMinutes: 15,
        lunchBreakMinutes: 60,
      },
      overtime: {
        otMinimumMinutes: 30,
        otRateWeekday: 1.5,
        otRateWeekend: 2.0,
        otRateHoliday: 3.0,
        requireApproval: true,
      },
      network: {
        allowedIPs: ["::1", "127.0.0.1", "::ffff:127.0.0.1"],
        allowRemoteCheckIn: false,
        requireVPN: false,
      },
      faceRecognition: {
        enabled: true,
        strictMode: false,
        savePhotos: true,
        photoRetentionDays: 90,
      },
      workingDays: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false,
      },
      autoActions: {
        autoMarkAbsentTime: "09:30",
        enableAutoMarkAbsent: true,
      },
      lastUpdatedBy: userId,
      lastUpdatedByName: userName,
    });
    
    res.status(200).json({
      success: true,
      message: "Đã reset cấu hình về mặc định",
      data: config,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// 5. Get current client IP (for testing)
exports.getCurrentIP = async (req, res) => {
  try {
    // Try to get real IP from headers first (for proxies/load balancers)
    let clientIP = 
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.headers['x-real-ip'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.ip;
    
    // Convert IPv6 localhost to IPv4 for consistency
    if (clientIP === '::1' || clientIP === '::ffff:127.0.0.1') {
      clientIP = '127.0.0.1';
    }
    
    // If it's IPv6-mapped IPv4, extract the IPv4 part
    if (clientIP.startsWith('::ffff:')) {
      clientIP = clientIP.substring(7);
    }
    
    res.status(200).json({
      success: true,
      data: {
        ip: clientIP,
        raw: req.ip || req.connection.remoteAddress,
        headers: {
          'x-forwarded-for': req.headers['x-forwarded-for'],
          'x-real-ip': req.headers['x-real-ip'],
        },
      },
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Export helper function for use in AttendanceController
exports.getSystemConfig = getOrCreateConfig;

module.exports = exports;
