const Payroll = require("../models/Payroll");
const User = require("../models/User");
const Attendance = require("../models/Attendance");
const Holiday = require("../models/Holiday");
const { getSystemConfig } = require("../helper/systemConfigHelper");
const { createNotificationForUser } = require("../helper/NotificationService");

// ===== HELPER FUNCTIONS =====

// Get first and last day of month
function getMonthPeriod(month, year) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  return { startDate, endDate };
}

// Calculate working days from attendance
async function calculateWorkingStats(employeeId, startDate, endDate) {
  const attendances = await Attendance.find({
    userId: employeeId,
    date: { $gte: startDate, $lte: endDate },
  });

  let workingDays = 0;
  let overtimeWeekday = 0;
  let overtimeWeekend = 0;
  let overtimeHoliday = 0;
  let overtimePendingWeekday = 0;
  let overtimePendingWeekend = 0;
  let overtimePendingHoliday = 0;
  let lateMinutes = 0;
  let earlyLeaveMinutes = 0;
  let absentDays = 0;

  // Get employee info for holiday checking
  const employee = await User.findById(employeeId).populate("department.department_id");
  const userDeptId = employee?.department?.department_id?._id;

  for (const att of attendances) {
    // Count working days (exclude Absent and On Leave)
    if (["Present", "Late", "Early Leave", "Late & Early Leave"].includes(att.status)) {
      workingDays++;
    }

    // Count absent days
    if (att.status === "Absent") {
      absentDays++;
    }

    // Sum overtime hours - PHÂN BIỆT APPROVED VS PENDING
    // CHỈ TÍNH OT ĐÃ ĐƯỢC DUYỆT (overtimeApproved = true)
    if (att.overtimeHours > 0) {
      const day = new Date(att.date).getDay();
      const isWeekend = day === 0 || day === 6;
      
      // Kiểm tra có phải holiday không
      const holidayInfo = await Holiday.isHoliday(att.date, employeeId, userDeptId);
      const isHoliday = !!holidayInfo;
      
      if (att.overtimeApproved === true) {
        // OT đã được duyệt - TÍNH LƯƠNG
        if (isHoliday) {
          overtimeHoliday += att.overtimeHours;
        } else if (isWeekend) {
          overtimeWeekend += att.overtimeHours;
        } else {
          overtimeWeekday += att.overtimeHours;
        }
      } else {
        // OT chưa được duyệt - CHỈ TRACKING
        if (isHoliday) {
          overtimePendingHoliday += att.overtimeHours;
        } else if (isWeekend) {
          overtimePendingWeekend += att.overtimeHours;
        } else {
          overtimePendingWeekday += att.overtimeHours;
        }
      }
    }

    // Sum late minutes
    if (att.lateMinutes > 0) {
      lateMinutes += att.lateMinutes;
    }
    
    // Sum early leave minutes
    if (att.earlyLeaveMinutes > 0) {
      earlyLeaveMinutes += att.earlyLeaveMinutes;
    }
  }

  return {
    workingDays,
    overtime: {
      weekday: overtimeWeekday,
      weekend: overtimeWeekend,
      holiday: overtimeHoliday,
    },
    overtimePending: {
      weekday: overtimePendingWeekday,
      weekend: overtimePendingWeekend,
      holiday: overtimePendingHoliday,
    },
    lateMinutes,
    earlyLeaveMinutes,
    absentDays,
  };
}

// Calculate salary based on template and attendance
async function calculateEmployeeSalary(employeeId, month, year, calculatedBy) {
  const { startDate, endDate } = getMonthPeriod(month, year);

  // Get employee info
  const employee = await User.findById(employeeId).populate("department.department_id");
  if (!employee) {
    throw new Error("Employee không tồn tại");
  }

  if (!employee.salary || employee.salary <= 0) {
    throw new Error(`Employee ${employee.full_name} chưa có lương cơ bản`);
  }

  // Get all attendances for the month
  const attendances = await Attendance.find({
    userId: employeeId,
    date: { $gte: startDate, $lte: endDate },
  });

  // Get working stats from attendance
  const stats = await calculateWorkingStats(employeeId, startDate, endDate);

  // Get system config for OT rates
  const systemConfig = await getSystemConfig();
  const otRates = {
    weekday: systemConfig.overtime.otRateWeekday || 1.5,
    weekend: systemConfig.overtime.otRateWeekday || 1.5, // T7/CN dùng hệ số weekday
    holiday: systemConfig.overtime.otRateHoliday || 3.0,
  };

  // ===== TÍNH LƯƠNG THEO 22 NGÀY CÔNG CỐ ĐỊNH =====
  // Sử dụng 22 ngày công chuẩn thay vì đếm ngày thực tế
  const standardWorkingDays = 22;
  
  // Calculate daily rate and hourly rate
  const dailySalary = Math.round((employee.salary / standardWorkingDays) * 100) / 100;
  const hourlyRate = Math.round((employee.salary / (standardWorkingDays * 8)) * 100) / 100;

  // Calculate actual base salary (only count working days)
  const actualBaseSalary = Math.round(dailySalary * stats.workingDays * 100) / 100;

  // Calculate overtime amount
  const overtimeAmount = Math.round(
    (hourlyRate * stats.overtime.weekday * otRates.weekday +
      hourlyRate * stats.overtime.weekend * otRates.weekend +
      hourlyRate * stats.overtime.holiday * otRates.holiday) * 100
  ) / 100;

  // ===== BUILD DAILY BREAKDOWN =====
  const dailyBreakdown = [];
  const lateDeductionRate = 10000; // 10,000 VND per minute
  const earlyLeaveDeductionRate = 10000; // 10,000 VND per minute
  const daysInMonth = new Date(year, month, 0).getDate(); // Get total days in month
  
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month - 1, day);
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Check holiday
    const userDeptId = employee?.department?.department_id?._id;
    const holidayInfo = await Holiday.isHoliday(currentDate, employeeId, userDeptId);
    const isHoliday = !!holidayInfo;
    const holidayName = holidayInfo?.name || null;
    
    // Find attendance for this day
    const attendance = attendances.find(att => {
      const attDate = new Date(att.date);
      return attDate.getDate() === day && 
             attDate.getMonth() === month - 1 && 
             attDate.getFullYear() === year;
    });
    
    // Determine if this is a working day
    // T2-T6 hoặc Holiday đều là ngày có thể đi làm
    const isWorkingDay = !isWeekend;
    
    // Format check-in/out time
    const formatTime = (date) => {
      if (!date) return null;
      const d = new Date(date);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };
    
    // Calculate daily amounts
    let dailySalaryAmount = 0;
    let otSalary = 0;
    let lateDeduction = 0;
    let earlyLeaveDeduction = 0;
    let otMultiplier = 0;
    
    if (attendance) {
      // 1. Daily Salary
      if (["Present", "Late", "Early Leave", "Late & Early Leave"].includes(attendance.status)) {
        if (isHoliday) {
          // HOLIDAY: Đi làm được x3 lương
          dailySalaryAmount = dailySalary * 3;
        } else if (isWorkingDay) {
          // Ngày thường: 1x lương
          dailySalaryAmount = dailySalary;
        }
      }
      
      // 2. OT Salary (CHỈ TÍNH KHI overtimeApproved = true)
      if (attendance.overtimeHours > 0 && attendance.overtimeApproved) {
        if (isHoliday) {
          otMultiplier = otRates.holiday;
          otSalary = hourlyRate * attendance.overtimeHours * otRates.holiday;
        } else if (isWeekend) {
          otMultiplier = otRates.weekend;
          otSalary = hourlyRate * attendance.overtimeHours * otRates.weekend;
        } else {
          otMultiplier = otRates.weekday;
          otSalary = hourlyRate * attendance.overtimeHours * otRates.weekday;
        }
      }
      
      // 3. Late Deduction
      if (attendance.lateMinutes > 0) {
        lateDeduction = attendance.lateMinutes * lateDeductionRate;
      }
      
      // 4. Early Leave Deduction
      if (attendance.earlyLeaveMinutes > 0) {
        earlyLeaveDeduction = attendance.earlyLeaveMinutes * earlyLeaveDeductionRate;
      }
    } else if (isWorkingDay && !isHoliday) {
      // Không có attendance và là ngày làm việc thường → Vắng mặt (đã tính trong absentDays)
      dailySalaryAmount = 0;
    } else if (isHoliday) {
      // Holiday nhưng không đi làm → Vẫn được hưởng lương cơ bản
      dailySalaryAmount = dailySalary;
    }
    
    // Round all amounts
    dailySalaryAmount = Math.round(dailySalaryAmount * 100) / 100;
    otSalary = Math.round(otSalary * 100) / 100;
    lateDeduction = Math.round(lateDeduction * 100) / 100;
    earlyLeaveDeduction = Math.round(earlyLeaveDeduction * 100) / 100;
    
    const dayTotal = dailySalaryAmount + otSalary - lateDeduction - earlyLeaveDeduction;
    
    dailyBreakdown.push({
      date: day,
      fullDate: currentDate,
      isWorkingDay,
      isHoliday,
      holidayName,
      checkIn: formatTime(attendance?.clockIn),
      checkOut: formatTime(attendance?.clockOut),
      status: attendance?.status || (isWeekend ? 'Weekend' : (isHoliday ? 'Holiday' : 'Absent')),
      lateMinutes: attendance?.lateMinutes || 0,
      earlyLeaveMinutes: attendance?.earlyLeaveMinutes || 0,
      workHours: attendance?.workHours || 0,
      otHours: (attendance?.overtimeHours && attendance?.overtimeApproved) ? attendance.overtimeHours : 0,
      otApproved: attendance?.overtimeApproved || false,
      otMultiplier,
      dailySalary: dailySalaryAmount,
      otSalary,
      lateDeduction,
      earlyLeaveDeduction,
      dayTotal: Math.round(dayTotal * 100) / 100,
    });
  }

  // Calculate deductions (late + early leave + absent)
  let deductions = [];
  let totalDeduction = 0;

  // Late deduction: 10,000 VND per minute
  if (stats.lateMinutes > 0) {
    const lateDeduction = Math.round(stats.lateMinutes * lateDeductionRate * 100) / 100;
    deductions.push({
      type: "Đi muộn",
      amount: lateDeduction,
      description: `${stats.lateMinutes} phút đi muộn`,
    });
    totalDeduction += lateDeduction;
  }

  // Early leave deduction: 10,000 VND per minute
  if (stats.earlyLeaveMinutes > 0) {
    const earlyLeaveDeduction = Math.round(stats.earlyLeaveMinutes * earlyLeaveDeductionRate * 100) / 100;
    deductions.push({
      type: "Về sớm",
      amount: earlyLeaveDeduction,
      description: `${stats.earlyLeaveMinutes} phút về sớm`,
    });
    totalDeduction += earlyLeaveDeduction;
  }

  // Absent deduction: 1 day = dailySalary
  if (stats.absentDays > 0) {
    const absentDeduction = Math.round(dailySalary * stats.absentDays * 100) / 100;
    deductions.push({
      type: "Vắng mặt",
      amount: absentDeduction,
      description: `${stats.absentDays} ngày vắng mặt`,
    });
    totalDeduction += absentDeduction;
  }

  // Create or update payroll
  let payroll = await Payroll.findOne({ employeeId, month, year });
  let isNewPayroll = false;

  if (payroll) {
    // Update existing
    payroll.baseSalary = employee.salary;
    payroll.workingDays = stats.workingDays;
    payroll.standardWorkingDays = standardWorkingDays;
    payroll.actualBaseSalary = actualBaseSalary;
    payroll.overtimeHours = stats.overtime;
    payroll.overtimePending = stats.overtimePending;
    payroll.overtimeRates = otRates;
    payroll.overtimeAmount = overtimeAmount;
    // allowances và bonuses đã bị xóa khỏi model
    payroll.deductions = deductions;
    payroll.dailyBreakdown = dailyBreakdown;
    payroll.calculatedAt = new Date();
    payroll.calculatedBy = calculatedBy;
  } else {
    // Create new
    isNewPayroll = true;
    payroll = new Payroll({
      employeeId,
      month,
      year,
      period: { startDate, endDate },
      baseSalary: employee.salary,
      workingDays: stats.workingDays,
      standardWorkingDays,
      actualBaseSalary,
      overtimeHours: stats.overtime,
      overtimePending: stats.overtimePending,
      overtimeRates: otRates,
      overtimeAmount,
      // allowances và bonuses đã bị xóa khỏi model
      deductions,
      dailyBreakdown,
      calculatedAt: new Date(),
      calculatedBy,
    });
  }

  await payroll.save();
  
  // Return payroll with flag indicating if it's new
  payroll.isNewPayroll = isNewPayroll;
  return payroll;
}

// ============ ADMIN ENDPOINTS ============

// 1. Calculate payroll for all employees (bulk)
const calculateAllPayroll = async (req, res) => {
  try {
    const { month, year } = req.body;
    const calculatedBy = req.user._id;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Tháng và năm là bắt buộc",
      });
    }

    // Get all active employees (exclude Admin)
    const employees = await User.find({
      status: "Active",
      role: { $in: ["Manager", "Employee"] },
      salary: { $exists: true, $gt: 0 },
    }).select("_id full_name");

    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không có nhân viên nào để tính lương",
      });
    }

    const results = [];
    const errors = [];

    // ✅ Lấy thông tin Admin 1 lần (thay vì query trong vòng lặp)
    const admin = await User.findById(calculatedBy).select("full_name avatar");

    // Calculate for each employee
    for (const employee of employees) {
      try {
        const payroll = await calculateEmployeeSalary(employee._id, month, year, calculatedBy);
        results.push({
          employeeId: employee._id,
          employeeName: employee.full_name,
          payrollId: payroll._id,
          netSalary: payroll.netSalary,
          status: "success",
          isNew: payroll.isNewPayroll,
        });
        
        // ✅ LUÔN gửi notification (cả khi tạo mới và update)
        try {
          const actionText = payroll.isNewPayroll ? "đã được tính toán" : "đã được cập nhật";
          await createNotificationForUser({
            userId: employee._id,
            senderId: calculatedBy,
            senderName: admin?.full_name || "Admin",
            senderAvatar: admin?.avatar || null,
            type: "Payroll",
            message: `Phiếu lương tháng ${month}/${year} của bạn ${actionText}. Thực lĩnh: ${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(payroll.netSalary)}`,
            relatedId: payroll._id,
          });
          console.log(`✅ Đã gửi notification ${payroll.isNewPayroll ? 'tính' : 'cập nhật'} lương cho ${employee.full_name}`);
        } catch (notifError) {
          console.error(`❌ Lỗi gửi notification cho ${employee.full_name}:`, notifError);
        }
      } catch (error) {
        errors.push({
          employeeId: employee._id,
          employeeName: employee.full_name,
          error: error.message,
          status: "failed",
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Tính lương thành công cho ${results.length}/${employees.length} nhân viên`,
      data: {
        month,
        year,
        total: employees.length,
        success: results.length,
        failed: errors.length,
        results,
        errors,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Calculate payroll for specific employee
const calculatePayroll = async (req, res) => {
  try {
    const { employeeId, month, year } = req.body;
    const calculatedBy = req.user._id;

    if (!employeeId || !month || !year) {
      return res.status(400).json({
        success: false,
        message: "Employee ID, tháng và năm là bắt buộc",
      });
    }

    const payroll = await calculateEmployeeSalary(employeeId, month, year, calculatedBy);

    await payroll.populate("employeeId", "full_name email employeeId department jobTitle");

    // ✅ Gửi notification cho nhân viên cụ thể
    try {
      const admin = await User.findById(calculatedBy).select("full_name avatar").lean();
      const actionText = payroll.isNewPayroll ? "đã được tính toán" : "đã được cập nhật";
      
      await createNotificationForUser({
        userId: employeeId,
        senderId: calculatedBy,
        senderName: admin?.full_name || "Admin",
        senderAvatar: admin?.avatar || null,
        type: "Payroll",
        message: `Phiếu lương tháng ${month}/${year} của bạn ${actionText}. Thực lĩnh: ${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(payroll.netSalary)}`,
        relatedId: payroll._id,
      });
      console.log(`✅ Đã gửi notification ${payroll.isNewPayroll ? 'tính' : 'cập nhật'} lương cho nhân viên ${payroll.employeeId?.full_name}`);
    } catch (notifError) {
      console.error(`❌ Lỗi gửi notification:`, notifError);
    }

    res.status(200).json({
      success: true,
      message: "Tính lương thành công",
      data: payroll,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Get all payrolls (with filters)
const getAllPayrolls = async (req, res) => {
  try {
    const { month, year, status, departmentId, page = 1, limit = 20, search } = req.query;

    const query = {};

    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (status) query.status = status;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Populate employee with department
    let payrolls = await Payroll.find(query)
      .populate({
        path: "employeeId",
        select: "full_name email employeeId department jobTitle avatar",
        populate: {
          path: "department.department_id",
          select: "department_name"
        }
      })
      .populate("calculatedBy", "full_name email")
      .populate("approvedBy", "full_name email")
      .populate("paidBy", "full_name email")
      .sort({ created_at: -1 });

    // Filter by department (after populate to access department data)
    if (departmentId) {
      payrolls = payrolls.filter(
        (p) => p.employeeId?.department?.department_id?._id?.toString() === departmentId
      );
    }

    // Search by employee name
    if (search) {
      const searchLower = search.toLowerCase();
      payrolls = payrolls.filter((p) =>
        p.employeeId?.full_name?.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination after filters
    const totalFiltered = payrolls.length;
    const paginatedPayrolls = payrolls.slice(skip, skip + parseInt(limit));

    // Calculate summary for filtered payrolls
    const summary = {
      totalPayrolls: totalFiltered,
      totalCost: payrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0),
      byStatus: {
        "Nháp": payrolls.filter((p) => p.status === "Nháp").length,
        "Chờ duyệt": payrolls.filter((p) => p.status === "Chờ duyệt").length,
        "Đã duyệt": payrolls.filter((p) => p.status === "Đã duyệt").length,
        "Đã thanh toán": payrolls.filter((p) => p.status === "Đã thanh toán").length,
      },
    };

    res.status(200).json({
      success: true,
      data: paginatedPayrolls,
      summary,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalFiltered / parseInt(limit)),
        totalItems: totalFiltered,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Get payroll by ID
const getPayrollById = async (req, res) => {
  try {
    const { id } = req.params;

    const payroll = await Payroll.findById(id)
      .populate("employeeId", "full_name email employeeId department jobTitle avatar")
      .populate("calculatedBy", "full_name email")
      .populate("approvedBy", "full_name email")
      .populate("paidBy", "full_name email");

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy payroll",
      });
    }

    res.status(200).json({
      success: true,
      data: payroll,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Update payroll (manual adjustment)
const updatePayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updatedBy = req.user._id;

    const payroll = await Payroll.findById(id);

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy payroll",
      });
    }

    // Only allow editing Draft or Pending
    if (["Đã duyệt", "Đã thanh toán"].includes(payroll.status)) {
      return res.status(403).json({
        success: false,
        message: `Không thể sửa payroll đã ${payroll.status}`,
      });
    }

    // Update fields (đã xóa allowances và bonuses)
    const allowedFields = [
      "actualBaseSalary",
      "overtimeAmount",
      "deductions",
      "notes",
    ];

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        payroll[field] = updates[field];
      }
    });

    await payroll.save();

    await payroll.populate("employeeId", "full_name email employeeId department");

    res.status(200).json({
      success: true,
      message: "Cập nhật payroll thành công",
      data: payroll,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Approve payroll (single)
const approvePayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const approvedBy = req.user._id;

    const payroll = await Payroll.findById(id);

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy payroll",
      });
    }

    if (payroll.status === "Đã duyệt") {
      return res.status(400).json({
        success: false,
        message: "Payroll đã được duyệt trước đó",
      });
    }

    payroll.status = "Đã duyệt";
    payroll.approvedBy = approvedBy;
    payroll.approvedAt = new Date();
    await payroll.save();

    await payroll.populate("employeeId", "full_name email");

    // ✅ Gửi notification cho nhân viên
    try {
      const admin = await User.findById(approvedBy).select("full_name avatar");
      await createNotificationForUser({
        userId: payroll.employeeId._id,
        senderId: approvedBy,
        senderName: admin?.full_name || "Admin",
        senderAvatar: admin?.avatar || null,
        type: "Payroll",
        message: `Phiếu lương tháng ${payroll.month}/${payroll.year} của bạn đã được duyệt. Thực lĩnh: ${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(payroll.netSalary)}`,
        relatedId: payroll._id,
      });
      console.log(`✅ Đã gửi notification approve lương cho ${payroll.employeeId.full_name}`);
    } catch (notifError) {
      console.error("❌ Lỗi gửi notification approve:", notifError);
    }

    res.status(200).json({
      success: true,
      message: `Đã duyệt lương cho ${payroll.employeeId.full_name}`,
      data: payroll,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Bulk approve payrolls
const bulkApprovePayrolls = async (req, res) => {
  try {
    const { payrollIds } = req.body;
    const approvedBy = req.user._id;

    if (!payrollIds || !Array.isArray(payrollIds) || payrollIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Danh sách payroll IDs là bắt buộc",
      });
    }

    const results = [];
    const errors = [];

    for (const id of payrollIds) {
      try {
        const payroll = await Payroll.findById(id);
        if (!payroll) {
          errors.push({ id, error: "Không tìm thấy payroll" });
          continue;
        }

        if (payroll.status !== "Đã duyệt") {
          payroll.status = "Đã duyệt";
          payroll.approvedBy = approvedBy;
          payroll.approvedAt = new Date();
          await payroll.save();
        }

        results.push({ id, status: "success" });
      } catch (error) {
        errors.push({ id, error: error.message });
      }
    }

    res.status(200).json({
      success: true,
      message: `Duyệt thành công ${results.length}/${payrollIds.length} payrolls`,
      data: { results, errors },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Mark payroll as Paid
const markAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, transactionId, bankDetails, notes } = req.body;
    const paidBy = req.user._id;

    const payroll = await Payroll.findById(id);

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy payroll",
      });
    }

    if (payroll.status !== "Đã duyệt") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể thanh toán payroll đã Approved",
      });
    }

    // Update payroll status
    payroll.status = "Đã thanh toán";
    payroll.paidBy = paidBy;
    payroll.paidAt = new Date();
    
    await payroll.save();

    await payroll.populate("employeeId", "full_name email");

    // ✅ Gửi notification cho nhân viên
    try {
      const admin = await User.findById(paidBy).select("full_name avatar");
      await createNotificationForUser({
        userId: payroll.employeeId._id,
        senderId: paidBy,
        senderName: admin?.full_name || "Admin",
        senderAvatar: admin?.avatar || null,
        type: "Payroll",
        message: `Lương tháng ${payroll.month}/${payroll.year} đã được chuyển khoản. Số tiền: ${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(payroll.netSalary)}`,
        relatedId: payroll._id,
      });
      console.log(`✅ Đã gửi notification paid lương cho ${payroll.employeeId.full_name}`);
    } catch (notifError) {
      console.error("❌ Lỗi gửi notification paid:", notifError);
    }

    res.status(200).json({
      success: true,
      message: `Đã thanh toán lương cho ${payroll.employeeId.full_name}`,
      data: { payroll },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 9. Delete payroll (only Draft)
const deletePayroll = async (req, res) => {
  try {
    const { id } = req.params;

    const payroll = await Payroll.findById(id);

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy payroll",
      });
    }

    if (payroll.status !== "Nháp") {
      return res.status(403).json({
        success: false,
        message: "Chỉ có thể xóa payroll Nháp",
      });
    }

    await payroll.deleteOne();

    res.status(200).json({
      success: true,
      message: "Xóa payroll thành công",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 10. Get payroll analytics
const getPayrollAnalytics = async (req, res) => {
  try {
    const { year } = req.query;

    if (!year) {
      return res.status(400).json({
        success: false,
        message: "Năm là bắt buộc",
      });
    }

    const payrolls = await Payroll.find({ year: parseInt(year), status: "Đã thanh toán" });

    // Group by month
    const byMonth = {};
    for (let month = 1; month <= 12; month++) {
      const monthPayrolls = payrolls.filter((p) => p.month === month);
      byMonth[month] = {
        totalCost: monthPayrolls.reduce((sum, p) => sum + p.netSalary, 0),
        totalEmployees: monthPayrolls.length,
        avgSalary:
          monthPayrolls.length > 0
            ? monthPayrolls.reduce((sum, p) => sum + p.netSalary, 0) / monthPayrolls.length
            : 0,
      };
    }

    // Total year stats
    const totalYearCost = payrolls.reduce((sum, p) => sum + p.netSalary, 0);

    res.status(200).json({
      success: true,
      data: {
        year: parseInt(year),
        totalYearCost,
        byMonth,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ EMPLOYEE ENDPOINTS ============

// Get my payrolls (for logged-in employee)
const getMyPayrolls = async (req, res) => {
  try {
    const employeeId = req.user._id; // From authenticate middleware
    const { month, year, page = 1, limit = 10 } = req.query;

    const query = { employeeId };

    // Filter by month/year if provided
    if (month && year) {
      query.month = parseInt(month);
      query.year = parseInt(year);
    } else if (year) {
      query.year = parseInt(year);
    }

    // Pagination
    const skip = (page - 1) * limit;
    const total = await Payroll.countDocuments(query);

    const payrolls = await Payroll.find(query)
      .populate("employeeId", "full_name employeeId email avatar department")
      .sort({ year: -1, month: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: payrolls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// ===== HELPER: Recalculate payroll for a specific employee/month (called from Request model hook) =====
const recalculatePayrollForEmployee = async (employeeId, month, year) => {
  try {
    console.log(`🔄 Recalculating payroll for employee ${employeeId}, month ${month}/${year}...`);
    
    // Find existing payroll
    const existingPayroll = await Payroll.findOne({
      employeeId: employeeId,
      month: month,
      year: year
    });
    
    if (!existingPayroll) {
      console.log(`⚠️ No existing payroll found for ${month}/${year}, skipping recalculation`);
      return null;
    }
    
    // Recalculate using the same calculatedBy user
    const calculatedBy = existingPayroll.calculatedBy || existingPayroll.employeeId;
    const updatedPayroll = await calculateEmployeeSalary(employeeId, month, year, calculatedBy);
    
    console.log(`✅ Payroll recalculated successfully for ${month}/${year}`);
    return updatedPayroll;
  } catch (error) {
    console.error(`❌ Error recalculating payroll:`, error.message);
    throw error;
  }
};

module.exports = {
  calculateAllPayroll,
  calculatePayroll,
  getAllPayrolls,
  getPayrollById,
  updatePayroll,
  approvePayroll,
  bulkApprovePayrolls,
  markAsPaid,
  deletePayroll,
  getPayrollAnalytics,
  getMyPayrolls,
  recalculatePayrollForEmployee, // Export helper for Request model
};
