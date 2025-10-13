// routes/DepartmentRoutes.js
const express = require("express");
const router = express.Router();
const departmentController = require("../controller/DepartmentController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

router.get("/options/all", departmentController.getDepartmentOptions);

router.post("/", authenticate, departmentController.createDepartment);
router.get("/", authenticate, departmentController.getDepartments);
router.get(
  "/:id/members",
  authenticate,
  departmentController.getDepartmentMembers
);
router.get("/:id", authenticate, departmentController.getDepartmentById);
router.post(
  "/add-employee",
  authenticate,
  departmentController.addEmployeeToDepartment
);
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
