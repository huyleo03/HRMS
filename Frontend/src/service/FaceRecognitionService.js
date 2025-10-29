import * as faceapi from 'face-api.js';

class FaceRecognitionService {
  constructor() {
    this.isModelsLoaded = false;
    // Models đã được clone về local bằng degit
    this.MODEL_URL = '/models';
    
    // Liveness Detection Configuration
    this.livenessConfig = {
      blinkThreshold: 0.25, // Eye Aspect Ratio threshold để detect chớp mắt
      minBlinks: 1, // Số lần chớp mắt tối thiểu
      detectionTimeWindow: 5000, // 5 giây để hoàn thành challenge
      headMovementThreshold: 15, // Độ nghiêng đầu tối thiểu (degrees)
    };
    
    // Tracking state for liveness detection
    this.livenessState = {
      blinkCount: 0,
      previousEAR: null,
      headPositions: [],
      challengeType: null, // 'blink' hoặc 'head_turn'
    };
  }

  /**
   * Load Face-API models (chỉ load 1 lần)
   */
  async loadModels() {
    if (this.isModelsLoaded) {
      console.log('✅ Models already loaded');
      return;
    }

    try {
      console.log('📥 Loading Face-API models from:', this.MODEL_URL);
      
      // Load models - files nằm trực tiếp trong /models (không có subfolder)
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(this.MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(this.MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(this.MODEL_URL),
      ]);
      
      this.isModelsLoaded = true;
      console.log('✅ Face-API models loaded successfully');
    } catch (error) {
      console.error('❌ Error loading Face-API models:', error);
      throw new Error('Không thể tải models AI. Vui lòng kiểm tra kết nối internet.');
    }
  }

  /**
   * Detect face từ base64 image
   */
  async detectFace(base64Image) {
    await this.loadModels();

    try {
      // Convert base64 to Image element
      const img = await this.base64ToImage(base64Image);

      // Detect face với descriptor
      const detection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({
          inputSize: 320,
          scoreThreshold: 0.5
        }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      return detection;
    } catch (error) {
      console.error('❌ Face detection error:', error);
      throw error;
    }
  }

  /**
   * So sánh 2 khuôn mặt
   * @param {string} profilePhoto - Base64 image từ profile
   * @param {string} checkInPhoto - Base64 image từ check-in
   * @param {number} threshold - Ngưỡng so sánh (0.4-0.7), càng nhỏ càng khắt khe
   * @returns {Object} Kết quả so sánh
   */
  async compareFaces(profilePhoto, checkInPhoto, threshold = 0.6) {
    try {
      console.log('🔍 Starting face comparison...');
      await this.loadModels();

      // Detect faces từ cả 2 ảnh
      console.log('📸 Detecting face in profile photo...');
      const profileDetection = await this.detectFace(profilePhoto);

      console.log('📸 Detecting face in check-in photo...');
      const checkInDetection = await this.detectFace(checkInPhoto);

      // Kiểm tra có detect được không
      if (!profileDetection) {
        return {
          success: false,
          isMatch: false,
          message: 'Không tìm thấy khuôn mặt trong ảnh hồ sơ. Vui lòng cập nhật ảnh đại diện rõ ràng hơn.',
          similarity: 0,
        };
      }

      if (!checkInDetection) {
        return {
          success: false,
          isMatch: false,
          message: 'Không tìm thấy khuôn mặt trong ảnh chấm công. Vui lòng chụp lại với khuôn mặt rõ ràng.',
          similarity: 0,
        };
      }

      // Tính khoảng cách Euclidean giữa 2 face descriptors
      const distance = faceapi.euclideanDistance(
        profileDetection.descriptor,
        checkInDetection.descriptor
      );

      // Convert distance sang % similarity
      const similarity = Math.max(0, ((1 - distance) * 100));
      const isMatch = distance < threshold;

      console.log('📊 Face comparison result:', {
        distance: distance.toFixed(4),
        similarity: similarity.toFixed(1) + '%',
        threshold,
        isMatch,
      });

      return {
        success: true,
        isMatch,
        distance: parseFloat(distance.toFixed(4)),
        similarity: parseFloat(similarity.toFixed(1)),
        threshold,
        message: isMatch
          ? `✅ Xác thực thành công! Độ tương đồng: ${similarity.toFixed(1)}%`
          : `❌ Khuôn mặt không khớp! Độ tương đồng: ${similarity.toFixed(1)}% (yêu cầu tối thiểu ${((1 - threshold) * 100).toFixed(0)}%)`,
      };
    } catch (error) {
      console.error('❌ Face comparison error:', error);
      return {
        success: false,
        isMatch: false,
        message: 'Lỗi khi so sánh khuôn mặt: ' + error.message,
        similarity: 0,
      };
    }
  }

  /**
   * Helper: Convert base64 to Image element
   * Nếu là URL external, fetch qua proxy để tránh CORS
   */
  async base64ToImage(base64) {
    return new Promise(async (resolve, reject) => {
      const img = new Image();
      
      // Nếu là URL external (không phải base64), fetch về blob
      if (base64.startsWith('http://') || base64.startsWith('https://')) {
        try {
          const response = await fetch(base64);
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          
          img.onload = () => {
            URL.revokeObjectURL(objectUrl); // Clean up
            resolve(img);
          };
          img.onerror = (err) => reject(new Error('Không thể load ảnh: ' + err));
          img.src = objectUrl;
        } catch (error) {
          reject(new Error('Lỗi khi fetch ảnh: ' + error.message));
        }
      } else {
        // Base64 string - load trực tiếp
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(new Error('Không thể load ảnh: ' + err));
        img.src = base64;
      }
    });
  }

  /**
   * Helper: Capture ảnh từ video element
   */
  captureFromVideo(videoElement) {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.95);
  }

  /**
   * Helper: Vẽ face detection lên canvas (để debug/preview)
   */
  async drawDetection(canvasElement, imageElement, detection) {
    if (!detection) return;

    const displaySize = {
      width: imageElement.width,
      height: imageElement.height,
    };

    faceapi.matchDimensions(canvasElement, displaySize);
    const resizedDetections = faceapi.resizeResults(detection, displaySize);
    
    canvasElement.getContext('2d').clearRect(0, 0, canvasElement.width, canvasElement.height);
    faceapi.draw.drawDetections(canvasElement, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvasElement, resizedDetections);
  }

  /**
   * ===========================================
   * 🛡️ LIVENESS DETECTION - CHỐNG GIAN LẬN 
   * ===========================================
   */

  /**
   * Tính Eye Aspect Ratio (EAR) để detect chớp mắt
   * EAR < 0.25 = mắt đang nhắm
   */
  calculateEAR(landmarks) {
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();

    const leftEAR = this.getEyeAspectRatio(leftEye);
    const rightEAR = this.getEyeAspectRatio(rightEye);

    return (leftEAR + rightEAR) / 2.0;
  }

  /**
   * Công thức EAR:
   * EAR = (||p2 - p6|| + ||p3 - p5||) / (2 * ||p1 - p4||)
   */
  getEyeAspectRatio(eyePoints) {
    const p1 = eyePoints[0];
    const p2 = eyePoints[1];
    const p3 = eyePoints[2];
    const p4 = eyePoints[3];
    const p5 = eyePoints[4];
    const p6 = eyePoints[5];

    const vertical1 = this.euclideanDistance(p2, p6);
    const vertical2 = this.euclideanDistance(p3, p5);
    const horizontal = this.euclideanDistance(p1, p4);

    return (vertical1 + vertical2) / (2.0 * horizontal);
  }

  euclideanDistance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }

  /**
   * Detect chớp mắt từ video stream
   * @returns {Promise<boolean>} True nếu detect được chớp mắt
   */
  async detectBlink(videoElement, onProgress) {
    return new Promise(async (resolve, reject) => {
      await this.loadModels();

      let blinkCount = 0;
      let isEyeClosed = false;
      const startTime = Date.now();
      const timeout = this.livenessConfig.detectionTimeWindow;

      const checkBlink = async () => {
        try {
          // Kiểm tra timeout
          if (Date.now() - startTime > timeout) {
            reject(new Error('⏱️ Hết thời gian! Vui lòng thử lại.'));
            return;
          }

          // Detect face với landmarks
          const detection = await faceapi
            .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks();

          if (!detection) {
            onProgress && onProgress({ message: '👤 Không tìm thấy khuôn mặt', blinkCount });
            requestAnimationFrame(checkBlink);
            return;
          }

          // Tính EAR
          const ear = this.calculateEAR(detection.landmarks);

          // Detect trạng thái mắt
          if (ear < this.livenessConfig.blinkThreshold) {
            // Mắt đang nhắm
            if (!isEyeClosed) {
              isEyeClosed = true;
            }
          } else {
            // Mắt đang mở
            if (isEyeClosed) {
              // Vừa mở mắt → Đã chớp 1 lần
              blinkCount++;
              isEyeClosed = false;

              onProgress && onProgress({
                message: `✅ Phát hiện chớp mắt ${blinkCount}/${this.livenessConfig.minBlinks}`,
                blinkCount,
              });

              // Đủ số lần chớp → Success
              if (blinkCount >= this.livenessConfig.minBlinks) {
                resolve(true);
                return;
              }
            }
          }

          onProgress && onProgress({
            message: `👁️ Vui lòng chớp mắt ${blinkCount}/${this.livenessConfig.minBlinks}`,
            blinkCount,
            ear: ear.toFixed(3),
          });

          // Continue checking
          requestAnimationFrame(checkBlink);
        } catch (error) {
          reject(error);
        }
      };

      // Start checking
      checkBlink();
    });
  }

  /**
   * Tính góc nghiêng đầu (Head Pose Estimation)
   */
  calculateHeadPose(landmarks) {
    const nose = landmarks.getNose();
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();

    // Tính trung điểm 2 mắt
    const eyeCenter = {
      x: (leftEye[0].x + rightEye[3].x) / 2,
      y: (leftEye[0].y + rightEye[3].y) / 2,
    };

    // Tính vector từ mũi đến trung điểm mắt
    const nosePoint = nose[3]; // Tip of nose
    const dx = nosePoint.x - eyeCenter.x;
    const dy = nosePoint.y - eyeCenter.y;

    // Tính góc yaw (xoay trái/phải)
    const yaw = Math.atan2(dx, dy) * (180 / Math.PI);

    return { yaw };
  }

  /**
   * Detect xoay đầu
   * @param {string} direction - 'left' hoặc 'right'
   */
  async detectHeadTurn(videoElement, direction = 'left', onProgress) {
    return new Promise(async (resolve, reject) => {
      await this.loadModels();

      let centerYaw = null;
      let maxDeviation = 0;
      const startTime = Date.now();
      const timeout = this.livenessConfig.detectionTimeWindow;
      const threshold = this.livenessConfig.headMovementThreshold;

      const checkHeadTurn = async () => {
        try {
          if (Date.now() - startTime > timeout) {
            reject(new Error('⏱️ Hết thời gian! Vui lòng thử lại.'));
            return;
          }

          const detection = await faceapi
            .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks();

          if (!detection) {
            onProgress && onProgress({ message: '👤 Không tìm thấy khuôn mặt' });
            requestAnimationFrame(checkHeadTurn);
            return;
          }

          const { yaw } = this.calculateHeadPose(detection.landmarks);

          // Lần đầu tiên → Lưu vị trí trung tâm
          if (centerYaw === null) {
            centerYaw = yaw;
            onProgress && onProgress({
              message: `📸 Vui lòng xoay đầu sang ${direction === 'left' ? 'TRÁI' : 'PHẢI'}`,
            });
            requestAnimationFrame(checkHeadTurn);
            return;
          }

          // Tính độ lệch
          const deviation = yaw - centerYaw;
          maxDeviation = Math.max(maxDeviation, Math.abs(deviation));

          const expectedDeviation = direction === 'left' ? deviation < -threshold : deviation > threshold;

          if (expectedDeviation) {
            resolve(true);
            return;
          }

          onProgress && onProgress({
            message: `🔄 Đang xoay... ${Math.abs(deviation).toFixed(0)}°/${threshold}°`,
            deviation: deviation.toFixed(1),
          });

          requestAnimationFrame(checkHeadTurn);
        } catch (error) {
          reject(error);
        }
      };

      checkHeadTurn();
    });
  }

  /**
   * MAIN FUNCTION: Liveness Check với Random Challenge
   * @param {HTMLVideoElement} videoElement 
   * @param {Function} onProgress - Callback để update UI
   * @returns {Promise<Object>}
   */
  async performLivenessCheck(videoElement, onProgress) {
    try {
      // Random challenge: 70% blink, 30% head turn
      const challenges = ['blink', 'blink', 'blink', 'head_turn'];
      const selectedChallenge = challenges[Math.floor(Math.random() * challenges.length)];

      console.log('🎲 Selected challenge:', selectedChallenge);

      if (selectedChallenge === 'blink') {
        onProgress && onProgress({
          challengeType: 'blink',
          message: '👁️ Vui lòng CHỚP MẮT để xác nhận bạn là người thật',
        });

        await this.detectBlink(videoElement, onProgress);

        return {
          success: true,
          challengeType: 'blink',
          message: '✅ Xác thực thành công! Bạn là người thật.',
        };
      } else {
        // Head turn (random left/right)
        const direction = Math.random() > 0.5 ? 'left' : 'right';

        onProgress && onProgress({
          challengeType: 'head_turn',
          direction,
          message: `🔄 Vui lòng XOAY ĐẦU SANG ${direction === 'left' ? 'TRÁI' : 'PHẢI'}`,
        });

        await this.detectHeadTurn(videoElement, direction, onProgress);

        return {
          success: true,
          challengeType: 'head_turn',
          message: '✅ Xác thực thành công! Bạn là người thật.',
        };
      }
    } catch (error) {
      console.error('❌ Liveness check failed:', error);
      return {
        success: false,
        message: error.message || 'Xác thực thất bại. Vui lòng thử lại.',
      };
    }
  }

  /**
   * Kiểm tra chất lượng ảnh (chống ảnh mờ/tối)
   */
  async checkImageQuality(base64Image) {
    try {
      const img = await this.base64ToImage(base64Image);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Tính độ sáng trung bình
      let totalBrightness = 0;
      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        totalBrightness += brightness;
      }
      const avgBrightness = totalBrightness / (data.length / 4);

      // Kiểm tra
      if (avgBrightness < 50) {
        return { success: false, message: '🌑 Ảnh quá tối! Vui lòng chụp ở nơi sáng hơn.' };
      }
      if (avgBrightness > 240) {
        return { success: false, message: '☀️ Ảnh quá sáng! Vui lòng giảm ánh sáng.' };
      }

      return { success: true, brightness: avgBrightness.toFixed(0) };
    } catch (error) {
      return { success: false, message: 'Không thể kiểm tra chất lượng ảnh' };
    }
  }
}

const faceRecognitionService = new FaceRecognitionService();
export default faceRecognitionService;
