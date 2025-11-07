import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import {
  Clock,
  Calendar,
  Camera,
  CheckCircle,
  XCircle,
  AlertCircle,
  LogIn,
  LogOut,
  Wifi,
  WifiOff,
  History,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Fingerprint,
  Shield,
} from "lucide-react";
import {
  pingIntranet,
  clockIn,
  clockOut,
  getTodayStatus,
  getMyHistory,
} from "../../service/AttendanceService";
import FaceRecognitionService from "../../service/FaceRecognitionService";
import { apiCall } from "../../service/api";
import { useAuth } from "../../contexts/AuthContext";
import FaceIdEnrollment from "./FaceIdEnrollment";
import FaceIdQuickVerification from "./FaceIdQuickVerification";
import "./EmployeeAttendance.css";

const ITEMS_PER_PAGE = 5; // Giảm xuống 5 để dễ test phân trang

const EmployeeAttendance = () => {
  // State Management
  const { user } = useAuth(); // Lấy user info
  const [activeTab, setActiveTab] = useState("dashboard"); // 'dashboard' | 'history'
  const [todayStatus, setTodayStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [isIntranet, setIsIntranet] = useState(false);
  const [isCheckingNetwork, setIsCheckingNetwork] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFaceVerifying, setIsFaceVerifying] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [actionType, setActionType] = useState(null); // 'in' | 'out'
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Face ID States
  const [faceIdStatus, setFaceIdStatus] = useState(null);
  const [showEnrollment, setShowEnrollment] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [isLoadingFaceId, setIsLoadingFaceId] = useState(true);
  
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
  });
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    status: "all",
  });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const isProcessingAttendanceRef = useRef(false); // 🔒 Ngăn xử lý chấm công nhiều lần

  // ============ EFFECTS ============

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check intranet on mount
  useEffect(() => {
    checkIntranet();
    fetchTodayStatus();
    checkFaceIdStatus();
  }, []);

  // Fetch history when switching to history tab
  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filters]);

  // ============ API CALLS ============

  const checkIntranet = async () => {
    setIsCheckingNetwork(true);
    try {
      const result = await pingIntranet();
      setIsIntranet(result.success);
    } catch (error) {
      setIsIntranet(false);
    } finally {
      setIsCheckingNetwork(false);
    }
  };

  const fetchTodayStatus = async () => {
    try {
      const response = await getTodayStatus();
      setTodayStatus(response.data);
    } catch (error) {
      console.error("Error fetching today status:", error);
    }
  };

  const checkFaceIdStatus = async () => {
    setIsLoadingFaceId(true);
    try {
      const response = await apiCall("/api/face-id/status", { method: 'GET' });
      setFaceIdStatus(response.data);
    } catch (error) {
      console.error("Error checking Face ID status:", error);
    } finally {
      setIsLoadingFaceId(false);
    }
  };

  const fetchHistory = async (page = 1) => {
    try {
      const params = {
        page,
        limit: ITEMS_PER_PAGE,
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.status !== "all" && { status: filters.status }),
      };

      const response = await getMyHistory(params);
      setHistory(response.data);
      
      // Backend trả về { total, page, pages } - cần convert sang format frontend
      setPagination({
        total: response.pagination.total,
        currentPage: response.pagination.page,
        totalPages: response.pagination.pages,
      });
    } catch (error) {
      console.error("Error fetching history:", error);
      toast.error("Không thể tải lịch sử chấm công");
    }
  };

  // ============ CAMERA FUNCTIONS ============

  const startCamera = async (type) => {
    if (!isIntranet) {
      toast.error("Bạn phải kết nối Intranet để chấm công!");
      return;
    }

    // Kiểm tra đăng ký quét mặt
    if (!faceIdStatus?.enrolled) {
      toast.warning("⚠️ Bạn chưa đăng ký quét mặt!\n\nVui lòng đăng ký quét mặt trước khi chấm công.", {
        autoClose: 5000,
      });
      return;
    }

    // Bật xác thực quét mặt (quét 5 góc)
    setActionType(type);
    setShowVerification(true);
  };

  // ============ XỬ LÝ QUÉT MẶT THÀNH CÔNG ============
  
  const handleVerificationSuccess = async (verificationData) => {
    // 🔒 Ngăn chặn xử lý nhiều lần
    if (isProcessingAttendanceRef.current) {
      console.log('⚠️ Đang xử lý chấm công, bỏ qua lệnh gọi trùng lặp');
      return;
    }
    
    isProcessingAttendanceRef.current = true;
    setShowVerification(false);
    setIsProcessing(true);

    try {
      toast.info("✅ Xác thực thành công! Đang xử lý chấm công...", { 
        autoClose: 2000,
        toastId: 'processing-attendance' // ✅ Chỉ hiển thị 1 toast
      });

      // Gọi API clock-in/clock-out (không cần photo nữa vì đã verify qua quét mặt)
      let response;

      if (actionType === "in") {
        response = await clockIn(null); // Không cần photo
      } else {
        response = await clockOut(null);
      }

      if (response.success) {
        toast.success(response.message, { 
          autoClose: 3000,
          toastId: 'attendance-success' // ✅ Chỉ hiển thị 1 toast
        });
        await fetchTodayStatus();
      }
    } catch (error) {
      console.error("Attendance error:", error);
      toast.error(error?.response?.data?.message || "Có lỗi xảy ra khi chấm công!", {
        toastId: 'attendance-error' // ✅ Chỉ hiển thị 1 toast
      });
    } finally {
      setIsProcessing(false);
      setActionType(null);
      // Reset flag sau 2 giây để cho phép chấm công lần tiếp theo
      setTimeout(() => {
        isProcessingAttendanceRef.current = false;
      }, 2000);
    }
  };

  const handleVerificationCancel = () => {
    setShowVerification(false);
    setActionType(null);
  };

  // ============ OLD CAMERA FUNCTIONS - XÓA SAU ============

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);

      const photoData = canvas.toDataURL("image/jpeg", 0.8);
      setCapturedPhoto(photoData);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setCapturedPhoto(null);
    setActionType(null);
  };

  const submitAttendance = async () => {
    // OLD FUNCTION - KHÔNG DÙNG NỮA
    toast.warning("Vui lòng sử dụng Face ID Verification mới!");
  };

  // ============ RENDER HELPERS ============

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      Present: { label: "Đúng giờ", className: "badge-success", icon: CheckCircle },
      Late: { label: "Đi muộn", className: "badge-warning", icon: AlertCircle },
      "Early Leave": { label: "Về sớm", className: "badge-warning", icon: AlertCircle },
      "Late & Early Leave": { label: "Muộn & Về sớm", className: "badge-danger", icon: XCircle },
      Absent: { label: "Vắng", className: "badge-danger", icon: XCircle },
      "On Leave": { label: "Nghỉ phép", className: "badge-info", icon: Calendar },
    };
    return badges[status] || badges.Present;
  };

  // ============ RENDER DASHBOARD ============

  const renderDashboard = () => (
    <div className="attendance-dashboard">
      {/* Network Status Banner */}
      <div className={`network-banner ${isIntranet ? "connected" : "disconnected"}`}>
        {isCheckingNetwork ? (
          <>
            <Clock className="animate-spin" size={20} />
            <span>Đang kiểm tra kết nối...</span>
          </>
        ) : isIntranet ? (
          <>
            <Wifi size={20} />
            <span>Kết nối Intranet</span>
          </>
        ) : (
          <>
            <WifiOff size={20} />
            <span>Ngoài Intranet - Không thể chấm công</span>
          </>
        )}
      </div>

      {/* Trạng thái Quét mặt */}
      {!isLoadingFaceId && (
        <div className={`face-id-banner ${faceIdStatus?.enrolled ? "enrolled" : "not-enrolled"}`}>
          <div className="banner-content">
            <Fingerprint size={20} />
            {faceIdStatus?.enrolled ? (
              <div className="enrolled-info">
                <span className="status-text">✅ Quét mặt đã đăng ký</span>
                <span className="enrollment-date">
                  Đăng ký: {new Date(faceIdStatus.enrolledAt).toLocaleDateString("vi-VN")}
                </span>
                {faceIdStatus.canEnroll && (
                  <button
                    className="btn-reenroll"
                    onClick={() => setShowEnrollment(true)}
                  >
                    🔄 Đăng ký lại
                  </button>
                )}
              </div>
            ) : (
              <div className="not-enrolled-info">
                <span className="status-text">⚠️ Chưa đăng ký quét mặt</span>
                <button
                  className="btn-enroll-now"
                  onClick={() => setShowEnrollment(true)}
                >
                  <Shield size={16} />
                  <span>Đăng ký ngay</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Current Time Display */}
      <div className="time-display">
        <div className="current-time">{formatTime(currentTime)}</div>
        <div className="current-date">{formatDate(currentTime)}</div>
      </div>

      {/* Today's Status Card */}
      {todayStatus ? (
        <div className="today-status-card">
          <div className="status-header">
            <h3>Trạng thái hôm nay</h3>
            {(() => {
              const StatusBadge = getStatusBadge(todayStatus.status);
              const Icon = StatusBadge.icon;
              return (
                <div className={`status-badge ${StatusBadge.className}`}>
                  <Icon size={16} />
                  <span>{StatusBadge.label}</span>
                </div>
              );
            })()}
          </div>

          <div className="status-timeline">
            {/* Clock In */}
            <div className="timeline-item">
              <div className="timeline-icon completed">
                <LogIn size={20} />
              </div>
              <div className="timeline-content">
                <div className="timeline-label">Check-in</div>
                <div className="timeline-time">
                  {todayStatus.clockIn ? formatTime(todayStatus.clockIn) : "--:--"}
                </div>
                {todayStatus.isLate && (
                  <div className="late-badge">Muộn {todayStatus.lateMinutes} phút</div>
                )}
              </div>
            </div>

            {/* Clock Out */}
            <div className="timeline-item">
              <div className={`timeline-icon ${todayStatus.clockOut ? "completed" : "pending"}`}>
                <LogOut size={20} />
              </div>
              <div className="timeline-content">
                <div className="timeline-label">Check-out</div>
                <div className="timeline-time">
                  {todayStatus.clockOut ? formatTime(todayStatus.clockOut) : "--:--"}
                </div>
              </div>
            </div>
          </div>

          {/* Work Summary */}
          <div className="work-summary">
            <div className="summary-item">
              <Clock size={18} />
              <div>
                <div className="summary-label">Giờ làm việc</div>
                <div className="summary-value">{todayStatus.workHours || 0} giờ</div>
              </div>
            </div>
            <div className="summary-item">
              <TrendingUp size={18} />
              <div>
                <div className="summary-label">Tăng ca</div>
                <div className="summary-value">{todayStatus.overtimeHours || 0} giờ</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="today-status-card empty">
          <AlertCircle size={48} />
          <p>Chưa có dữ liệu chấm công hôm nay</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="action-buttons">
        <button
          className="btn-clock-in"
          onClick={() => startCamera("in")}
          disabled={!isIntranet || !faceIdStatus?.enrolled || todayStatus?.clockIn || isProcessing}
          title={
            !faceIdStatus?.enrolled
              ? "Vui lòng đăng ký quét mặt trước"
              : !isIntranet
              ? "Cần kết nối Intranet"
              : todayStatus?.clockIn
              ? "Đã check-in hôm nay"
              : "Check-in với quét mặt"
          }
        >
          <LogIn size={20} />
          <span>Check-in với quét mặt</span>
        </button>

        <button
          className="btn-clock-out"
          onClick={() => startCamera("out")}
          disabled={
            !isIntranet ||
            !faceIdStatus?.enrolled ||
            !todayStatus?.clockIn ||
            todayStatus?.clockOut ||
            isProcessing
          }
          title={
            !faceIdStatus?.enrolled
              ? "Vui lòng đăng ký quét mặt trước"
              : !isIntranet
              ? "Cần kết nối Intranet"
              : !todayStatus?.clockIn
              ? "Chưa check-in hôm nay"
              : todayStatus?.clockOut
              ? "Đã check-out hôm nay"
              : "Check-out với quét mặt"
          }
        >
          <LogOut size={20} />
          <span>Check-out với quét mặt</span>
        </button>
      </div>
    </div>
  );

  // ============ RENDER HISTORY ============

  const renderHistory = () => (
    <div className="attendance-history">
      {/* Filters */}
      <div className="history-filters">
        <div className="filter-group-employee">
          <label>Từ ngày</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />
        </div>
        <div className="filter-group-employee">
          <label>Đến ngày</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
        </div>
        <div className="filter-group-employee">
          <label>Trạng thái</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="all">Tất cả</option>
            <option value="Present">Đúng giờ</option>
            <option value="Late">Đi muộn</option>
            <option value="Early Leave">Về sớm</option>
            <option value="Late & Early Leave">Muộn & Về sớm</option>
            <option value="Absent">Vắng</option>
            <option value="On Leave">Nghỉ phép</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="history-table-wrapper">
        <table className="history-table">
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Trạng thái</th>
              <th>Giờ làm</th>
              <th>Tăng ca</th>
              <th>Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {history.length > 0 ? (
              history.map((record) => {
                const StatusBadge = getStatusBadge(record.status);
                const Icon = StatusBadge.icon;
                return (
                  <tr key={record._id}>
                    <td>
                      {new Date(record.date).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </td>
                    <td>{record.clockIn ? formatTime(record.clockIn) : "--:--"}</td>
                    <td>{record.clockOut ? formatTime(record.clockOut) : "--:--"}</td>
                    <td>
                      <div className={`status-badge ${StatusBadge.className}`}>
                        <Icon size={14} />
                        <span>{StatusBadge.label}</span>
                      </div>
                    </td>
                    <td>{record.workHours || 0}h</td>
                    <td>{record.overtimeHours || 0}h</td>
                    <td className="remarks">
                      {record.isLate && `Muộn ${record.lateMinutes}p`}
                      {record.remarks && ` - ${record.remarks}`}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="empty-state">
                  <History size={48} />
                  <p>Không có dữ liệu</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {history.length > 0 && (
        <div className="pagination">
          <button
            onClick={() => fetchHistory(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="pagination-btn"
          >
            <ChevronLeft size={18} />
            <span>Trước</span>
          </button>

          <span className="pagination-info">
            Trang {pagination.currentPage} / {pagination.totalPages} 
            {pagination.total > 0 && ` (${pagination.total} bản ghi)`}
          </span>

          <button
            onClick={() => fetchHistory(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
            className="pagination-btn"
          >
            <span>Sau</span>
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );

  // ============ RENDER CAMERA MODAL ============

  const renderCameraModal = () => (
    <div className="camera-modal-overlay" onClick={stopCamera}>
      <div className="camera-modal" onClick={(e) => e.stopPropagation()}>
        <div className="camera-header">
          <h3>
            <Camera size={20} />
            <span>{actionType === "in" ? "Check-in với quét mặt" : "Check-out với quét mặt"}</span>
          </h3>
          <button onClick={stopCamera} className="btn-close">
            ×
          </button>
        </div>

        <div className="camera-body">
          {!capturedPhoto ? (
            <div className="camera-preview">
              <video ref={videoRef} autoPlay playsInline />
              <canvas ref={canvasRef} style={{ display: "none" }} />
              <div className="face-guide-overlay">
                <div className="face-oval"></div>
                <p className="guide-text">Đặt khuôn mặt vào khung hình</p>
              </div>
            </div>
          ) : (
            <div className="photo-preview">
              <img src={capturedPhoto} alt="Captured" />
            </div>
          )}
        </div>

        <div className="camera-actions">
          {!capturedPhoto ? (
            <>
              <button onClick={stopCamera} className="btn-secondary">
                Hủy
              </button>
              <button onClick={capturePhoto} className="btn-primary">
                <Camera size={18} />
                <span>Chụp ảnh</span>
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setCapturedPhoto(null)} className="btn-secondary">
                Chụp lại
              </button>
              <button
                onClick={submitAttendance}
                className="btn-success"
                disabled={isProcessing}
              >
                {isFaceVerifying ? (
                  <>
                    <Clock className="animate-spin" size={18} />
                    <span>Đang xác thực...</span>
                  </>
                ) : isProcessing ? (
                  <>
                    <Clock className="animate-spin" size={18} />
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    <span>Xác nhận</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // ============ MAIN RENDER ============

  return (
    <div className="employee-attendance-container">
      {/* Header with Tabs */}
      <div className="attendance-header">
        <div className="header-tabs">
          <button
            className={`tab ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <Clock size={18} />
            <span>Chấm công</span>
          </button>
          <button
            className={`tab ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            <History size={18} />
            <span>Lịch sử</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="attendance-content">
        {activeTab === "dashboard" ? renderDashboard() : renderHistory()}
      </div>

      {/* Camera Modal */}
      {showCamera && renderCameraModal()}

      {/* Modal Đăng ký quét mặt */}
      {showEnrollment && (
        <div className="enrollment-modal-overlay">
          <FaceIdEnrollment
            onComplete={() => {
              setShowEnrollment(false);
              checkFaceIdStatus();
              toast.success("✅ Đăng ký quét mặt thành công! Bạn có thể chấm công ngay bây giờ.", {
                autoClose: 4000,
              });
            }}
            onCancel={() => {
              setShowEnrollment(false);
            }}
          />
        </div>
      )}

      {/* Modal Xác thực quét mặt (Check-in/out) - CHỤP 1 LẦN */}
      {showVerification && (
        <div className="enrollment-modal-overlay">
          <FaceIdQuickVerification
            actionType={actionType}
            onSuccess={handleVerificationSuccess}
            onCancel={handleVerificationCancel}
          />
        </div>
      )}
    </div>
  );
};

export default EmployeeAttendance;
