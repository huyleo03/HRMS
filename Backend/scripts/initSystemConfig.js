/**
 * Script to initialize default system configuration
 * Run this once after deploying the Settings module
 * 
 * Usage: node scripts/initSystemConfig.js
 */

const mongoose = require("mongoose");
require("dotenv").config();

const SystemConfig = require("../src/models/SystemConfig");

const DEFAULT_CONFIG = {
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
    allowedIPs: [
      "::1",                // Localhost IPv6
      "127.0.0.1",          // Localhost IPv4
      "::ffff:127.0.0.1",   // IPv6-mapped IPv4
    ],
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
};

async function initSystemConfig() {
  try {
    // Connect to MongoDB
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Check if config already exists
    const existing = await SystemConfig.findOne({ configType: "company" });
    
    if (existing) {
      console.log("⚠️  System config already exists!");
      console.log("📋 Current config:");
      console.log(JSON.stringify(existing, null, 2));
      
      const readline = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      
      readline.question("\nDo you want to reset to default? (yes/no): ", async (answer) => {
        if (answer.toLowerCase() === "yes" || answer.toLowerCase() === "y") {
          await SystemConfig.deleteOne({ configType: "company" });
          const newConfig = await SystemConfig.create(DEFAULT_CONFIG);
          console.log("✅ Config reset to default successfully!");
          console.log(JSON.stringify(newConfig, null, 2));
        } else {
          console.log("❌ Operation cancelled");
        }
        
        readline.close();
        await mongoose.disconnect();
        process.exit(0);
      });
    } else {
      // Create new config
      console.log("📝 Creating default system config...");
      const config = await SystemConfig.create(DEFAULT_CONFIG);
      console.log("✅ System config created successfully!");
      console.log(JSON.stringify(config, null, 2));
      
      await mongoose.disconnect();
      process.exit(0);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the script
initSystemConfig();
