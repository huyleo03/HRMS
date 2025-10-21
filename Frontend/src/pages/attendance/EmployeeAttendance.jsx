import React, { useState, useEffect, useCallback, useRef } from "react";
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
} from "lucide-react";
import {
  pingIntranet,
  clockIn,
  clockOut,
  getTodayStatus,
  getMyHistory,
} from "../../service/AttendanceService";
import "./EmployeeAttendance.css";

const ITEMS_PER_PAGE = 10;

const EmployeeAttendance = () => {
  // State Management
  const [activeTab, setActiveTab] = useState("dashboard"); // 'dashboard' | 'history'
  const [todayStatus, setTodayStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [isIntranet, setIsIntranet] = useState(false);
  const [isCheckingNetwork, setIsCheckingNetwork] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [actionType, setActionType] = useState(null); // 'in' | 'out'
  const [currentTime, setCurrentTime] = useState(new Date());
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
  }, []);

  // Fetch history when switching to history tab
  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory(1);
    }
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
      setPagination(response.pagination);
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

    setActionType(type);
    setShowCamera(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 1280, height: 720 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.error("Camera error:", error);
      toast.error("Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.");
      setShowCamera(false);
    }
  };

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
    if (!capturedPhoto) {
      toast.error("Vui lòng chụp ảnh trước khi gửi!");
      return;
    }

    setIsProcessing(true);

    try {
      const data = { photo: capturedPhoto };
      let response;

      if (actionType === "in") {
        response = await clockIn(data);
      } else {
        response = await clockOut(data);
      }

      if (response.success) {
        toast.success(response.message);
        await fetchTodayStatus();
        stopCamera();
      }
    } catch (error) {
      console.error("Attendance error:", error);
      toast.error(error?.response?.data?.message || "Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsProcessing(false);
    }
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
          disabled={!isIntranet || todayStatus?.clockIn || isProcessing}
        >
          <LogIn size={20} />
          <span>Check-in</span>
        </button>

        <button
          className="btn-clock-out"
          onClick={() => startCamera("out")}
          disabled={!isIntranet || !todayStatus?.clockIn || todayStatus?.clockOut || isProcessing}
        >
          <LogOut size={20} />
          <span>Check-out</span>
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
      {pagination.totalPages > 1 && (
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
            <span>{actionType === "in" ? "Check-in" : "Check-out"}</span>
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
                {isProcessing ? (
                  <>
                    <Clock className="animate-spin" size={18} />
                    <span>Đang xử lý...</span>
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
    </div>
  );
};

export default EmployeeAttendance;
