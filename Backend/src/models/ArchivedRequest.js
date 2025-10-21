/**
 * ArchivedRequest Model
 * Stores old completed/cancelled requests for compliance and audit purposes
 */

const mongoose = require("mongoose");

// Reuse Request schema structure but mark as archived
const archivedRequestSchema = new mongoose.Schema(
  {
    // Original request data (stored as Mixed for flexibility)
    originalData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    // Original request ID for reference
    originalId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    // Request metadata for quick queries
    requestId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    requestType: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      index: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    submittedByName: {
      type: String,
      required: true,
    },
    submittedByEmail: {
      type: String,
      required: true,
    },

    // Archive metadata
    archivedAt: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    archivedReason: {
      type: String,
      default: "Automatic archival of old requests",
    },

    // Original timestamps
    originalCreatedAt: {
      type: Date,
      required: true,
      index: true,
    },
    originalCompletedAt: {
      type: Date,
      index: true,
    },
    originalCancelledAt: {
      type: Date,
      index: true,
    },

    // Restoration tracking
    isRestored: {
      type: Boolean,
      default: false,
      index: true,
    },
    restoredAt: {
      type: Date,
    },
    restoredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    collection: "archivedrequests",
  }
);

// ===================================================================
// INDEXES
// ===================================================================

archivedRequestSchema.index({ submittedBy: 1, archivedAt: -1 });
archivedRequestSchema.index({ requestType: 1, archivedAt: -1 });
archivedRequestSchema.index({ status: 1, archivedAt: -1 });
archivedRequestSchema.index({ originalCreatedAt: 1 });

// Text search
archivedRequestSchema.index({
  requestId: "text",
  submittedByName: "text",
  submittedByEmail: "text",
});

// ===================================================================
// STATIC METHODS
// ===================================================================

/**
 * Archive a request
 */
archivedRequestSchema.statics.archiveRequest = async function (
  request,
  archivedBy = null,
  reason = "Automatic archival of old requests"
) {
  try {
    const archivedRequest = await this.create({
      originalData: request.toObject(),
      originalId: request._id,
      requestId: request.requestId,
      requestType: request.requestType,
      status: request.status,
      submittedBy: request.submittedBy,
      submittedByName: request.submittedByName,
      submittedByEmail: request.submittedByEmail,
      archivedBy,
      archivedReason: reason,
      originalCreatedAt: request.created_at || request.createdAt,
      originalCompletedAt:
        request.status === "Completed" || request.status === "Approved"
          ? request.updated_at || request.updatedAt
          : null,
      originalCancelledAt: request.senderStatus?.cancelledAt || null,
    });

    console.log(`✅ Archived request ${request.requestId} to ArchivedRequests collection`);

    return archivedRequest;
  } catch (error) {
    console.error(`❌ Failed to archive request ${request.requestId}:`, error.message);
    throw error;
  }
};

/**
 * Search archived requests
 */
archivedRequestSchema.statics.searchArchived = async function ({
  userId,
  requestType,
  status,
  startDate,
  endDate,
  searchText,
  limit = 50,
  skip = 0,
} = {}) {
  const query = {};

  if (userId) {
    query.submittedBy = userId;
  }

  if (requestType) {
    query.requestType = requestType;
  }

  if (status) {
    query.status = status;
  }

  if (startDate || endDate) {
    query.originalCreatedAt = {};
    if (startDate) query.originalCreatedAt.$gte = new Date(startDate);
    if (endDate) query.originalCreatedAt.$lte = new Date(endDate);
  }

  if (searchText) {
    query.$text = { $search: searchText };
  }

  return this.find(query)
    .sort({ archivedAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();
};

/**
 * Get archive statistics
 */
archivedRequestSchema.statics.getStats = async function () {
  const total = await this.countDocuments();

  const byStatus = await this.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const byRequestType = await this.aggregate([
    {
      $group: {
        _id: "$requestType",
        count: { $sum: 1 },
      },
    },
  ]);

  const restored = await this.countDocuments({ isRestored: true });

  return {
    total,
    byStatus,
    byRequestType,
    restored,
  };
};

// ===================================================================
// INSTANCE METHODS
// ===================================================================

/**
 * Restore archived request back to main collection
 */
archivedRequestSchema.methods.restore = async function (restoredBy) {
  try {
    const Request = require("./Request");

    // Create new request from archived data
    const restoredRequest = await Request.create({
      ...this.originalData,
      _id: undefined, // Create new ID
      __v: undefined, // Reset version
    });

    // Mark archive as restored
    this.isRestored = true;
    this.restoredAt = new Date();
    this.restoredBy = restoredBy;
    await this.save();

    console.log(`✅ Restored request ${this.requestId} from archive`);

    return restoredRequest;
  } catch (error) {
    console.error(`❌ Failed to restore request ${this.requestId}:`, error.message);
    throw error;
  }
};

/**
 * Get summary of archived request
 */
archivedRequestSchema.methods.getSummary = function () {
  return {
    id: this._id,
    requestId: this.requestId,
    requestType: this.requestType,
    status: this.status,
    submittedBy: {
      id: this.submittedBy,
      name: this.submittedByName,
      email: this.submittedByEmail,
    },
    archivedAt: this.archivedAt,
    originalCreatedAt: this.originalCreatedAt,
    isRestored: this.isRestored,
  };
};

module.exports = mongoose.model("ArchivedRequest", archivedRequestSchema);
