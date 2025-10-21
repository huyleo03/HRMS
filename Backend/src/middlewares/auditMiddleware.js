/**
 * Audit Logging Middleware
 * Automatically logs critical actions to audit trail
 */

const AuditLog = require("../models/AuditLog");

/**
 * Helper to extract IP address from request
 */
const getIpAddress = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.headers["x-real-ip"] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    "Unknown"
  );
};

/**
 * Helper to create audit log entry
 */
const createAuditLog = async ({
  req,
  action,
  resourceType,
  resourceId,
  resourceName,
  description,
  changes,
  status = "SUCCESS",
  errorMessage,
  metadata,
}) => {
  try {
    // Don't log if no user (shouldn't happen, but safety check)
    if (!req.user) {
      console.warn("⚠️  Audit log skipped - no user in request");
      return null;
    }

    const auditData = {
      userId: req.user.userId,
      userName: req.user.fullName || req.user.email,
      userEmail: req.user.email,
      userRole: req.user.role,
      action,
      resourceType,
      resourceId,
      resourceName,
      description,
      changes,
      ipAddress: getIpAddress(req),
      userAgent: req.headers["user-agent"],
      requestMethod: req.method,
      requestUrl: req.originalUrl || req.url,
      status,
      errorMessage,
      metadata,
    };

    return await AuditLog.log(auditData);
  } catch (error) {
    // Don't break main flow if audit logging fails
    console.error("❌ Audit logging error:", error.message);
    return null;
  }
};

/**
 * Middleware to log request creation
 */
const logRequestCreation = async (req, res, next) => {
  // Store original send function
  const originalSend = res.send;

  // Override send to capture response
  res.send = function (data) {
    // Parse response if it's JSON string
    let responseData;
    try {
      responseData = typeof data === "string" ? JSON.parse(data) : data;
    } catch (e) {
      responseData = data;
    }

    // Log if successful (status 200 or 201)
    if (res.statusCode === 200 || res.statusCode === 201) {
      const request = responseData.data || responseData.request;

      if (request && request._id) {
        createAuditLog({
          req,
          action: "CREATE_REQUEST",
          resourceType: "Request",
          resourceId: request._id,
          resourceName: request.subject || request.requestType,
          description: `Created new ${request.requestType} request: ${
            request.subject || "No subject"
          }`,
          metadata: {
            requestType: request.requestType,
            fromDate: request.fromDate,
            toDate: request.toDate,
            approvalFlow: request.approvalFlow,
          },
        });
      }
    }

    // Call original send
    return originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware to log request approval
 */
const logRequestApproval = async (req, res, next) => {
  const originalSend = res.send;

  res.send = function (data) {
    let responseData;
    try {
      responseData = typeof data === "string" ? JSON.parse(data) : data;
    } catch (e) {
      responseData = data;
    }

    if (res.statusCode === 200) {
      const request = responseData.data || responseData.request;

      if (request && request._id) {
        const isForceApprove = req.originalUrl.includes("force-approve");

        createAuditLog({
          req,
          action: isForceApprove ? "FORCE_APPROVE" : "APPROVE_REQUEST",
          resourceType: "Request",
          resourceId: request._id,
          resourceName: request.subject || request.requestType,
          description: `${
            isForceApprove ? "Force approved" : "Approved"
          } ${request.requestType} request${
            request.subject ? `: ${request.subject}` : ""
          }`,
          metadata: {
            requestType: request.requestType,
            currentStatus: request.status,
            comment: req.body.comment,
          },
        });
      }
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware to log request rejection
 */
const logRequestRejection = async (req, res, next) => {
  const originalSend = res.send;

  res.send = function (data) {
    let responseData;
    try {
      responseData = typeof data === "string" ? JSON.parse(data) : data;
    } catch (e) {
      responseData = data;
    }

    if (res.statusCode === 200) {
      const request = responseData.data || responseData.request;

      if (request && request._id) {
        const isForceReject = req.originalUrl.includes("force-reject");

        createAuditLog({
          req,
          action: isForceReject ? "FORCE_REJECT" : "REJECT_REQUEST",
          resourceType: "Request",
          resourceId: request._id,
          resourceName: request.subject || request.requestType,
          description: `${isForceReject ? "Force rejected" : "Rejected"} ${
            request.requestType
          } request${request.subject ? `: ${request.subject}` : ""}`,
          metadata: {
            requestType: request.requestType,
            reason: req.body.comment,
          },
        });
      }
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware to log request changes request
 */
const logRequestChanges = async (req, res, next) => {
  const originalSend = res.send;

  res.send = function (data) {
    let responseData;
    try {
      responseData = typeof data === "string" ? JSON.parse(data) : data;
    } catch (e) {
      responseData = data;
    }

    if (res.statusCode === 200) {
      const request = responseData.data || responseData.request;

      if (request && request._id) {
        createAuditLog({
          req,
          action: "REQUEST_CHANGES",
          resourceType: "Request",
          resourceId: request._id,
          resourceName: request.subject || request.requestType,
          description: `Requested changes for ${request.requestType} request${
            request.subject ? `: ${request.subject}` : ""
          }`,
          metadata: {
            requestType: request.requestType,
            comment: req.body.comment,
          },
        });
      }
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware to log request resubmission
 */
const logRequestResubmit = async (req, res, next) => {
  const originalSend = res.send;

  res.send = function (data) {
    let responseData;
    try {
      responseData = typeof data === "string" ? JSON.parse(data) : data;
    } catch (e) {
      responseData = data;
    }

    if (res.statusCode === 200) {
      const request = responseData.data || responseData.request;

      if (request && request._id) {
        createAuditLog({
          req,
          action: "RESUBMIT_REQUEST",
          resourceType: "Request",
          resourceId: request._id,
          resourceName: request.subject || request.requestType,
          description: `Resubmitted ${request.requestType} request after changes${
            request.subject ? `: ${request.subject}` : ""
          }`,
          metadata: {
            requestType: request.requestType,
            changes: req.body,
          },
        });
      }
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware to log request cancellation
 */
const logRequestCancellation = async (req, res, next) => {
  const originalSend = res.send;

  res.send = function (data) {
    let responseData;
    try {
      responseData = typeof data === "string" ? JSON.parse(data) : data;
    } catch (e) {
      responseData = data;
    }

    if (res.statusCode === 200) {
      const request = responseData.data || responseData.request;

      if (request && request._id) {
        createAuditLog({
          req,
          action: "CANCEL_REQUEST",
          resourceType: "Request",
          resourceId: request._id,
          resourceName: request.subject || request.requestType,
          description: `Cancelled ${request.requestType} request${
            request.subject ? `: ${request.subject}` : ""
          }`,
          metadata: {
            requestType: request.requestType,
            reason: req.body.comment,
          },
        });
      }
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware to log workflow creation
 */
const logWorkflowCreation = async (req, res, next) => {
  const originalSend = res.send;

  res.send = function (data) {
    let responseData;
    try {
      responseData = typeof data === "string" ? JSON.parse(data) : data;
    } catch (e) {
      responseData = data;
    }

    if (res.statusCode === 200 || res.statusCode === 201) {
      const workflow = responseData.data;

      if (workflow && workflow._id) {
        createAuditLog({
          req,
          action: "CREATE_WORKFLOW",
          resourceType: "Workflow",
          resourceId: workflow._id,
          resourceName: workflow.name,
          description: `Created new workflow: ${workflow.name} for ${workflow.requestType}`,
          metadata: {
            requestType: workflow.requestType,
            approvalFlow: workflow.approvalFlow,
            isActive: workflow.isActive,
          },
        });
      }
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware to log workflow update
 */
const logWorkflowUpdate = async (req, res, next) => {
  const originalSend = res.send;

  res.send = function (data) {
    let responseData;
    try {
      responseData = typeof data === "string" ? JSON.parse(data) : data;
    } catch (e) {
      responseData = data;
    }

    if (res.statusCode === 200) {
      const workflow = responseData.data;

      if (workflow && workflow._id) {
        createAuditLog({
          req,
          action: "UPDATE_WORKFLOW",
          resourceType: "Workflow",
          resourceId: workflow._id,
          resourceName: workflow.name,
          description: `Updated workflow: ${workflow.name}`,
          changes: {
            before: req.body._original, // Would need to store original
            after: req.body,
          },
          metadata: {
            requestType: workflow.requestType,
            isActive: workflow.isActive,
          },
        });
      }
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware to log workflow deletion
 */
const logWorkflowDeletion = async (req, res, next) => {
  const originalSend = res.send;

  res.send = function (data) {
    if (res.statusCode === 200) {
      createAuditLog({
        req,
        action: "DELETE_WORKFLOW",
        resourceType: "Workflow",
        resourceId: req.params.id,
        description: `Deleted workflow with ID: ${req.params.id}`,
      });
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware to log login attempts
 */
const logLogin = async (req, res, next) => {
  const originalSend = res.send;

  res.send = function (data) {
    let responseData;
    try {
      responseData = typeof data === "string" ? JSON.parse(data) : data;
    } catch (e) {
      responseData = data;
    }

    const isSuccess = res.statusCode === 200;
    const email = req.body.email;

    // Create audit log without user context for login
    AuditLog.log({
      userId: responseData.userId || null,
      userName: responseData.fullName || email,
      userEmail: email,
      userRole: responseData.role || "Unknown",
      action: isSuccess ? "LOGIN" : "FAILED_LOGIN",
      resourceType: "Auth",
      description: `${isSuccess ? "Successful" : "Failed"} login attempt for ${email}`,
      ipAddress: getIpAddress(req),
      userAgent: req.headers["user-agent"],
      requestMethod: req.method,
      requestUrl: req.originalUrl || req.url,
      status: isSuccess ? "SUCCESS" : "FAILURE",
      errorMessage: isSuccess ? null : responseData.message,
    });

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Generic audit middleware - can be used for any action
 */
const auditAction = (action, resourceType, getResourceInfo) => {
  return async (req, res, next) => {
    const originalSend = res.send;

    res.send = function (data) {
      let responseData;
      try {
        responseData = typeof data === "string" ? JSON.parse(data) : data;
      } catch (e) {
        responseData = data;
      }

      if (res.statusCode === 200 || res.statusCode === 201) {
        const resourceInfo = getResourceInfo(req, responseData);

        createAuditLog({
          req,
          action,
          resourceType,
          ...resourceInfo,
        });
      }

      return originalSend.call(this, data);
    };

    next();
  };
};

module.exports = {
  createAuditLog,
  logRequestCreation,
  logRequestApproval,
  logRequestRejection,
  logRequestChanges,
  logRequestResubmit,
  logRequestCancellation,
  logWorkflowCreation,
  logWorkflowUpdate,
  logWorkflowDeletion,
  logLogin,
  auditAction,
};
