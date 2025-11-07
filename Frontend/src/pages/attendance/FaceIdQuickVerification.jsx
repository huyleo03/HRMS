import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { toast } from 'react-toastify';
import FaceRecognitionService from '../../service/FaceRecognitionService';
import { apiCall } from '../../service/api';
import './FaceIdEnrollment.css';
import './FaceIdQuickVerification.css';

/**
 * 🎯 FACE ID QUICK VERIFICATION
 * Chụp 1 lần, so sánh với 5 góc đã lưu
 */

const FaceIdQuickVerification = ({ actionType, onSuccess, onCancel }) => {
  // Random chọn 1 hướng NGAY TỪ ĐẦU
  const movements = ['left', 'right', 'up', 'down'];
  const initialMovement = movements[Math.floor(Math.random() * movements.length)];
  
  const [step, setStep] = useState('ready'); // ready, detecting, capturing, processing, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [requiredMovement, setRequiredMovement] = useState(initialMovement); // Set ngay từ đầu
  const [movementProgress, setMovementProgress] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const lastDetectionRef = useRef(null);
  const hasCalledSuccessRef = useRef(false); // 🔒 Ngăn gọi onSuccess nhiều lần

  useEffect(() => {
    console.log(`🎯 Required movement: ${requiredMovement}`);
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      console.log('📹 Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Đợi video load xong rồi bắt đầu phát hiện chuyển động
        videoRef.current.onloadedmetadata = () => {
          console.log('📹 Camera loaded, starting movement detection...');
          startMovementDetection();
        };
      }
    } catch (error) {
      console.error('❌ Camera error:', error);
      toast.error('Không thể truy cập camera!');
      setStep('error');
      setErrorMessage('Không thể truy cập camera');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
  };

  /**
   * Bắt đầu phát hiện chuyển động liên tục
   */
  const startMovementDetection = () => {
    console.log('🎬 Starting movement detection...');
    setStep('detecting');
    
    // Phát hiện mỗi 200ms
    detectionIntervalRef.current = setInterval(() => {
      detectMovement();
    }, 200);
  };

  /**
   * Phát hiện chuyển động của đầu
   */
  const detectMovement = async () => {
    // Không check step nữa vì interval chỉ chạy khi detecting
    // if (step !== 'detecting') return;

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas) {
        console.log('⚠️ Video or canvas not ready');
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);

      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      const detection = await FaceRecognitionService.detectFace(imageData);

      if (!detection) {
        setMovementProgress(0);
        console.log('⚠️ No face detected');
        return;
      }

      // Lấy landmarks để tính góc
      const landmarks = detection.landmarks;
      const nose = landmarks.getNose();
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      const mouth = landmarks.getMouth();

      // Tính trung điểm 2 mắt
      const eyeCenter = {
        x: (leftEye[0].x + rightEye[3].x) / 2,
        y: (leftEye[0].y + rightEye[3].y) / 2,
      };

      const nosePoint = nose[3]; // Tip of nose
      const mouthCenter = {
        x: (mouth[0].x + mouth[6].x) / 2,
        y: (mouth[3].y + mouth[9].y) / 2,
      };

      // Tính khoảng cách giữa 2 mắt để làm tỷ lệ
      const eyeDistance = Math.sqrt(
        Math.pow(rightEye[3].x - leftEye[0].x, 2) + 
        Math.pow(rightEye[3].y - leftEye[0].y, 2)
      );

      // Tính góc yaw (xoay trái/phải)
      const dx = nosePoint.x - eyeCenter.x;
      const yaw = Math.atan2(dx, eyeDistance * 1.5) * (180 / Math.PI);
      
      // Tính pitch (ngẩng/cúi)
      const noseTipY = nosePoint.y;
      const eyeCenterY = eyeCenter.y;
      const mouthBottomY = mouth[9].y;
      const pitchRatio = (noseTipY - eyeCenterY) / (mouthBottomY - eyeCenterY);
      const pitch = pitchRatio * 100;

      // Kiểm tra chuyển động theo hướng yêu cầu
      let isCorrectMovement = false;
      const YAW_THRESHOLD = 5; // Giảm từ 8 xuống 5 - dễ hơn
      const PITCH_UP_THRESHOLD = 40; // Tăng từ 35 lên 40 - dễ hơn
      const PITCH_DOWN_THRESHOLD = 50; // Giảm từ 55 xuống 50 - dễ hơn

      switch (requiredMovement) {
        case 'left':
          isCorrectMovement = yaw < -YAW_THRESHOLD;
          break;
        case 'right':
          isCorrectMovement = yaw > YAW_THRESHOLD;
          break;
        case 'up':
          isCorrectMovement = pitch < PITCH_UP_THRESHOLD;
          break;
        case 'down':
          isCorrectMovement = pitch > PITCH_DOWN_THRESHOLD;
          break;
      }

      // DEBUG: Log movement data
      console.log(`🎯 Movement Detection - Required: ${requiredMovement}, Yaw: ${yaw.toFixed(1)}°, Pitch: ${pitch.toFixed(1)}, Match: ${isCorrectMovement}`);

      if (isCorrectMovement) {
        // Tăng progress nhanh hơn
        setMovementProgress(prev => {
          const newProgress = Math.min(prev + 25, 100); // Tăng từ 20 lên 25 - nhanh hơn
          console.log(`✅ Correct movement! Progress: ${prev}% → ${newProgress}%`);
          
          // Khi đạt 100% → Tự động chụp (CHỈ 1 LẦN)
          if (newProgress >= 100 && prev < 100) { // ✅ Kiểm tra prev < 100 để chỉ gọi 1 lần
            console.log('📸 Progress reached 100%, capturing...');
            clearInterval(detectionIntervalRef.current);
            detectionIntervalRef.current = null; // Set null để không gọi lại
            setTimeout(() => captureAndVerify(), 100); // Delay nhỏ để UI cập nhật
          }
          
          return newProgress;
        });
      } else {
        // Giảm progress chậm hơn
        setMovementProgress(prev => Math.max(prev - 5, 0)); // Giảm từ 10 xuống 5 - ít khắt khe hơn
      }

      // Lưu detection để debug
      lastDetectionRef.current = { yaw, pitch, isCorrectMovement };

    } catch (error) {
      console.error('Movement detection error:', error);
    }
  };

  const captureAndVerify = async () => {
    if (isVerifying) return;

    console.log('📸 Starting capture and verify...');
    
    // Stop movement detection
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }

    setIsVerifying(true);
    setStep('capturing');

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);

      const imageData = canvas.toDataURL('image/jpeg', 0.95);
      setCapturedImage(imageData);

      // Phát hiện khuôn mặt
      setStep('processing');
      const detection = await FaceRecognitionService.detectFace(imageData);

      if (!detection) {
        throw new Error('Không phát hiện khuôn mặt! Vui lòng thử lại.');
      }

      // Lấy descriptor từ ảnh chụp
      const descriptor = Array.from(detection.descriptor);
      
      console.log('📤 Verifying Face ID after movement detection...');
      
      // Gọi API verify - sẽ so sánh với TẤT CẢ 5 descriptors đã lưu
      const response = await apiCall('/api/face-id/verify', {
        method: 'POST',
        body: JSON.stringify({
          descriptor: descriptor,
          threshold: 0.6, // Ngưỡng tương đồng (60%)
        }),
      });

      console.log('✅ Verification response:', response);

      if (response.success && response.data.verified) {
        setStep('success');
        toast.success(`✅ Xác thực thành công! Độ tương đồng: ${response.data.similarity}%`, {
          toastId: 'face-verification-success' // ✅ Chỉ hiển thị 1 toast
        });
        
        // ✅ Chỉ gọi onSuccess MỘT LẦN duy nhất
        if (!hasCalledSuccessRef.current) {
          hasCalledSuccessRef.current = true;
          setTimeout(() => {
            stopCamera();
            onSuccess && onSuccess(response.data);
          }, 1500);
        }
      } else {
        throw new Error(response.message || `Xác thực thất bại. Độ tương đồng: ${response.data?.similarity || 0}%`);
      }
    } catch (error) {
      console.error('❌ Verification error:', error);
      setStep('error');
      setErrorMessage(error.message || 'Lỗi khi xác thực Face ID');
      toast.error(error.message || 'Lỗi khi xác thực Face ID');
      
      // Auto retry after 2s
      setTimeout(() => {
        setStep('ready');
        setErrorMessage('');
        setCapturedImage(null);
      }, 2000);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancel = () => {
    stopCamera();
    onCancel && onCancel();
  };

  const getMovementInstruction = () => {
    const instructions = {
      left: '👈 Vui lòng NGHIÊNG ĐẦU SANG TRÁI',
      right: '👉 Vui lòng NGHIÊNG ĐẦU SANG PHẢI',
      up: '👆 Vui lòng NGẨNG ĐẦU LÊN',
      down: '👇 Vui lòng CÚI ĐẦU XUỐNG'
    };
    return instructions[requiredMovement] || '';
  };

  const getMovementIcon = () => {
    const icons = {
      left: '👈',
      right: '👉',
      up: '👆',
      down: '👇'
    };
    return icons[requiredMovement] || '📷';
  };

  // ===== RENDER =====

  return (
    <div className="face-id-enrollment">
      <div className="enrollment-scanner">
        <div className="scanner-header">
          <h2>
            {actionType === 'in' ? '📥 Check-in với Face ID' : '📤 Check-out với Face ID'}
          </h2>
          <p>
            {step === 'ready' && 'Đang khởi động camera...'}
            {step === 'detecting' && getMovementInstruction()}
            {step === 'capturing' && 'Đang chụp ảnh...'}
            {step === 'processing' && 'Đang xác thực khuôn mặt...'}
            {step === 'success' && '✅ Xác thực thành công!'}
            {step === 'error' && `❌ ${errorMessage}`}
          </p>
          
          {/* Progress Bar */}
          {step === 'detecting' && (
            <div className="movement-progress">
              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${movementProgress}%` }}
                />
              </div>
              <span className="progress-text">{movementProgress}%</span>
            </div>
          )}
        </div>

        <div className="scanner-video">
          <video ref={videoRef} autoPlay playsInline />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          
          {capturedImage && (
            <div className="captured-overlay">
              <img src={capturedImage} alt="Captured" />
            </div>
          )}

          {/* Face Guide Overlay */}
          {step === 'detecting' && (
            <div className="face-guide-simple">
              <div className="face-circle"></div>
              <div className="movement-indicator">
                <span className="movement-icon">{getMovementIcon()}</span>
                <p className="movement-text">{getMovementInstruction()}</p>
              </div>
            </div>
          )}

          {step === 'ready' && (
            <div className="face-guide-simple">
              <div className="face-circle"></div>
              <p className="guide-text">Đang khởi động...</p>
            </div>
          )}

          {/* Processing Overlay */}
          {step === 'processing' && (
            <div className="processing-overlay">
              <Loader className="spin-animation" size={48} />
              <p>Đang xác thực...</p>
            </div>
          )}

          {/* Success Overlay */}
          {step === 'success' && (
            <div className="success-overlay">
              <CheckCircle size={64} color="#10B981" />
              <p>Xác thực thành công!</p>
            </div>
          )}

          {/* Error Overlay */}
          {step === 'error' && (
            <div className="error-overlay">
              <AlertCircle size={64} color="#EF4444" />
              <p>{errorMessage}</p>
              <small>Thử lại sau 2 giây...</small>
            </div>
          )}
        </div>

        <div className="scanner-actions">
          <button 
            onClick={handleCancel} 
            className="btn-cancel-floating"
            disabled={isVerifying || step === 'success'}
          >
            <X size={20} />
            <span>Hủy</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FaceIdQuickVerification;
