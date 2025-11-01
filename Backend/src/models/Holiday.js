const mongoose = require("mongoose");

const holidaySchema = new mongoose.Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    
    // Date Information
    date: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      default: null, // Null means single-day holiday
    },
    year: {
      type: Number,
      required: true,
    },
    
    // Holiday Type
    type: {
      type: String,
      enum: ["National", "Company", "Optional", "Regional"],
      default: "National",
    },
    category: {
      type: String,
      enum: ["Public Holiday", "Religious", "Cultural", "Company Event", "Other"],
      default: "Public Holiday",
    },
    
    // Recurring Information
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringPattern: {
      type: {
        type: String,
        enum: ["yearly", "monthly", "custom"],
        default: "yearly",
      },
      day: Number, // Day of month (1-31)
      month: Number, // Month (1-12)
    },
    
    // Applicability
    appliesTo: {
      type: String,
      enum: ["All", "Specific Departments", "Specific Employees"],
      default: "All",
    },
    departments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    }],
    employees: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    
    // Holiday Settings
    isPaid: {
      type: Boolean,
      default: true,
    },
    affectsAttendance: {
      type: Boolean,
      default: true,
    },
    
    // Status
    status: {
      type: String,
      enum: ["Active", "Inactive", "Draft"],
      default: "Active",
    },
    
    // Additional Information
    color: {
      type: String,
      default: "#3b82f6", // Blue color
    },
    notes: {
      type: String,
    },
    
    // Metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// ===== INDEXES =====
holidaySchema.index({ date: 1, year: 1 });
holidaySchema.index({ status: 1 });
holidaySchema.index({ type: 1 });
holidaySchema.index({ year: 1, status: 1 });

// ===== VIRTUAL PROPERTIES =====

// Calculate duration in days
holidaySchema.virtual("duration").get(function () {
  if (!this.endDate) return 1;
  const start = new Date(this.date);
  const end = new Date(this.endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
});

// Check if holiday is upcoming
holidaySchema.virtual("isUpcoming").get(function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return this.date >= today;
});

// Check if holiday is past
holidaySchema.virtual("isPast").get(function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = this.endDate || this.date;
  return endDate < today;
});

// ===== MIDDLEWARE =====

// Pre-save: Set year from date
holidaySchema.pre("save", function (next) {
  if (this.date) {
    this.year = new Date(this.date).getFullYear();
  }
  
  // Validate endDate is after date
  if (this.endDate && this.endDate < this.date) {
    return next(new Error("End date must be after start date"));
  }
  
  next();
});

// ===== INSTANCE METHODS =====

// Check if holiday applies to a user
holidaySchema.methods.appliesToUser = function (userId, userDeptId) {
  if (this.appliesTo === "All") return true;
  
  if (this.appliesTo === "Specific Departments") {
    return this.departments.some(d => d.toString() === userDeptId.toString());
  }
  
  if (this.appliesTo === "Specific Employees") {
    return this.employees.some(e => e.toString() === userId.toString());
  }
  
  return false;
};

// ===== STATIC METHODS =====

// Check if a date is a holiday
holidaySchema.statics.isHoliday = async function (date, userId = null, userDeptId = null) {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);
  
  const holidays = await this.find({
    status: "Active",
    $or: [
      { date: { $lte: targetDate }, endDate: { $gte: targetDate } },
      { date: targetDate, endDate: null },
    ],
  }).populate("departments");
  
  // Filter by applicability if userId provided
  if (userId && userDeptId) {
    const applicableHolidays = holidays.filter(h => 
      h.appliesToUser(userId, userDeptId)
    );
    return applicableHolidays.length > 0 ? applicableHolidays[0] : null;
  }
  
  return holidays.length > 0 ? holidays[0] : null;
};

// Generate recurring holidays for next year
holidaySchema.statics.generateRecurringHolidays = async function (sourceYear, targetYear, createdBy) {
  const sourceHolidays = await this.find({
    year: sourceYear,
    isRecurring: true,
    status: "Active",
  });
  
  const newHolidays = [];
  
  for (const holiday of sourceHolidays) {
    const newDate = new Date(holiday.date);
    newDate.setFullYear(targetYear);
    
    let newEndDate = null;
    if (holiday.endDate) {
      newEndDate = new Date(holiday.endDate);
      newEndDate.setFullYear(targetYear);
    }
    
    // Check if already exists
    const exists = await this.findOne({
      name: holiday.name,
      year: targetYear,
    });
    
    if (!exists) {
      newHolidays.push({
        name: holiday.name,
        description: holiday.description,
        date: newDate,
        endDate: newEndDate,
        year: targetYear,
        type: holiday.type,
        category: holiday.category,
        isRecurring: holiday.isRecurring,
        recurringPattern: holiday.recurringPattern,
        appliesTo: holiday.appliesTo,
        departments: holiday.departments,
        employees: holiday.employees,
        isPaid: holiday.isPaid,
        affectsAttendance: holiday.affectsAttendance,
        color: holiday.color,
        notes: holiday.notes,
        createdBy: createdBy,
      });
    }
  }
  
  if (newHolidays.length > 0) {
    return this.insertMany(newHolidays);
  }
  
  return [];
};

// Get upcoming holidays (next N holidays)
holidaySchema.statics.getUpcomingHolidays = async function (limit = 5, userId = null, userDeptId = null) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let holidays = await this.find({
    status: "Active",
    date: { $gte: today },
  })
    .populate("createdBy", "full_name email")
    .populate("departments", "department_name")
    .sort({ date: 1 })
    .limit(limit * 3); // Get more to filter by applicability
  
  // Filter by applicability if userId provided
  if (userId && userDeptId) {
    holidays = holidays.filter(h => h.appliesToUser(userId, userDeptId));
  }
  
  return holidays.slice(0, limit);
};

// Get holidays for calendar view (specific month)
holidaySchema.statics.getCalendarHolidays = async function (year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  return this.find({
    status: "Active",
    $or: [
      { date: { $gte: startDate, $lte: endDate } },
      { endDate: { $gte: startDate, $lte: endDate } },
      {
        date: { $lte: startDate },
        endDate: { $gte: endDate },
      },
    ],
  })
    .populate("createdBy", "full_name email")
    .populate("departments", "department_name")
    .sort({ date: 1 });
};

const Holiday = mongoose.model("Holiday", holidaySchema, "Holiday");

module.exports = Holiday;
