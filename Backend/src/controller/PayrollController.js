const Payroll = require("../models/Payroll");
const PayrollTemplate = require("../models/PayrollTemplate");
const PaymentHistory = require("../models/PaymentHistory");
const SalaryAdjustment = require("../models/SalaryAdjustment");
const User = require("../models/User");
const Attendance = require("../models/Attendance");
const { getSystemConfig } = require("../helper/systemConfigHelper");

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
  let absentDays = 0;

  attendances.forEach((att) => {
    // Count working days (exclude Absent and On Leave)
    if (["Present", "Late", "Early Leave", "Late & Early Leave"].includes(att.status)) {
      workingDays++;
    }

    // Count absent days
    if (att.status === "Absent") {
      absentDays++;
    }

    // Sum overtime hours - PHÂN BIỆT APPROVED VS PENDING
    if (att.overtimeHours > 0) {
      const day = new Date(att.date).getDay();
      const isWeekend = day === 0 || day === 6;
      
      if (att.overtimeApproved === true) {
        // OT đã được duyệt - TÍNH LƯƠNG
        if (isWeekend) {
          overtimeWeekend += att.overtimeHours;
        } else {
          overtimeWeekday += att.overtimeHours;
        }
      } else {
        // OT chưa được duyệt - CHỈ TRACKING
        if (isWeekend) {
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
  });

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

  // Get working stats from attendance
  const stats = await calculateWorkingStats(employeeId, startDate, endDate);

  // Get system config for OT rates
  const systemConfig = await getSystemConfig();
  const otRates = {
    weekday: systemConfig.overtime.otRateWeekday || 1.5,
    weekend: systemConfig.overtime.otRateWeekend || 2.0,
    holiday: systemConfig.overtime.otRateHoliday || 3.0,
  };

  // Calculate base salary (actual working days)
  const standardWorkingDays = 22; // Default
  const dailySalary = Math.round((employee.salary / standardWorkingDays) * 100) / 100;
  const actualBaseSalary = Math.round(dailySalary * stats.workingDays * 100) / 100;

  // Calculate overtime
  const hourlyRate = Math.round((employee.salary / 176) * 100) / 100; // 22 days * 8 hours
  const overtimeAmount = Math.round(
    (hourlyRate * stats.overtime.weekday * otRates.weekday +
      hourlyRate * stats.overtime.weekend * otRates.weekend +
      hourlyRate * stats.overtime.holiday * otRates.holiday) * 100
  ) / 100;

  // Calculate deductions (late + absent)
  let deductions = [];
  let totalDeduction = 0;

  // Late deduction: 10,000 VND per minute
  if (stats.lateMinutes > 0) {
    const lateDeduction = Math.round(stats.lateMinutes * 10000 * 100) / 100;
    deductions.push({
      type: "Late",
      amount: lateDeduction,
      description: `${stats.lateMinutes} phút đi muộn`,
    });
    totalDeduction += lateDeduction;
  }

  // Absent deduction: 1 day = dailySalary
  if (stats.absentDays > 0) {
    const absentDeduction = Math.round(dailySalary * stats.absentDays * 100) / 100;
    deductions.push({
      type: "Absent",
      amount: absentDeduction,
      description: `${stats.absentDays} ngày vắng mặt`,
    });
    totalDeduction += absentDeduction;
  }

  // Create or update payroll
  let payroll = await Payroll.findOne({ employeeId, month, year });

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
    payroll.allowances = []; // No allowances
    payroll.bonuses = []; // No bonuses
    payroll.deductions = deductions;
    payroll.calculatedAt = new Date();
    payroll.calculatedBy = calculatedBy;
  } else {
    // Create new
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
      allowances: [], // No allowances
      bonuses: [], // No bonuses
      deductions,
      calculatedAt: new Date(),
      calculatedBy,
    });
  }

  await payroll.save();
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
        });
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

    let payrolls = await Payroll.find(query)
      .populate("employeeId", "full_name email employeeId department jobTitle avatar")
      .populate("calculatedBy", "full_name email")
      .populate("approvedBy", "full_name email")
      .populate("paidBy", "full_name email")
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Filter by department
    if (departmentId) {
      payrolls = payrolls.filter(
        (p) => p.employeeId?.department?.department_id?.toString() === departmentId
      );
    }

    // Search by employee name
    if (search) {
      const searchLower = search.toLowerCase();
      payrolls = payrolls.filter((p) =>
        p.employeeId?.full_name?.toLowerCase().includes(searchLower)
      );
    }

    const total = await Payroll.countDocuments(query);

    // Calculate summary for ALL payrolls matching the filter (not just current page)
    const allPayrollsForSummary = await Payroll.find(query).select("netSalary status");
    
    const summary = {
      totalPayrolls: total,
      totalCost: allPayrollsForSummary.reduce((sum, p) => sum + (p.netSalary || 0), 0),
      byStatus: {
        Draft: allPayrollsForSummary.filter((p) => p.status === "Draft").length,
        Pending: allPayrollsForSummary.filter((p) => p.status === "Pending").length,
        Approved: allPayrollsForSummary.filter((p) => p.status === "Approved").length,
        Paid: allPayrollsForSummary.filter((p) => p.status === "Paid").length,
      },
    };

    res.status(200).json({
      success: true,
      data: payrolls,
      summary,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
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
    if (["Approved", "Paid"].includes(payroll.status)) {
      return res.status(403).json({
        success: false,
        message: `Không thể sửa payroll đã ${payroll.status}`,
      });
    }

    // Update fields
    const allowedFields = [
      "actualBaseSalary",
      "overtimeAmount",
      "allowances",
      "bonuses",
      "deductions",
      "notes",
    ];

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        payroll[field] = updates[field];
      }
    });

    // ✅ Khi Admin edit thủ công → Xóa flag rejection
    // Vì Admin đã xử lý vấn đề mà Manager báo
    if (payroll.rejectedByManager) {
      payroll.rejectedByManager = false;
      // Giữ history để audit, nhưng đánh dấu đã resolved
      const lastRejection = payroll.managerRejectionHistory[payroll.managerRejectionHistory.length - 1];
      if (lastRejection) {
        lastRejection.resolvedAt = new Date();
        lastRejection.resolvedBy = updatedBy;
        lastRejection.resolvedAction = "Admin đã chỉnh sửa thủ công";
      }
    }

    payroll.updatedBy = updatedBy;
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

    if (payroll.status === "Approved") {
      return res.status(400).json({
        success: false,
        message: "Payroll đã được duyệt trước đó",
      });
    }

    // ✅ Nếu Admin approve phiếu bị Manager reject → Mark as resolved (Override)
    if (payroll.rejectedByManager) {
      payroll.rejectedByManager = false;
      const lastRejection = payroll.managerRejectionHistory[payroll.managerRejectionHistory.length - 1];
      if (lastRejection) {
        lastRejection.resolvedAt = new Date();
        lastRejection.resolvedBy = approvedBy;
        lastRejection.resolvedAction = "Admin đã duyệt (Override Manager rejection)";
      }
    }

    payroll.status = "Approved";
    payroll.approvedBy = approvedBy;
    payroll.approvedAt = new Date();
    await payroll.save();

    await payroll.populate("employeeId", "full_name email");

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

        if (payroll.status !== "Approved") {
          payroll.status = "Approved";
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

    if (payroll.status !== "Approved") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể thanh toán payroll đã Approved",
      });
    }

    // Update payroll status
    payroll.status = "Paid";
    payroll.paidBy = paidBy;
    payroll.paidAt = new Date();
    await payroll.save();

    // Create payment history
    const payment = new PaymentHistory({
      payrollId: payroll._id,
      employeeId: payroll.employeeId,
      amount: payroll.netSalary,
      paymentMethod: paymentMethod || "BankTransfer",
      paymentDate: new Date(),
      transactionId,
      bankDetails,
      status: "Success",
      paidBy,
      notes,
    });

    await payment.save();

    await payroll.populate("employeeId", "full_name email");

    res.status(200).json({
      success: true,
      message: `Đã thanh toán lương cho ${payroll.employeeId.full_name}`,
      data: { payroll, payment },
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

    if (payroll.status !== "Draft") {
      return res.status(403).json({
        success: false,
        message: "Chỉ có thể xóa payroll Draft",
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

    const payrolls = await Payroll.find({ year: parseInt(year), status: "Paid" });

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

// Get department payrolls (for manager)
const getDepartmentPayrolls = async (req, res) => {
  try {
    const managerId = req.user._id;
    const { month, year, status, page = 1, limit = 10 } = req.query;

    // Find manager's user record to get department
    const manager = await User.findById(managerId).select("department");
    if (!manager || !manager.department) {
      return res.status(403).json({
        success: false,
        message: "Bạn chưa được gán phòng ban",
      });
    }

    // Build query for employees in same department
    const employeeQuery = { department: manager.department };
    const employees = await User.find(employeeQuery).select("_id");
    const employeeIds = employees.map((e) => e._id);

    // Build payroll query
    const query = { employeeId: { $in: employeeIds } };

    if (month && year) {
      query.month = parseInt(month);
      query.year = parseInt(year);
    } else if (year) {
      query.year = parseInt(year);
    }

    if (status) {
      query.status = status;
    }

    // Pagination
    const skip = (page - 1) * limit;
    const total = await Payroll.countDocuments(query);

    const payrolls = await Payroll.find(query)
      .populate("employeeId", "full_name employeeId email avatar department")
      .sort({ year: -1, month: -1, createdAt: -1 })
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

// Approve payroll (for manager)
const managerApprovePayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const managerId = req.user._id;
    const { notes } = req.body;

    // Get payroll
    const payroll = await Payroll.findById(id).populate("employeeId", "department");
    if (!payroll) {
      return res.status(404).json({ success: false, message: "Không tìm thấy phiếu lương" });
    }

    // Verify manager's department
    const manager = await User.findById(managerId).select("department");
    if (!manager || !manager.department) {
      return res.status(403).json({ success: false, message: "Bạn chưa được gán phòng ban" });
    }

    if (payroll.employeeId.department.toString() !== manager.department.toString()) {
      return res.status(403).json({
        success: false,
        message: "Bạn chỉ có thể duyệt lương của nhân viên trong phòng ban mình",
      });
    }

    // Manager can ONLY approve Draft → Pending (pre-approval)
    if (payroll.status === "Draft") {
      payroll.status = "Pending";
      payroll.notes = notes || "Đã duyệt bởi Manager";
    } else {
      return res.status(400).json({
        success: false,
        message: "Manager chỉ có thể duyệt phiếu lương ở trạng thái Draft. Phiếu lương này cần Admin duyệt cuối.",
      });
    }

    await payroll.save();

    res.status(200).json({
      success: true,
      message: "Đã duyệt phiếu lương (chờ Admin phê duyệt cuối)",
      data: payroll,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reject payroll (for manager)
const managerRejectPayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const managerId = req.user._id;
    const { reason } = req.body;

    if (!reason || reason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập lý do từ chối",
      });
    }

    // Get payroll
    const payroll = await Payroll.findById(id).populate("employeeId", "department");
    if (!payroll) {
      return res.status(404).json({ success: false, message: "Không tìm thấy phiếu lương" });
    }

    // Verify manager's department
    const manager = await User.findById(managerId).select("department");
    if (!manager || !manager.department) {
      return res.status(403).json({ success: false, message: "Bạn chưa được gán phòng ban" });
    }

    if (payroll.employeeId.department.toString() !== manager.department.toString()) {
      return res.status(403).json({
        success: false,
        message: "Bạn chỉ có thể từ chối lương của nhân viên trong phòng ban mình",
      });
    }

    // Manager can only reject Draft (send back for recalculation)
    if (payroll.status !== "Draft") {
      return res.status(400).json({
        success: false,
        message: "Manager chỉ có thể từ chối phiếu lương ở trạng thái Draft",
      });
    }

    // ✅ PHƯƠNG ÁN 2: Trả về Draft + Đánh dấu đã bị reject
    payroll.status = "Draft"; // Giữ nguyên Draft để Admin có thể sửa/tính lại
    payroll.rejectedByManager = true;
    
    // Lấy thông tin Manager để lưu vào history
    const managerInfo = await User.findById(managerId).select("full_name");
    
    // Thêm vào rejection history
    payroll.managerRejectionHistory.push({
      rejectedBy: managerId,
      rejectedByName: managerInfo?.full_name || "Manager",
      rejectedAt: new Date(),
      reason: reason,
    });
    
    // Cập nhật notes để Admin biết
    const previousNotes = payroll.notes ? `${payroll.notes}\n\n` : "";
    payroll.notes = `${previousNotes}⚠️ Từ chối bởi Manager (${managerInfo?.full_name}): ${reason}`;

    await payroll.save();

    res.status(200).json({
      success: true,
      message: "Đã từ chối phiếu lương. Admin có thể xem lại và tính lại nếu cần.",
      data: payroll,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
  getDepartmentPayrolls,
  managerApprovePayroll,
  managerRejectPayroll,
};
