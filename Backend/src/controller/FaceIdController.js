const User = require("../models/User");
const { uploadBase64Image } = require("../utils/cloudinary");

/**
 * 🎯 FACE ID CONTROLLER
 * Giống iPhone Face ID - Đăng ký và xác thực khuôn mặt
 */

/**
 * GET /api/face-id/status
 * Kiểm tra trạng thái đăng ký Face ID
 */
exports.getFaceIdStatus = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select('faceId');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
      });
    }

    const now = new Date();
    const canEnroll = !user.faceId.enrolled || 
                      !user.faceId.nextEnrollmentDate || 
                      now >= user.faceId.nextEnrollmentDate;

    res.json({
      success: true,
      data: {
        enrolled: user.faceId.enrolled || false,
        enrolledAt: user.faceId.enrolledAt,
        nextEnrollmentDate: user.faceId.nextEnrollmentDate,
        enrollmentCount: user.faceId.enrollmentCount || 0,
        canEnroll,
        descriptorCount: user.faceId.descriptors?.length || 0,
      },
    });
  } catch (error) {
    console.error('❌ Get Face ID status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi kiểm tra trạng thái Face ID',
      error: error.message,
    });
  }
};

/**
 * POST /api/face-id/enroll
 * Đăng ký Face ID (giống quét mặt iPhone)
 * Body: {
 *   descriptors: [[128 numbers], [128 numbers], ...], // 5-10 descriptors từ nhiều góc
 *   samplePhotos: ['base64', 'base64', ...] // Optional
 * }
 */
exports.enrollFaceId = async (req, res) => {
  try {
    const userId = req.user._id;
    const { descriptors, samplePhotos } = req.body;

    // Validation
    if (!descriptors || !Array.isArray(descriptors) || descriptors.length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Cần tối thiểu 5 descriptors từ nhiều góc khác nhau',
      });
    }

    // Kiểm tra mỗi descriptor có đúng format không
    const isValidDescriptors = descriptors.every(
      desc => Array.isArray(desc) && desc.length === 128
    );

    if (!isValidDescriptors) {
      return res.status(400).json({
        success: false,
        message: 'Descriptor không hợp lệ (phải là array of 128 numbers)',
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
      });
    }

    // Kiểm tra có thể đăng ký không (1 tháng/lần)
    const now = new Date();
    if (user.faceId.enrolled && user.faceId.nextEnrollmentDate && now < user.faceId.nextEnrollmentDate) {
      const daysLeft = Math.ceil((user.faceId.nextEnrollmentDate - now) / (1000 * 60 * 60 * 24));
      return res.status(403).json({
        success: false,
        message: `Bạn chỉ có thể đăng ký lại sau ${daysLeft} ngày`,
        nextEnrollmentDate: user.faceId.nextEnrollmentDate,
      });
    }

    // Upload sample photos (nếu có)
    let uploadedPhotos = [];
    if (samplePhotos && Array.isArray(samplePhotos)) {
      for (const photo of samplePhotos.slice(0, 3)) { // Chỉ lưu 3 ảnh
        try {
          const result = await uploadBase64Image(photo, 'face-id-samples');
          uploadedPhotos.push({
            url: result,
            capturedAt: new Date(),
          });
        } catch (uploadError) {
          console.warn('⚠️ Upload photo failed:', uploadError.message);
        }
      }
    }

    // Cập nhật Face ID
    user.faceId.enrolled = true;
    user.faceId.descriptors = descriptors;
    user.faceId.enrolledAt = now;
    user.faceId.nextEnrollmentDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 ngày
    user.faceId.enrollmentCount = (user.faceId.enrollmentCount || 0) + 1;
    if (uploadedPhotos.length > 0) {
      user.faceId.samplePhotos = uploadedPhotos;
    }

    await user.save();

    res.json({
      success: true,
      message: '✅ Đăng ký Face ID thành công!',
      data: {
        enrolled: true,
        enrolledAt: user.faceId.enrolledAt,
        nextEnrollmentDate: user.faceId.nextEnrollmentDate,
        descriptorCount: descriptors.length,
        enrollmentCount: user.faceId.enrollmentCount,
      },
    });
  } catch (error) {
    console.error('❌ Enroll Face ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đăng ký Face ID',
      error: error.message,
    });
  }
};

/**
 * POST /api/face-id/verify
 * Xác thực Face ID khi check-in
 * Body: {
 *   descriptor: [128 numbers], // Descriptor từ ảnh check-in
 *   threshold: 0.6 // Optional, mặc định 0.6
 * }
 */
exports.verifyFaceId = async (req, res) => {
  try {
    const userId = req.user._id;
    const { descriptor, threshold = 0.6 } = req.body;

    // Validation
    if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
      return res.status(400).json({
        success: false,
        message: 'Descriptor không hợp lệ',
      });
    }

    const user = await User.findById(userId).select('faceId full_name');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
      });
    }

    // Kiểm tra đã đăng ký Face ID chưa
    if (!user.faceId.enrolled || !user.faceId.descriptors || user.faceId.descriptors.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Bạn chưa đăng ký Face ID. Vui lòng đăng ký trước khi sử dụng.',
        needEnrollment: true,
      });
    }

    // So sánh với tất cả descriptors đã lưu
    const distances = user.faceId.descriptors.map(savedDescriptor => {
      return euclideanDistance(descriptor, savedDescriptor);
    });

    // Lấy distance nhỏ nhất (khớp nhất)
    const minDistance = Math.min(...distances);
    const isMatch = minDistance < threshold;
    const similarity = Math.max(0, ((1 - minDistance) * 100));

    console.log(`🔍 Face ID Verification for ${user.full_name}:`, {
      minDistance: minDistance.toFixed(4),
      similarity: similarity.toFixed(1) + '%',
      threshold,
      isMatch,
    });

    if (isMatch) {
      res.json({
        success: true,
        message: '✅ Xác thực Face ID thành công!',
        data: {
          verified: true,
          similarity: parseFloat(similarity.toFixed(1)),
          distance: parseFloat(minDistance.toFixed(4)),
        },
      });
    } else {
      res.status(401).json({
        success: false,
        message: `❌ Xác thực Face ID thất bại. Độ tương đồng: ${similarity.toFixed(1)}% (yêu cầu ${((1 - threshold) * 100).toFixed(0)}%)`,
        data: {
          verified: false,
          similarity: parseFloat(similarity.toFixed(1)),
          distance: parseFloat(minDistance.toFixed(4)),
        },
      });
    }
  } catch (error) {
    console.error('❌ Verify Face ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xác thực Face ID',
      error: error.message,
    });
  }
};

/**
 * POST /api/face-id/verify-angles
 * Xác thực Face ID bằng cách quét 5 góc (giống enrollment)
 * Body: {
 *   descriptors: [[128 numbers], [128 numbers], ...], // 5 descriptors từ 5 góc
 *   threshold: 0.6 // Optional
 * }
 */
exports.verifyFaceIdAngles = async (req, res) => {
  try {
    const userId = req.user._id;
    const { descriptors, threshold = 0.45 } = req.body; // Threshold 0.45 để cân bằng security và usability

    // Validation - phải có đúng 5 descriptors
    if (!descriptors || !Array.isArray(descriptors) || descriptors.length !== 5) {
      return res.status(400).json({
        success: false,
        message: 'Yêu cầu 5 descriptors từ 5 góc mặt (thẳng, trái, phải, ngẩng, cúi)',
      });
    }

    // Validate từng descriptor
    const isValidDescriptors = descriptors.every(
      desc => Array.isArray(desc) && desc.length === 128
    );

    if (!isValidDescriptors) {
      return res.status(400).json({
        success: false,
        message: 'Descriptor không hợp lệ (phải là array of 128 numbers)',
      });
    }

    const user = await User.findById(userId).select('faceId full_name');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
      });
    }

    // Kiểm tra đã đăng ký Face ID chưa
    if (!user.faceId.enrolled || !user.faceId.descriptors || user.faceId.descriptors.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Bạn chưa đăng ký Face ID. Vui lòng đăng ký trước khi sử dụng.',
        needEnrollment: true,
      });
    }

    // Kiểm tra số lượng descriptors đã lưu
    if (user.faceId.descriptors.length !== 5) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu Face ID không hợp lệ. Vui lòng đăng ký lại.',
        needReEnrollment: true,
      });
    }

    // So sánh từng góc với góc tương ứng đã lưu
    const angleResults = [];
    let totalDistance = 0;

    for (let i = 0; i < 5; i++) {
      const distance = euclideanDistance(descriptors[i], user.faceId.descriptors[i]);
      const similarity = Math.max(0, ((1 - distance) * 100));
      const isMatch = distance < threshold;

      angleResults.push({
        angle: ['Thẳng', 'Trái', 'Phải', 'Ngẩng', 'Cúi'][i],
        distance: parseFloat(distance.toFixed(4)),
        similarity: parseFloat(similarity.toFixed(1)),
        isMatch,
      });

      totalDistance += distance;
    }

    // Tính kết quả tổng - kiểm tra AVERAGE thay vì yêu cầu TẤT CẢ góc pass
    const avgDistance = totalDistance / 5;
    const avgSimilarity = Math.max(0, ((1 - avgDistance) * 100));
    
    // Đếm số góc match để tham khảo
    const matchedCount = angleResults.filter(r => r.isMatch).length;
    
    // Kiểm tra AVERAGE distance thay vì all angles
    const isVerified = avgDistance < threshold;

    console.log(`🔍 Face ID Multi-Angle Verification for ${user.full_name}:`, {
      avgDistance: avgDistance.toFixed(4),
      avgSimilarity: avgSimilarity.toFixed(1) + '%',
      threshold,
      matchedCount: `${matchedCount}/5`,
      isVerified,
      angleResults,
    });

    if (isVerified) {
      res.json({
        success: true,
        message: '✅ Xác thực Face ID thành công!',
        data: {
          verified: true,
          averageSimilarity: parseFloat(avgSimilarity.toFixed(1)),
          averageDistance: parseFloat(avgDistance.toFixed(4)),
          matchedAngles: matchedCount,
          angleResults,
        },
      });
    } else {
      res.status(401).json({
        success: false,
        message: `❌ Xác thực thất bại - Độ tương đồng trung bình: ${avgSimilarity.toFixed(1)}%`,
        data: {
          verified: false,
          averageSimilarity: parseFloat(avgSimilarity.toFixed(1)),
          averageDistance: parseFloat(avgDistance.toFixed(4)),
          matchedAngles: matchedCount,
          angleResults,
        },
      });
    }
  } catch (error) {
    console.error('❌ Verify Face ID Angles error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xác thực Face ID',
      error: error.message,
    });
  }
};

/**
 * DELETE /api/face-id/reset
 * Reset Face ID (chỉ admin hoặc khi quên - với lý do)
 */
exports.resetFaceId = async (req, res) => {
  try {
    const userId = req.user._id;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp lý do reset Face ID',
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
      });
    }

    // Reset Face ID
    user.faceId.enrolled = false;
    user.faceId.descriptors = [];
    user.faceId.enrolledAt = null;
    user.faceId.nextEnrollmentDate = null;
    // Không reset enrollmentCount để tracking

    await user.save();

    console.log(`🔄 Face ID reset for user ${user.full_name}. Reason: ${reason}`);

    res.json({
      success: true,
      message: '✅ Đã reset Face ID thành công. Bạn có thể đăng ký lại ngay.',
    });
  } catch (error) {
    console.error('❌ Reset Face ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi reset Face ID',
      error: error.message,
    });
  }
};

// ===== HELPER FUNCTIONS =====

/**
 * Tính khoảng cách Euclidean giữa 2 descriptors
 */
function euclideanDistance(desc1, desc2) {
  if (desc1.length !== desc2.length) {
    throw new Error('Descriptors phải có cùng độ dài');
  }

  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    sum += Math.pow(desc1[i] - desc2[i], 2);
  }

  return Math.sqrt(sum);
}
