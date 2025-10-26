import * as faceapi from 'face-api.js';

class FaceRecognitionService {
  constructor() {
    this.isModelsLoaded = false;
    // Models đã được clone về local bằng degit
    this.MODEL_URL = '/models';
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
      console.log('📥 Loading Face-API models...');
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(`${this.MODEL_URL}/tiny_face_detector`),
        faceapi.nets.faceLandmark68Net.loadFromUri(`${this.MODEL_URL}/face_landmark_68`),
        faceapi.nets.faceRecognitionNet.loadFromUri(`${this.MODEL_URL}/face_recognition`),
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
   * Vẽ face detection lên canvas (để debug/preview)
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
}

export default new FaceRecognitionService();
