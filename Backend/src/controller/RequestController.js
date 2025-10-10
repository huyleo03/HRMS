const Request = require("../models/Request");
const User = require("../models/User");
const {
  createNotificationForUser,
  createNotificationForMultipleUsers,
} = require("../helper/NotificationService");

// ===== 1. TẠO VÀ GỬI ĐƠN =====
exports.createRequest = async (req, res) => {
  try {
    const {
      type,
      subject,
      reason,
      startDate,
      endDate,
      hour,
      attachments,
      priority,
      approvers,
      cc,
    } = req.body;

    const submitter = await User.findById(req.user.id);
    if (!submitter) {
      return res.status(404).json({ message: "Người gửi không tồn tại" });
    }

    if (!approvers || approvers.length === 0) {
      return res.status(400).json({
        message: "Vui lòng chọn ít nhất một người phê duyệt",
      });
    }

    const approvalFlow = approvers.map((approver) => ({
      level: approver.level || 1,
      approverId: approver.userId,
      approverName: approver.name,
      approverEmail: approver.email,
      role: approver.role || "Approver",
      status: "Pending",
    }));

    const newRequest = new Request({
      submittedBy: submitter._id,
      submittedByName: submitter.full_name,
      submittedByEmail: submitter.email,
      submittedByAvatar: submitter.avatar,
      department: {
        department_id: submitter.department?.department_id,
        department_name: submitter.department?.department_name,
      },
      type,
      subject,
      reason,
      startDate,
      endDate,
      hour,
      attachments: attachments || [],
      priority: priority || "Normal",
      approvalFlow,
      cc: cc || [],
      status: "Pending",
      senderStatus: {
        isDraft: false,
      },
    });

    await newRequest.save();

    // ✅ TẠO THÔNG BÁO CHO APPROVERS (thay thế sendEmail)
    const approverIds = approvers.map((a) => a.userId);
    
    await createNotificationForMultipleUsers(approverIds, {
      senderId: submitter._id,
      senderName: submitter.full_name,
      senderAvatar: submitter.avatar,
      type: "NewRequest",
      message: `${submitter.full_name} đã gửi đơn ${type}${subject ? `: ${subject}` : ""} cần bạn phê duyệt.`,
      relatedId: newRequest._id,
      metadata: {
        requestType: type,
        requestSubject: subject,
        priority: priority || "Normal",
        actionUrl: `/requests/${newRequest._id}`,
      },
    });

    // ✅ TẠO THÔNG BÁO CHO CC (nếu có)
    if (cc && cc.length > 0) {
      const ccIds = cc.map((c) => c.userId);
      
      await createNotificationForMultipleUsers(ccIds, {
        senderId: submitter._id,
        senderName: submitter.full_name,
        senderAvatar: submitter.avatar,
        type: "NewRequest",
        message: `Bạn được CC trong đơn ${type}${subject ? `: ${subject}` : ""} của ${submitter.full_name}.`,
        relatedId: newRequest._id,
        metadata: {
          requestType: type,
          requestSubject: subject,
          priority: priority || "Normal",
          actionUrl: `/requests/${newRequest._id}`,
        },
      });
    }

    res.status(201).json({
      message: "Gửi đơn thành công",
      request: newRequest,
    });
  } catch (error) {
    console.error("Lỗi khi tạo đơn:", error);
    res.status(500).json({
      message: "Lỗi server khi tạo đơn",
      error: error.message,
    });
  }
};

// ===== 2. PHÊ DUYỆT ĐƠN (APPROVE) =====
exports.approveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { comment } = req.body;

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    await request.approve(req.user.id, comment || "");

    const approver = await User.findById(req.user.id);

    const allApproved = request.approvalFlow.every(
      (a) => a.role !== "Approver" || a.status === "Approved"
    );

    if (allApproved) {
      // ✅ TẠO THÔNG BÁO CHO NGƯỜI GỬI
      await createNotificationForUser({
        userId: request.submittedBy,
        senderId: approver._id,
        senderName: approver.full_name,
        senderAvatar: approver.avatar,
        type: "RequestApproved",
        message: `${approver.full_name} đã phê duyệt đơn ${request.type} của bạn.${comment ? ` Nhận xét: ${comment}` : ""}`,
        relatedId: request._id,
        metadata: {
          requestType: request.type,
          requestSubject: request.subject,
          actionUrl: `/requests/${request._id}`,
          comment: comment || "",
        },
      });
    }

    res.status(200).json({
      message: "Phê duyệt đơn thành công",
      request,
    });
  } catch (error) {
    console.error("Lỗi khi phê duyệt:", error);
    res.status(500).json({
      message: error.message || "Lỗi server",
    });
  }
};

// ===== 3. TỪ CHỐI ĐƠN (REJECT) =====
exports.rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { comment } = req.body;

    if (!comment || comment.trim() === "") {
      return res.status(400).json({
        message: "Vui lòng cung cấp lý do từ chối",
      });
    }

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    await request.reject(req.user.id, comment);

    const approver = await User.findById(req.user.id);

    // ✅ TẠO THÔNG BÁO CHO NGƯỜI GỬI
    await createNotificationForUser({
      userId: request.submittedBy,
      senderId: approver._id,
      senderName: approver.full_name,
      senderAvatar: approver.avatar,
      type: "RequestRejected",
      message: `${approver.full_name} đã từ chối đơn ${request.type} của bạn. Lý do: ${comment}`,
      relatedId: request._id,
      metadata: {
        requestType: request.type,
        requestSubject: request.subject,
        actionUrl: `/requests/${request._id}`,
        comment: comment,
      },
    });

    res.status(200).json({
      message: "Từ chối đơn thành công",
      request,
    });
  } catch (error) {
    console.error("Lỗi khi từ chối:", error);
    res.status(500).json({
      message: error.message || "Lỗi server",
    });
  }
};

// ===== 4. YÊU CẦU CHỈNH SỬA (REQUEST CHANGES) =====
exports.requestChanges = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { comment } = req.body;

    if (!comment || comment.trim() === "") {
      return res.status(400).json({
        message: "Vui lòng cung cấp lý do cần chỉnh sửa",
      });
    }

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    await request.requestChanges(req.user.id, comment);

    const approver = await User.findById(req.user.id);

    // ✅ TẠO THÔNG BÁO CHO NGƯỜI GỬI
    await createNotificationForUser({
      userId: request.submittedBy,
      senderId: approver._id,
      senderName: approver.full_name,
      senderAvatar: approver.avatar,
      type: "RequestNeedsReview",
      message: `${approver.full_name} yêu cầu bạn chỉnh sửa đơn ${request.type}. Nội dung: ${comment}`,
      relatedId: request._id,
      metadata: {
        requestType: request.type,
        requestSubject: request.subject,
        actionUrl: `/requests/${request._id}/edit`,
        comment: comment,
      },
    });

    res.status(200).json({
      message: "Yêu cầu chỉnh sửa đơn thành công",
      request,
    });
  } catch (error) {
    console.error("Lỗi khi yêu cầu chỉnh sửa:", error);
    res.status(500).json({
      message: error.message || "Lỗi server",
    });
  }
};

// ===== 5. GỬI LẠI ĐƠN SAU KHI CHỈNH SỬA =====
exports.resubmitRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason, attachments, ...updates } = req.body;

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    if (updates.subject) request.subject = updates.subject;
    if (reason) request.reason = reason;
    if (updates.startDate) request.startDate = updates.startDate;
    if (updates.endDate) request.endDate = updates.endDate;
    if (updates.hour) request.hour = updates.hour;
    if (attachments) request.attachments = attachments;

    await request.resubmit(req.user.id);

    const submitter = await User.findById(req.user.id);

    // ✅ TẠO THÔNG BÁO CHO APPROVERS
    const approverIds = request.approvalFlow
      .filter((a) => a.role === "Approver")
      .map((a) => a.approverId);

    await createNotificationForMultipleUsers(approverIds, {
      senderId: submitter._id,
      senderName: submitter.full_name,
      senderAvatar: submitter.avatar,
      type: "RequestResubmitted",
      message: `${submitter.full_name} đã chỉnh sửa và gửi lại đơn ${request.type}.`,
      relatedId: request._id,
      metadata: {
        requestType: request.type,
        requestSubject: request.subject,
        actionUrl: `/requests/${request._id}`,
      },
    });

    res.status(200).json({
      message: "Gửi lại đơn thành công",
      request,
    });
  } catch (error) {
    console.error("Lỗi khi gửi lại đơn:", error);
    res.status(500).json({
      message: error.message || "Lỗi server",
    });
  }
};

// ===== 6. HỦY ĐƠN (CANCEL) =====
exports.cancelRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { comment } = req.body;

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    await request.cancel(req.user.id, comment || "");

    const submitter = await User.findById(req.user.id);

    // ✅ TẠO THÔNG BÁO CHO APPROVERS ĐANG PENDING
    const pendingApprovers = request.approvalFlow
      .filter((a) => a.role === "Approver" && a.status === "Pending")
      .map((a) => a.approverId);

    if (pendingApprovers.length > 0) {
      await createNotificationForMultipleUsers(pendingApprovers, {
        senderId: submitter._id,
        senderName: submitter.full_name,
        senderAvatar: submitter.avatar,
        type: "RequestCancelled",
        message: `${submitter.full_name} đã hủy đơn ${request.type}.${comment ? ` Lý do: ${comment}` : ""}`,
        relatedId: request._id,
        metadata: {
          requestType: request.type,
          requestSubject: request.subject,
          actionUrl: `/requests/${request._id}`,
          comment: comment || "",
        },
      });
    }

    res.status(200).json({
      message: "Hủy đơn thành công",
      request,
    });
  } catch (error) {
    console.error("Lỗi khi hủy đơn:", error);
    res.status(500).json({
      message: error.message || "Lỗi server",
    });
  }
};