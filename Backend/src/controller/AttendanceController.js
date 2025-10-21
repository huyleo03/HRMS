 const Attendance = require("../models/Attendance");
const User = require("../models/User");
const XLSX = require("xlsx");

// Cấu hình chấm công (hardcoded, có thể chuyển sang DB sau)
const CONFIG = {
  workStartTime: "08:00",
  workEndTime: "17:00",
  standardWorkHours: 8,
  gracePeriodMinutes: 15,
  otMinimumMinutes: 30,
  allowedIPs: [
    // Localhost (để test trên máy local)
    "::1",
    "127.0.0.1",
    "::ffff:127.0.0.1",
    
    // IP công cộng của máy bạn (lấy từ ipify.org)
    "42.118.89.199",
    
    // IPv6 của bạn (nếu cần)
    "2402:800:6106:4fc0::2",
    "2402:800:6106:4fc0:3de3:19da:bce2:5d05",
  ],
};


// ============ HELPERS ============

// Hàm lấy IP thật của client (xử lý proxy, load balancer)
function getClientIP(req) {
  // Thử lấy từ các headers khác nhau (do proxy/load balancer set)
  const forwarded = req.headers['x-forwarded-for'];
  const realIP = req.headers['x-real-ip'];
  const cfConnectingIP = req.headers['cf-connecting-ip']; // Cloudflare
  
  // X-Forwarded-For có thể chứa nhiều IP: "client, proxy1, proxy2"
  // Lấy IP đầu tiên (IP của client thật)
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim());
    return ips[0];
  }
  
  if (realIP) return realIP;
  if (cfConnectingIP) return cfConnectingIP;
  
  // Fallback về req.ip hoặc remoteAddress
  return req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
}

function normalizeDate(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function calculateStatus(clockIn, config) {
  const clockInTime = new Date(clockIn);
  const [startHour, startMinute] = config.workStartTime.split(":").map(Number);
  
  const scheduledStart = new Date(clockInTime);
  scheduledStart.setHours(startHour, startMinute, 0, 0);
  
  const lateMs = clockInTime - scheduledStart;
  const lateMinutes = Math.max(0, Math.floor(lateMs / 60000));
  
  return {
    isLate: lateMinutes > config.gracePeriodMinutes,
    lateMinutes: lateMinutes > config.gracePeriodMinutes ? lateMinutes : 0,
    status: lateMinutes > config.gracePeriodMinutes ? "Late" : "Present",
  };
}

function calculateWorkHours(clockIn, clockOut, config) {
  if (!clockIn || !clockOut) return { workHours: 0, overtimeHours: 0 };
  
  const workMs = new Date(clockOut) - new Date(clockIn);
  const workMinutes = Math.floor(workMs / 60000);
  const workHours = +(workMinutes / 60).toFixed(2);
  
  const overtimeMinutes = Math.max(0, workMinutes - (config.standardWorkHours * 60));
  const overtimeHours = overtimeMinutes >= config.otMinimumMinutes 
    ? +(overtimeMinutes / 60).toFixed(2) 
    : 0;
  
  return { workHours, overtimeHours };
}

// ============ EMPLOYEE ENDPOINTS ============

// 1. Check-in
exports.clockIn = async (req, res) => {
  try {
    const userId = req.user._id;
    const { photo } = req.body;
    const clientIP = getClientIP(req);
    
    // Kiểm tra IP (intranet) - so sánh chính xác
    const isIntranet = CONFIG.allowedIPs.some(ip => ip === clientIP);
    if (!isIntranet) {
      return res.status(403).json({
        success: false,
        message: "Bạn không ở trong mạng nội bộ công ty. Vui lòng kết nối mạng văn phòng.",
        debug: { 
          clientIP, 
          allowedIPs: CONFIG.allowedIPs,
          headers: {
            'x-forwarded-for': req.headers['x-forwarded-for'],
            'x-real-ip': req.headers['x-real-ip'],
            'req.ip': req.ip
          }
        },
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy user." });
    }
    
    const today = normalizeDate(new Date());
    
    // Kiểm tra đã check-in chưa
    const existing = await Attendance.findOne({ userId, date: today });
    if (existing?.clockIn) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã chấm công vào hôm nay rồi.",
        data: existing,
      });
    }
    
    const now = new Date();
    const { isLate, lateMinutes, status } = calculateStatus(now, CONFIG);
    
    const attendance = existing || new Attendance({
      userId,
      date: today,
    });
    
    attendance.clockIn = now;
    attendance.clockInIP = clientIP;
    attendance.clockInPhoto = photo;
    attendance.status = status;
    attendance.isLate = isLate;
    attendance.lateMinutes = lateMinutes;
    
    await attendance.save();
    
    res.status(200).json({
      success: true,
      message: isLate 
        ? `Check-in thành công. Bạn đã đi muộn ${lateMinutes} phút.`
        : "Check-in thành công!",
      data: attendance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Check-out
exports.clockOut = async (req, res) => {
  try {
    const userId = req.user._id;
    const { photo } = req.body;
    const clientIP = getClientIP(req);
    
    const today = normalizeDate(new Date());
    const attendance = await Attendance.findOne({ userId, date: today });
    
    if (!attendance?.clockIn) {
      return res.status(404).json({
        success: false,
        message: "Bạn chưa check-in hôm nay.",
      });
    }
    
    if (attendance.clockOut) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã check-out rồi.",
        data: attendance,
      });
    }
    
    const now = new Date();
    const { workHours, overtimeHours } = calculateWorkHours(attendance.clockIn, now, CONFIG);
    
    attendance.clockOut = now;
    attendance.clockOutIP = clientIP;
    attendance.clockOutPhoto = photo;
    attendance.workHours = workHours;
    attendance.overtimeHours = overtimeHours;
    
    await attendance.save();
    
    res.status(200).json({
      success: true,
      message: `Check-out thành công! Bạn đã làm việc ${workHours} giờ${overtimeHours > 0 ? `, OT ${overtimeHours} giờ` : ""}.`,
      data: attendance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Xem trạng thái hôm nay
exports.getTodayStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = normalizeDate(new Date());
    const attendance = await Attendance.findOne({ userId, date: today })
      .populate("userId", "full_name email employeeId avatar");
    
    res.status(200).json({
      success: true,
      data: attendance || null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Xem lịch sử của mình
exports.getMyHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 30, startDate, endDate, status } = req.query;
    
    const query = { userId };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = normalizeDate(new Date(startDate));
      if (endDate) query.date.$lte = normalizeDate(new Date(endDate));
    }
    if (status) query.status = status;
    
    const p = Math.max(1, parseInt(page));
    const lim = Math.max(1, parseInt(limit));
    
    const [records, total] = await Promise.all([
      Attendance.find(query)
        .sort({ date: -1 })
        .skip((p - 1) * lim)
        .limit(lim)
        .populate("userId", "full_name email employeeId avatar department")
        .lean(),
      Attendance.countDocuments(query),
    ]);
    
    res.status(200).json({
      success: true,
      data: records,
      pagination: { total, page: p, pages: Math.ceil(total / lim) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ MANAGER ENDPOINTS ============

// 5. Xem tổng quan phòng ban
exports.getDepartmentOverview = async (req, res) => {
  try {
    const managerId = req.user._id;
    const manager = await User.findById(managerId);
    
    if (!manager?.department?.department_id) {
      return res.status(400).json({
        success: false,
        message: "Bạn không thuộc phòng ban nào.",
      });
    }
    
    const { page = 1, limit = 50, date, startDate, endDate, status } = req.query;
    
    // Tìm tất cả users trong department
    const departmentUsers = await User.find({
      "department.department_id": manager.department.department_id,
      status: "Active",
    }).select("_id");
    
    const userIds = departmentUsers.map(u => u._id);
    const query = { userId: { $in: userIds } };
    
    if (date) {
      query.date = normalizeDate(new Date(date));
    } else if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = normalizeDate(new Date(startDate));
      if (endDate) query.date.$lte = normalizeDate(new Date(endDate));
    }
    if (status) query.status = status;
    
    const p = Math.max(1, parseInt(page));
    const lim = Math.max(1, parseInt(limit));
    
    const [records, total] = await Promise.all([
      Attendance.find(query)
        .sort({ date: -1, clockIn: 1 })
        .skip((p - 1) * lim)
        .limit(lim)
        .populate("userId", "full_name email avatar employeeId department")
        .lean(),
      Attendance.countDocuments(query),
    ]);
    
    res.status(200).json({
      success: true,
      data: records,
      pagination: { total, page: p, pages: Math.ceil(total / lim) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Báo cáo phòng ban
exports.getDepartmentReport = async (req, res) => {
  try {
    const managerId = req.user._id;
    const manager = await User.findById(managerId);
    
    if (!manager?.department?.department_id) {
      return res.status(400).json({
        success: false,
        message: "Bạn không thuộc phòng ban nào.",
      });
    }
    
    const { startDate, endDate } = req.query;
    
    // Tìm tất cả users trong department
    const departmentUsers = await User.find({
      "department.department_id": manager.department.department_id,
      status: "Active",
    }).select("_id");
    
    const userIds = departmentUsers.map(u => u._id);
    const query = { userId: { $in: userIds } };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = normalizeDate(new Date(startDate));
      if (endDate) query.date.$lte = normalizeDate(new Date(endDate));
    }
    
    const records = await Attendance.find(query).lean();
    
    const stats = {
      totalRecords: records.length,
      present: records.filter(r => r.status === "Present").length,
      late: records.filter(r => r.status === "Late").length,
      absent: records.filter(r => r.status === "Absent").length,
      onLeave: records.filter(r => r.status === "On Leave").length,
      avgWorkHours: records.length > 0 
        ? +(records.reduce((sum, r) => sum + (r.workHours || 0), 0) / records.length).toFixed(2)
        : 0,
      totalOT: +records.reduce((sum, r) => sum + (r.overtimeHours || 0), 0).toFixed(2),
      onTimeRate: records.length > 0 
        ? +((records.filter(r => !r.isLate).length / records.length) * 100).toFixed(1)
        : 0,
    };
    
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ ADMIN ENDPOINTS ============

// 7. Xem toàn công ty
exports.getAllAttendance = async (req, res) => {
  try {
    const { page = 1, limit = 50, startDate, endDate, status, departmentId, search } = req.query;
    const query = {};
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = normalizeDate(new Date(startDate));
      if (endDate) query.date.$lte = normalizeDate(new Date(endDate));
    }
    if (status) query.status = status;
    
    // Search by employee name or employeeId
    if (search) {
      const searchRegex = new RegExp(search.trim(), "i");
      const users = await User.find({
        $or: [
          { full_name: searchRegex },
          { employeeId: searchRegex }
        ],
        status: "Active",
      }).select("_id");
      
      if (users.length > 0) {
        query.userId = { $in: users.map(u => u._id) };
      } else {
        // Không tìm thấy user nào, trả về mảng rỗng
        return res.status(200).json({
          success: true,
          data: [],
          pagination: { total: 0, page: 1, pages: 0 },
        });
      }
    }
    
    if (departmentId) {
      // Find all users in department
      const departmentUsers = await User.find({
        "department.department_id": departmentId,
        status: "Active",
      }).select("_id");
      
      // Nếu đã có search, kết hợp cả 2 điều kiện
      if (query.userId) {
        const searchUserIds = query.userId.$in.map(id => id.toString());
        const deptUserIds = departmentUsers.map(u => u._id.toString());
        const combinedIds = searchUserIds.filter(id => deptUserIds.includes(id));
        query.userId = { $in: combinedIds };
      } else {
        query.userId = { $in: departmentUsers.map(u => u._id) };
      }
    }
    
    const p = Math.max(1, parseInt(page));
    const lim = Math.max(1, parseInt(limit));
    
    const [records, total] = await Promise.all([
      Attendance.find(query)
        .sort({ date: -1, clockIn: 1 })
        .skip((p - 1) * lim)
        .limit(lim)
        .populate("userId", "full_name email avatar employeeId department")
        .lean(),
      Attendance.countDocuments(query),
    ]);
    
    res.status(200).json({
      success: true,
      data: records,
      pagination: { total, page: p, pages: Math.ceil(total / lim) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Báo cáo toàn công ty
exports.getCompanyReport = async (req, res) => {
  try {
    const { startDate, endDate, departmentId } = req.query;
    const query = {};
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = normalizeDate(new Date(startDate));
      if (endDate) query.date.$lte = normalizeDate(new Date(endDate));
    }
    if (departmentId) {
      // Find all users in department
      const departmentUsers = await User.find({
        "department.department_id": departmentId,
        status: "Active",
      }).select("_id");
      query.userId = { $in: departmentUsers.map(u => u._id) };
    }
    
    const records = await Attendance.find(query).lean();
    
    const stats = {
      totalRecords: records.length,
      present: records.filter(r => r.status === "Present").length,
      late: records.filter(r => r.status === "Late").length,
      absent: records.filter(r => r.status === "Absent").length,
      onLeave: records.filter(r => r.status === "On Leave").length,
      avgWorkHours: records.length > 0 
        ? +(records.reduce((sum, r) => sum + (r.workHours || 0), 0) / records.length).toFixed(2)
        : 0,
      totalOT: +records.reduce((sum, r) => sum + (r.overtimeHours || 0), 0).toFixed(2),
      onTimeRate: records.length > 0 
        ? +((records.filter(r => !r.isLate).length / records.length) * 100).toFixed(1)
        : 0,
    };
    
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 9. Chỉnh sửa thủ công
exports.manualAdjust = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { clockIn, clockOut, status, reason } = req.body;
    
    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bản ghi chấm công.",
      });
    }
    
    if (clockIn) attendance.clockIn = new Date(clockIn);
    if (clockOut) attendance.clockOut = new Date(clockOut);
    if (status) attendance.status = status;
    
    // Tính lại nếu có clock-in
    if (attendance.clockIn) {
      const statusData = calculateStatus(attendance.clockIn, CONFIG);
      attendance.isLate = statusData.isLate;
      attendance.lateMinutes = statusData.lateMinutes;
      if (!status) attendance.status = statusData.status;
      
      if (attendance.clockOut) {
        const workData = calculateWorkHours(attendance.clockIn, attendance.clockOut, CONFIG);
        attendance.workHours = workData.workHours;
        attendance.overtimeHours = workData.overtimeHours;
      }
    }
    
    attendance.isManuallyAdjusted = true;
    attendance.adjustedBy = req.user._id;
    attendance.adjustedAt = new Date();
    attendance.adjustmentReason = reason || "Admin adjustment";
    
    await attendance.save();
    
    res.status(200).json({
      success: true,
      message: "Đã chỉnh sửa bản ghi chấm công.",
      data: attendance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 10. Đánh dấu vắng tự động (chạy cron hoặc manual)
exports.markAbsent = async (req, res) => {
  try {
    const today = normalizeDate(new Date());
    const users = await User.find({ 
      status: "Active", 
      role: { $in: ["Employee", "Manager"] } 
    });
    
    let markedCount = 0;
    
    for (const user of users) {
      const existing = await Attendance.findOne({ userId: user._id, date: today });
      
      if (!existing) {
        await Attendance.create({
          userId: user._id,
          date: today,
          status: "Absent",
          remarks: "Auto-marked absent",
        });
        markedCount++;
      }
    }
    
    res.status(200).json({
      success: true,
      message: `Đã đánh dấu vắng cho ${markedCount} nhân viên.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 11. Xuất dữ liệu Excel
exports.exportData = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { startDate, endDate, departmentId, format = "excel" } = req.query;
    const query = {};
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = normalizeDate(new Date(startDate));
      if (endDate) query.date.$lte = normalizeDate(new Date(endDate));
    }
    
    // Nếu là Manager, chỉ export phòng ban của mình
    if (userRole === "Manager") {
      const manager = await User.findById(userId);
      if (!manager?.department?.department_id) {
        return res.status(400).json({
          success: false,
          message: "Bạn không thuộc phòng ban nào.",
        });
      }
      
      // Lấy tất cả users trong phòng ban
      const departmentUsers = await User.find({
        "department.department_id": manager.department.department_id,
        status: "Active",
      }).select("_id");
      query.userId = { $in: departmentUsers.map(u => u._id) };
    } else if (departmentId) {
      // Admin có thể filter theo departmentId
      const departmentUsers = await User.find({
        "department.department_id": departmentId,
        status: "Active",
      }).select("_id");
      query.userId = { $in: departmentUsers.map(u => u._id) };
    }
    
    const records = await Attendance.find(query)
      .populate("userId", "full_name email employeeId department")
      .sort({ date: -1 })
      .lean();
    
    // Nếu yêu cầu JSON
    if (format === "json") {
      return res.status(200).json({
        success: true,
        data: records,
        total: records.length,
      });
    }
    
    // Xuất Excel
    const excelData = records.map((record, index) => ({
      "STT": index + 1,
      "Mã NV": record.userId?.employeeId || "N/A",
      "Họ tên": record.userId?.full_name || "N/A",
      "Email": record.userId?.email || "N/A",
      "Phòng ban": record.userId?.department?.department_name || "N/A",
      "Ngày": new Date(record.date).toLocaleDateString("vi-VN"),
      "Giờ vào": record.clockIn ? new Date(record.clockIn).toLocaleTimeString("vi-VN") : "",
      "Giờ ra": record.clockOut ? new Date(record.clockOut).toLocaleTimeString("vi-VN") : "",
      "Trạng thái": record.status || "N/A",
      "Muộn (phút)": record.lateMinutes || 0,
      "Giờ làm": record.workHours || 0,
      "Giờ OT": record.overtimeHours || 0,
      "IP vào": record.clockInIP || "",
      "IP ra": record.clockOutIP || "",
      "Chỉnh sửa": record.isManuallyAdjusted ? "Có" : "Không",
      "Ghi chú": record.remarks || record.adjustmentReason || "",
    }));
    
    // Tạo workbook và worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Tự động điều chỉnh độ rộng cột
    const colWidths = [
      { wch: 5 },  // STT
      { wch: 10 }, // Mã NV
      { wch: 25 }, // Họ tên
      { wch: 30 }, // Email
      { wch: 20 }, // Phòng ban
      { wch: 12 }, // Ngày
      { wch: 12 }, // Giờ vào
      { wch: 12 }, // Giờ ra
      { wch: 12 }, // Trạng thái
      { wch: 12 }, // Muộn
      { wch: 10 }, // Giờ làm
      { wch: 10 }, // Giờ OT
      { wch: 15 }, // IP vào
      { wch: 15 }, // IP ra
      { wch: 10 }, // Chỉnh sửa
      { wch: 30 }, // Ghi chú
    ];
    ws['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    
    // Tạo buffer
    const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    
    // Tạo tên file
    const filename = `Attendance_${startDate || "all"}_to_${endDate || "now"}.xlsx`;
    
    // Gửi file
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(excelBuffer);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ PING ENDPOINT (Intranet Check) ============
exports.pingIntranet = (req, res) => {
  const clientIP = getClientIP(req);
  const isAllowed = CONFIG.allowedIPs.some(ip => ip === clientIP);
  
  if (isAllowed) {
    return res.status(204).send(); // No content - success
  } else {
    return res.status(403).json({
      success: false,
      message: "Access denied. Not in office network.",
      debug: { 
        clientIP, 
        allowedIPs: CONFIG.allowedIPs,
        headers: {
          'x-forwarded-for': req.headers['x-forwarded-for'],
          'x-real-ip': req.headers['x-real-ip'],
          'req.ip': req.ip
        }
      },
    });
  }
};

module.exports = exports;
