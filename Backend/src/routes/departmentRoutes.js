// routes/DepartmentRoutes.js
const express = require("express");
const router = express.Router();
const departmentController = require("../controller/DepartmentController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

router.get("/options/all", departmentController.getDepartmentOptions);

router.post(
  "/",
  authenticate,
  authorize("Admin"),
  departmentController.createDepartment
);

router.get(
  "/",
  authenticate,
  authorize("Admin", "Manager"),
  departmentController.getDepartments
);

router.get(
  "/:id",
  authenticate,
  authorize("Admin", "Manager"),
  departmentController.getDepartmentById
);

// Admin & Manager - Xem danh sách members của phòng ban (Manager có thể cần xem để phối hợp công việc)
router.get(
  "/:id/members",
  authenticate,
  authorize("Admin", "Manager"),
  departmentController.getDepartmentMembers
);

// Admin only - Thêm nhân viên vào phòng ban
router.post(
  "/add-employee",
  authenticate,
  authorize("Admin"),
  departmentController.addEmployeeToDepartment
);

// Admin only - Xóa nhân viên khỏi phòng ban
router.post(
  "/remove-employee",
  authenticate,
  authorize("Admin"),
  departmentController.removeEmployeeFromDepartment
);

// Admin & Manager - Lấy options list (cho các form select)
// router.get(
//   "/options/list",
//   authenticate,
//   authorize("Admin", "Manager"),
//   departmentController.getDepartmentOptions
// );

// Admin & Manager - Kiểm tra phòng ban đã có manager chưa
router.get(
  "/:departmentId/manager-check",
  authenticate,
  authorize("Admin", "Manager"),
  departmentController.checkDepartmentManager
);

module.exports = router;