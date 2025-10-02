// routes/DepartmentRoutes.js
const express = require("express");
const router = express.Router();
const departmentController = require("../controller/DepartmentController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

// Đặt các path tĩnh / cụ thể TRƯỚC path động
router.get("/options/all", departmentController.getDepartmentOptions);

router.post("/", departmentController.createDepartment);
router.get("/", departmentController.getDepartments);
router.get("/:id/members", departmentController.getDepartmentMembers);
router.get("/:id", departmentController.getDepartmentById);
router.post("/add-employee", departmentController.addEmployeeToDepartment);
router.post(
  "/remove-employee",
  departmentController.removeEmployeeFromDepartment
);

router.get(
  "/options/list",
  authenticate,
  departmentController.getDepartmentOptions
);
router.get(
  "/:departmentId/manager-check",
  authenticate,
  departmentController.checkDepartmentManager
);

module.exports = router;
