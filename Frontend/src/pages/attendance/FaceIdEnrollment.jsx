import React, { useState, useRef, useEffect } from 'react';
import { Camera, Check, X, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import FaceRecognitionService from '../../service/FaceRecognitionService';
import { apiCall } from '../../service/api';
import './FaceIdEnrollment.css';

/**
 * 🎯 FACE ID ENROLLMENT
 * Giống iPhone Face ID - Quét mặt từ nhiều góc
 */

const FaceIdEnrollment = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState('intro'); // intro, scanning, processing, success, error
  const [descriptors, setDescriptors] = useState([]);
  const [samplePhotos, setSamplePhotos] = useState([]);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [progress, setProgress] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const REQUIRED_ANGLES = [
    { id: 0, name: 'Nhìn thẳng', icon: '😐', instruction: 'Nhìn thẳng vào camera' },
    { id: 1, name: 'Quay trái', icon: '😏', instruction: 'Xoay đầu sang trái 30°' },
    { id: 2, name: 'Quay phải', icon: '😌', instruction: 'Xoay đầu sang phải 30°' },
    { id: 3, name: 'Ngẩng đầu', icon: '😊', instruction: 'Ngẩng đầu lên nhẹ' },
    { id: 4, name: 'Cúi đầu', icon: '😔', instruction: 'Cúi đầu xuống nhẹ' },
  ];

  useEffect(() => {
    if (step === 'scanning') {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [step]);

  const startCamera = async () => {
    try {
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
      }
    } catch (error) {
      console.error('❌ Camera error:', error);
      toast.error('Không thể truy cập camera!');
      setStep('error');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const captureAngle = async () => {
    if (isCapturing) return;

    setIsCapturing(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);

      const imageData = canvas.toDataURL('image/jpeg', 0.95);

      // Detect face và lấy descriptor + landmarks
      const detection = await FaceRecognitionService.detectFace(imageData);

      if (!detection) {
        toast.error('❌ Không phát hiện khuôn mặt! Vui lòng thử lại.');
        setIsCapturing(false);
        return;
      }

      // ===== VALIDATION: KIỂM TRA GÓC KHUÔN MẶT =====
      const currentAngleConfig = REQUIRED_ANGLES[currentAngle];
      const isCorrectAngle = validateFaceAngle(detection.landmarks, currentAngleConfig.id);

      if (!isCorrectAngle) {
        toast.warning(`⚠️ ${currentAngleConfig.instruction}\n\nVui lòng điều chỉnh góc khuôn mặt!`, {
          autoClose: 3000,
        });
        setIsCapturing(false);
        return;
      }

      // Lưu descriptor
      const newDescriptors = [...descriptors, Array.from(detection.descriptor)];
      setDescriptors(newDescriptors);

      // Lưu ảnh mẫu (3 ảnh đầu tiên)
      if (samplePhotos.length < 3) {
        setSamplePhotos([...samplePhotos, imageData]);
      }

      toast.success(`✅ Đã quét góc ${currentAngle + 1}/${REQUIRED_ANGLES.length}`);

      // Chuyển góc tiếp theo
      if (currentAngle < REQUIRED_ANGLES.length - 1) {
        setCurrentAngle(currentAngle + 1);
        setProgress(((currentAngle + 1) / REQUIRED_ANGLES.length) * 100);
      } else {
        // Hoàn thành quét
        setProgress(100);
        setStep('processing');
        await submitEnrollment(newDescriptors, samplePhotos);
      }
    } catch (error) {
      console.error('❌ Capture error:', error);
      toast.error('Lỗi khi quét khuôn mặt!');
    } finally {
      setIsCapturing(false);
    }
  };

  /**
   * Validate góc khuôn mặt dựa trên facial landmarks
   * @param {object} landmarks - Face landmarks từ face-api.js
   * @param {number} angleId - ID của góc cần kiểm tra (0-4)
   * @returns {boolean} True nếu đúng góc
   */
  const validateFaceAngle = (landmarks, angleId) => {
    // Góc 0 (nhìn thẳng) và Góc 3 (ngẩng đầu) - LUÔN CHO QUA
    if (angleId === 0 || angleId === 3) {
      console.log(`✅ Angle ${angleId} - AUTO PASS`);
      return true;
    }

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
    const dy = eyeCenter.y - nosePoint.y; // ĐẢO NGƯỢC: mắt - mũi

    // Tính góc yaw (xoay trái/phải) và pitch (ngẩng/cúi)
    const yaw = Math.atan2(dx, 150) * (180 / Math.PI); // Góc ngang
    const pitch = Math.atan2(dy, 150) * (180 / Math.PI); // Góc dọc

    console.log(`📐 Angle ${angleId} - yaw: ${yaw.toFixed(1)}°, pitch: ${pitch.toFixed(1)}°`);

    const YAW_TOLERANCE = 12;
    const PITCH_TOLERANCE = 10;

    let isValid = false;

    switch (angleId) {
      case 1: // Quay trái
        isValid = yaw < -YAW_TOLERANCE;
        break;
      
      case 2: // Quay phải
        isValid = yaw > YAW_TOLERANCE;
        break;
      
      case 4: // Cúi đầu - pitch âm
        isValid = pitch < -PITCH_TOLERANCE;
        break;
      
      default:
        isValid = true;
    }

    console.log(`${isValid ? '✅' : '❌'} Angle ${angleId} validation:`, isValid);
    return isValid;
  };

  const submitEnrollment = async (finalDescriptors, finalPhotos) => {
    try {
      const response = await apiCall('/api/face-id/enroll', {
        method: 'POST',
        body: JSON.stringify({
          descriptors: finalDescriptors,
          samplePhotos: finalPhotos,
        }),
      });

      if (response.success) {
        setStep('success');
        toast.success('Đăng ký quét mặt thành công!');
        
        setTimeout(() => {
          onComplete && onComplete();
        }, 2000);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('❌ Submit enrollment error:', error);
      setStep('error');
      toast.error(error.response?.data?.message || 'Lỗi khi đăng ký quét mặt!');
    }
  };

  const handleStart = () => {
    setStep('scanning');
  };

  const handleRetry = () => {
    setDescriptors([]);
    setSamplePhotos([]);
    setCurrentAngle(0);
    setProgress(0);
    setStep('scanning');
  };

  // ===== RENDER =====

  if (step === 'intro') {
    return (
      <div className="face-id-enrollment">
        <div className="enrollment-card">
          <h2>Đăng ký quét mặt</h2>
          <p className="enrollment-description">
            Quét khuôn mặt từ nhiều góc để hệ thống nhận diện chính xác.
          </p>
          
          <div className="enrollment-steps">
            <h3>Quy trình:</h3>
            <ul>
              <li>Quét khuôn mặt từ 5 góc khác nhau</li>
              <li>Mỗi góc chỉ mất 2-3 giây</li>
              <li>Chỉ đăng ký 1 lần/tháng</li>
              <li>Sau đó chấm công tự động bằng quét mặt</li>
            </ul>
          </div>

          <div className="enrollment-actions">
            <button onClick={onCancel} className="btn-secondary">
              Đóng
            </button>
            <button onClick={handleStart} className="btn-primary">
              Bắt đầu đăng ký
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'scanning') {
    const currentAngleData = REQUIRED_ANGLES[currentAngle];

    return (
      <div className="face-id-enrollment">
        <div className="enrollment-scanner">
          <div className="scanner-header">
            <h2>Đăng ký quét mặt</h2>
            <p>Quét {currentAngle + 1}/{REQUIRED_ANGLES.length}</p>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="scanner-video">
            <video ref={videoRef} autoPlay playsInline />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>

          <div className="scanner-instruction">
            <h3>{currentAngleData.name}</h3>
            <p>{currentAngleData.instruction}</p>
          </div>

          <div className="scanner-actions">
            <button 
              onClick={captureAngle} 
              className="btn-capture"
              disabled={isCapturing}
            >
              {isCapturing ? (
                <span>Đang xử lý...</span>
              ) : (
                <span>Chụp</span>
              )}
            </button>
          </div>

          <button onClick={onCancel} className="btn-cancel-floating">
            <span>Dừng</span>
          </button>
        </div>
      </div>
    );
  }

  if (step === 'processing') {
    return (
      <div className="face-id-enrollment">
        <div className="enrollment-card">
          <h2>Đang xử lý...</h2>
          <p>Vui lòng đợi trong giây lát</p>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="face-id-enrollment">
        <div className="enrollment-card success">
          <h2>Hoàn thành!</h2>
          <p>Quét mặt đã được đăng ký thành công.</p>
          <p className="note">Từ giờ bạn có thể chấm công bằng quét mặt!</p>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="face-id-enrollment">
        <div className="enrollment-card error">
          <h2>Có lỗi xảy ra</h2>
          <p>Không thể đăng ký quét mặt. Vui lòng thử lại.</p>
          
          <div className="enrollment-actions">
            <button onClick={onCancel} className="btn-secondary">
              Đóng
            </button>
            <button onClick={handleRetry} className="btn-primary">
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default FaceIdEnrollment;
