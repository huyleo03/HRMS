const express = require("express");
const router = express.Router();
const departmentController = require("../controller/DepartmentController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

// CRUD + business logic
router.post(
  "/",
  authenticate,
  authorize("Admin"),
  departmentController.createDepartment
);
router.get("/", authenticate, departmentController.getDepartments);
router.get("/search", authenticate, departmentController.searchDepartments);
router.get("/:id", authenticate, departmentController.getDepartmentById);
router.post(
  "/add-employee",
  authenticate,
  departmentController.addEmployeeToDepartment
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
