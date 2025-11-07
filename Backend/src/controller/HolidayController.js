const Holiday = require("../models/Holiday");

// ===== 1. CREATE HOLIDAY (Admin only) =====
exports.createHoliday = async (req, res) => {
  try {
    const {
      name,
      description,
      date,
      endDate,
      type,
      isRecurring,
      appliesTo,
      departments,
      isPaid,
      notes,
      color,
    } = req.body;
    
    // Validation
    if (!name || !date) {
      return res.status(400).json({
        success: false,
        message: "Tên và ngày nghỉ là bắt buộc",
      });
    }
    
    const holidayDate = new Date(date);
    const year = holidayDate.getFullYear();
    
    // Check duplicate
    const existing = await Holiday.findOne({
      name,
      year,
      status: "Active",
    });
    
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Ngày nghỉ này đã tồn tại trong năm " + year,
      });
    }
    
    const holiday = new Holiday({
      name,
      description,
      date: holidayDate,
      endDate: endDate ? new Date(endDate) : null,
      year,
      type: type || "National",
      isRecurring: isRecurring || false,
      appliesTo: appliesTo || "All Employees",
      departments: departments || [],
      isPaid: isPaid !== undefined ? isPaid : true,
      notes,
      color: color || "#3b82f6",
      createdBy: req.user._id,
    });
    
    await holiday.save();
    await holiday.populate("createdBy", "full_name email");
    
    res.status(201).json({
      success: true,
      message: "Tạo ngày nghỉ thành công",
      data: holiday,
    });
  } catch (error) {
    console.error("Create holiday error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi tạo ngày nghỉ",
    });
  }
};

// ===== 2. GET ALL HOLIDAYS (with filters & pagination) =====
exports.getHolidays = async (req, res) => {
  try {
    const {
      year,
      type,
      status,
      page = 1,
      limit = 50,
      sortBy = "date",
      order = "asc",
    } = req.query;
    
    const query = {};
    
    if (year) query.year = parseInt(year);
    if (type) query.type = type;
    if (status) query.status = status;
    else query.status = "Active"; // Default to active only
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === "desc" ? -1 : 1;
    
    const holidays = await Holiday.find(query)
      .populate("createdBy", "full_name email")
      .populate("departments", "department_name")
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Holiday.countDocuments(query);
    
    res.json({
      success: true,
      data: holidays,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get holidays error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi lấy danh sách ngày nghỉ",
    });
  }
};

// ===== 3. GET HOLIDAY BY ID =====
exports.getHolidayById = async (req, res) => {
  try {
    const holiday = await Holiday.findById(req.params.id)
      .populate("createdBy", "full_name email")
      .populate("updatedBy", "full_name email")
      .populate("departments", "department_name")
      .populate("employees", "full_name email employeeId");
    
    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy ngày nghỉ",
      });
    }
    
    res.json({
      success: true,
      data: holiday,
    });
  } catch (error) {
    console.error("Get holiday by ID error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi lấy thông tin ngày nghỉ",
    });
  }
};

// ===== 4. UPDATE HOLIDAY (Admin only) =====
exports.updateHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findById(req.params.id);
    
    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy ngày nghỉ",
      });
    }
    
    const {
      name,
      description,
      date,
      endDate,
      type,
      isRecurring,
      appliesTo,
      departments,
      isPaid,
      notes,
      color,
      status,
    } = req.body;
    
    // Update fields
    if (name) holiday.name = name;
    if (description !== undefined) holiday.description = description;
    if (date) {
      holiday.date = new Date(date);
      holiday.year = new Date(date).getFullYear();
    }
    if (endDate !== undefined) holiday.endDate = endDate ? new Date(endDate) : null;
    if (type) holiday.type = type;
    if (isRecurring !== undefined) holiday.isRecurring = isRecurring;
    if (appliesTo) holiday.appliesTo = appliesTo;
    if (departments !== undefined) holiday.departments = departments;
    if (isPaid !== undefined) holiday.isPaid = isPaid;
    if (notes !== undefined) holiday.notes = notes;
    if (color) holiday.color = color;
    if (status) holiday.status = status;
    
    holiday.updatedBy = req.user._id;
    
    await holiday.save();
    await holiday.populate("createdBy", "full_name email");
    await holiday.populate("updatedBy", "full_name email");
    
    res.json({
      success: true,
      message: "Cập nhật ngày nghỉ thành công",
      data: holiday,
    });
  } catch (error) {
    console.error("Update holiday error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi cập nhật ngày nghỉ",
    });
  }
};

// ===== 5. DELETE HOLIDAY (Admin only - soft delete) =====
exports.deleteHoliday = async (req, res) => {
  try {
    
    const holiday = await Holiday.findById(req.params.id);
    
    if (!holiday) {
      console.log('❌ [DELETE HOLIDAY] Holiday not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy ngày nghỉ",
      });
    }
  
    
    // Soft delete - set status to Inactive
    holiday.status = "Inactive";
    holiday.updatedBy = req.user._id;
    await holiday.save();
    
    console.log('✅ [DELETE HOLIDAY] Successfully set status to Inactive');
    
    res.json({
      success: true,
      message: "Xóa ngày nghỉ thành công",
    });
  } catch (error) {
    console.error("❌ [DELETE HOLIDAY] Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi xóa ngày nghỉ",
    });
  }
};

// ===== 6. GET UPCOMING HOLIDAYS =====
exports.getUpcomingHolidays = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const userId = req.user._id;
    const userDeptId = req.user.department;
    
    const holidays = await Holiday.getUpcomingHolidays(
      parseInt(limit),
      userId,
      userDeptId
    );
    
    res.json({
      success: true,
      data: holidays,
    });
  } catch (error) {
    console.error("Get upcoming holidays error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi lấy danh sách ngày nghỉ sắp tới",
    });
  }
};

// ===== 7. GET CALENDAR HOLIDAYS (for calendar view) =====
exports.getCalendarHolidays = async (req, res) => {
  try {
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: "Year và month là bắt buộc",
      });
    }
    
    const holidays = await Holiday.getCalendarHolidays(
      parseInt(year),
      parseInt(month)
    );
    
    res.json({
      success: true,
      data: holidays,
    });
  } catch (error) {
    console.error("Get calendar holidays error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi lấy lịch ngày nghỉ",
    });
  }
};

// ===== 8. BULK CREATE HOLIDAYS (Admin only) =====
exports.bulkCreateHolidays = async (req, res) => {
  try {
    const { holidays } = req.body;
    
    if (!holidays || !Array.isArray(holidays) || holidays.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Danh sách ngày nghỉ không hợp lệ",
      });
    }
    
    const results = {
      created: 0,
      failed: 0,
      errors: [],
    };
    
    for (const holidayData of holidays) {
      try {
        const holidayDate = new Date(holidayData.date);
        const year = holidayDate.getFullYear();
        
        // Check duplicate
        const existing = await Holiday.findOne({
          name: holidayData.name,
          year,
          status: "Active",
        });
        
        if (existing) {
          results.failed++;
          results.errors.push({
            name: holidayData.name,
            error: "Đã tồn tại",
          });
          continue;
        }
        
        // Remove field "id" trước khi tạo (tránh conflict với _id)
        const { id, ...cleanData } = holidayData;
        
        const holiday = new Holiday({
          ...cleanData,
          year,
          date: holidayDate,
          endDate: holidayData.endDate ? new Date(holidayData.endDate) : null,
          appliesTo: holidayData.appliesTo || "All Employees", // Default: áp dụng cho tất cả
          createdBy: req.user._id,
        });
        
        await holiday.save();
        results.created++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          name: holidayData.name,
          error: error.message,
        });
      }
    }
    
    res.json({
      success: true,
      message: `Tạo thành công ${results.created}/${holidays.length} ngày nghỉ`,
      data: results,
    });
  } catch (error) {
    console.error("Bulk create holidays error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi tạo hàng loạt ngày nghỉ",
    });
  }
};

// ===== 9. GENERATE RECURRING HOLIDAYS (Admin only) =====
exports.generateRecurringHolidays = async (req, res) => {
  try {
    const { sourceYear, targetYear } = req.body;
    
    if (!sourceYear || !targetYear) {
      return res.status(400).json({
        success: false,
        message: "Source year và target year là bắt buộc",
      });
    }
    
    const newHolidays = await Holiday.generateRecurringHolidays(
      parseInt(sourceYear),
      parseInt(targetYear),
      req.user._id
    );
    
    res.json({
      success: true,
      message: `Tạo thành công ${newHolidays.length} ngày nghỉ cho năm ${targetYear}`,
      data: newHolidays,
    });
  } catch (error) {
    console.error("Generate recurring holidays error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi tạo ngày nghỉ định kỳ",
    });
  }
};

// ===== 10. CHECK IF DATE IS HOLIDAY =====
exports.checkHoliday = async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date là bắt buộc",
      });
    }
    
    const userId = req.user._id;
    const userDeptId = req.user.department;
    
    const holiday = await Holiday.isHoliday(date, userId, userDeptId);
    
    res.json({
      success: true,
      isHoliday: !!holiday,
      holiday: holiday || null,
    });
  } catch (error) {
    console.error("Check holiday error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi kiểm tra ngày nghỉ",
    });
  }
};
