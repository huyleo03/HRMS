const express = require("express");
const router = express.Router();
const userController = require("../controller/UserController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

router.post(
  "/create",
  authenticate,
  authorize("Admin"),
  userController.createUserByAdmin
);
router.get(
  "/", 
  authenticate, 
  authorize("Admin", "Manager"), 
  userController.getAllUsers
);

router.put(
  "/status/:id",
  authenticate,
  authorize("Admin"),
  userController.changeUserStatus
);

router.put(
  "/role/:id",
  authenticate,
  authorize("Admin"),
  userController.changeUserRole
);

router.put(
  "/update/:id",
  authenticate,
  authorize("Admin"),
  userController.updateUserByAdmin
);

router.get(
  "/detail/:id",
  authenticate,
  authorize("Admin", "Manager"),
  userController.getUserById
);

router.get(
  "/me",
  authenticate,
  userController.getOwnProfile
);

router.put(
  "/me",
  authenticate,
  userController.updateOwnProfile
);

module.exports = router;
