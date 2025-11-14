/**
 * Script để tạo dữ liệu attendance cho tháng 10 và 1-14/11/2025 (45 ngày)
 * Bao gồm tự động tạo đơn OT khi có overtime
 * Chạy: node scripts/seedAttendanceOctNov.js
 */

const mongoose = require("mongoose");
const Attendance = require("../src/models/Attendance");
const User = require("../src/models/User");
const Holiday = require("../src/models/Holiday");
const Request = require("../src/models/Request");
const Payroll = require("../src/models/Payroll"); // Import to prevent "Schema not registered" error
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/HRMS", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Helper: Random time generator
function randomTime(start, end) {
  const startMinutes = start.split(":").reduce((h, m) => parseInt(h) * 60 + parseInt(m));
  const endMinutes = end.split(":").reduce((h, m) => parseInt(h) * 60 + parseInt(m));
  const randomMinutes = Math.floor(Math.random() * (endMinutes - startMinutes)) + startMinutes;
  const hours = Math.floor(randomMinutes / 60);
  const minutes = randomMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

// Helper: Calculate work hours (trừ 1 giờ nghỉ trưa)
function calculateWorkHours(clockIn, clockOut) {
  const [inH, inM] = clockIn.split(":").map(Number);
  const [outH, outM] = clockOut.split(":").map(Number);
  const inMinutes = inH * 60 + inM;
  const outMinutes = outH * 60 + outM;
  const totalMinutes = outMinutes - inMinutes;
  
  // Trừ 60 phút nghỉ trưa nếu làm việc >= 6 tiếng
  const lunchBreak = totalMinutes >= 360 ? 60 : 0;
  const workMinutes = totalMinutes - lunchBreak;
  
  return Math.round((workMinutes / 60) * 10) / 10;
}

// Helper: Calculate overtime hours (tính từ giờ tan ca 17:00)
// Logic: Chỉ tính từ SAU 17:00, tối thiểu 30 phút (0.5h), tối đa 4 giờ
// Giờ vào sớm hay muộn KHÔNG ảnh hưởng đến OT
function calculateOvertimeHours(clockOut, hasOT = false) {
  if (!hasOT) return 0;
  
  const [outH, outM] = clockOut.split(":").map(Number);
  const outMinutes = outH * 60 + outM;
  
  // Giờ tan ca chuẩn: 17:00 (1020 phút từ 0:00)
  const standardEndTime = 17 * 60; // 17:00 = 1020 phút
  
  // Chỉ tính OT nếu ra sau 17:00
  if (outMinutes <= standardEndTime) return 0;
  
  // OT = thời gian từ 17:00 đến giờ ra (KHÔNG trừ giờ vào sớm)
  const otMinutes = outMinutes - standardEndTime;
  
  // Chuyển sang giờ, làm tròn 1 chữ số
  const otHours = Math.round((otMinutes / 60) * 10) / 10;
  
  // Tối thiểu 30 phút (0.5h) mới tính OT, tối đa 4 giờ
  if (otHours < 0.5) return 0;
  return Math.min(4, otHours);
}

// Helper: Generate random IP address
function randomIP() {
  const prefixes = [
    "192.168.1.", // Local network
    "10.0.0.",    // Private network
    "172.16.0.",  // Private network
  ];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = Math.floor(Math.random() * 254) + 1;
  return prefix + suffix;
}

// Helper: Calculate late minutes
function calculateLateMinutes(clockIn, expectedIn = "08:00") {
  const [inH, inM] = clockIn.split(":").map(Number);
  const [expH, expM] = expectedIn.split(":").map(Number);
  const inMinutes = inH * 60 + inM;
  const expMinutes = expH * 60 + expM;
  return Math.max(0, inMinutes - expMinutes);
}

// Helper: Calculate early leave minutes
function calculateEarlyLeaveMinutes(clockOut, expectedOut = "17:00") {
  const [outH, outM] = clockOut.split(":").map(Number);
  const [expH, expM] = expectedOut.split(":").map(Number);
  const outMinutes = outH * 60 + outM;
  const expMinutes = expH * 60 + expM;
  return Math.max(0, expMinutes - outMinutes);
}

// Helper: Generate unique request ID
function generateRequestId() {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let part1 = "";
  let part2 = "";
  for (let i = 0; i < 8; i++) part1 += chars[Math.floor(Math.random() * chars.length)];
  for (let i = 0; i < 4; i++) part2 += chars[Math.floor(Math.random() * chars.length)];
  return `REQ-${part1}-${part2}`;
}

async function seedAttendance() {
  try {
    console.log("🌱 Starting attendance seeding for Oct + Nov 1-14, 2025 (45 days)...");

    // 1. Get all employees
    const employees = await User.find({ role: { $in: ["Employee", "Manager"] } });
    if (employees.length === 0) {
      console.log("❌ No employees found! Please seed users first.");
      process.exit(1);
    }
    console.log(`✅ Found ${employees.length} employees`);

    // 2. Get holidays for Oct-Nov 2025
    const holidays = await Holiday.find({
      date: {
        $gte: new Date("2025-10-01"),
        $lte: new Date("2025-11-14"),
      },
    });
    const holidayDates = holidays.map((h) => h.date.toISOString().split("T")[0]);
    console.log(`✅ Found ${holidays.length} holidays:`, holidayDates);

    // 3. Delete existing attendance for Oct-Nov 1-14, 2025
    const deleteAttendanceResult = await Attendance.deleteMany({
      date: {
        $gte: new Date("2025-10-01T00:00:00.000Z"),
        $lte: new Date("2025-11-14T23:59:59.999Z"),
      },
    });
    console.log(`🗑️  Cleared ${deleteAttendanceResult.deletedCount} existing Oct-Nov 14, 2025 attendance records`);

    // 4. Delete existing OT requests for Oct-Nov 1-14, 2025
    const deleteRequestResult = await Request.deleteMany({
      type: "Overtime",
      startDate: {
        $gte: new Date("2025-10-01T00:00:00.000Z"),
        $lte: new Date("2025-11-14T23:59:59.999Z"),
      },
    });
    console.log(`🗑️  Cleared ${deleteRequestResult.deletedCount} existing OT requests`);

    // 5. Generate attendance for each employee
    let totalRecords = 0;
    let totalOTRequests = 0;
    const periods = [
      { month: 10, year: 2025, startDay: 1, endDay: 31 }, // October
      { month: 11, year: 2025, startDay: 1, endDay: 14 }, // Nov 1-14
    ];

    for (const employee of employees) {
      console.log(`\n📝 Creating attendance for ${employee.full_name} (${employee.employeeId})`);

      // Lấy thông tin manager để approve OT
      let manager = null;
      if (employee.manager_id) {
        manager = await User.findById(employee.manager_id);
      }

      for (const period of periods) {
        const { month, year, startDay, endDay } = period;
      
        for (let day = startDay; day <= endDay; day++) {
        // Tạo date ở đầu ngày UTC để đảm bảo consistency
        const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
          const dayOfWeek = date.getUTCDay(); // 0=Sunday, 6=Saturday
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const dateStr = date.toISOString().split("T")[0];
          const isHoliday = holidayDates.includes(dateStr);

          // Skip weekends (không tạo attendance)
          if (isWeekend) continue;

          // Random patterns for realistic data
          const random = Math.random();
          let attendanceData = null;
          let shouldCreateOTRequest = false; // Track if need to create OT request

          if (isHoliday) {
            // HOLIDAY: 70% không đi, 30% đi làm
            if (random < 0.7) {
              // Không đi làm holiday (không tạo attendance record, nhưng vẫn được lương)
              continue;
            } else {
              // Đi làm holiday (x3 lương)
              let clockIn, clockOut, workHours, overtimeHours;
              
              // 50% làm đủ giờ (không OT)
              if (random < 0.85) {
                clockIn = randomTime("07:45", "08:30");
                clockOut = randomTime("17:00", "17:30");
                workHours = calculateWorkHours(clockIn, clockOut);
                overtimeHours = 0; // Không OT
              } 
              // 50% làm thêm giờ trong ngày holiday
              else {
                clockIn = randomTime("07:45", "08:30");
                clockOut = randomTime("18:30", "20:00");
                workHours = calculateWorkHours(clockIn, clockOut);
                overtimeHours = calculateOvertimeHours(clockOut, true);
                shouldCreateOTRequest = overtimeHours > 0;
              }
              
              // Tạo Date object - giữ nguyên timezone local (VN)
              const [inH, inM] = clockIn.split(":").map(Number);
              const [outH, outM] = clockOut.split(":").map(Number);
              const clockInDate = new Date(year, month - 1, day, inH, inM, 0, 0);
              const clockOutDate = new Date(year, month - 1, day, outH, outM, 0, 0);
              
              attendanceData = {
                userId: employee._id,
                date: date,
                clockIn: clockInDate,
                clockInIP: randomIP(),
                clockOut: clockOutDate,
                clockOutIP: randomIP(),
                status: "Present",
                lateMinutes: calculateLateMinutes(clockIn),
                isEarlyLeave: false,
                earlyLeaveMinutes: 0,
                workHours: workHours,
                location: {
                  latitude: 21.028511 + (Math.random() - 0.5) * 0.01,
                  longitude: 105.804817 + (Math.random() - 0.5) * 0.01,
                },
                overtimeHours: overtimeHours,
                overtimeApproved: overtimeHours > 0 ? true : false,
              };
            }
          } else {
            // NORMAL WORKING DAY
            if (random < 0.85) {
              // 85% Present/Late
              let clockIn, clockOut, workHours, overtimeHours;
              
              // 60% làm đúng giờ (7:50-8:00 vào, 17:00-17:10 ra) - không OT
              // Giới hạn: Đi muộn tối đa 30p (8:00-8:30), về sớm tối đa 30p (16:30-17:00)
              if (random < 0.51) {
                clockIn = randomTime("07:50", "08:00"); // Đúng giờ hoặc sớm
                clockOut = randomTime("17:00", "17:10"); // Đúng giờ hoặc muộn 10p
                workHours = calculateWorkHours(clockIn, clockOut);
                overtimeHours = 0; // Không OT
              } 
              // 25% làm thêm giờ (ra muộn hơn 17:30 để có OT)
              else if (random < 0.76) {
                clockIn = randomTime("08:00", "08:30"); // Đi muộn 0-30 phút
                // Ra từ 17:30-19:00 → OT từ 17:00 = khoảng 0.5-2h
                clockOut = randomTime("17:30", "19:00");
                workHours = calculateWorkHours(clockIn, clockOut);
                overtimeHours = calculateOvertimeHours(clockOut, true);
                shouldCreateOTRequest = overtimeHours > 0;
              }
              // 10% làm thêm nhiều (ra rất muộn)
              else {
                clockIn = randomTime("08:00", "08:30"); // Đi muộn 0-30 phút
                // Ra từ 19:00-21:00 → OT từ 17:00 = khoảng 2-4h
                clockOut = randomTime("19:00", "21:00");
                workHours = calculateWorkHours(clockIn, clockOut);
                overtimeHours = calculateOvertimeHours(clockOut, true);
                shouldCreateOTRequest = overtimeHours > 0;
              }
              
              const late = calculateLateMinutes(clockIn);
              const earlyLeave = calculateEarlyLeaveMinutes(clockOut);
              
              // Xác định status
              let status = "Present";
              let isEarlyLeave = false;
              if (late > 0 && earlyLeave > 0) {
                status = "Late & Early Leave";
                isEarlyLeave = true;
              } else if (late > 0) {
                status = "Late";
              } else if (earlyLeave > 0) {
                status = "Early Leave";
                isEarlyLeave = true;
              }
              
              // Tạo Date object - giữ nguyên timezone local (VN)
              const [inH, inM] = clockIn.split(":").map(Number);
              const [outH, outM] = clockOut.split(":").map(Number);
              const clockInDate = new Date(year, month - 1, day, inH, inM, 0, 0);
              const clockOutDate = new Date(year, month - 1, day, outH, outM, 0, 0);
              
              attendanceData = {
                userId: employee._id,
                date: date,
                clockIn: clockInDate,
                clockInIP: randomIP(),
                clockOut: clockOutDate,
                clockOutIP: randomIP(),
                status: status,
                lateMinutes: late,
                isEarlyLeave: isEarlyLeave,
                earlyLeaveMinutes: earlyLeave,
                workHours: workHours,
                location: {
                  latitude: 21.028511 + (Math.random() - 0.5) * 0.01,
                  longitude: 105.804817 + (Math.random() - 0.5) * 0.01,
                },
                overtimeHours: overtimeHours,
                overtimeApproved: overtimeHours > 0 ? (random < 0.8) : false, // 80% approved nếu có OT
              };
            } else if (random < 0.95) {
              // 10% Early Leave (về sớm tối đa 30 phút: 16:30-17:00)
              const clockIn = randomTime("08:00", "08:30"); // Đi muộn 0-30 phút
              const clockOut = randomTime("16:30", "17:00"); // Về sớm 0-30 phút
              
              const late = calculateLateMinutes(clockIn);
              const earlyLeave = calculateEarlyLeaveMinutes(clockOut);
              
              // Xác định status
              let status = "Early Leave";
              if (late > 0) {
                status = "Late & Early Leave";
              }
              
              // Tạo Date object - giữ nguyên timezone local (VN)
              const [inH, inM] = clockIn.split(":").map(Number);
              const [outH, outM] = clockOut.split(":").map(Number);
              const clockInDate = new Date(year, month - 1, day, inH, inM, 0, 0);
              const clockOutDate = new Date(year, month - 1, day, outH, outM, 0, 0);
              
              attendanceData = {
                userId: employee._id,
                date: date,
                clockIn: clockInDate,
                clockInIP: randomIP(),
                clockOut: clockOutDate,
                clockOutIP: randomIP(),
                status: status,
                lateMinutes: late,
                isEarlyLeave: true,
                earlyLeaveMinutes: earlyLeave,
                workHours: calculateWorkHours(clockIn, clockOut),
                location: {
                  latitude: 21.028511 + (Math.random() - 0.5) * 0.01,
                  longitude: 105.804817 + (Math.random() - 0.5) * 0.01,
                },
                overtimeHours: 0,
                overtimeApproved: false,
              };
            } else {
              // 5% Absent
              attendanceData = {
                userId: employee._id,
                date: date,
                status: "Absent",
                lateMinutes: 0,
                isEarlyLeave: false,
                earlyLeaveMinutes: 0,
                workHours: 0,
                overtimeHours: 0,
                overtimeApproved: false,
              };
            }
          }

          if (attendanceData) {
            try {
              await Attendance.create(attendanceData);
              totalRecords++;

              // Tạo OT request nếu có overtime
              if (shouldCreateOTRequest && attendanceData.overtimeHours > 0 && manager) {
                const otRequest = {
                  requestId: generateRequestId(),
                  submittedBy: employee._id,
                  submittedByName: employee.full_name,
                  submittedByEmail: employee.email,
                  submittedByAvatar: employee.avatar,
                  department: employee.department,
                  type: "Overtime",
                  subject: `OT ${attendanceData.overtimeHours}h - ${dateStr}`,
                  reason: `Làm thêm ${attendanceData.overtimeHours} giờ vào ngày ${dateStr}`,
                  startDate: date,
                  endDate: date,
                  hour: attendanceData.overtimeHours,
                  attachments: [],
                  status: attendanceData.overtimeApproved ? "Approved" : "Pending",
                  priority: "Normal",
                  approvalFlow: [
                    {
                      level: 1,
                      approverId: manager._id,
                      approverName: manager.full_name,
                      approverEmail: manager.email,
                      role: "Approver",
                      status: attendanceData.overtimeApproved ? "Approved" : "Pending",
                      isRead: attendanceData.overtimeApproved,
                      ...(attendanceData.overtimeApproved && {
                        approvedAt: new Date(year, month - 1, day, 18, 0, 0, 0),
                        comment: "Approved",
                      }),
                    },
                  ],
                  cc: [],
                  senderStatus: { isDeleted: false },
                  history: [],
                  sentAt: new Date(year, month - 1, day, 17, 30, 0, 0),
                  created_at: new Date(year, month - 1, day, 17, 30, 0, 0),
                  updated_at: attendanceData.overtimeApproved
                    ? new Date(year, month - 1, day, 18, 0, 0, 0)
                    : new Date(year, month - 1, day, 17, 30, 0, 0),
                };

                await Request.create(otRequest);
                totalOTRequests++;
              }
            } catch (err) {
              if (err.code === 11000) {
                console.log(`⚠️  Skipped duplicate: ${employee.full_name} on ${dateStr}`);
              } else {
                throw err; // Re-throw other errors
              }
            }
          }
        }
      }
    }

    console.log(`\n✅ Successfully created ${totalRecords} attendance records!`);
    console.log(`✅ Successfully created ${totalOTRequests} OT requests!`);
    console.log("\n📊 Summary:");
    console.log(`   - Employees: ${employees.length}`);
    console.log(`   - Period: October 2025 (31 days) + Nov 1-14, 2025 (14 days) = 45 days`);
    console.log(`   - Total attendance: ${totalRecords}`);
    console.log(`   - Total OT requests: ${totalOTRequests}`);
    console.log(`   - Holidays: ${holidays.length}`);
    console.log("\n💡 Tip: Now you can run payroll calculation for Oct-Nov 2025!");

  } catch (error) {
    console.error("❌ Error seeding attendance:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

// Run the seed function
seedAttendance();
