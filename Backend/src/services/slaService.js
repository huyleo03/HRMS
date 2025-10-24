/**
 * SLA (Service Level Agreement) Service
 * Handles SLA deadline tracking, reminders, and auto-escalation
 */

const Request = require("../models/Request");
const User = require("../models/User");
const { sendEmail } = require("../utils/email");

// SLA Configuration
const SLA_CONFIG = {
  DEFAULT_DEADLINE_HOURS: 48, // Default SLA: 48 hours
  REMINDER_INTERVALS: [24, 36], // Send reminders at 24h and 36h
  ESCALATION_HOURS: 48, // Escalate after 48 hours
  CHECK_INTERVAL_MINUTES: 30, // Check SLA every 30 minutes
};

/**
 * Calculate SLA deadline for a request
 */
const calculateSLADeadline = (sentAt, deadlineHours = SLA_CONFIG.DEFAULT_DEADLINE_HOURS) => {
  const deadline = new Date(sentAt);
  deadline.setHours(deadline.getHours() + deadlineHours);
  return deadline;
};

/**
 * Initialize SLA for new request
 */
const initializeSLA = async (requestId) => {
  try {
    const request = await Request.findById(requestId);
    
    if (!request || !request.sentAt) {
      return null;
    }

    const deadline = calculateSLADeadline(request.sentAt);

    request.sla = {
      deadline,
      isOverdue: false,
      overdueHours: 0,
      remindersSent: [],
    };

    await request.save();

    console.log(`✅ SLA initialized for request ${request.requestId}: Deadline ${deadline.toISOString()}`);

    return request.sla;
  } catch (error) {
    console.error(`❌ Failed to initialize SLA for request ${requestId}:`, error.message);
    return null;
  }
};

/**
 * Check if request is overdue
 */
const checkOverdue = (request) => {
  if (!request.sla?.deadline) {
    return { isOverdue: false, overdueHours: 0 };
  }

  const now = new Date();
  const deadline = new Date(request.sla.deadline);

  if (now > deadline) {
    const overdueMs = now - deadline;
    const overdueHours = Math.floor(overdueMs / (1000 * 60 * 60));
    return { isOverdue: true, overdueHours };
  }

  return { isOverdue: false, overdueHours: 0 };
};

/**
 * Send SLA reminder email to pending approvers
 */
const sendSLAReminder = async (request, reminderType) => {
  try {
    // Get pending approvers
    const pendingApprovers = request.approvers.filter(
      (app) => app.status === "Pending"
    );

    if (pendingApprovers.length === 0) {
      console.log(`ℹ️  No pending approvers for request ${request.requestId}, skipping reminder`);
      return [];
    }

    const recipientIds = [];

    for (const approver of pendingApprovers) {
      try {
        const user = await User.findById(approver.approver);
        
        if (!user || !user.email) {
          console.warn(`⚠️  Approver ${approver.approver} not found or has no email`);
          continue;
        }

        const emailSubject = `⏰ SLA Reminder: Request ${request.requestId} needs your approval`;
        
        let urgencyMessage = "";
        if (reminderType === "24h") {
          urgencyMessage = "This request has been pending for 24 hours.";
        } else if (reminderType === "36h") {
          urgencyMessage = "⚠️ URGENT: This request has been pending for 36 hours and will be escalated soon!";
        } else if (reminderType === "overdue") {
          urgencyMessage = "🚨 CRITICAL: This request is now OVERDUE and has been escalated!";
        }

        const emailBody = `
          <h2>SLA Reminder: Request Pending Approval</h2>
          <p>Dear ${user.fullName},</p>
          <p>${urgencyMessage}</p>
          
          <h3>Request Details:</h3>
          <ul>
            <li><strong>Request ID:</strong> ${request.requestId}</li>
            <li><strong>Type:</strong> ${request.requestType}</li>
            <li><strong>Subject:</strong> ${request.subject || "No subject"}</li>
            <li><strong>Submitted by:</strong> ${request.submittedByName}</li>
            <li><strong>Submitted at:</strong> ${new Date(request.sentAt).toLocaleString()}</li>
            <li><strong>SLA Deadline:</strong> ${new Date(request.sla.deadline).toLocaleString()}</li>
          </ul>

          <h3>Action Required:</h3>
          <p>Please review and approve/reject this request as soon as possible.</p>
          <p><a href="${process.env.FRONTEND_URL}/requests/${request._id}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Request</a></p>

          <p>Best regards,<br>HRMS System</p>
        `;

        await sendEmail({
          to: user.email,
          subject: emailSubject,
          html: emailBody,
        });

        recipientIds.push(approver.approver);

        console.log(`✅ SLA reminder sent to ${user.email} for request ${request.requestId}`);
      } catch (emailError) {
        console.error(`❌ Failed to send reminder to approver ${approver.approver}:`, emailError.message);
      }
    }

    // Record reminder sent
    if (recipientIds.length > 0) {
      request.sla.remindersSent.push({
        sentAt: new Date(),
        type: reminderType,
        recipientIds,
      });
      await request.save();
    }

    return recipientIds;
  } catch (error) {
    console.error(`❌ Failed to send SLA reminder for request ${request.requestId}:`, error.message);
    return [];
  }
};

/**
 * Escalate request to higher manager
 */
const escalateRequest = async (request) => {
  try {
    // Get current pending approver
    const pendingApprover = request.approvers.find(
      (app) => app.status === "Pending"
    );

    if (!pendingApprover) {
      console.log(`ℹ️  No pending approver for request ${request.requestId}, skipping escalation`);
      return null;
    }

    // Get approver's manager
    const approver = await User.findById(pendingApprover.approver).populate("manager_id");

    if (!approver || !approver.manager_id) {
      console.warn(`⚠️  No manager found for approver ${pendingApprover.approver}, cannot escalate`);
      
      // Try to find admin as fallback
      const admin = await User.findOne({ role: "Admin" });
      
      if (admin) {
        request.sla.escalatedTo = admin._id;
        request.sla.escalatedAt = new Date();
        request.sla.escalationReason = "No manager found, escalated to Admin";
        await request.save();

        // Send email to admin
        await sendEmail({
          to: admin.email,
          subject: `🚨 Escalated Request: ${request.requestId}`,
          html: `
            <h2>Request Escalation Alert</h2>
            <p>Dear Admin,</p>
            <p>The following request has been escalated to you due to SLA violation:</p>
            <ul>
              <li><strong>Request ID:</strong> ${request.requestId}</li>
              <li><strong>Type:</strong> ${request.requestType}</li>
              <li><strong>Submitted by:</strong> ${request.submittedByName}</li>
              <li><strong>Overdue by:</strong> ${request.sla.overdueHours} hours</li>
              <li><strong>Reason:</strong> Original approver has no manager</li>
            </ul>
            <p><a href="${process.env.FRONTEND_URL}/requests/${request._id}">View Request</a></p>
          `,
        });

        console.log(`✅ Request ${request.requestId} escalated to Admin ${admin.email}`);
        return admin;
      }

      return null;
    }

    const manager = approver.manager_id;

    // Update request with escalation info
    request.sla.escalatedTo = manager._id;
    request.sla.escalatedAt = new Date();
    request.sla.escalationReason = `Escalated due to SLA violation (${request.sla.overdueHours}h overdue)`;
    
    await request.save();

    // Send escalation email to manager
    const emailSubject = `🚨 Escalated Request: ${request.requestId} (SLA Violation)`;
    const emailBody = `
      <h2>Request Escalation Alert</h2>
      <p>Dear ${manager.fullName},</p>
      <p>The following request has been escalated to you because it has exceeded the SLA deadline:</p>
      
      <h3>Request Details:</h3>
      <ul>
        <li><strong>Request ID:</strong> ${request.requestId}</li>
        <li><strong>Type:</strong> ${request.requestType}</li>
        <li><strong>Subject:</strong> ${request.subject || "No subject"}</li>
        <li><strong>Submitted by:</strong> ${request.submittedByName}</li>
        <li><strong>Submitted at:</strong> ${new Date(request.sentAt).toLocaleString()}</li>
        <li><strong>SLA Deadline:</strong> ${new Date(request.sla.deadline).toLocaleString()}</li>
        <li><strong>Overdue by:</strong> ${request.sla.overdueHours} hours</li>
        <li><strong>Original Approver:</strong> ${approver.fullName} (${approver.email})</li>
      </ul>

      <h3>Action Required:</h3>
      <p>This request requires immediate attention. Please review and take appropriate action.</p>
      <p><a href="${process.env.FRONTEND_URL}/requests/${request._id}" style="background-color: #f44336; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Request (Urgent)</a></p>

      <p>Best regards,<br>HRMS System</p>
    `;

    await sendEmail({
      to: manager.email,
      subject: emailSubject,
      html: emailBody,
    });

    // Also notify original approver about escalation
    await sendEmail({
      to: approver.email,
      subject: `📢 Request ${request.requestId} has been escalated to ${manager.fullName}`,
      html: `
        <h2>Request Escalation Notification</h2>
        <p>Dear ${approver.fullName},</p>
        <p>The request ${request.requestId} assigned to you has been escalated to your manager ${manager.fullName} due to SLA violation (${request.sla.overdueHours}h overdue).</p>
        <p>Please coordinate with your manager to resolve this request.</p>
        <p>Best regards,<br>HRMS System</p>
      `,
    });

    console.log(`✅ Request ${request.requestId} escalated to ${manager.fullName} (${manager.email})`);

    return manager;
  } catch (error) {
    console.error(`❌ Failed to escalate request ${request.requestId}:`, error.message);
    return null;
  }
};

/**
 * Check and process SLA for all pending requests
 */
const checkAllRequestsSLA = async () => {
  try {
    console.log("🔍 Checking SLA for all pending requests...");

    // Find all requests that are pending approval and have SLA deadline
    const requests = await Request.find({
      status: { $in: ["Pending", "Manager_Approved"] },
      "sla.deadline": { $exists: true },
    });

    console.log(`📊 Found ${requests.length} requests with SLA tracking`);

    let reminders24h = 0;
    let reminders36h = 0;
    let escalations = 0;
    let overdueUpdates = 0;

    for (const request of requests) {
      try {
        const now = new Date();
        const deadline = new Date(request.sla.deadline);
        const sentAt = new Date(request.sentAt);
        
        const hoursElapsed = (now - sentAt) / (1000 * 60 * 60);
        const { isOverdue, overdueHours } = checkOverdue(request);

        // Update overdue status
        if (isOverdue && !request.sla.isOverdue) {
          request.sla.isOverdue = true;
          request.sla.overdueHours = overdueHours;
          await request.save();
          overdueUpdates++;
        }

        // Check if we need to send 24h reminder
        if (
          hoursElapsed >= 24 &&
          hoursElapsed < 25 &&
          !request.sla.remindersSent.some((r) => r.type === "24h")
        ) {
          await sendSLAReminder(request, "24h");
          reminders24h++;
        }

        // Check if we need to send 36h reminder
        if (
          hoursElapsed >= 36 &&
          hoursElapsed < 37 &&
          !request.sla.remindersSent.some((r) => r.type === "36h")
        ) {
          await sendSLAReminder(request, "36h");
          reminders36h++;
        }

        // Check if we need to escalate (48h overdue)
        if (
          isOverdue &&
          overdueHours >= SLA_CONFIG.ESCALATION_HOURS &&
          !request.sla.escalatedTo
        ) {
          await sendSLAReminder(request, "overdue");
          await escalateRequest(request);
          escalations++;
        }
      } catch (error) {
        console.error(`❌ Error processing SLA for request ${request.requestId}:`, error.message);
      }
    }

    console.log(`✅ SLA check completed:`);
    console.log(`   - 24h reminders sent: ${reminders24h}`);
    console.log(`   - 36h reminders sent: ${reminders36h}`);
    console.log(`   - Escalations: ${escalations}`);
    console.log(`   - Overdue status updates: ${overdueUpdates}`);

    return {
      totalChecked: requests.length,
      reminders24h,
      reminders36h,
      escalations,
      overdueUpdates,
    };
  } catch (error) {
    console.error("❌ Failed to check SLA for requests:", error.message);
    return null;
  }
};

// Store interval ID for cleanup
let slaMonitoringInterval = null;

/**
 * Start SLA monitoring background job
 */
const startSLAMonitoring = () => {
  console.log(`⏰ SLA monitoring enabled (checks every ${SLA_CONFIG.CHECK_INTERVAL_MINUTES} minutes)`);

  // Check immediately on startup (silently)
  checkAllRequestsSLA();

  // Then check periodically
  const intervalMs = SLA_CONFIG.CHECK_INTERVAL_MINUTES * 60 * 1000;
  
  slaMonitoringInterval = setInterval(() => {
    checkAllRequestsSLA();
  }, intervalMs);
};

/**
 * Stop SLA monitoring background job
 */
const stopSLAMonitoring = () => {
  if (slaMonitoringInterval) {
    clearInterval(slaMonitoringInterval);
    slaMonitoringInterval = null;
    console.log('⏰ SLA monitoring stopped');
  }
};

/**
 * Get SLA statistics
 */
const getSLAStats = async () => {
  try {
    const totalWithSLA = await Request.countDocuments({
      "sla.deadline": { $exists: true },
    });

    const overdue = await Request.countDocuments({
      "sla.isOverdue": true,
      status: { $in: ["Pending", "Manager_Approved"] },
    });

    const escalated = await Request.countDocuments({
      "sla.escalatedTo": { $exists: true },
    });

    const approaching24h = await Request.countDocuments({
      status: { $in: ["Pending", "Manager_Approved"] },
      "sla.deadline": {
        $gte: new Date(),
        $lte: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return {
      totalWithSLA,
      overdue,
      escalated,
      approaching24h,
    };
  } catch (error) {
    console.error("❌ Failed to get SLA stats:", error.message);
    return null;
  }
};

module.exports = {
  SLA_CONFIG,
  calculateSLADeadline,
  initializeSLA,
  checkOverdue,
  sendSLAReminder,
  escalateRequest,
  checkAllRequestsSLA,
  startSLAMonitoring,
  stopSLAMonitoring,
  getSLAStats,
};
