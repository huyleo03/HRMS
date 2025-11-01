import React, { useState } from "react";
import { toast } from "react-toastify";
import { generateRecurringHolidays } from "../../../service/HolidayService";
import "../css/GenerateRecurringModal.css";

/**
 * GenerateRecurringModal - Tự động copy recurring holidays từ năm cũ sang năm mới
 * Admin only feature
 * 
 * Use case: Copy Tết, 30/4, 1/5, 2/9... từ 2025 → 2026 tự động
 */
function GenerateRecurringModal({ isOpen, onClose, onSuccess }) {
  const currentYear = new Date().getFullYear();
  
  const [sourceYear, setSourceYear] = useState(currentYear);
  const [targetYear, setTargetYear] = useState(currentYear + 1);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null); // Kết quả sau khi generate
  const [showResult, setShowResult] = useState(false);

  const handleGenerate = async () => {
    // Validation
    if (sourceYear >= targetYear) {
      toast.error("Năm nguồn phải nhỏ hơn năm đích!");
      return;
    }

    if (sourceYear < 2020 || targetYear > 2100) {
      toast.error("Vui lòng chọn năm trong khoảng 2020-2100!");
      return;
    }

    setIsLoading(true);
    try {
      const response = await generateRecurringHolidays(sourceYear, targetYear);
      
      setResult(response);
      setShowResult(true);
      
      toast.success(response.message || "Generate thành công!");
      
      // Auto close after 3s
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 3000);
    } catch (error) {
      console.error("Generate error:", error);
      toast.error(error.message || "Lỗi khi generate recurring holidays");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSourceYear(currentYear);
    setTargetYear(currentYear + 1);
    setResult(null);
    setShowResult(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content generate-recurring-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🔄 Generate Recurring Holidays</h2>
          <button className="modal-close" onClick={handleClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {!showResult ? (
            <>
              {/* Instructions */}
              <div className="instructions">
                <p className="description">
                  🎯 Tự động copy các ngày nghỉ <strong>định kỳ hàng năm</strong> từ năm cũ sang năm mới.
                </p>
                <div className="info-box">
                  <h4>💡 Chức năng này sẽ:</h4>
                  <ul>
                    <li>✅ Tìm tất cả holidays có <code>isRecurring = true</code> ở năm nguồn</li>
                    <li>✅ Tự động tạo bản copy cho năm đích</li>
                    <li>✅ Giữ nguyên: tên, type, màu sắc, mô tả</li>
                    <li>✅ Cập nhật: ngày tháng theo năm mới</li>
                    <li>⚠️ Bỏ qua: Holidays đã tồn tại ở năm đích</li>
                  </ul>
                </div>

                <div className="example-box">
                  <h4>📝 Ví dụ:</h4>
                  <div className="example-item">
                    <span className="source">📅 2025: Tết Nguyên Đán (29/01/2025)</span>
                    <span className="arrow">→</span>
                    <span className="target">📅 2026: Tết Nguyên Đán (17/02/2026)</span>
                  </div>
                  <div className="example-item">
                    <span className="source">📅 2025: Quốc Khánh (02/09/2025)</span>
                    <span className="arrow">→</span>
                    <span className="target">📅 2026: Quốc Khánh (02/09/2026)</span>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="generate-form">
                <div className="form-group">
                  <label htmlFor="sourceYear">
                    📂 Năm nguồn (copy từ):
                  </label>
                  <input
                    type="number"
                    id="sourceYear"
                    min="2020"
                    max="2100"
                    value={sourceYear}
                    onChange={(e) => setSourceYear(parseInt(e.target.value))}
                    className="form-input"
                  />
                  <span className="hint">Năm có sẵn recurring holidays</span>
                </div>

                <div className="arrow-icon">➡️</div>

                <div className="form-group">
                  <label htmlFor="targetYear">
                    🎯 Năm đích (copy đến):
                  </label>
                  <input
                    type="number"
                    id="targetYear"
                    min="2020"
                    max="2100"
                    value={targetYear}
                    onChange={(e) => setTargetYear(parseInt(e.target.value))}
                    className="form-input"
                  />
                  <span className="hint">Năm mới cần tạo holidays</span>
                </div>
              </div>

              {/* Actions */}
              <div className="modal-actions">
                <button 
                  className="btn btn--secondary" 
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  ❌ Hủy
                </button>
                <button 
                  className="btn btn--primary" 
                  onClick={handleGenerate}
                  disabled={isLoading}
                >
                  {isLoading ? "⏳ Đang xử lý..." : "🔄 Generate"}
                </button>
              </div>
            </>
          ) : (
            // Result Screen
            <div className="result-section">
              <div className="result-success">
                <div className="result-icon">✅</div>
                <h3>Generate Thành Công!</h3>
                <p className="result-message">{result?.message}</p>
                
                {result?.data && result.data.length > 0 && (
                  <div className="result-details">
                    <h4>📋 Danh sách holidays đã tạo:</h4>
                    <div className="result-list">
                      {result.data.map((holiday, index) => (
                        <div key={index} className="result-item">
                          <span className="holiday-icon">🎉</span>
                          <span className="holiday-name">{holiday.name}</span>
                          <span className="holiday-date">
                            {new Date(holiday.date).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="result-note">
                  ℹ️ Modal sẽ tự động đóng sau 3 giây...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GenerateRecurringModal;
