/**
 * Data Archiving Service
 * Handles automatic archival of old requests to improve performance
 */

const Request = require("../models/Request");
const ArchivedRequest = require("../models/ArchivedRequest");

// ===================================================================
// CONFIGURATION
// ===================================================================

const ARCHIVING_CONFIG = {
  // Archive requests older than this (in months)
  DEFAULT_AGE_MONTHS: 6,

  // Batch size for archiving (process in chunks to avoid memory issues)
  BATCH_SIZE: 100,

  // Statuses eligible for archiving
  ARCHIVABLE_STATUSES: ["Completed", "Approved", "Rejected", "Cancelled"],

  // Run archiving job monthly
  JOB_INTERVAL_DAYS: 30,

  // Delete original after archiving?
  DELETE_AFTER_ARCHIVE: true,
};

// ===================================================================
// HELPER FUNCTIONS
// ===================================================================

/**
 * Calculate cutoff date for archiving
 */
function getCutoffDate(monthsOld = ARCHIVING_CONFIG.DEFAULT_AGE_MONTHS) {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - monthsOld);
  return cutoffDate;
}

/**
 * Find requests eligible for archiving
 */
async function findRequestsToArchive(monthsOld = ARCHIVING_CONFIG.DEFAULT_AGE_MONTHS) {
  try {
    const cutoffDate = getCutoffDate(monthsOld);

    const query = {
      status: { $in: ARCHIVING_CONFIG.ARCHIVABLE_STATUSES },
      $or: [
        { updated_at: { $lt: cutoffDate } },
        { updatedAt: { $lt: cutoffDate } },
        { created_at: { $lt: cutoffDate } },
        { createdAt: { $lt: cutoffDate } },
      ],
    };

    const requests = await Request.find(query)
      .sort({ created_at: 1 })
      .limit(ARCHIVING_CONFIG.BATCH_SIZE)
      .lean();

    // ✅ Chỉ log khi có requests cần archive
    if (requests.length > 0) {
      console.log(`📦 Found ${requests.length} requests eligible for archiving (older than ${monthsOld} months)`);
    }

    return requests;
  } catch (error) {
    console.error("❌ Error finding requests to archive:", error.message);
    throw error;
  }
}

/**
 * Archive a single request
 */
async function archiveRequest(requestId, archivedBy = null, reason = "Automatic archival of old requests") {
  try {
    // Find the request
    const request = await Request.findById(requestId);

    if (!request) {
      throw new Error(`Request ${requestId} not found`);
    }

    // Check if already archived
    const existingArchive = await ArchivedRequest.findOne({ originalId: request._id });
    if (existingArchive) {
      console.log(`⚠️ Request ${request.requestId} is already archived`);
      return existingArchive;
    }

    // Archive the request
    const archivedRequest = await ArchivedRequest.archiveRequest(request, archivedBy, reason);

    // Delete original if configured
    if (ARCHIVING_CONFIG.DELETE_AFTER_ARCHIVE) {
      await Request.findByIdAndDelete(request._id);
      console.log(`🗑️ Deleted original request ${request.requestId} after archiving`);
    }

    return archivedRequest;
  } catch (error) {
    console.error(`❌ Failed to archive request ${requestId}:`, error.message);
    throw error;
  }
}

/**
 * Archive multiple requests in batch
 */
async function archiveBatch(monthsOld = ARCHIVING_CONFIG.DEFAULT_AGE_MONTHS) {
  try {
    const requests = await findRequestsToArchive(monthsOld);

    if (requests.length === 0) {
      // ✅ Không log gì khi không có requests cần archive (giảm noise)
      return {
        success: true,
        archived: 0,
        failed: 0,
        results: [],
      };
    }

    // ✅ Chỉ log khi có requests cần archive
    console.log(`\n📦 Starting batch archival process...`);
    console.log(`📅 Archiving ${requests.length} requests older than ${monthsOld} months`);

    let archived = 0;
    let failed = 0;
    const results = [];

    for (const request of requests) {
      try {
        await archiveRequest(request._id, null, `Batch archival - older than ${monthsOld} months`);
        archived++;
        results.push({
          requestId: request.requestId,
          status: "success",
        });
      } catch (error) {
        failed++;
        results.push({
          requestId: request.requestId || request._id,
          status: "failed",
          error: error.message,
        });
      }
    }

    console.log(`\n✅ Batch archival completed:`);
    console.log(`   📦 Archived: ${archived}`);
    console.log(`   ❌ Failed: ${failed}`);

    return {
      success: true,
      archived,
      failed,
      results,
    };
  } catch (error) {
    console.error("❌ Batch archival process failed:", error.message);
    throw error;
  }
}

/**
 * Restore an archived request
 */
async function restoreFromArchive(archivedRequestId, restoredBy) {
  try {
    const archivedRequest = await ArchivedRequest.findById(archivedRequestId);

    if (!archivedRequest) {
      throw new Error(`Archived request ${archivedRequestId} not found`);
    }

    if (archivedRequest.isRestored) {
      throw new Error(`Request ${archivedRequest.requestId} has already been restored`);
    }

    // Restore the request
    const restoredRequest = await archivedRequest.restore(restoredBy);

    console.log(`✅ Successfully restored request ${archivedRequest.requestId}`);

    return restoredRequest;
  } catch (error) {
    console.error(`❌ Failed to restore archived request ${archivedRequestId}:`, error.message);
    throw error;
  }
}

/**
 * Get archived requests with filters
 */
async function getArchivedRequests(filters = {}) {
  try {
    return await ArchivedRequest.searchArchived(filters);
  } catch (error) {
    console.error("❌ Error getting archived requests:", error.message);
    throw error;
  }
}

/**
 * Get archiving statistics
 */
async function getArchivingStats() {
  try {
    const archivedStats = await ArchivedRequest.getStats();

    const activeRequests = await Request.countDocuments();

    const oldestActive = await Request.findOne()
      .sort({ created_at: 1 })
      .select("created_at createdAt requestId")
      .lean();

    const oldestArchived = await ArchivedRequest.findOne()
      .sort({ originalCreatedAt: 1 })
      .select("originalCreatedAt requestId")
      .lean();

    const recentlyArchived = await ArchivedRequest.find()
      .sort({ archivedAt: -1 })
      .limit(10)
      .select("requestId requestType status archivedAt originalCreatedAt")
      .lean();

    // Find eligible requests for next archival
    const cutoffDate = getCutoffDate();
    const eligibleForArchival = await Request.countDocuments({
      status: { $in: ARCHIVING_CONFIG.ARCHIVABLE_STATUSES },
      $or: [
        { updated_at: { $lt: cutoffDate } },
        { updatedAt: { $lt: cutoffDate } },
        { created_at: { $lt: cutoffDate } },
        { createdAt: { $lt: cutoffDate } },
      ],
    });

    return {
      activeRequests,
      archivedRequests: archivedStats.total,
      totalRequests: activeRequests + archivedStats.total,
      archivedByStatus: archivedStats.byStatus,
      archivedByType: archivedStats.byRequestType,
      restoredCount: archivedStats.restored,
      oldestActive: oldestActive
        ? {
            requestId: oldestActive.requestId,
            date: oldestActive.created_at || oldestActive.createdAt,
          }
        : null,
      oldestArchived: oldestArchived
        ? {
            requestId: oldestArchived.requestId,
            date: oldestArchived.originalCreatedAt,
          }
        : null,
      recentlyArchived,
      eligibleForArchival,
      config: {
        archiveAfterMonths: ARCHIVING_CONFIG.DEFAULT_AGE_MONTHS,
        archivableStatuses: ARCHIVING_CONFIG.ARCHIVABLE_STATUSES,
        deleteAfterArchive: ARCHIVING_CONFIG.DELETE_AFTER_ARCHIVE,
      },
    };
  } catch (error) {
    console.error("❌ Error getting archiving stats:", error.message);
    throw error;
  }
}

/**
 * Clean up very old archived requests (permanent deletion)
 * Use with caution - this permanently deletes data!
 */
async function purgeOldArchives(yearsOld = 7) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - yearsOld);

    console.log(`\n🗑️ WARNING: Purging archives older than ${yearsOld} years (before ${cutoffDate.toISOString()})`);

    const result = await ArchivedRequest.deleteMany({
      archivedAt: { $lt: cutoffDate },
    });

    console.log(`✅ Permanently deleted ${result.deletedCount} archived requests older than ${yearsOld} years`);

    return {
      success: true,
      deletedCount: result.deletedCount,
      cutoffDate,
    };
  } catch (error) {
    console.error("❌ Error purging old archives:", error.message);
    throw error;
  }
}

// ===================================================================
// BACKGROUND JOB
// ===================================================================

let archivingInterval = null;

/**
 * Start automatic archiving background job
 */
function startArchivingJob() {
  if (archivingInterval) {
    console.log("⚠️ Archiving job is already running");
    return;
  }

  console.log(`📦 Archiving service enabled (runs every ${ARCHIVING_CONFIG.JOB_INTERVAL_DAYS} days, threshold: ${ARCHIVING_CONFIG.DEFAULT_AGE_MONTHS} months)`);

  // Run immediately on startup (silently)
  archiveBatch().catch((error) => {
    console.error("❌ Initial archival failed:", error.message);
  });

  // Schedule recurring job
  // ✅ Fix: 30 days = 2,592,000,000ms > max 32-bit int (2,147,483,647)
  // Solution: Use smaller interval (1 day) and check if 30 days passed
  const oneDayMs = 24 * 60 * 60 * 1000;
  let dayCounter = 0;
  
  archivingInterval = setInterval(async () => {
    dayCounter++;
    
    // Only run archival every 30 days
    if (dayCounter >= ARCHIVING_CONFIG.JOB_INTERVAL_DAYS) {
      dayCounter = 0;
      try {
        await archiveBatch();
      } catch (error) {
        console.error("❌ Scheduled archiving job failed:", error.message);
      }
    }
  }, oneDayMs);
}

/**
 * Stop automatic archiving background job
 */
function stopArchivingJob() {
  if (archivingInterval) {
    clearInterval(archivingInterval);
    archivingInterval = null;
    console.log("🛑 Archiving job stopped");
  }
}

// ===================================================================
// EXPORTS
// ===================================================================

module.exports = {
  // Core functions
  findRequestsToArchive,
  archiveRequest,
  archiveBatch,
  restoreFromArchive,
  getArchivedRequests,
  getArchivingStats,
  purgeOldArchives,

  // Background job
  startArchivingJob,
  stopArchivingJob,

  // Config (for testing/admin)
  ARCHIVING_CONFIG,
};
