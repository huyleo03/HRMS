const express = require("express");
const router = express.Router();
const userController = require("../controller/UserController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

router.post(
  "/create",
  // authenticate,
  // authorize("Admin"),
  userController.createUserByAdmin
);
router.get(
  "/", 
  // authenticate, 
  // authorize("Admin"), 
  userController.getAllUsers
);

router.put(
  "/status/:id",
  // authenticate,
  // authorize("Admin"),
  userController.changeUserStatus
);

router.put(
  "/role/:id",
  // authenticate,
  // authorize("Admin"),
  userController.changeUserRole
);

router.delete(
  "/:id",
  // authenticate,
  // authorize("Admin"),
  userController.deleteUser
);

module.exports = router;
