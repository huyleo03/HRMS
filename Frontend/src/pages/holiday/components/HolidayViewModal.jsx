import React from "react";
import "../css/HolidayModal.css";

/**
 * HolidayViewModal - Read-only modal to view holiday details
 * Used by Employee and Manager (no edit/delete permissions)
 */
const HolidayViewModal = ({ holiday, onClose }) => {
  if (!holiday) return null;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  };

  const getTypeLabel = (type) => {
    const types = {
      "Public Holiday": "🎊 Ngày lễ quốc gia",
      "National Holiday": "🇻🇳 Ngày lễ",
      "Company Holiday": "🏢 Ngày nghỉ công ty",
      "Optional Holiday": "⭐ Ngày lễ tùy chọn",
      "Regional Holiday": "🌏 Ngày lễ địa phương",
    };
    return types[type] || type;
  };

  const getApplicabilityLabel = (appliesTo) => {
    const labels = {
      "All Employees": "👥 Tất cả nhân viên",
      "Specific Departments": "🏢 Phòng ban cụ thể",
      "Specific Employees": "👤 Nhân viên cụ thể",
    };
    return labels[appliesTo] || appliesTo;
  };

  const isMultiDay = holiday.endDate && holiday.endDate !== holiday.date;
  const duration = isMultiDay
    ? Math.ceil(
        (new Date(holiday.endDate) - new Date(holiday.date)) / (1000 * 60 * 60 * 24)
      ) + 1
    : 1;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📅 Chi tiết ngày lễ</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Holiday Name with Color Indicator */}
          <div className="info-group">
            <div
              className="color-indicator"
              style={{ backgroundColor: holiday.color }}
            ></div>
            <div>
              <label>Tên ngày lễ</label>
              <h3>{holiday.name}</h3>
            </div>
          </div>

          {/* Date Information */}
          <div className="info-row">
            <div className="info-group">
              <label>📅 Ngày bắt đầu</label>
              <p>{formatDate(holiday.date)}</p>
            </div>

            {isMultiDay && (
              <div className="info-group">
                <label>📅 Ngày kết thúc</label>
                <p>{formatDate(holiday.endDate)}</p>
              </div>
            )}
          </div>

          {isMultiDay && (
            <div className="info-badge info-badge--info">
              ⏱️ Kéo dài {duration} ngày
            </div>
          )}

          {/* Type and Status */}
          <div className="info-row">
            <div className="info-group">
              <label>Loại ngày lễ</label>
              <p>{getTypeLabel(holiday.type)}</p>
            </div>

            <div className="info-group">
              <label>Trạng thái</label>
              <div className={`badge badge--${holiday.status.toLowerCase()}`}>
                {holiday.status === "Active"
                  ? "✅ Đang áp dụng"
                  : holiday.status === "Inactive"
                  ? "❌ Không áp dụng"
                  : "📝 Nháp"}
              </div>
            </div>
          </div>

          {/* Paid Status */}
          <div className="info-group">
            <label>Chế độ nghỉ</label>
            <div
              className={`info-badge ${
                holiday.isPaid ? "info-badge--success" : "info-badge--warning"
              }`}
            >
              {holiday.isPaid ? "💰 Nghỉ có lương" : "⚠️ Nghỉ không lương"}
            </div>
          </div>

          {/* Recurring */}
          {holiday.isRecurring && (
            <div className="info-group">
              <label>Lặp lại hàng năm</label>
              <div className="info-badge info-badge--info">
                🔄 Ngày lễ lặp lại mỗi năm
              </div>
            </div>
          )}

          {/* Applicability */}
          <div className="info-group">
            <label>Áp dụng cho</label>
            <p>{getApplicabilityLabel(holiday.appliesTo)}</p>
          </div>

          {/* Departments (if applicable) */}
          {holiday.appliesTo === "Specific Departments" &&
            holiday.departments &&
            holiday.departments.length > 0 && (
              <div className="info-group">
                <label>Phòng ban</label>
                <div className="tags-list">
                  {holiday.departments.map((dept, index) => (
                    <span key={index} className="tag tag--department">
                      🏢 {dept.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

          {/* Description */}
          {holiday.description && (
            <div className="info-group">
              <label>Mô tả</label>
              <p className="description-text">{holiday.description}</p>
            </div>
          )}

          {/* Notes */}
          {holiday.notes && (
            <div className="info-group">
              <label>Ghi chú</label>
              <div className="notes-box">{holiday.notes}</div>
            </div>
          )}

          {/* Metadata */}
          <div className="info-meta">
            <small>
              📅 Năm: {holiday.year} | 🕐 Tạo lúc:{" "}
              {new Date(holiday.createdAt).toLocaleString("vi-VN")}
            </small>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn--secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default HolidayViewModal;
