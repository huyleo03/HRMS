const Request = require("../models/Request");
const User = require("../models/User");
const {
  createNotificationForUser,
  createNotificationForMultipleUsers,
} = require("../helper/NotificationService");
const Workflow = require("../models/Workflow");

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
      cc,
    } = req.body;
    const submitter = await User.findById(req.user.id).populate(
      "department.department_id manager_id"
    );
    if (!submitter) {
      return res.status(404).json({ message: "Người gửi không tồn tại" });
    }
    if (submitter.role === "Admin") {
      return res.status(403).json({
        message:
          "Admin không được phép tạo đơn. Admin chỉ có quyền duyệt đơn của người khác.",
      });
    }

    const ccUserIds = (cc || []).map((c) => c.userId);

    // Bước 2: Tìm Workflow Template phù hợp dựa trên 'type' của đơn
    const workflow = await Workflow.getActiveWorkflow(
      type,
      submitter.department?.department_id?._id
    );
    if (!workflow) {
      return res.status(400).json({
        message: `Không tìm thấy quy trình phê duyệt nào cho loại đơn "${type}". Vui lòng liên hệ Admin.`,
      });
    }
    const resolvedApprovalFlow = await workflow.resolveApprovers(submitter);
    if (!resolvedApprovalFlow || resolvedApprovalFlow.length === 0) {
      return res.status(400).json({
        message: `Quy trình phê duyệt cho loại đơn "${type}" không hợp lệ hoặc không tìm thấy người duyệt.`,
      });
    }

    const newRequest = new Request({
      submittedBy: submitter._id,
      submittedByName: submitter.full_name,
      submittedByEmail: submitter.email,
      submittedByAvatar: submitter.avatar,
      department: {
        department_id: submitter.department?.department_id?._id,
        department_name: submitter.department?.department_id?.department_name,
      },
      type,
      subject,
      reason,
      startDate,
      endDate,
      hour,
      attachments: attachments || [],
      priority: priority || "Normal",
      approvalFlow: resolvedApprovalFlow,
      cc: ccUserIds,
      status: "Pending",
      senderStatus: {
        isDraft: false,
      },
    });

    await newRequest.save();

    // Bước 5: Gửi thông báo đến những người duyệt thực tế trong quy trình
    const approverIds = resolvedApprovalFlow.map((a) => a.approverId);

    await createNotificationForMultipleUsers(approverIds, {
      senderId: submitter._id,
      senderName: submitter.full_name,
      senderAvatar: submitter.avatar,
      type: "NewRequest",
      message: `${submitter.full_name} đã gửi đơn ${type}${
        subject ? `: ${subject}` : ""
      } cần bạn phê duyệt.`,
      relatedId: newRequest._id,
      metadata: {
        requestType: type,
        requestSubject: subject,
        priority: priority || "Normal",
        actionUrl: `/requests/${newRequest._id}`,
      },
    });

    // Gửi thông báo cho CC (nếu có)
    if (ccUserIds.length > 0) {
      await createNotificationForMultipleUsers(ccUserIds, {
        senderId: submitter._id,
        senderName: submitter.full_name,
        senderAvatar: submitter.avatar,
        type: "NewRequest",
        message: `Bạn được CC trong đơn ${type}${
          subject ? `: ${subject}` : ""
        } của ${submitter.full_name}.`,
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

// Lấy ra các request của user hiện tại
exports.getUserRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      box = "inbox",
      page = 1,
      limit = 20,
      sortBy = "sentAt",
      sortOrder = "desc",
      status,
      search,
      priority,
    } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    let baseQuery = {};
    switch (box.toLowerCase()) {
      case "inbox":
        baseQuery = {
          "approvalFlow.approverId": userId,
          "approvalFlow.status": "Pending",
          status: { $in: ["Pending", "Manager_Approved"] },
        };
        break;
      case "sent":
        baseQuery = {
          submittedBy: userId,
          "senderStatus.isDraft": false,
        };
        break;
      case "cc":
        baseQuery = { cc: userId };
        break;
      case "starred":
        baseQuery = {
          submittedBy: userId,
          "senderStatus.isStarred": true,
        };
        break;
      case "drafts":
        baseQuery = {
          submittedBy: userId,
          "senderStatus.isDraft": true,
        };
        break;
      case "all":
        baseQuery = {
          $or: [
            { "approvalFlow.approverId": userId },
            { submittedBy: userId },
            { cc: userId },
          ],
        };
        break;
      default:
        return res.status(400).json({ message: "Hộp thư không hợp lệ." });
    }
    if (status) {
      if (baseQuery.status && baseQuery.status.$in) {
        baseQuery.status = status;
      } else {
        baseQuery.status = status;
      }
    }
    if (priority) {
      baseQuery.priority = priority;
    }
    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");
      if (baseQuery.$or) {
        const originalOr = baseQuery.$or;
        delete baseQuery.$or;
        baseQuery.$and = [
          { $or: originalOr },
          {
            $or: [
              { reason: { $regex: searchRegex } },
              { subject: { $regex: searchRegex } },
              { submittedByName: { $regex: searchRegex } },
            ],
          },
        ];
      } else {
        baseQuery.$or = [
          { reason: { $regex: searchRegex } },
          { subject: { $regex: searchRegex } },
          { submittedByName: { $regex: searchRegex } },
        ];
      }
    }

    const sortOptions = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [requests, totalRequests] = await Promise.all([
      Request.find(baseQuery)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .populate("submittedBy", "full_name avatar")
        .populate("approvalFlow.approverId", "full_name avatar")
        .populate("cc", "full_name avatar")
        .lean(),
      Request.countDocuments(baseQuery),
    ]);

    res.status(200).json({
      message: `Lấy danh sách đơn trong hộp thư '${box}' thành công`,
      data: {
        requests,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalRequests / limitNum),
          totalRequests,
          limit: limitNum,
        },
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đơn:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy danh sách đơn",
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
    if (request.cc && request.cc.length > 0) {
      await createNotificationForMultipleUsers(request.cc, {
        senderId: approver._id,
        senderName: approver.full_name,
        senderAvatar: approver.avatar,
        type: "RequestUpdate",
        message: `Đơn ${request.type} của ${request.submittedByName} đã được ${approver.full_name} phê duyệt.`,
        relatedId: request._id,
        metadata: {
          requestType: request.type,
          actionUrl: `/requests/${request._id}`,
        },
      });
    }
    const allApproved = request.approvalFlow.every(
      (a) => a.role !== "Approver" || a.status === "Approved"
    );
    if (allApproved) {
      await createNotificationForUser({
        userId: request.submittedBy,
        senderId: approver._id,
        senderName: approver.full_name,
        senderAvatar: approver.avatar,
        type: "RequestApproved",
        message: `${approver.full_name} đã phê duyệt đơn ${
          request.type
        } của bạn.${comment ? ` Nhận xét: ${comment}` : ""}`,
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

    // 1. Tìm request
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    // 2. Kiểm tra quyền
    if (request.submittedBy.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Không có quyền chỉnh sửa đơn này" });
    }

    // 3. Kiểm tra trạng thái
    if (request.status !== "NeedsReview") {
      return res.status(400).json({
        message: "Chỉ có thể chỉnh sửa đơn ở trạng thái 'Cần chỉnh sửa'",
      });
    }

    // 4. Lấy thông tin submitter
    const submitter = await User.findById(req.user.id);
    if (!submitter) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy thông tin người gửi." });
    }

    const {
      subject,
      reason,
      startDate,
      endDate,
      existingAttachments,
      newAttachments,
    } = req.body;

    // 5. Cập nhật các trường
    request.subject = subject || request.subject;
    request.reason = reason || request.reason;
    request.startDate = startDate || request.startDate;
    request.endDate = endDate !== undefined ? endDate : request.endDate;

    // 6. Xử lý file đính kèm
    let finalAttachments = [];

    if (existingAttachments) {
      try {
        finalAttachments = JSON.parse(existingAttachments);
      } catch (e) {
        console.error("Lỗi parse existingAttachments:", e);
        return res.status(400).json({
          message: "Định dạng file đính kèm hiện tại không hợp lệ.",
          error: e.message,
        });
      }
    }

    if (newAttachments) {
      try {
        const parsedNewAttachments = JSON.parse(newAttachments);
        finalAttachments.push(...parsedNewAttachments);
      } catch (e) {
        console.error("Lỗi parse newAttachments:", e);
        return res.status(400).json({
          message: "Định dạng file đính kèm mới không hợp lệ.",
          error: e.message,
        });
      }
    }

    request.attachments = finalAttachments;

    // 7. Reset quy trình phê duyệt
    try {
      await request.resubmit(req.user.id);
    } catch (e) {
      console.error("Lỗi khi gọi request.resubmit():", e);
      return res.status(500).json({
        message: "Lỗi khi reset quy trình phê duyệt",
        error: e.message,
      });
    }

    // 8. Tạo thông báo
    try {
      const approverIds = request.approvalFlow
        .filter((a) => a.role === "Approver")
        .map((a) => a.approverId);

      if (approverIds.length > 0) {
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
      }
    } catch (e) {
      console.error("Lỗi khi tạo thông báo:", e);
    }

    // 9. Trả về kết quả
    const finalRequest = await Request.findById(request._id).populate([
      { path: "submittedBy", select: "full_name avatar email" },
      { path: "approvalFlow.approverId", select: "full_name avatar" },
      { path: "cc", select: "full_name avatar" },
    ]);
    res.status(200).json({
      message: "Đã cập nhật và gửi lại đơn thành công",
      request: finalRequest,
    });
  } catch (error) {
    console.error("❌ Lỗi khi gửi lại đơn:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      message: "Lỗi server",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
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
    const pendingApprovers = request.approvalFlow
      .filter((a) => a.role === "Approver" && a.status === "Pending")
      .map((a) => a.approverId);
    if (pendingApprovers.length > 0) {
      await createNotificationForMultipleUsers(pendingApprovers, {
        senderId: submitter._id,
        senderName: submitter.full_name,
        senderAvatar: submitter.avatar,
        type: "RequestCancelled",
        message: `${submitter.full_name} đã hủy đơn ${request.type}.${
          comment ? ` Lý do: ${comment}` : ""
        }`,
        relatedId: request._id,
        metadata: {
          requestType: request.type,
          requestSubject: request.subject,
          actionUrl: `/requests/${request._id}`,
          comment: comment || "",
        },
      });
    }
    await request.populate([
      { path: "submittedBy", select: "full_name avatar email" },
      { path: "approvalFlow.approverId", select: "full_name avatar" },
      { path: "cc", select: "full_name avatar" },
    ]);
    res.status(200).json({
      message: "Hủy đơn thành công",
      request,
    });
  } catch (error) {
    console.error("❌ [Cancel Request] Lỗi khi hủy đơn:", error);
    res.status(500).json({
      message: error.message || "Lỗi server",
    });
  }
};

// ============ ADMIN FUNCTIONS ============

// GET ALL REQUESTS (Admin only)
exports.getAllRequestsAdmin = async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res
        .status(403)
        .json({ message: "Chỉ Admin mới có quyền truy cập" });
    }
    const {
      page = 1,
      limit = 20,
      search,
      status,
      priority,
      department,
      submitterId,
      approverId,
      startDate,
      endDate,
      sortBy = "created_at",
      sortOrder = "desc",
    } = req.query;
    const query = {};
    // Search in subject/reason
    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: "i" } },
        { reason: { $regex: search, $options: "i" } },
        { submittedByName: { $regex: search, $options: "i" } },
      ];
    }
    // Filter by status
    if (status && status !== "all") {
      query.status = status;
    }
    // Filter by priority
    if (priority && priority !== "all") {
      query.priority = priority;
    }
    // Filter by submitter
    if (submitterId) {
      query.submittedBy = submitterId;
    }
    // Filter by date range
    if (startDate || endDate) {
      query.created_at = {}; // ✅ Dùng created_at thay vì createdAt

      if (startDate) {
        // ✅ Set giờ về đầu ngày (00:00:00)
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.created_at.$gte = start;
      }

      if (endDate) {
        // ✅ Set giờ về cuối ngày (23:59:59)
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.created_at.$lte = end;
      }
    }
    // Filter by department
    if (department) {
      query['department.department_id'] = department;
    }
    // Filter by approver (check if user is in approvalFlow)
    if (approverId) {
      query['approvalFlow.approverId'] = approverId;
    }
    // Pagination
    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;
    // Execute query
    const [requests, total] = await Promise.all([
      Request.find(query)
        .populate("submittedBy", "full_name email avatar")
        .populate("approvalFlow.approverId", "full_name email avatar role")
        .populate("department.department_id", "department_name")
        .populate("cc", "full_name email avatar")
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Request.countDocuments(query),
    ]);
    res.status(200).json({
      requests,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đơn (Admin):", error);
    res.status(500).json({
      message: error.message || "Lỗi server",
    });
  }
};

// FORCE APPROVE REQUEST (Admin only - bypass approval flow)
exports.forceApproveRequest = async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res
        .status(403)
        .json({ message: "Chỉ Admin mới có quyền truy cập" });
    }

    const { requestId } = req.params;
    const { comment } = req.body;

    if (!comment || comment.trim() === "") {
      return res.status(400).json({
        message: "Vui lòng nhập lý do phê duyệt",
      });
    }

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    if (
      !["Pending", "Manager_Approved", "NeedsReview"].includes(request.status)
    ) {
      return res.status(400).json({
        message: `Không thể duyệt đơn ở trạng thái ${request.status}`,
      });
    }

    // Update approval flow
    request.approvalFlow = request.approvalFlow.map((step) => ({
      ...step,
      status: step.status === "Pending" ? "Approved" : step.status,
      actionAt: step.status === "Pending" ? new Date() : step.actionAt,
      comment:
        step.status === "Pending"
          ? `[Admin Force Approve] ${comment}`
          : step.comment,
    }));

    request.status = "Approved";
    await request.save();

    // ✅ QUAN TRỌNG: Populate SAU KHI SAVE và GÁN LẠI KẾT QUẢ
    const populatedRequest = await Request.findById(requestId).populate([
      { path: "submittedBy", select: "full_name email avatar" },
      {
        path: "approvalFlow.approverId",
        select: "full_name email avatar role",
      },
      { path: "department.department_id", select: "department_name" },
      { path: "cc", select: "full_name email avatar" },
    ]);

    const admin = await User.findById(req.user.id);

    await createNotificationForUser({
      userId: populatedRequest.submittedBy._id,
      senderId: admin._id,
      senderName: admin.full_name,
      senderAvatar: admin.avatar,
      type: "RequestApproved",
      message: `Đơn "${populatedRequest.subject}" đã được Admin phê duyệt. Lý do: ${comment}`,
      relatedId: populatedRequest._id,
      metadata: {
        requestType: populatedRequest.type,
        requestSubject: populatedRequest.subject,
        actionUrl: `/requests/${populatedRequest._id}`,
        comment: comment,
      },
    });

    // ✅ TRẢ VỀ populatedRequest THAY VÌ request
    res.status(200).json({
      message: "Đã phê duyệt đơn thành công",
      request: populatedRequest,
    });
  } catch (error) {
    console.error("Lỗi khi phê duyệt đơn (Admin):", error);
    res.status(500).json({
      message: error.message || "Lỗi server",
    });
  }
};

// FORCE REJECT REQUEST (Admin only)
exports.forceRejectRequest = async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res
        .status(403)
        .json({ message: "Chỉ Admin mới có quyền truy cập" });
    }

    const { requestId } = req.params;
    const { comment } = req.body;

    if (!comment || comment.trim() === "") {
      return res.status(400).json({ message: "Vui lòng nhập lý do từ chối" });
    }

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    if (
      !["Pending", "Manager_Approved", "NeedsReview"].includes(request.status)
    ) {
      return res.status(400).json({
        message: `Không thể từ chối đơn ở trạng thái ${request.status}`,
      });
    }

    // ✅ Set status to Rejected
    request.status = "Rejected";
    request.adminComment = `[Admin Force Reject] ${comment}`;

    // ✅ Update approval flow (optional - mark all as rejected)
    request.approvalFlow = request.approvalFlow.map((step) => ({
      ...step,
      status: step.status === "Pending" ? "Rejected" : step.status,
      actionAt: step.status === "Pending" ? new Date() : step.actionAt,
      comment:
        step.status === "Pending"
          ? `[Admin Force Reject] ${comment}`
          : step.comment,
    }));

    await request.save();

    // ✅ QUAN TRỌNG: Populate SAU KHI SAVE và GÁN LẠI KẾT QUẢ
    const populatedRequest = await Request.findById(requestId).populate([
      { path: "submittedBy", select: "full_name email avatar" },
      {
        path: "approvalFlow.approverId",
        select: "full_name email avatar role",
      },
      { path: "department.department_id", select: "department_name" },
      { path: "cc", select: "full_name email avatar" },
    ]);

    const admin = await User.findById(req.user.id);

    await createNotificationForUser({
      userId: populatedRequest.submittedBy._id,
      senderId: admin._id,
      senderName: admin.full_name,
      senderAvatar: admin.avatar,
      type: "RequestRejected",
      message: `Đơn "${populatedRequest.subject}" đã bị Admin từ chối. Lý do: ${comment}`,
      relatedId: populatedRequest._id,
      metadata: {
        requestType: populatedRequest.type,
        requestSubject: populatedRequest.subject,
        actionUrl: `/requests/${populatedRequest._id}`,
        comment: comment,
      },
    });
    res.status(200).json({
      message: "Đã từ chối đơn thành công",
      request: populatedRequest,
    });
  } catch (error) {
    console.error("Lỗi khi từ chối đơn (Admin):", error);
    res.status(500).json({
      message: error.message || "Lỗi server",
    });
  }
};

// GET ADMIN STATISTICS
exports.getAdminStats = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "Admin") {
      return res
        .status(403)
        .json({ message: "Chỉ Admin mới có quyền truy cập" });
    }

    const { startDate, endDate, department } = req.query;

    // Build query for date range
    const dateQuery = {};
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) {
        dateQuery.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        dateQuery.createdAt.$lte = new Date(endDate);
      }
    }

    // Add department filter if provided
    if (department) {
      dateQuery.department = department;
    }

    // Get statistics
    const [
      totalRequests,
      statusStats,
      priorityStats,
      typeStats,
      departmentStats,
      avgApprovalTime,
      recentRequests,
    ] = await Promise.all([
      // Total requests (exclude drafts)
      Request.countDocuments({ ...dateQuery, status: { $ne: "Draft" } }),

      // By status
      Request.aggregate([
        { $match: { ...dateQuery, status: { $ne: "Draft" } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      // By priority
      Request.aggregate([
        { $match: { ...dateQuery, status: { $ne: "Draft" } } },
        { $group: { _id: "$priority", count: { $sum: 1 } } },
      ]),

      // By type
      Request.aggregate([
        { $match: { ...dateQuery, status: { $ne: "Draft" } } },
        { $group: { _id: "$requestType", count: { $sum: 1 } } },
      ]),

      // By department
      Request.aggregate([
        { $match: { ...dateQuery, status: { $ne: "Draft" } } },
        { $group: { _id: "$department", count: { $sum: 1 } } },
        {
          $lookup: {
            from: "departments",
            localField: "_id",
            foreignField: "_id",
            as: "dept",
          },
        },
        { $unwind: "$dept" },
        { $project: { _id: 1, count: 1, name: "$dept.name" } },
      ]),

      // Average approval time (for approved requests)
      Request.aggregate([
        {
          $match: {
            ...dateQuery,
            status: "Approved",
            "approvalFlow.approvedAt": { $exists: true },
          },
        },
        {
          $project: {
            approvalTime: {
              $subtract: [{ $max: "$approvalFlow.approvedAt" }, "$createdAt"],
            },
          },
        },
        {
          $group: {
            _id: null,
            avgTime: { $avg: "$approvalTime" },
          },
        },
      ]),

      // Recent requests
      Request.find({ ...dateQuery, status: { $ne: "Draft" } })
        .populate("submittedBy", "full_name email avatar")
        .populate("department.department_id", "department_name")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    // Format statistics
    const stats = {
      total: totalRequests,
      byStatus: statusStats.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      byPriority: priorityStats.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      byType: typeStats.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      byDepartment: departmentStats.map((d) => ({
        id: d._id,
        name: d.name,
        count: d.count,
      })),
      avgApprovalTimeHours: avgApprovalTime[0]?.avgTime
        ? (avgApprovalTime[0].avgTime / (1000 * 60 * 60)).toFixed(2)
        : 0,
      recentRequests,
    };

    res.status(200).json({ stats });
  } catch (error) {
    console.error("Lỗi khi lấy thống kê (Admin):", error);
    res.status(500).json({
      message: error.message || "Lỗi server",
    });
  }
};
