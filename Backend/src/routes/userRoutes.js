const express = require("express");
const router = express.Router();
const userController = require("../controller/UserController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

router.post(
  "/create-user",
  authenticate,
  authorize("Admin"),
  userController.createUserByAdmin
);
router.put("/profile", authenticate, userController.updateProfile);

module.exports = router;
