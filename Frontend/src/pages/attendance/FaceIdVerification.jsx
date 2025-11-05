import React, { useState, useRef, useEffect } from 'react';
import { Camera, Check, X, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import FaceRecognitionService from '../../service/FaceRecognitionService';
import './FaceIdEnrollment.css';

const FaceIdVerification = ({ onSuccess, onCancel, actionType }) => {
  const [step, setStep] = useState('intro');
  const [descriptors, setDescriptors] = useState([]);
  const [samplePhotos, setSamplePhotos] = useState([]);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Liveness detection states
  const [smileDetected, setSmileDetected] = useState(false);
  const [smileRequired, setSmileRequired] = useState(false);
  const [motionDetected, setMotionDetected] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const previousFrameRef = useRef(null); // Lưu frame trước để so sánh motion
  const motionCheckIntervalRef = useRef(null);
  const smileCheckIntervalRef = useRef(null);
  const smileCountRef = useRef(0); // Đếm số frame phát hiện smile

  const REQUIRED_ANGLES = [
    { id: 0, name: 'Nhìn thẳng', icon: '😐', instruction: 'Nhìn thẳng vào camera' },
    { id: 1, name: 'Quay trái', icon: '😏', instruction: 'Xoay đầu sang trái' },
    { id: 2, name: 'Quay phải', icon: '😌', instruction: 'Xoay đầu sang phải' },
    { id: 3, name: 'Ngẩng đầu', icon: '😊', instruction: 'Ngẩng đầu lên' },
    { id: 4, name: 'Cúi đầu', icon: '😔', instruction: 'Cúi đầu xuống' },
  ];

  useEffect(() => {
    return () => {
      stopCamera();
      if (motionCheckIntervalRef.current) {
        clearInterval(motionCheckIntervalRef.current);
      }
      if (smileCheckIntervalRef.current) {
        clearInterval(smileCheckIntervalRef.current);
      }
    };
  }, []);

  const startScanning = async () => {
    setStep('scanning');
    setCurrentAngle(0);
    setDescriptors([]);
    setSamplePhotos([]);
    setProgress(0);
    
    // Random angle để yêu cầu smile (1 trong 5 góc)
    const randomSmileAngle = Math.floor(Math.random() * 5);
    setSmileRequired(randomSmileAngle);
    setSmileDetected(false);
    setMotionDetected(false);
    
    // Reset counters
    smileCountRef.current = 0;

    try {
      await FaceRecognitionService.loadModels();
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Bắt đầu check motion detection
        startMotionDetection();
        
        // Bắt đầu check smile detection liên tục
        startSmileDetection();
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Không thể truy cập camera!');
      setStep('error');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (motionCheckIntervalRef.current) {
      clearInterval(motionCheckIntervalRef.current);
      motionCheckIntervalRef.current = null;
    }
    if (smileCheckIntervalRef.current) {
      clearInterval(smileCheckIntervalRef.current);
      smileCheckIntervalRef.current = null;
    }
  };

  // Motion Detection - Check video có thay đổi giữa các frame
  const startMotionDetection = () => {
    motionCheckIntervalRef.current = setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);

      if (previousFrameRef.current) {
        const diff = calculateFrameDifference(previousFrameRef.current, currentFrame);
        
        // Nếu có sự thay đổi > 5% pixels → Video thật
        if (diff > 0.05) {
          setMotionDetected(true);
        }
      }

      previousFrameRef.current = currentFrame;
    }, 500); // Check mỗi 500ms
  };

  // Tính độ khác biệt giữa 2 frames
  const calculateFrameDifference = (frame1, frame2) => {
    const data1 = frame1.data;
    const data2 = frame2.data;
    let diffCount = 0;
    const threshold = 30; // Ngưỡng khác biệt pixel

    for (let i = 0; i < data1.length; i += 4) {
      const diff = Math.abs(data1[i] - data2[i]) + 
                   Math.abs(data1[i + 1] - data2[i + 1]) + 
                   Math.abs(data1[i + 2] - data2[i + 2]);
      
      if (diff > threshold) {
        diffCount++;
      }
    }

    return diffCount / (data1.length / 4); // % pixels thay đổi
  };

  // Smile Detection - Kiểm tra có mỉm cười
  const checkSmile = (detectionWithLandmarks) => {
    if (!detectionWithLandmarks || !detectionWithLandmarks.landmarks) {
      return false;
    }

    const landmarks = detectionWithLandmarks.landmarks.positions;
    
    // Mouth landmarks (face-api.js 68-point model)
    // Mouth outer: 48-59
    const mouthLeft = landmarks[48];   // Left corner
    const mouthRight = landmarks[54];  // Right corner
    const mouthTop = landmarks[51];    // Top center
    const mouthBottom = landmarks[57]; // Bottom center

    // Tính mouth aspect ratio
    const mouthWidth = distance(mouthLeft, mouthRight);
    const mouthHeight = distance(mouthTop, mouthBottom);
    const mouthRatio = mouthWidth / mouthHeight;

    console.log('� Mouth Ratio:', mouthRatio.toFixed(2)); // Debug

    // Ratio > 2.5 = đang cười (miệng kéo ngang)
    return mouthRatio > 2.5;
  };

  // Smile Detection liên tục
  const startSmileDetection = () => {
    smileCheckIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || smileDetected) return;

      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        const photoData = canvas.toDataURL('image/jpeg', 0.8);
        const detection = await FaceRecognitionService.detectFace(photoData, true);

        if (detection) {
          const isSmiling = checkSmile(detection);

          if (isSmiling) {
            smileCountRef.current++;
            
            // Phát hiện smile ổn định trong 3 frames liên tục
            if (smileCountRef.current >= 3) {
              console.log('✅ SMILE DETECTED!');
              setSmileDetected(true);
              toast.success('😊 Đã phát hiện nụ cười!', { autoClose: 1500 });
              clearInterval(smileCheckIntervalRef.current);
            }
          } else {
            smileCountRef.current = 0; // Reset nếu không cười
          }

          console.log('Smile state:', isSmiling ? '😊 SMILING' : '😐 NEUTRAL', 
                      'Count:', smileCountRef.current);
        }
      } catch (error) {
        // Ignore errors
      }
    }, 300); // Check mỗi 300ms
  };

  const distance = (p1, p2) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };

  const captureAngle = async () => {
    if (isCapturing) return;

    setIsCapturing(true);

    try {
      // 1. Kiểm tra motion detection trước
      if (!motionDetected) {
        toast.error('⚠️ Không phát hiện chuyển động!\n\nVui lòng di chuyển đầu nhẹ nhàng.', {
          autoClose: 3000,
        });
        setIsCapturing(false);
        return;
      }

      // 2. Nếu góc này yêu cầu smile → Kiểm tra đã smile chưa
      if (currentAngle === smileRequired && !smileDetected) {
        toast.warning('😊 Vui lòng mỉm cười trước!', {
          autoClose: 2000,
        });
        setIsCapturing(false);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas) {
        throw new Error('Video hoặc Canvas không tồn tại');
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      const photoData = canvas.toDataURL('image/jpeg', 0.8);

      const detection = await FaceRecognitionService.detectFace(photoData, true);

      if (!detection) {
        toast.error('❌ Không phát hiện khuôn mặt!\n\nĐảm bảo mặt trong khung oval.', {
          autoClose: 3000,
        });
        setIsCapturing(false);
        return;
      }

      const descriptor = Array.from(detection.descriptor);
      const newDescriptors = [...descriptors, descriptor];
      setDescriptors(newDescriptors);

      const newPhotos = [...samplePhotos, photoData];
      setSamplePhotos(newPhotos);

      toast.success(`✅ Đã chụp góc "${REQUIRED_ANGLES[currentAngle].name}"!`, {
        autoClose: 1500,
      });

      const newProgress = ((currentAngle + 1) / REQUIRED_ANGLES.length) * 100;
      setProgress(newProgress);

      if (currentAngle < REQUIRED_ANGLES.length - 1) {
        setCurrentAngle(currentAngle + 1);
        setIsCapturing(false);
      } else {
        stopCamera();
        await submitVerification(newDescriptors);
      }
    } catch (error) {
      console.error('Capture error:', error);
      toast.error('Lỗi khi chụp! Thử lại.');
      setIsCapturing(false);
    }
  };

  const submitVerification = async (finalDescriptors) => {
    setStep('processing');

    try {
      const response = await fetch('http://localhost:9999/api/face-id/verify-angles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ descriptors: finalDescriptors }),
      });

      const data = await response.json();

      if (data.success) {
        setStep('success');
        toast.success(`✅ ${data.message}\n\nĐộ khớp: ${data.data.averageSimilarity}%`, {
          autoClose: 3000,
        });
        setTimeout(() => {
          onSuccess && onSuccess(data.data);
        }, 1500);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Verification error:', error);
      setStep('error');
      toast.error(error.message || 'Xác thực thất bại!');
    }
  };

  const handleRetry = () => {
    setStep('intro');
    setDescriptors([]);
    setSamplePhotos([]);
    setCurrentAngle(0);
    setProgress(0);
  };

  const currentAngleData = REQUIRED_ANGLES[currentAngle];

  if (step === 'intro') {
    return (
      <div className="face-id-enrollment">
        <div className="enrollment-card">
          <div className="enrollment-header">
            <h2>Quét mặt</h2>
            <p>Xác thực khuôn mặt với tính năng chống giả mạo</p>
          </div>
          <div className="enrollment-steps">
            <h3>Quy trình</h3>
            <ul>
              <li>Chụp 5 góc theo hướng dẫn</li>
              <li>Nhấn nút "Chụp" cho mỗi góc</li>
              <li>Di chuyển đầu nhẹ nhàng (chống ảnh tĩnh)</li>
              <li>Mỉm cười khi được yêu cầu</li>
            </ul>
          </div>
          <div className="enrollment-actions">
            <button onClick={onCancel} className="btn-secondary">
              <span>Đóng</span>
            </button>
            <button onClick={startScanning} className="btn-primary">
              <span>Bắt đầu quét</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'scanning') {
    return (
      <div className="face-id-enrollment">
        <div className="enrollment-scanner">
          <div className="scanner-header">
            <h2>Đang quét mặt</h2>
            <p>Góc {currentAngle + 1}/5 - {currentAngleData.name}</p>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="scanner-video">
            <video ref={videoRef} autoPlay playsInline />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div className="face-oval" />
            
            {/* Liveness indicators */}
            <div className="liveness-indicators">
              <div className={`liveness-badge ${motionDetected ? 'active' : ''}`}>
                <span>{motionDetected ? 'Video thật' : 'Chưa phát hiện chuyển động'}</span>
              </div>
              {currentAngle === smileRequired && !smileDetected && (
                <div className="liveness-badge blink-required">
                  <span>Vui lòng mỉm cười</span>
                </div>
              )}
              {smileDetected && currentAngle >= smileRequired && (
                <div className="liveness-badge active">
                  <span>Đã phát hiện nụ cười</span>
                </div>
              )}
            </div>
          </div>

          <div className="scanner-instruction">
            <h3>{currentAngleData.name}</h3>
            <p>{currentAngleData.instruction}</p>
            {currentAngle === smileRequired && !smileDetected && (
              <p style={{ color: '#f59e0b', fontWeight: 'bold', marginTop: '8px' }}>
                Vui lòng mỉm cười trước khi chụp!
              </p>
            )}
          </div>

          <div className="scanner-actions">
            <button 
              onClick={captureAngle} 
              className="btn-capture"
              disabled={isCapturing || !motionDetected}
            >
              {isCapturing ? (
                <span>Đang xử lý...</span>
              ) : !motionDetected ? (
                <span>Chờ phát hiện chuyển động...</span>
              ) : (
                <span>Chụp</span>
              )}
            </button>
            <button onClick={onCancel} className="btn-cancel">
              <span>Dừng lại</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'processing') {
    return (
      <div className="face-id-enrollment">
        <div className="enrollment-card">
          <div className="enrollment-header">
            <h2>Đang xác thực...</h2>
            <p>So sánh với dữ liệu đã lưu</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="face-id-enrollment">
        <div className="enrollment-card">
          <div className="enrollment-header">
            <h2>Xác thực thành công!</h2>
            <p>Đang {actionType === 'in' ? 'check-in' : 'check-out'}...</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="face-id-enrollment">
        <div className="enrollment-card">
          <div className="enrollment-header">
            <h2>Có lỗi xảy ra</h2>
            <p>Không thể xác thực. Vui lòng thử lại.</p>
          </div>
          <div className="enrollment-actions">
            <button onClick={onCancel} className="btn-secondary">
              <span>Đóng</span>
            </button>
            <button onClick={handleRetry} className="btn-primary">
              <span>Thử lại</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default FaceIdVerification;
