// routes/DepartmentRoutes.js
const express = require("express");
const router = express.Router();
const departmentController = require("../controller/DepartmentController");

// Đặt các path tĩnh / cụ thể TRƯỚC path động
router.get("/options/all", departmentController.getDepartmentOptions);

router.post("/", departmentController.createDepartment);
router.get("/", departmentController.getDepartments);
router.get("/:id/members", departmentController.getDepartmentMembers);
router.get("/:id", departmentController.getDepartmentById);
router.post("/add-employee", departmentController.addEmployeeToDepartment);
router.post("/remove-employee", departmentController.removeEmployeeFromDepartment);

module.exports = router;
