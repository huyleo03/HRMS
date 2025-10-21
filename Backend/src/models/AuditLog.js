/**
 * AuditLog Model
 * Tracks all critical actions for compliance, security, and debugging
 */

const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    // Who performed the action
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    userRole: {
      type: String,
      required: true,
    },

    // What action was performed
    action: {
      type: String,
      required: true,
      enum: [
        "CREATE_REQUEST",
        "APPROVE_REQUEST",
        "REJECT_REQUEST",
        "REQUEST_CHANGES",
        "RESUBMIT_REQUEST",
        "CANCEL_REQUEST",
        "FORCE_APPROVE",
        "FORCE_REJECT",
        "CREATE_WORKFLOW",
        "UPDATE_WORKFLOW",
        "DELETE_WORKFLOW",
        "CREATE_USER",
        "UPDATE_USER",
        "DELETE_USER",
        "CREATE_DEPARTMENT",
        "UPDATE_DEPARTMENT",
        "DELETE_DEPARTMENT",
        "LOGIN",
        "LOGOUT",
        "PASSWORD_CHANGE",
        "PASSWORD_RESET",
        "FAILED_LOGIN",
      ],
      index: true,
    },

    // What resource was affected
    resourceType: {
      type: String,
      required: true,
      enum: ["Request", "Workflow", "User", "Department", "Auth"],
      index: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },
    resourceName: {
      type: String, // Human-readable resource name
    },

    // Details of the action
    description: {
      type: String,
      required: true,
    },
    
    // Before and after values (for updates)
    changes: {
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed,
    },

    // Request metadata
    ipAddress: {
      type: String,
      index: true,
    },
    userAgent: {
      type: String,
    },
    requestMethod: {
      type: String, // GET, POST, PUT, DELETE
    },
    requestUrl: {
      type: String,
    },

    // Outcome
    status: {
      type: String,
      enum: ["SUCCESS", "FAILURE", "PARTIAL"],
      default: "SUCCESS",
      index: true,
    },
    errorMessage: {
      type: String,
    },

    // Additional metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },

    // Timestamp
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    collection: "auditlogs",
  }
);

// ===================================================================
// INDEXES for performance
// ===================================================================

// Compound index for common queries
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ status: 1, timestamp: -1 });

// Text index for searching descriptions
auditLogSchema.index({ 
  description: "text", 
  userName: "text", 
  userEmail: "text" 
});

// ===================================================================
// STATIC METHODS
// ===================================================================

/**
 * Log an action to audit trail
 */
auditLogSchema.statics.log = async function ({
  userId,
  userName,
  userEmail,
  userRole,
  action,
  resourceType,
  resourceId,
  resourceName,
  description,
  changes,
  ipAddress,
  userAgent,
  requestMethod,
  requestUrl,
  status = "SUCCESS",
  errorMessage,
  metadata,
}) {
  try {
    const auditLog = await this.create({
      userId,
      userName,
      userEmail,
      userRole,
      action,
      resourceType,
      resourceId,
      resourceName,
      description,
      changes,
      ipAddress,
      userAgent,
      requestMethod,
      requestUrl,
      status,
      errorMessage,
      metadata,
      timestamp: new Date(),
    });

    console.log(
      `✅ Audit Log: [${action}] by ${userName} (${userEmail}) - ${description}`
    );

    return auditLog;
  } catch (error) {
    // Don't throw - audit logging should not break main flow
    console.error("❌ Failed to create audit log:", error.message);
    return null;
  }
};

/**
 * Get audit logs for a specific user
 */
auditLogSchema.statics.getUserLogs = async function (
  userId,
  { limit = 50, skip = 0, action, startDate, endDate } = {}
) {
  const query = { userId };

  if (action) {
    query.action = action;
  }

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip)
    .lean();
};

/**
 * Get audit logs for a specific resource
 */
auditLogSchema.statics.getResourceLogs = async function (
  resourceType,
  resourceId,
  { limit = 50, skip = 0 } = {}
) {
  return this.find({ resourceType, resourceId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip)
    .populate("userId", "fullName email role")
    .lean();
};

/**
 * Get recent failed actions (for security monitoring)
 */
auditLogSchema.statics.getFailedActions = async function ({
  limit = 100,
  hours = 24,
} = {}) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  return this.find({
    status: "FAILURE",
    timestamp: { $gte: since },
  })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

/**
 * Get audit statistics
 */
auditLogSchema.statics.getStats = async function ({
  startDate,
  endDate,
  userId,
} = {}) {
  const match = {};

  if (startDate || endDate) {
    match.timestamp = {};
    if (startDate) match.timestamp.$gte = new Date(startDate);
    if (endDate) match.timestamp.$lte = new Date(endDate);
  }

  if (userId) {
    match.userId = mongoose.Types.ObjectId(userId);
  }

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$action",
        count: { $sum: 1 },
        successCount: {
          $sum: { $cond: [{ $eq: ["$status", "SUCCESS"] }, 1, 0] },
        },
        failureCount: {
          $sum: { $cond: [{ $eq: ["$status", "FAILURE"] }, 1, 0] },
        },
      },
    },
    { $sort: { count: -1 } },
  ]);

  return stats;
};

/**
 * Archive old logs (>6 months)
 */
auditLogSchema.statics.archiveOldLogs = async function (months = 6) {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - months);

  const result = await this.deleteMany({
    timestamp: { $lt: cutoffDate },
  });

  console.log(
    `✅ Archived ${result.deletedCount} audit logs older than ${months} months`
  );

  return result;
};

// ===================================================================
// INSTANCE METHODS
// ===================================================================

/**
 * Format audit log for display
 */
auditLogSchema.methods.toSummary = function () {
  return {
    id: this._id,
    user: `${this.userName} (${this.userEmail})`,
    action: this.action,
    resource: `${this.resourceType}${
      this.resourceName ? `: ${this.resourceName}` : ""
    }`,
    description: this.description,
    status: this.status,
    timestamp: this.timestamp,
    ipAddress: this.ipAddress,
  };
};

module.exports = mongoose.model("AuditLog", auditLogSchema);
