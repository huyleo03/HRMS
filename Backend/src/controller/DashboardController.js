const User = require("../models/User");
const Request = require("../models/Request");
const Attendance = require("../models/Attendance");
const Payroll = require("../models/Payroll");
const Department = require("../models/Department");

/**
 * GET /api/dashboard/stats/overview
 * Lấy tất cả KPIs tổng quan cho Admin Dashboard
 * @access Admin only
 */
exports.getOverviewStats = async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11
    const currentYear = now.getFullYear();
    
    // Dates for this month
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
    
    // Dates for last month (for comparison)
    const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfLastMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
    
    // Today
    const today = new Date(currentYear, currentMonth, now.getDate());
    today.setHours(0, 0, 0, 0);

    // ===== 1. EMPLOYEES STATS =====
    const [totalEmployees, activeEmployees, inactiveEmployees, newThisMonth] = 
      await Promise.all([
        User.countDocuments({}),
        User.countDocuments({ status: "Active" }),
        User.countDocuments({ status: "Inactive" }),
        User.countDocuments({
          startDate: { $gte: startOfMonth, $lte: endOfMonth }
        }),
      ]);

    // ===== 2. ATTENDANCE STATS (Today) =====
    const todayAttendance = await Attendance.aggregate([
      {
        $match: {
          date: today,
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Map attendance counts
    const attendanceMap = {};
    todayAttendance.forEach((item) => {
      attendanceMap[item._id] = item.count;
    });

    const todayPresent = (attendanceMap["Present"] || 0) + (attendanceMap["Late"] || 0) + 
                         (attendanceMap["Early Leave"] || 0) + (attendanceMap["Late & Early Leave"] || 0);
    const todayLate = (attendanceMap["Late"] || 0) + (attendanceMap["Late & Early Leave"] || 0);
    const todayAbsent = attendanceMap["Absent"] || 0;
    const todayOnLeave = attendanceMap["On Leave"] || 0;

    // Punctuality rate (this month)
    const monthAttendance = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: startOfMonth, $lte: endOfMonth },
          status: { $in: ["Present", "Late", "Late & Early Leave"] },
        },
      },
      {
        $group: {
          _id: null,
          totalPresent: {
            $sum: {
              $cond: [{ $eq: ["$status", "Present"] }, 1, 0],
            },
          },
          totalLate: {
            $sum: {
              $cond: [
                { $in: ["$status", ["Late", "Late & Early Leave"]] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const punctualityRate =
      monthAttendance.length > 0 && monthAttendance[0].totalPresent + monthAttendance[0].totalLate > 0
        ? ((monthAttendance[0].totalPresent / (monthAttendance[0].totalPresent + monthAttendance[0].totalLate)) * 100).toFixed(1)
        : 0;

    // Average work hours per employee (this month)
    const avgWorkHoursResult = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: startOfMonth, $lte: endOfMonth },
          workHours: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          avgHours: { $avg: "$workHours" },
        },
      },
    ]);

    const avgWorkHoursPerEmployee =
      avgWorkHoursResult.length > 0 ? parseFloat(avgWorkHoursResult[0].avgHours.toFixed(1)) : 0;

    // ===== 3. REQUESTS STATS =====
    const [totalPending, totalApproved, totalRejected] = await Promise.all([
      Request.countDocuments({ status: "Pending" }),
      Request.countDocuments({
        status: "Approved",
        updated_at: { $gte: startOfMonth, $lte: endOfMonth },
      }),
      Request.countDocuments({
        status: "Rejected",
        updated_at: { $gte: startOfMonth, $lte: endOfMonth },
      }),
    ]);

    // Average processing time (this month)
    const processedRequests = await Request.find({
      status: { $in: ["Approved", "Rejected"] },
      updated_at: { $gte: startOfMonth, $lte: endOfMonth },
    }).select("created_at updated_at");

    let avgProcessingTime = 0;
    if (processedRequests.length > 0) {
      const totalProcessingDays = processedRequests.reduce((sum, req) => {
        const days = (req.updated_at - req.created_at) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0);
      avgProcessingTime = parseFloat((totalProcessingDays / processedRequests.length).toFixed(1));
    }

    // Approval rate
    const approvalRate =
      totalApproved + totalRejected > 0
        ? parseFloat(((totalApproved / (totalApproved + totalRejected)) * 100).toFixed(1))
        : 0;

    // ===== 4. PAYROLL STATS =====
    const [thisMonthPayrolls, lastMonthPayrolls] = await Promise.all([
      Payroll.find({
        month: currentMonth + 1,
        year: currentYear,
        status: { $in: ["Approved", "Paid"] },
      }).select("netSalary overtimeAmount status"),
      Payroll.find({
        month: currentMonth === 0 ? 12 : currentMonth,
        year: currentMonth === 0 ? currentYear - 1 : currentYear,
        status: { $in: ["Approved", "Paid"] },
      }).select("netSalary"),
    ]);

    // Calculate totals for this month
    let totalThisMonth = 0;
    let overtimeCost = 0;
    let pendingPayrolls = 0;
    let paidPayrolls = 0;

    thisMonthPayrolls.forEach((payroll) => {
      totalThisMonth += payroll.netSalary || 0;
      overtimeCost += payroll.overtimeAmount || 0;
      if (payroll.status === "Pending") pendingPayrolls++;
      if (payroll.status === "Paid") paidPayrolls++;
    });

    // Calculate total for last month
    const totalLastMonth = lastMonthPayrolls.reduce((sum, payroll) => sum + (payroll.netSalary || 0), 0);

    // Compare to last month
    const comparedToLastMonth =
      totalLastMonth > 0
        ? parseFloat((((totalThisMonth - totalLastMonth) / totalLastMonth) * 100).toFixed(1))
        : 0;

    // Count pending payrolls (status = "Pending")
    const pendingPayrollsCount = await Payroll.countDocuments({
      month: currentMonth + 1,
      year: currentYear,
      status: "Pending",
    });

    // Count paid payrolls (status = "Paid")
    const paidPayrollsCount = await Payroll.countDocuments({
      month: currentMonth + 1,
      year: currentYear,
      status: "Paid",
    });

    // ===== 5. ROLES DISTRIBUTION =====
    const [adminCount, managerCount, employeeCount] = await Promise.all([
      User.countDocuments({ role: "Admin" }),
      User.countDocuments({ role: "Manager" }),
      User.countDocuments({ role: "Employee" }),
    ]);

    // ===== RESPONSE =====
    res.status(200).json({
      employees: {
        total: totalEmployees,
        active: activeEmployees,
        inactive: inactiveEmployees,
        newThisMonth: newThisMonth,
      },
      attendance: {
        todayPresent: todayPresent,
        todayLate: todayLate,
        todayAbsent: todayAbsent,
        todayOnLeave: todayOnLeave,
        punctualityRate: parseFloat(punctualityRate),
        avgWorkHoursPerEmployee: avgWorkHoursPerEmployee,
      },
      requests: {
        totalPending: totalPending,
        totalApproved: totalApproved,
        totalRejected: totalRejected,
        avgProcessingTime: avgProcessingTime,
        approvalRate: approvalRate,
      },
      payroll: {
        totalThisMonth: totalThisMonth,
        overtimeCost: overtimeCost,
        comparedToLastMonth: comparedToLastMonth,
        pendingPayrolls: pendingPayrollsCount,
        paidPayrolls: paidPayrollsCount,
      },
      roles: {
        admin: adminCount,
        manager: managerCount,
        employee: employeeCount,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching overview stats:", error);
    res.status(500).json({
      message: "Lỗi khi lấy thống kê tổng quan",
      error: error.message,
    });
  }
};

/**
 * GET /api/dashboard/stats/requests-details
 * Lấy chi tiết thống kê requests cho Admin Dashboard
 * @access Admin only
 */
exports.getRequestsDetails = async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

    // ===== 1. BY TYPE (Theo loại đơn) =====
    const byType = await Request.aggregate([
      {
        $match: {
          created_at: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
    ]);

    const typeMap = {};
    byType.forEach((item) => {
      typeMap[item._id] = item.count;
    });

    // ===== 2. BY PRIORITY (Theo ưu tiên) =====
    const byPriority = await Request.aggregate([
      {
        $match: {
          status: "Pending",
        },
      },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]);

    const priorityMap = {};
    byPriority.forEach((item) => {
      priorityMap[item._id] = item.count;
    });

    // ===== 3. BY DEPARTMENT (Theo phòng ban) =====
    const byDepartment = await Request.aggregate([
      {
        $match: {
          created_at: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: "$department.department_id",
          departmentName: { $first: "$department.department_name" },
          total: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
          },
          approved: {
            $sum: { $cond: [{ $eq: ["$status", "Approved"] }, 1, 0] },
          },
          rejected: {
            $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] },
          },
        },
      },
      {
        $sort: { total: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // ===== 5. MONTH COMPARISON (So sánh tháng) =====
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const startOfLastMonth = new Date(lastMonthYear, lastMonth, 1);
    const endOfLastMonth = new Date(lastMonthYear, lastMonth + 1, 0, 23, 59, 59, 999);

    const [thisMonthStats, lastMonthStats] = await Promise.all([
      Request.aggregate([
        {
          $match: {
            created_at: { $gte: startOfMonth, $lte: endOfMonth },
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
      Request.aggregate([
        {
          $match: {
            created_at: { $gte: startOfLastMonth, $lte: endOfLastMonth },
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const getStatusCount = (stats, status) => {
      const found = stats.find((s) => s._id === status);
      return found ? found.count : 0;
    };

    const thisMonthTotal = thisMonthStats.reduce((sum, s) => sum + s.count, 0);
    const lastMonthTotal = lastMonthStats.reduce((sum, s) => sum + s.count, 0);

    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return parseFloat((((current - previous) / previous) * 100).toFixed(1));
    };

    const monthComparison = {
      thisMonth: {
        total: thisMonthTotal,
        approved: getStatusCount(thisMonthStats, "Approved"),
        rejected: getStatusCount(thisMonthStats, "Rejected"),
        pending: getStatusCount(thisMonthStats, "Pending"),
      },
      lastMonth: {
        total: lastMonthTotal,
        approved: getStatusCount(lastMonthStats, "Approved"),
        rejected: getStatusCount(lastMonthStats, "Rejected"),
        pending: getStatusCount(lastMonthStats, "Pending"),
      },
      change: {
        total: calculateChange(thisMonthTotal, lastMonthTotal),
        approved: calculateChange(
          getStatusCount(thisMonthStats, "Approved"),
          getStatusCount(lastMonthStats, "Approved")
        ),
        rejected: calculateChange(
          getStatusCount(thisMonthStats, "Rejected"),
          getStatusCount(lastMonthStats, "Rejected")
        ),
        pending: calculateChange(
          getStatusCount(thisMonthStats, "Pending"),
          getStatusCount(lastMonthStats, "Pending")
        ),
      },
    };

    // ===== 6. RECENT REQUESTS (10 đơn gần nhất) =====
    const recentRequests = await Request.find({})
      .select(
        "requestId type status priority created_at submittedByName submittedByAvatar department"
      )
      .populate("submittedBy", "full_name avatar")
      .sort({ created_at: -1 })
      .limit(10)
      .lean();

    const recentRequestsFormatted = recentRequests.map((req) => {
      const hoursSinceCreated = Math.floor((now - req.created_at) / (1000 * 60 * 60));
      return {
        requestId: req.requestId,
        type: req.type,
        status: req.status,
        priority: req.priority,
        submittedBy: {
          name: req.submittedByName,
          avatar: req.submittedByAvatar,
          department: req.department?.department_name || "N/A",
        },
        createdAt: req.created_at,
        hoursSinceCreated,
      };
    });

    // ===== RESPONSE =====
    res.status(200).json({
      byType: typeMap,
      byPriority: priorityMap,
      byDepartment: byDepartment.map((dept) => ({
        departmentId: dept._id,
        departmentName: dept.departmentName || "Unknown",
        total: dept.total,
        pending: dept.pending,
        approved: dept.approved,
        rejected: dept.rejected,
      })),
      monthComparison,
      recentRequests: recentRequestsFormatted,
    });
  } catch (error) {
    console.error("❌ Error fetching requests details:", error);
    res.status(500).json({
      message: "Lỗi khi lấy chi tiết thống kê requests",
      error: error.message,
    });
  }
};

/**
 * GET /api/dashboard/stats/attendance-trend
 * Lấy xu hướng chấm công 7 ngày hoặc 6 tháng gần nhất
 * @access Admin only
 * @query period: 'week' | 'month' (default: 'week')
 */
exports.getAttendanceTrend = async (req, res) => {
  try {
    const { period = "week" } = req.query;
    const now = new Date();
    let startDate, groupBy, dateFormat;

    if (period === "month") {
      // 6 tháng gần nhất
      startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      groupBy = { year: { $year: "$date" }, month: { $month: "$date" } };
      dateFormat = "month";
    } else {
      // 7 ngày gần nhất
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      groupBy = {
        year: { $year: "$date" },
        month: { $month: "$date" },
        day: { $dayOfMonth: "$date" },
      };
      dateFormat = "day";
    }

    const trendData = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: now },
        },
      },
      {
        $group: {
          _id: groupBy,
          total: { $sum: 1 },
          present: {
            $sum: {
              $cond: [
                {
                  $in: [
                    "$status",
                    ["Present", "Late", "Early Leave", "Late & Early Leave"],
                  ],
                },
                1,
                0,
              ],
            },
          },
          late: {
            $sum: {
              $cond: [{ $in: ["$status", ["Late", "Late & Early Leave"]] }, 1, 0],
            },
          },
          absent: {
            $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] },
          },
          onLeave: {
            $sum: { $cond: [{ $eq: ["$status", "On Leave"] }, 1, 0] },
          },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
    ]);

    // Format response
    const formattedData = trendData.map((item) => {
      let date;
      if (dateFormat === "day") {
        date = `${item._id.year}-${String(item._id.month).padStart(2, "0")}-${String(
          item._id.day
        ).padStart(2, "0")}`;
      } else {
        date = `${item._id.year}-${String(item._id.month).padStart(2, "0")}`;
      }

      return {
        date,
        total: item.total,
        present: item.present,
        late: item.late,
        absent: item.absent,
        onLeave: item.onLeave,
        presentRate:
          item.total > 0 ? parseFloat(((item.present / item.total) * 100).toFixed(1)) : 0,
      };
    });

    res.status(200).json({
      period,
      data: formattedData,
    });
  } catch (error) {
    console.error("❌ Error fetching attendance trend:", error);
    res.status(500).json({
      message: "Lỗi khi lấy xu hướng chấm công",
      error: error.message,
    });
  }
};

/**
 * GET /api/dashboard/stats/manager-overview
 * Lấy tổng quan cho Manager Dashboard - chỉ của phòng ban mình quản lý
 * @access Manager only
 */
exports.getManagerOverview = async (req, res) => {
  try {
    const managerId = req.user._id;
    
    // Lấy thông tin manager và phòng ban
    const manager = await User.findById(managerId).select('department');
    if (!manager || !manager.department || !manager.department.department_id) {
      return res.status(404).json({
        message: "Manager không thuộc phòng ban nào",
      });
    }

    const departmentId = manager.department.department_id;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
    
    const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfLastMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
    
    const today = new Date(currentYear, currentMonth, now.getDate());
    today.setHours(0, 0, 0, 0);

    // ===== 1. EMPLOYEES STATS (chỉ phòng ban của manager) =====
    const [totalEmployees, activeEmployees, inactiveEmployees, newThisMonth] = 
      await Promise.all([
        User.countDocuments({ "department.department_id": departmentId }),
        User.countDocuments({ "department.department_id": departmentId, status: "Active" }),
        User.countDocuments({ "department.department_id": departmentId, status: "Inactive" }),
        User.countDocuments({
          "department.department_id": departmentId,
          startDate: { $gte: startOfMonth, $lte: endOfMonth }
        }),
      ]);

    // ===== 2. ATTENDANCE STATS (Today - chỉ phòng ban) =====
    const departmentUserIds = await User.find({
      "department.department_id": departmentId
    }).select('_id').lean();
    
    const userIds = departmentUserIds.map(u => u._id);

    const todayAttendance = await Attendance.aggregate([
      {
        $match: {
          date: today,
          userId: { $in: userIds },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const attendanceMap = {};
    todayAttendance.forEach((item) => {
      attendanceMap[item._id] = item.count;
    });

    const todayPresent = (attendanceMap["Present"] || 0) + (attendanceMap["Late"] || 0) + 
                         (attendanceMap["Early Leave"] || 0) + (attendanceMap["Late & Early Leave"] || 0);
    const todayLate = (attendanceMap["Late"] || 0) + (attendanceMap["Late & Early Leave"] || 0);
    const todayAbsent = attendanceMap["Absent"] || 0;
    const todayOnLeave = attendanceMap["On Leave"] || 0;

    // Punctuality rate (this month - phòng ban)
    const monthAttendance = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: startOfMonth, $lte: endOfMonth },
          userId: { $in: userIds },
          status: { $in: ["Present", "Late", "Late & Early Leave"] },
        },
      },
      {
        $group: {
          _id: null,
          totalPresent: {
            $sum: {
              $cond: [{ $eq: ["$status", "Present"] }, 1, 0],
            },
          },
          totalLate: {
            $sum: {
              $cond: [
                { $in: ["$status", ["Late", "Late & Early Leave"]] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const punctualityRate =
      monthAttendance.length > 0 && monthAttendance[0].totalPresent + monthAttendance[0].totalLate > 0
        ? ((monthAttendance[0].totalPresent / (monthAttendance[0].totalPresent + monthAttendance[0].totalLate)) * 100).toFixed(1)
        : 0;

    // Average work hours (phòng ban)
    const avgWorkHoursResult = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: startOfMonth, $lte: endOfMonth },
          userId: { $in: userIds },
          workHours: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          avgHours: { $avg: "$workHours" },
        },
      },
    ]);

    const avgWorkHoursPerEmployee =
      avgWorkHoursResult.length > 0 ? parseFloat(avgWorkHoursResult[0].avgHours.toFixed(1)) : 0;

    // ===== 3. REQUESTS STATS (phòng ban) =====
    const [totalPending, totalApproved, totalRejected] = await Promise.all([
      Request.countDocuments({ 
        "department.department_id": departmentId,
        status: "Pending" 
      }),
      Request.countDocuments({
        "department.department_id": departmentId,
        status: "Approved",
        updated_at: { $gte: startOfMonth, $lte: endOfMonth },
      }),
      Request.countDocuments({
        "department.department_id": departmentId,
        status: "Rejected",
        updated_at: { $gte: startOfMonth, $lte: endOfMonth },
      }),
    ]);

    // Average processing time
    const processedRequests = await Request.find({
      "department.department_id": departmentId,
      status: { $in: ["Approved", "Rejected"] },
      updated_at: { $gte: startOfMonth, $lte: endOfMonth },
    }).select("created_at updated_at");

    let avgProcessingTime = 0;
    if (processedRequests.length > 0) {
      const totalProcessingDays = processedRequests.reduce((sum, req) => {
        const days = (req.updated_at - req.created_at) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0);
      avgProcessingTime = parseFloat((totalProcessingDays / processedRequests.length).toFixed(1));
    }

    const approvalRate =
      totalApproved + totalRejected > 0
        ? parseFloat(((totalApproved / (totalApproved + totalRejected)) * 100).toFixed(1))
        : 0;

    // ===== 4. PAYROLL STATS (phòng ban) =====
    const thisMonthPayrolls = await Payroll.find({
      employeeId: { $in: userIds },
      month: currentMonth + 1,
      year: currentYear,
      status: { $in: ["Approved", "Paid"] },
    }).select("netSalary overtimeAmount status");

    let totalThisMonth = 0;
    let overtimeCost = 0;

    thisMonthPayrolls.forEach((payroll) => {
      totalThisMonth += payroll.netSalary || 0;
      overtimeCost += payroll.overtimeAmount || 0;
    });

    const lastMonthPayrolls = await Payroll.find({
      employeeId: { $in: userIds },
      month: currentMonth === 0 ? 12 : currentMonth,
      year: currentMonth === 0 ? currentYear - 1 : currentYear,
      status: { $in: ["Approved", "Paid"] },
    }).select("netSalary");

    const totalLastMonth = lastMonthPayrolls.reduce((sum, payroll) => sum + (payroll.netSalary || 0), 0);

    const comparedToLastMonth =
      totalLastMonth > 0
        ? parseFloat((((totalThisMonth - totalLastMonth) / totalLastMonth) * 100).toFixed(1))
        : 0;

    const pendingPayrollsCount = await Payroll.countDocuments({
      employeeId: { $in: userIds },
      month: currentMonth + 1,
      year: currentYear,
      status: "Pending",
    });

    const paidPayrollsCount = await Payroll.countDocuments({
      employeeId: { $in: userIds },
      month: currentMonth + 1,
      year: currentYear,
      status: "Paid",
    });

    // ===== RESPONSE =====
    res.status(200).json({
      departmentInfo: {
        departmentId: manager.department.department_id,
        departmentName: manager.department.department_name,
      },
      employees: {
        total: totalEmployees,
        active: activeEmployees,
        inactive: inactiveEmployees,
        newThisMonth: newThisMonth,
      },
      attendance: {
        todayPresent: todayPresent,
        todayLate: todayLate,
        todayAbsent: todayAbsent,
        todayOnLeave: todayOnLeave,
        punctualityRate: parseFloat(punctualityRate),
        avgWorkHoursPerEmployee: avgWorkHoursPerEmployee,
      },
      requests: {
        totalPending: totalPending,
        totalApproved: totalApproved,
        totalRejected: totalRejected,
        avgProcessingTime: avgProcessingTime,
        approvalRate: approvalRate,
      },
      payroll: {
        totalThisMonth: totalThisMonth,
        overtimeCost: overtimeCost,
        comparedToLastMonth: comparedToLastMonth,
        pendingPayrolls: pendingPayrollsCount,
        paidPayrolls: paidPayrollsCount,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching manager overview:", error);
    res.status(500).json({
      message: "Lỗi khi lấy thống kê phòng ban",
      error: error.message,
    });
  }
};

/**
 * GET /api/dashboard/stats/manager-requests-details
 * Lấy chi tiết requests của phòng ban manager
 * @access Manager only
 */
exports.getManagerRequestsDetails = async (req, res) => {
  try {
    const managerId = req.user._id;
    
    const manager = await User.findById(managerId).select('department');
    if (!manager || !manager.department || !manager.department.department_id) {
      return res.status(404).json({
        message: "Manager không thuộc phòng ban nào",
      });
    }

    const departmentId = manager.department.department_id;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

    // ===== BY TYPE =====
    const byType = await Request.aggregate([
      {
        $match: {
          "department.department_id": departmentId,
          created_at: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
    ]);

    const typeMap = {};
    byType.forEach((item) => {
      typeMap[item._id] = item.count;
    });

    // ===== BY PRIORITY =====
    const byPriority = await Request.aggregate([
      {
        $match: {
          "department.department_id": departmentId,
          status: "Pending",
        },
      },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]);

    const priorityMap = {};
    byPriority.forEach((item) => {
      priorityMap[item._id] = item.count;
    });

    // ===== MONTH COMPARISON =====
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const startOfLastMonth = new Date(lastMonthYear, lastMonth, 1);
    const endOfLastMonth = new Date(lastMonthYear, lastMonth + 1, 0, 23, 59, 59, 999);

    const [thisMonthStats, lastMonthStats] = await Promise.all([
      Request.aggregate([
        {
          $match: {
            "department.department_id": departmentId,
            created_at: { $gte: startOfMonth, $lte: endOfMonth },
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
      Request.aggregate([
        {
          $match: {
            "department.department_id": departmentId,
            created_at: { $gte: startOfLastMonth, $lte: endOfLastMonth },
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const getStatusCount = (stats, status) => {
      const found = stats.find((s) => s._id === status);
      return found ? found.count : 0;
    };

    const thisMonthTotal = thisMonthStats.reduce((sum, s) => sum + s.count, 0);
    const lastMonthTotal = lastMonthStats.reduce((sum, s) => sum + s.count, 0);

    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return parseFloat((((current - previous) / previous) * 100).toFixed(1));
    };

    const monthComparison = {
      thisMonth: {
        total: thisMonthTotal,
        approved: getStatusCount(thisMonthStats, "Approved"),
        rejected: getStatusCount(thisMonthStats, "Rejected"),
        pending: getStatusCount(thisMonthStats, "Pending"),
      },
      lastMonth: {
        total: lastMonthTotal,
        approved: getStatusCount(lastMonthStats, "Approved"),
        rejected: getStatusCount(lastMonthStats, "Rejected"),
        pending: getStatusCount(lastMonthStats, "Pending"),
      },
      change: {
        total: calculateChange(thisMonthTotal, lastMonthTotal),
        approved: calculateChange(
          getStatusCount(thisMonthStats, "Approved"),
          getStatusCount(lastMonthStats, "Approved")
        ),
        rejected: calculateChange(
          getStatusCount(thisMonthStats, "Rejected"),
          getStatusCount(lastMonthStats, "Rejected")
        ),
        pending: calculateChange(
          getStatusCount(thisMonthStats, "Pending"),
          getStatusCount(lastMonthStats, "Pending")
        ),
      },
    };

    // ===== RECENT REQUESTS =====
    const recentRequests = await Request.find({
      "department.department_id": departmentId,
    })
      .select(
        "requestId type status priority created_at submittedByName submittedByAvatar"
      )
      .sort({ created_at: -1 })
      .limit(10)
      .lean();

    const recentRequestsFormatted = recentRequests.map((req) => {
      const hoursSinceCreated = Math.floor((now - req.created_at) / (1000 * 60 * 60));
      return {
        requestId: req.requestId,
        type: req.type,
        status: req.status,
        priority: req.priority,
        submittedBy: {
          name: req.submittedByName,
          avatar: req.submittedByAvatar,
        },
        createdAt: req.created_at,
        hoursSinceCreated,
      };
    });

    res.status(200).json({
      byType: typeMap,
      byPriority: priorityMap,
      monthComparison,
      recentRequests: recentRequestsFormatted,
    });
  } catch (error) {
    console.error("❌ Error fetching manager requests details:", error);
    res.status(500).json({
      message: "Lỗi khi lấy chi tiết requests phòng ban",
      error: error.message,
    });
  }
};

/**
 * GET /api/dashboard/stats/manager-attendance-trend
 * Lấy xu hướng chấm công của phòng ban manager
 * @access Manager only
 */
exports.getManagerAttendanceTrend = async (req, res) => {
  try {
    const managerId = req.user._id;
    const { period = "week" } = req.query;
    
    const manager = await User.findById(managerId).select('department');
    if (!manager || !manager.department || !manager.department.department_id) {
      return res.status(404).json({
        message: "Manager không thuộc phòng ban nào",
      });
    }

    const departmentId = manager.department.department_id;
    const now = new Date();
    let startDate, groupBy, dateFormat;

    if (period === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      groupBy = { year: { $year: "$date" }, month: { $month: "$date" } };
      dateFormat = "month";
    } else {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      groupBy = {
        year: { $year: "$date" },
        month: { $month: "$date" },
        day: { $dayOfMonth: "$date" },
      };
      dateFormat = "day";
    }

    // Get department user IDs
    const departmentUserIds = await User.find({
      "department.department_id": departmentId
    }).select('_id').lean();
    
    const userIds = departmentUserIds.map(u => u._id);

    const trendData = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: now },
          userId: { $in: userIds },
        },
      },
      {
        $group: {
          _id: groupBy,
          total: { $sum: 1 },
          present: {
            $sum: {
              $cond: [
                {
                  $in: [
                    "$status",
                    ["Present", "Late", "Early Leave", "Late & Early Leave"],
                  ],
                },
                1,
                0,
              ],
            },
          },
          late: {
            $sum: {
              $cond: [{ $in: ["$status", ["Late", "Late & Early Leave"]] }, 1, 0],
            },
          },
          absent: {
            $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] },
          },
          onLeave: {
            $sum: { $cond: [{ $eq: ["$status", "On Leave"] }, 1, 0] },
          },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
    ]);

    const formattedData = trendData.map((item) => {
      let date;
      if (dateFormat === "day") {
        date = `${item._id.year}-${String(item._id.month).padStart(2, "0")}-${String(
          item._id.day
        ).padStart(2, "0")}`;
      } else {
        date = `${item._id.year}-${String(item._id.month).padStart(2, "0")}`;
      }

      return {
        date,
        total: item.total,
        present: item.present,
        late: item.late,
        absent: item.absent,
        onLeave: item.onLeave,
        presentRate:
          item.total > 0 ? parseFloat(((item.present / item.total) * 100).toFixed(1)) : 0,
      };
    });

    res.status(200).json({
      period,
      data: formattedData,
    });
  } catch (error) {
    console.error("❌ Error fetching manager attendance trend:", error);
    res.status(500).json({
      message: "Lỗi khi lấy xu hướng chấm công phòng ban",
      error: error.message,
    });
  }
};

