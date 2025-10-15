// Script tạo dữ liệu mẫu cho test Postman
// Chạy: node createTestData.js

const mongoose = require('mongoose');
require('dotenv').config();

const Attendance = require('./src/models/Attendance');
const User = require('./src/models/User');

// Kết nối DB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/HRMS')
  .then(() => console.log('✅ Kết nối MongoDB thành công'))
  .catch((err) => {
    console.error('❌ Lỗi kết nối MongoDB:', err.message);
    process.exit(1);
  });

function normalizeDate(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function randomTime(baseDate, startHour, endHour) {
  const date = new Date(baseDate);
  const hour = startHour + Math.floor(Math.random() * (endHour - startHour + 1));
  const minute = Math.floor(Math.random() * 60);
  date.setHours(hour, minute, 0, 0);
  return date;
}

async function createTestData() {
  try {
    console.log('\n🌱 Tạo dữ liệu test...\n');
    
    // Lấy users
    const users = await User.find({ 
      status: 'Active',
      role: { $in: ['Employee', 'Manager'] }
    }).lean();
    
    if (users.length === 0) {
      console.log('⚠️ Không có user nào! Tạo user trước khi chạy script này.');
      process.exit(1);
    }
    
    console.log(`📊 Tìm thấy ${users.length} users`);
    
    // Xóa dữ liệu cũ
    const deleted = await Attendance.deleteMany({});
    console.log(`🗑️ Đã xóa ${deleted.deletedCount} bản ghi cũ\n`);
    
    const records = [];
    const today = new Date();
    
    // Tạo dữ liệu 7 ngày gần nhất
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = normalizeDate(new Date(today.getTime() - dayOffset * 24 * 60 * 60 * 1000));
      
      // Bỏ qua cuối tuần
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      console.log(`📅 Tạo dữ liệu cho ngày: ${date.toISOString().split('T')[0]}`);
      
      for (const user of users) {
        const rand = Math.random();
        
        if (rand > 0.85) {
          // 15% vắng
          records.push({
            userId: user._id,
            date,
            status: 'Absent',
          });
        } else {
          // 85% có mặt
          const clockInTime = randomTime(date, 7, 9);
          const clockOutTime = randomTime(date, 17, 19);
          
          const lateMinutes = Math.max(0, (clockInTime.getHours() * 60 + clockInTime.getMinutes()) - (8 * 60));
          const isLate = lateMinutes > 15;
          
          const workMs = clockOutTime - clockInTime;
          const workMinutes = Math.floor(workMs / 60000);
          const workHours = +(workMinutes / 60).toFixed(2);
          
          const overtimeMinutes = Math.max(0, workMinutes - 480);
          const overtimeHours = overtimeMinutes >= 30 ? +(overtimeMinutes / 60).toFixed(2) : 0;
          
          records.push({
            userId: user._id,
            date,
            clockIn: clockInTime,
            clockInIP: '192.168.1.' + Math.floor(Math.random() * 255),
            clockInPhoto: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
            clockOut: clockOutTime,
            clockOutIP: '192.168.1.' + Math.floor(Math.random() * 255),
            clockOutPhoto: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
            status: isLate ? 'Late' : 'Present',
            isLate,
            lateMinutes: isLate ? lateMinutes : 0,
            workHours,
            overtimeHours,
          });
        }
      }
    }
    
    // Insert vào DB
    if (records.length > 0) {
      await Attendance.insertMany(records);
      console.log(`\n✅ Đã tạo ${records.length} bản ghi chấm công`);
    }
    
    // Thống kê
    const stats = {
      total: records.length,
      present: records.filter(r => r.status === 'Present').length,
      late: records.filter(r => r.status === 'Late').length,
      absent: records.filter(r => r.status === 'Absent').length,
    };
    
    console.log('\n📊 Thống kê:');
    console.log(`   - Tổng: ${stats.total}`);
    console.log(`   - Đúng giờ: ${stats.present} (${((stats.present/stats.total)*100).toFixed(1)}%)`);
    console.log(`   - Đi muộn: ${stats.late} (${((stats.late/stats.total)*100).toFixed(1)}%)`);
    console.log(`   - Vắng: ${stats.absent} (${((stats.absent/stats.total)*100).toFixed(1)}%)`);
    console.log('\n✅ Hoàn thành! Giờ có thể test trên Postman.\n');
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

createTestData();
