const Workflow = require("../models/Workflow");
const User = require("../models/User");

/**
 * Lấy tất cả workflows (dành cho Admin quản lý)
 * GET /api/workflows
 */
exports.getAllWorkflows = async (req, res) => {
  try {
    const workflows = await Workflow.find({ isActive: true })
      .populate("createdBy", "full_name email")
      .sort({ requestType: 1 });

    res.status(200).json({
      message: "Lấy danh sách workflows thành công",
      data: workflows,
    });
  } catch (error) {
    console.error("Error in getAllWorkflows:", error);
    res.status(500).json({
      message: "Lỗi khi lấy danh sách workflows",
      error: error.message,
    });
  }
};

/**
 * Lấy workflow template theo loại đơn (cho người dùng tạo đơn)
 * GET /api/workflows/template?type=Leave
 */
exports.getWorkflowTemplate = async (req, res) => {
  try {
    const { type } = req.query;

    if (!type) {
      return res.status(400).json({
        message: "Vui lòng cung cấp loại đơn (type parameter)",
      });
    }

    const currentUser = await User.populate(req.user, [
      { path: "department.department_id" },
      { path: "manager_id" },
    ]);

    const workflow = await Workflow.getActiveWorkflow(
      type,
      currentUser.department?.department_id?._id
    );

    if (!workflow) {
      return res.status(404).json({
        message: `Không tìm thấy quy trình phê duyệt cho loại đơn: ${type}`,
      });
    }

    const resolvedApprovers = await workflow.resolveApprovers(currentUser);

    res.status(200).json({
      workflowName: workflow.name,
      description: workflow.description,
      approvalFlow: resolvedApprovers,
    });
  } catch (error) {
    console.error("Error in getWorkflowTemplate:", error);
    res.status(500).json({
      message: "Lỗi khi lấy quy trình phê duyệt",
      error: error.message,
    });
  }
};

/**
 * Tạo workflow mới (dành cho Admin)
 * POST /api/workflows
 */
exports.createWorkflow = async (req, res) => {
  try {
    const workflowData = {
      ...req.body,
      createdBy: req.user.userId,
    };

    const workflow = new Workflow(workflowData);
    
    // ✅ VALIDATE WORKFLOW: Test với mock user để đảm bảo có thể resolve approvers
    try {
      // Tạo mock user để test workflow
      const mockUser = await User.findOne({ role: { $ne: "Admin" } })
        .populate("department.department_id manager_id");
      
      if (mockUser) {
        const resolvedApprovers = await workflow.resolveApprovers(mockUser);
        
        if (!resolvedApprovers || resolvedApprovers.length === 0) {
          return res.status(400).json({
            message: "Workflow không hợp lệ: Không thể xác định được người duyệt. Vui lòng kiểm tra lại cấu hình approvalFlow.",
            details: "Workflow phải có ít nhất một approver có thể được resolve."
          });
        }
        
        console.log(`✅ Workflow validation passed. Resolved ${resolvedApprovers.length} approver(s).`);
      } else {
        console.warn("⚠️  No non-admin user found for workflow validation. Skipping validation.");
      }
    } catch (validationError) {
      console.error("❌ Workflow validation failed:", validationError);
      return res.status(400).json({
        message: "Workflow không hợp lệ",
        error: validationError.message,
        details: "Vui lòng kiểm tra lại cấu hình approvalFlow (approverType, approverId, departmentId)."
      });
    }

    await workflow.save();

    res.status(201).json({
      message: "Tạo workflow thành công",
      data: workflow,
    });
  } catch (error) {
    console.error("Error in createWorkflow:", error);
    res.status(500).json({
      message: "Lỗi khi tạo workflow",
      error: error.message,
    });
  }
};

/**
 * Cập nhật workflow (dành cho Admin)
 * PUT /api/workflows/:id
 */
exports.updateWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedBy: req.user.userId,
    };

    // ✅ Tìm workflow hiện tại
    const existingWorkflow = await Workflow.findById(id);
    if (!existingWorkflow) {
      return res.status(404).json({
        message: "Không tìm thấy workflow",
      });
    }

    // ✅ Merge update data vào existing workflow để validate
    Object.assign(existingWorkflow, updateData);

    // ✅ VALIDATE WORKFLOW: Test với mock user
    try {
      const mockUser = await User.findOne({ role: { $ne: "Admin" } })
        .populate("department.department_id manager_id");
      
      if (mockUser) {
        const resolvedApprovers = await existingWorkflow.resolveApprovers(mockUser);
        
        if (!resolvedApprovers || resolvedApprovers.length === 0) {
          return res.status(400).json({
            message: "Workflow không hợp lệ: Không thể xác định được người duyệt sau khi cập nhật.",
            details: "Workflow phải có ít nhất một approver có thể được resolve."
          });
        }
        
        console.log(`✅ Workflow update validation passed. Resolved ${resolvedApprovers.length} approver(s).`);
      } else {
        console.warn("⚠️  No non-admin user found for workflow validation. Skipping validation.");
      }
    } catch (validationError) {
      console.error("❌ Workflow update validation failed:", validationError);
      return res.status(400).json({
        message: "Workflow không hợp lệ",
        error: validationError.message,
        details: "Vui lòng kiểm tra lại cấu hình approvalFlow."
      });
    }

    // ✅ Lưu workflow đã validate
    const workflow = await Workflow.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      message: "Cập nhật workflow thành công",
      data: workflow,
    });
  } catch (error) {
    console.error("Error in updateWorkflow:", error);
    res.status(500).json({
      message: "Lỗi khi cập nhật workflow",
      error: error.message,
    });
  }
};

/**
 * Xóa workflow (dành cho Admin)
 * DELETE /api/workflows/:id
 */
exports.deleteWorkflow = async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete: chỉ đánh dấu isActive = false
    const workflow = await Workflow.findByIdAndUpdate(
      id,
      { isActive: false, updatedBy: req.user.userId },
      { new: true }
    );

    if (!workflow) {
      return res.status(404).json({
        message: "Không tìm thấy workflow",
      });
    }

    res.status(200).json({
      message: "Xóa workflow thành công",
      data: workflow,
    });
  } catch (error) {
    console.error("Error in deleteWorkflow:", error);
    res.status(500).json({
      message: "Lỗi khi xóa workflow",
      error: error.message,
    });
  }
};