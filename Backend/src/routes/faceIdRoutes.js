const express = require('express');
const router = express.Router();
const FaceIdController = require('../controller/FaceIdController');
const { authenticate } = require('../middlewares/authMiddleware');

/**
 * 🎯 FACE ID ROUTES
 * Giống iPhone Face ID
 */

// GET /api/face-id/status - Kiểm tra trạng thái đăng ký
router.get('/status', authenticate, FaceIdController.getFaceIdStatus);

// POST /api/face-id/enroll - Đăng ký Face ID (1 lần/tháng)
router.post('/enroll', authenticate, FaceIdController.enrollFaceId);

// POST /api/face-id/verify - Xác thực Face ID khi check-in (single descriptor - OLD)
router.post('/verify', authenticate, FaceIdController.verifyFaceId);

// POST /api/face-id/verify-angles - Xác thực Face ID bằng 5 góc (NEW - SECURE)
router.post('/verify-angles', authenticate, FaceIdController.verifyFaceIdAngles);

// DELETE /api/face-id/reset - Reset Face ID (emergency)
router.delete('/reset', authenticate, FaceIdController.resetFaceId);

module.exports = router;
