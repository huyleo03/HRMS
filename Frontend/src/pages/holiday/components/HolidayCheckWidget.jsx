import React, { useState } from "react";
import { checkHoliday } from "../../../service/HolidayService";
import "../../holiday/css/HolidayCheckWidget.css";

/**
 * HolidayCheckWidget - Quick tool to check if a date is a holiday
 * Available for all roles (Admin, Manager, Employee)
 * 
 * Use cases:
 * - Check if a specific date is a holiday
 * - Useful for planning requests, attendance, etc.
 */
function HolidayCheckWidget({ compact = false, defaultCollapsed = true }) {
  const [selectedDate, setSelectedDate] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleCheck = async () => {
    if (!selectedDate) {
      setError("Vui lòng chọn ngày để kiểm tra");
      return;
    }

    setIsChecking(true);
    setError(null);
    setResult(null);

    try {
      const response = await checkHoliday(selectedDate);
      setResult(response);
    } catch (err) {
      console.error("Check holiday error:", err);
      setError(err.message || "Lỗi khi kiểm tra ngày lễ");
    } finally {
      setIsChecking(false);
    }
  };

  const handleReset = () => {
    setSelectedDate("");
    setResult(null);
    setError(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  if (compact) {
    // Compact mode: Inline form with collapsible
    return (
      <div className="holiday-check-widget holiday-check-widget--compact">
        <div className="widget-header-compact" onClick={toggleCollapse}>
          <span className="header-title">🔍 Kiểm tra ngày lễ</span>
          <button className="collapse-toggle" type="button">
            {isCollapsed ? "�" : "�"}
          </button>
        </div>
        
        {!isCollapsed && (
          <>
            <div className="check-form">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="date-input"
                max="2100-12-31"
              />
              <button 
                className="btn-check"
                onClick={handleCheck}
                disabled={isChecking || !selectedDate}
              >
                {isChecking ? "⏳" : "🔍"} Check
              </button>
            </div>

            {/* Result */}
            {result && (
              <div className={`check-result check-result--${result.isHoliday ? 'holiday' : 'normal'}`}>
                {result.isHoliday ? (
                  <>
                    <div className="result-icon">🎉</div>
                    <div className="result-content">
                      <strong>{result.holiday.name}</strong>
                      <span className="result-type">{result.holiday.type}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="result-icon">📅</div>
                    <span>Ngày làm việc bình thường</span>
                  </>
                )}
              </div>
            )}

            {error && <div className="check-error">{error}</div>}
          </>
        )}
      </div>
    );
  }

  // Full mode: Card layout with collapsible
  return (
    <div className="holiday-check-widget">
      <div 
        className="widget-header widget-header--clickable" 
        onClick={toggleCollapse}
      >
        <div className="header-content">
          <h3>🔍 Kiểm tra ngày lễ</h3>
          <p className="widget-description">
            Nhập ngày để kiểm tra xem có phải ngày nghỉ lễ không
          </p>
        </div>
        <button className="collapse-toggle" type="button">
          {isCollapsed ? "🔽" : "🔼"}
        </button>
      </div>

      {!isCollapsed && (
      <div className="widget-body">
        <div className="check-form-full">
          <div className="form-group">
            <label htmlFor="checkDate">Chọn ngày:</label>
            <div className="input-group">
              <input
                type="date"
                id="checkDate"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="date-input-full"
                max="2100-12-31"
              />
              <button 
                className="btn-today"
                onClick={() => setSelectedDate(getTodayDate())}
                title="Chọn hôm nay"
              >
                📅 Hôm nay
              </button>
            </div>
          </div>

          <div className="form-actions">
            <button 
              className="btn btn--primary"
              onClick={handleCheck}
              disabled={isChecking || !selectedDate}
            >
              {isChecking ? "⏳ Đang kiểm tra..." : "🔍 Kiểm tra"}
            </button>
            {(result || error) && (
              <button 
                className="btn btn--secondary"
                onClick={handleReset}
              >
                🔄 Làm mới
              </button>
            )}
          </div>
        </div>

        {/* Result Display */}
        {result && (
          <div className="result-display">
            {result.isHoliday ? (
              <div className="result-card result-card--holiday">
                <div className="result-header">
                  <span className="result-emoji">🎉</span>
                  <h4>Đây là ngày nghỉ lễ!</h4>
                </div>
                <div className="result-details">
                  <div className="detail-row">
                    <span className="detail-label">📅 Ngày:</span>
                    <span className="detail-value">{formatDate(selectedDate)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">🎊 Tên:</span>
                    <span className="detail-value">{result.holiday.name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">📋 Loại:</span>
                    <span className="detail-value">
                      <span className={`badge badge--${result.holiday.type.toLowerCase()}`}>
                        {result.holiday.type}
                      </span>
                    </span>
                  </div>
                  {result.holiday.isPaid && (
                    <div className="detail-row">
                      <span className="detail-label">💰 Trạng thái:</span>
                      <span className="detail-value">
                        <span className="badge badge--success">Có lương</span>
                      </span>
                    </div>
                  )}
                  {result.holiday.description && (
                    <div className="detail-row detail-row--full">
                      <span className="detail-label">📝 Mô tả:</span>
                      <span className="detail-value">{result.holiday.description}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="result-card result-card--normal">
                <div className="result-header">
                  <span className="result-emoji">📅</span>
                  <h4>Ngày làm việc bình thường</h4>
                </div>
                <div className="result-message">
                  <p>{formatDate(selectedDate)} không phải là ngày nghỉ lễ.</p>
                  <p className="hint">Nhân viên cần làm việc hoặc xin phép nếu nghỉ.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="error-display">
            <span className="error-icon">⚠️</span>
            <span className="error-message">{error}</span>
          </div>
        )}

        {/* Quick Examples */}
        {!result && !error && (
          <div className="widget-footer">
            <p className="footer-hint">💡 Tip: Chọn ngày và nhấn "Kiểm tra" để xem kết quả</p>
          </div>
        )}
      </div>
      )}
    </div>
  );
}

export default HolidayCheckWidget;
