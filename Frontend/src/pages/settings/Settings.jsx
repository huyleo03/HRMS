import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  getCompanyConfig,
  updateCompanyConfig,
  testIPAddress,
  resetToDefault,
  getCurrentIP,
} from "../../service/ConfigService";
import "./css/Settings.css";

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("company");
  const [config, setConfig] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Network test states
  const [testIP, setTestIP] = useState("");
  const [testResult, setTestResult] = useState(null);
  const [testingIP, setTestingIP] = useState(false);
  const [currentIP, setCurrentIP] = useState("");

  // Fetch config
  const fetchConfig = async () => {
    setLoading(true);
    try {
      console.log("🔄 Fetching config...");
      const response = await getCompanyConfig();
      console.log("✅ Config response:", response);
      console.log("📦 Config data:", response.data);
      setConfig(response.data);
      setHasChanges(false);
    } catch (error) {
      console.error("❌ Error fetching config:", error);
      console.error("Error details:", error.response?.data || error.message);
      toast.error("Không thể tải cấu hình");
    } finally {
      setLoading(false);
    }
  };

  // Fetch current IP
  const fetchCurrentIP = async () => {
    try {
      const response = await getCurrentIP();
      setCurrentIP(response.data.ip);
    } catch (error) {
      console.error("Error fetching current IP:", error);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchCurrentIP();
  }, []);

  // Calculate working hours between two times (excluding 1 hour lunch break)
  const calculateWorkingHours = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;
    
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startInMinutes = startHour * 60 + startMin;
    const endInMinutes = endHour * 60 + endMin;
    
    // Total hours - 1 hour lunch break
    const totalMinutes = endInMinutes - startInMinutes;
    const workingHours = (totalMinutes / 60) - 1; // Trừ 1 tiếng nghỉ trưa
    
    return workingHours;
  };

  // Handle input change
  const handleChange = (section, field, value) => {
    setConfig((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  // Handle save
  const handleSave = async () => {
    if (!hasChanges) {
      toast.info("Không có thay đổi nào để lưu");
      return;
    }

    // Validate work schedule before saving
    const workingHours = calculateWorkingHours(
      config.workSchedule.workStartTime,
      config.workSchedule.workEndTime
    );
    
    if (workingHours !== 8) {
      toast.error(
        `⚠️ Thời gian làm việc phải là 8 tiếng!\n` +
        `Hiện tại: ${workingHours.toFixed(1)} tiếng\n` +
        `Ví dụ hợp lệ: 08:00-17:00, 07:00-16:00, 07:30-16:30`
      );
      return;
    }

    setLoading(true);
    try {
      await updateCompanyConfig(config);
      toast.success("Cập nhật cấu hình thành công!");
      setHasChanges(false);
      fetchConfig();
    } catch (error) {
      console.error("Error saving config:", error);
      toast.error(error.response?.data?.message || "Không thể lưu cấu hình");
    } finally {
      setLoading(false);
    }
  };

  // Handle reset
  const handleReset = async () => {
    if (!window.confirm("Bạn có chắc muốn reset toàn bộ cấu hình về mặc định?")) {
      return;
    }

    setLoading(true);
    try {
      await resetToDefault();
      toast.success("Đã reset cấu hình về mặc định!");
      fetchConfig();
      setHasChanges(false);
    } catch (error) {
      console.error("Error resetting config:", error);
      toast.error("Không thể reset cấu hình");
    } finally {
      setLoading(false);
    }
  };

  // Handle test IP
  const handleTestIP = async () => {
    if (!testIP.trim()) {
      toast.error("Vui lòng nhập địa chỉ IP");
      return;
    }

    setTestingIP(true);
    setTestResult(null);
    try {
      const response = await testIPAddress(testIP);
      setTestResult(response.data);
      if (response.data.isAllowed) {
        toast.success(response.data.message);
      } else {
        toast.warning(response.data.message);
      }
    } catch (error) {
      console.error("Error testing IP:", error);
      toast.error(error.response?.data?.message || "Không thể test IP");
      setTestResult({ isValid: false, message: "IP không hợp lệ" });
    } finally {
      setTestingIP(false);
    }
  };

  // Add IP to list
  const handleAddIP = () => {
    if (!testIP.trim()) {
      toast.error("Vui lòng nhập địa chỉ IP");
      return;
    }

    if (config.network.allowedIPs.includes(testIP)) {
      toast.warning("IP này đã có trong danh sách");
      return;
    }

    setConfig((prev) => ({
      ...prev,
      network: {
        ...prev.network,
        allowedIPs: [...prev.network.allowedIPs, testIP],
      },
    }));
    setHasChanges(true);
    setTestIP("");
    toast.success("Đã thêm IP vào danh sách");
  };

  // Remove IP from list
  const handleRemoveIP = (ip) => {
    if (config.network.allowedIPs.length <= 1) {
      toast.error("Phải có ít nhất 1 IP trong danh sách");
      return;
    }

    setConfig((prev) => ({
      ...prev,
      network: {
        ...prev.network,
        allowedIPs: prev.network.allowedIPs.filter((item) => item !== ip),
      },
    }));
    setHasChanges(true);
    toast.success("Đã xóa IP khỏi danh sách");
  };

  if (loading && !config) {
    return (
      <div className="settings-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải cấu hình...</p>
        </div>
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="settings-header">
        <div className="header-left">
          <h1 className="page-title">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                stroke="#7152F3"
                strokeWidth="1.5"
                strokeMiterlimit="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12.88V11.12C2 10.08 2.85 9.22 3.9 9.22C5.71 9.22 6.45 7.94 5.54 6.37C5.02 5.47 5.33 4.3 6.24 3.78L7.97 2.79C8.76 2.32 9.78 2.6 10.25 3.39L10.36 3.58C11.26 5.15 12.74 5.15 13.65 3.58L13.76 3.39C14.23 2.6 15.25 2.32 16.04 2.79L17.77 3.78C18.68 4.3 18.99 5.47 18.47 6.37C17.56 7.94 18.3 9.22 20.11 9.22C21.15 9.22 22.01 10.07 22.01 11.12V12.88C22.01 13.92 21.16 14.78 20.11 14.78C18.3 14.78 17.56 16.06 18.47 17.63C18.99 18.54 18.68 19.7 17.77 20.22L16.04 21.21C15.25 21.68 14.23 21.4 13.76 20.61L13.65 20.42C12.75 18.85 11.27 18.85 10.36 20.42L10.25 20.61C9.78 21.4 8.76 21.68 7.97 21.21L6.24 20.22C5.33 19.7 5.02 18.53 5.54 17.63C6.45 16.06 5.71 14.78 3.9 14.78C2.85 14.78 2 13.92 2 12.88Z"
                stroke="#7152F3"
                strokeWidth="1.5"
                strokeMiterlimit="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            System Settings
          </h1>
          <p className="page-description">Quản lý cấu hình hệ thống chấm công</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handleReset} disabled={loading}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M14.89 5.08C14.58 5.03 14.27 5 13.95 5H10.05C9.73999 5 9.42999 5.03 9.11999 5.08C6.66999 5.43 5 7.39 5 10V14C5 17 7 19 10 19H14C17 19 19 17 19 14V10C19 7.39 17.33 5.43 14.89 5.08ZM13.25 15.53C13.25 15.81 13.16 16.07 12.98 16.27C12.87 16.39 12.73 16.48 12.59 16.55C12.44 16.62 12.28 16.65 12.11 16.65C11.77 16.65 11.46 16.51 11.23 16.27L8.46999 13.51C8.17999 13.22 8.17999 12.74 8.46999 12.45C8.75999 12.16 9.23999 12.16 9.52999 12.45L11.75 14.67V8.25C11.75 7.84 12.09 7.5 12.5 7.5C12.91 7.5 13.25 7.84 13.25 8.25V15.53Z"
                fill="currentColor"
              />
            </svg>
            Reset về mặc định
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={loading || !hasChanges}>
            {loading ? (
              <>
                <div className="btn-spinner"></div>
                Đang lưu...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7.75 12L10.58 14.83L16.25 9.17004"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Lưu thay đổi
              </>
            )}
          </button>
        </div>
      </div>

      {/* Change indicator */}
      {hasChanges && (
        <div className="change-indicator">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 9V14M12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12C21 16.97 16.97 21 12 21Z"
              stroke="#F59E0B"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path d="M11.995 17H12.004" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Bạn có thay đổi chưa lưu
        </div>
      )}

      {/* Tabs */}
      <div className="settings-tabs">
        <button
          className={`tab-button ${activeTab === "company" ? "active" : ""}`}
          onClick={() => setActiveTab("company")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Cấu hình công ty
        </button>
        <button
          className={`tab-button ${activeTab === "network" ? "active" : ""}`}
          onClick={() => setActiveTab("network")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM11 19.93C7.06 19.44 4 16.08 4 12C4 11.38 4.08 10.79 4.21 10.21L9 15V16C9 17.1 9.9 18 11 18V19.93ZM17.9 17.39C17.64 16.58 16.9 16 16 16H15V13C15 12.45 14.55 12 14 12H8V10H10C10.55 10 11 9.55 11 9V7H13C14.1 7 15 6.1 15 5V4.59C17.93 5.78 20 8.65 20 12C20 14.08 19.2 15.97 17.9 17.39Z"
              fill="currentColor"
            />
          </svg>
          Mạng & Bảo mật
        </button>
      </div>

      {/* Tab Content */}
      <div className="settings-content">
        {activeTab === "company" && (
          <div className="tab-panel">
            {/* Work Schedule Section */}
            <div className="settings-section">
              <div className="section-header">
                <div className="section-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2C17.52 2 22 6.48 22 12Z"
                      stroke="#7152F3"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M15.71 15.18L12.61 13.33C12.07 13.01 11.63 12.24 11.63 11.61V7.51001"
                      stroke="#7152F3"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="section-title">Lịch làm việc</h2>
                  <p className="section-description">Cấu hình giờ làm việc và thời gian nghỉ</p>
                </div>
              </div>

              <div className="settings-grid">
                <div className="setting-item">
                  <label className="setting-label">Giờ vào làm</label>
                  <input
                    type="time"
                    className="setting-input"
                    value={config.workSchedule.workStartTime}
                    onChange={(e) =>
                      handleChange("workSchedule", "workStartTime", e.target.value)
                    }
                  />
                </div>

                <div className="setting-item">
                  <label className="setting-label">Giờ tan làm</label>
                  <input
                    type="time"
                    className="setting-input"
                    value={config.workSchedule.workEndTime}
                    onChange={(e) =>
                      handleChange("workSchedule", "workEndTime", e.target.value)
                    }
                  />
                </div>

                <div className="setting-item">
                  <label className="setting-label">Cho phép muộn (phút)</label>
                  <input
                    type="number"
                    className="setting-input"
                    min="0"
                    max="60"
                    value={config.workSchedule.gracePeriodMinutes}
                    onChange={(e) =>
                      handleChange("workSchedule", "gracePeriodMinutes", parseInt(e.target.value))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Overtime Section */}
            <div className="settings-section">
              <div className="section-header">
                <div className="section-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M9.5 13.75C9.5 14.72 10.25 15.5 11.17 15.5H13.05C13.85 15.5 14.5 14.82 14.5 13.97C14.5 13.06 14.1 12.73 13.51 12.52L10.5 11.47C9.91 11.26 9.51001 10.94 9.51001 10.02C9.51001 9.17999 10.16 8.48999 10.96 8.48999H12.84C13.76 8.48999 14.51 9.26999 14.51 10.24"
                      stroke="#F59E0B"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M12 7.5V16.5"
                      stroke="#F59E0B"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2C17.52 2 22 6.48 22 12Z"
                      stroke="#F59E0B"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="section-title">Làm thêm giờ (Overtime)</h2>
                  <p className="section-description">Cấu hình chính sách làm thêm giờ</p>
                </div>
              </div>

              <div className="settings-grid">
                <div className="setting-item">
                  <label className="setting-label">Tối thiểu phút OT tính</label>
                  <input
                    type="number"
                    className="setting-input"
                    min="15"
                    max="120"
                    step="15"
                    value={config.overtime.otMinimumMinutes}
                    onChange={(e) =>
                      handleChange("overtime", "otMinimumMinutes", parseInt(e.target.value))
                    }
                  />
                </div>

                <div className="setting-item">
                  <label className="setting-label">Hệ số OT ngày thường</label>
                  <input
                    type="number"
                    className="setting-input"
                    min="1"
                    max="5"
                    step="0.1"
                    value={config.overtime.otRateWeekday}
                    onChange={(e) =>
                      handleChange("overtime", "otRateWeekday", parseFloat(e.target.value))
                    }
                  />
                </div>

                <div className="setting-item">
                  <label className="setting-label">Hệ số OT ngày lễ</label>
                  <input
                    type="number"
                    className="setting-input"
                    min="1"
                    max="5"
                    step="0.1"
                    value={config.overtime.otRateHoliday}
                    onChange={(e) =>
                      handleChange("overtime", "otRateHoliday", parseFloat(e.target.value))
                    }
                  />
                </div>

                <div className="setting-item full-width">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      className="toggle-input"
                      checked={config.overtime.requireApproval}
                      onChange={(e) =>
                        handleChange("overtime", "requireApproval", e.target.checked)
                      }
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-text">Yêu cầu phê duyệt OT</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Auto Actions Section */}
            <div className="settings-section">
              <div className="section-header">
                <div className="section-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 8V12L15 15M22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2C17.52 2 22 6.48 22 12Z"
                      stroke="#3B82F6"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="section-title">Hành động tự động</h2>
                  <p className="section-description">Cấu hình các hành động tự động của hệ thống</p>
                </div>
              </div>

              <div className="settings-grid">
                <div className="setting-item full-width">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      className="toggle-input"
                      checked={config.autoActions.enableAutoMarkAbsent}
                      onChange={(e) =>
                        handleChange("autoActions", "enableAutoMarkAbsent", e.target.checked)
                      }
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-text">Tự động đánh dấu vắng mặt</span>
                  </label>
                </div>

                <div className="setting-item">
                  <label className="setting-label">Thời gian tự động đánh vắng</label>
                  <input
                    type="time"
                    className="setting-input"
                    value={config.autoActions.autoMarkAbsentTime}
                    onChange={(e) =>
                      handleChange("autoActions", "autoMarkAbsentTime", e.target.value)
                    }
                    disabled={!config.autoActions.enableAutoMarkAbsent}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "network" && (
          <div className="tab-panel">
            {/* IP Management Section */}
            <div className="settings-section">
              <div className="section-header">
                <div className="section-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM11 19.93C7.06 19.44 4 16.08 4 12C4 11.38 4.08 10.79 4.21 10.21L9 15V16C9 17.1 9.9 18 11 18V19.93ZM17.9 17.39C17.64 16.58 16.9 16 16 16H15V13C15 12.45 14.55 12 14 12H8V10H10C10.55 10 11 9.55 11 9V7H13C14.1 7 15 6.1 15 5V4.59C17.93 5.78 20 8.65 20 12C20 14.08 19.2 15.97 17.9 17.39Z"
                      fill="#7152F3"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="section-title">Quản lý địa chỉ IP được phép chấm công</h2>
                  <p className="section-description">
                    Chỉ những IP trong danh sách này mới được phép chấm công. 
                    Thêm IP của các văn phòng/chi nhánh để nhân viên ở đó có thể chấm công.
                    <br/><small style={{color: "#6B7280"}}>
                      ℹ️ Khi nhân viên chấm công, hệ thống sẽ tự động lấy IP của họ và kiểm tra có trong danh sách này không.
                    </small>
                  </p>
                </div>
              </div>

              {/* Test IP */}
              <div className="ip-test-section">
                <label className="setting-label" style={{marginBottom: "10px", display: "block"}}>
                  Kiểm tra hoặc thêm địa chỉ IP mới
                </label>
                <div className="input-with-button">
                  <input
                    type="text"
                    className="ip-input"
                    placeholder="Nhập IP cần kiểm tra (VD: 192.168.1.100 hoặc 192.168.1.0/24)"
                    value={testIP}
                    onChange={(e) => setTestIP(e.target.value)}
                  />
                  <button
                    className="btn-test"
                    onClick={handleTestIP}
                    disabled={testingIP}
                    title="Kiểm tra xem IP này đã có trong danh sách chưa"
                  >
                    {testingIP ? "Đang test..." : "Kiểm tra"}
                  </button>
                  <button 
                    className="btn-add" 
                    onClick={handleAddIP} 
                    disabled={testingIP}
                    title="Thêm IP này vào danh sách được phép"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 5V19M5 12H19"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Thêm IP
                  </button>
                </div>

                {testResult && (
                  <div className={`test-result ${testResult.isAllowed ? "success" : "warning"}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      {testResult.isAllowed ? (
                        <path
                          d="M12 2C6.49 2 2 6.49 2 12C2 17.51 6.49 22 12 22C17.51 22 22 17.51 22 12C22 6.49 17.51 2 12 2ZM16.78 9.7L11.11 15.37C10.97 15.51 10.78 15.59 10.58 15.59C10.38 15.59 10.19 15.51 10.05 15.37L7.22 12.54C6.93 12.25 6.93 11.77 7.22 11.48C7.51 11.19 7.99 11.19 8.28 11.48L10.58 13.78L15.72 8.64C16.01 8.35 16.49 8.35 16.78 8.64C17.07 8.93 17.07 9.4 16.78 9.7Z"
                          fill="currentColor"
                        />
                      ) : (
                        <path
                          d="M12 9V14M12 21.41H5.94C2.47 21.41 1.02 18.93 2.7 15.9L5.82 10.28L8.76 5C10.54 1.79 13.46 1.79 15.24 5L18.18 10.29L21.3 15.91C22.98 18.94 21.52 21.42 18.06 21.42H12V21.41Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}
                    </svg>
                    {testResult.message}
                  </div>
                )}
              </div>

              {/* IP List */}
              <div style={{marginTop: "30px"}}>
                <label className="setting-label" style={{marginBottom: "15px", display: "block"}}>
                  Danh sách IP được phép chấm công ({config.network.allowedIPs.length} địa chỉ)
                </label>
              </div>
              <div className="ip-list">
                {config.network.allowedIPs.map((ip, index) => (
                  <div key={index} className="ip-item">
                    <div className="ip-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.78 9.7L11.11 15.37C10.97 15.51 10.78 15.59 10.58 15.59C10.38 15.59 10.19 15.51 10.05 15.37L7.22 12.54C6.93 12.25 6.93 11.77 7.22 11.48C7.51 11.19 7.99 11.19 8.28 11.48L10.58 13.78L15.72 8.64C16.01 8.35 16.49 8.35 16.78 8.64C17.07 8.93 17.07 9.4 16.78 9.7Z"
                          fill="#10B981"
                        />
                      </svg>
                    </div>
                    <span className="ip-address">{ip}</span>
                    {ip === currentIP && <span className="ip-badge">IP hiện tại</span>}
                    <button
                      className="ip-remove-btn"
                      onClick={() => handleRemoveIP(ip)}
                      title="Xóa IP"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M21 5.98C17.67 5.65 14.32 5.48 10.98 5.48C9 5.48 7.02 5.58 5.04 5.78L3 5.98M8.5 4.97L8.72 3.66C8.88 2.71 9 2 10.69 2H13.31C15 2 15.13 2.75 15.28 3.67L15.5 4.97M18.85 9.14L18.2 19.21C18.09 20.78 18 22 15.21 22H8.79C6 22 5.91 20.78 5.8 19.21L5.15 9.14M10.33 16.5H13.66M9.5 12.5H14.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      {config.lastUpdatedByName && (
        <div className="settings-footer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 8V13M21 12C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12Z"
              stroke="#A2A1A8"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M11.995 16H12.004" stroke="#A2A1A8" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Cập nhật lần cuối bởi <strong>{config.lastUpdatedByName}</strong> vào{" "}
          {new Date(config.updatedAt).toLocaleString("vi-VN")}
        </div>
      )}
    </div>
  );
};

export default Settings;
