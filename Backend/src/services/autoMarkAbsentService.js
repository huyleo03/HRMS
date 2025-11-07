const cron = require('node-cron');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { getSystemConfig } = require('../controller/ConfigController');
const { createNotificationForMultipleUsers } = require('../helper/NotificationService');

let cronJob = null;
let currentSchedule = null;

// Helper function
function normalizeDate(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Chạy auto mark absent (được gọi bởi cron job)
 */
async function runAutoMarkAbsent() {
  try {
    const config = await getSystemConfig();
    
    // Kiểm tra có bật không
    if (!config.autoActions?.enableAutoMarkAbsent) {
      console.log('⏭️ Auto mark absent is disabled. Skipping...');
      return;
    }
    
    const today = normalizeDate(new Date());
    const users = await User.find({ 
      status: "Active", 
      role: { $in: ["Employee", "Manager"] } 
    });
    
    let markedCount = 0;
    const markedUserIds = [];
    const markedUserNames = [];
    
    for (const user of users) {
      const existing = await Attendance.findOne({ userId: user._id, date: today });
      
      if (!existing) {
        await Attendance.create({
          userId: user._id,
          date: today,
          status: "Absent",
          remarks: "Tự động đánh vắng bởi hệ thống",
        });
        markedCount++;
        markedUserIds.push(user._id);
        markedUserNames.push(user.full_name);
      }
    }
    
    console.log(`✅ Auto mark absent completed: Marked ${markedCount} employees as absent.`);
    
    // 🔔 Gửi thông báo cho những người bị đánh vắng
    if (markedCount > 0) {
      try {
        // Gửi thông báo cho nhân viên bị đánh vắng
        await createNotificationForMultipleUsers(markedUserIds, {
          senderId: null,
          senderName: "Hệ thống",
          senderAvatar: null,
          type: "AttendanceUpdate",
          message: `Bạn đã được hệ thống tự động đánh dấu vắng mặt do không chấm công hôm nay (${new Date().toLocaleDateString('vi-VN')}).`,
          relatedId: null,
        });
        
        console.log(`📬 Sent notifications to ${markedCount} users: ${markedUserNames.join(', ')}`);
        
        // 🔔 Gửi thông báo cho tất cả Admin
        const Admin = require('../models/User');
        const admins = await Admin.find({ role: "Admin", status: "Active" }).select('_id');
        const adminIds = admins.map(admin => admin._id);
        
        if (adminIds.length > 0) {
          const { createNotificationForMultipleUsers: notifyAdmins } = require('../helper/NotificationService');
          await notifyAdmins(adminIds, {
            senderId: null,
            senderName: "Hệ thống",
            senderAvatar: null,
            type: "General",
            message: `Hệ thống đã tự động đánh vắng ${markedCount} nhân viên không chấm công hôm nay (${new Date().toLocaleDateString('vi-VN')}). Danh sách: ${markedUserNames.join(', ')}.`,
            relatedId: null,
          });
          console.log(`📬 Sent admin notification to ${adminIds.length} admins`);
        }
      } catch (notifError) {
        console.error('⚠️ Error sending notifications:', notifError.message);
      }
    }
  } catch (error) {
    console.error('❌ Auto mark absent error:', error.message);
  }
}

/**
 * Setup cron job dựa trên config
 */
async function setupCronJob() {
  try {
    const config = await getSystemConfig();
    const autoMarkTime = config.autoActions?.autoMarkAbsentTime || "09:30";
    const isEnabled = config.autoActions?.enableAutoMarkAbsent ?? true;
    
    console.log(`📋 Auto Mark Absent Config:`);
    console.log(`   - Enabled: ${isEnabled}`);
    console.log(`   - Time: ${autoMarkTime}`);
    
    // Nếu đã có cron job và schedule giống nhau, không cần setup lại
    if (cronJob && currentSchedule === autoMarkTime) {
      console.log(`   - Cron job already running at ${autoMarkTime} ✅`);
      return;
    }
    
    // Dừng cron job cũ nếu có
    if (cronJob) {
      cronJob.stop();
      console.log('🛑 Stopped old auto mark absent cron job');
    }
    
    if (!isEnabled) {
      console.log('⏸️ Auto mark absent is disabled');
      cronJob = null;
      currentSchedule = null;
      return;
    }
    
    // Parse time
    const [hour, minute] = autoMarkTime.split(':').map(Number);
    
    // Cron format: minute hour * * *
    const cronSchedule = `${minute} ${hour} * * *`;
    
    // Tạo cron job mới
    cronJob = cron.schedule(cronSchedule, () => {
      console.log(`\n⏰ Running auto mark absent at ${autoMarkTime}...`);
      runAutoMarkAbsent();
    }, {
      timezone: "Asia/Ho_Chi_Minh"
    });
    
    currentSchedule = autoMarkTime;
    
    console.log(`✅ Auto mark absent cron job scheduled at ${autoMarkTime} (Cron: ${cronSchedule}, Timezone: Asia/Ho_Chi_Minh)`);
  } catch (error) {
    console.error('❌ Error setting up auto mark absent cron job:', error.message);
  }
}

/**
 * Start service
 */
function startAutoMarkAbsentService() {
  console.log('🤖 Starting Auto Mark Absent Service...');
  setupCronJob();
  // Note: Cron job sẽ tự động refresh khi Admin thay đổi config ở Settings
}

/**
 * Stop service
 */
function stopAutoMarkAbsentService() {
  if (cronJob) {
    cronJob.stop();
    console.log('🛑 Stopped Auto Mark Absent Service');
  }
}

module.exports = {
  startAutoMarkAbsentService,
  stopAutoMarkAbsentService,
  setupCronJob, // Export để ConfigController có thể gọi khi update config
};
