const express = require("express");
const router = express.Router();
const departmentController = require("../controller/DepartmentController");

// CRUD + business logic
router.post("/", departmentController.createDepartment);
router.get("/", departmentController.getDepartments);
router.get("/search", departmentController.searchDepartments);
router.get("/:id", departmentController.getDepartmentById);
router.post("/add-employee", departmentController.addEmployeeToDepartment);
router.get("/options/list", departmentController.getDepartmentOptions);

module.exports = router;
