import React from "react";
import ModalWrapper from "./shared/ModalWrapper";
import { formatDate, getTypeLabel, getApplicabilityLabel, calculateDuration } from "../utils/holidayUtils";
import "../css/HolidayModal.css";

/**
 * HolidayViewModal - Read-only modal to view holiday details
 * Used by Employee and Manager (no edit/delete permissions)
 * Refactored to use shared components and utilities
 */
const HolidayViewModal = ({ holiday, onClose }) => {
  if (!holiday) return null;

  // Check if this is a dateEvents object (from calendar click) or direct holiday/leave object
  const isDateEvents = holiday.date && holiday.events;
  const actualEvent = isDateEvents ? holiday.events[0] : holiday;

  // Check if this is an employee leave (has employeeName) or company holiday
  const isEmployeeLeave = actualEvent && actualEvent.employeeName;

  if (!actualEvent) return null;

  // Calculate dates based on data type
  const startDate = actualEvent.startDate || actualEvent.date;
  const endDate = actualEvent.endDate;
  const isMultiDay = endDate && endDate !== startDate;
  const duration = calculateDuration(startDate, endDate);

  const footer = (
    <button className="btn btn--secondary" onClick={onClose}>
      Đóng
    </button>
  );

  return (
    <ModalWrapper 
      title={isEmployeeLeave ? "🏖️ Chi tiết nghỉ phép" : "📅 Chi tiết ngày lễ"}
      onClose={onClose}
      footer={footer}
    >
      {/* Employee Leave Info OR Holiday Name */}
          {isEmployeeLeave ? (
            <div className="info-group">
              <label>👤 Nhân viên</label>
              <h3>{actualEvent.employeeName}</h3>
              {actualEvent.departmentName && (
                <p
                  style={{ fontSize: "0.9em", color: "#666", marginTop: "4px" }}
                >
                  🏢 {actualEvent.departmentName}
                </p>
              )}
            </div>
          ) : (
            <div className="info-group">
              <div
                className="color-indicator"
                style={{ backgroundColor: actualEvent.color }}
              ></div>
              <div>
                <label>Tên ngày lễ</label>
                <h3>{actualEvent.name}</h3>
              </div>
            </div>
          )}

          {/* Date Information */}
          <div className="info-row">
            <div className="info-group">
              <label>📅 Ngày bắt đầu</label>
              <p>{formatDate(startDate)}</p>
            </div>

            {isMultiDay && (
              <div className="info-group">
                <label>📅 Ngày kết thúc</label>
                <p>{formatDate(endDate)}</p>
              </div>
            )}
          </div>

          {isMultiDay && (
            <div className="info-badge info-badge--info">
              ⏱️ Kéo dài {duration} ngày
            </div>
          )}

          {/* Type - different layout for employee leave vs holiday */}
          {isEmployeeLeave ? (
            // Employee leave: only show type (already approved)
            <div className="info-group">
              <label>📋 Loại nghỉ</label>
              <div
                className="info-badge info-badge--success"
                style={{ marginBottom: "8px" }}
              >
                {actualEvent.requestType === 'BusinessTrip' ? '✈️ Công tác' : '🏖️ Nghỉ phép'} - ✅ Đã duyệt
              </div>
            </div>
          ) : (
            // Holiday: show type and status in row
            <div className="info-row">
              <div className="info-group">
                <label>Loại ngày lễ</label>
                <p>{getTypeLabel(actualEvent.type)}</p>
              </div>

              <div className="info-group">
                <label>Trạng thái</label>
                {actualEvent.status ? (
                  <div
                    className={`badge badge--${actualEvent.status.toLowerCase()}`}
                  >
                    {actualEvent.status === "Active"
                      ? "✅ Đang áp dụng"
                      : actualEvent.status === "Inactive"
                      ? "❌ Không áp dụng"
                      : "📝 Nháp"}
                  </div>
                ) : (
                  <p>-</p>
                )}
              </div>
            </div>
          )}

          {/* Reason for employee leave */}
          {isEmployeeLeave && actualEvent.reason && (
            <div className="info-group">
              <label>💬 Lý do nghỉ</label>
              <p className="description-text">{actualEvent.reason}</p>
            </div>
          )}

          {/* Paid Status - only for holidays */}
          {!isEmployeeLeave && actualEvent.isPaid !== undefined && (
            <div className="info-group">
              <label>Chế độ nghỉ</label>
              <div
                className={`info-badge ${
                  actualEvent.isPaid
                    ? "info-badge--success"
                    : "info-badge--warning"
                }`}
              >
                {actualEvent.isPaid
                  ? "💰 Nghỉ có lương"
                  : "⚠️ Nghỉ không lương"}
              </div>
            </div>
          )}

          {/* Recurring - only for holidays */}
          {!isEmployeeLeave && actualEvent.isRecurring && (
            <div className="info-group">
              <label>Lặp lại hàng năm</label>
              <div className="info-badge info-badge--info">
                🔄 Ngày lễ lặp lại mỗi năm
              </div>
            </div>
          )}

          {/* Applicability - only for holidays */}
          {!isEmployeeLeave && actualEvent.appliesTo && (
            <div className="info-group">
              <label>Áp dụng cho</label>
              <p>{getApplicabilityLabel(actualEvent.appliesTo)}</p>
            </div>
          )}

          {/* Departments (if applicable) - only for holidays */}
          {!isEmployeeLeave &&
            actualEvent.appliesTo === "Specific Departments" &&
            actualEvent.departments &&
            actualEvent.departments.length > 0 && (
              <div className="info-group">
                <label>Phòng ban</label>
                <div className="tags-list">
                  {actualEvent.departments.map((dept, index) => (
                    <span key={dept._id || index} className="tag tag--department">
                      🏢 {dept.department_name || dept.name || dept}
                    </span>
                  ))}
                </div>
              </div>
            )}

          {/* Description - only for holidays */}
          {!isEmployeeLeave && actualEvent.description && (
            <div className="info-group">
              <label>Mô tả</label>
              <p className="description-text">{actualEvent.description}</p>
            </div>
          )}

          {/* Notes - only for holidays */}
          {!isEmployeeLeave && actualEvent.notes && (
            <div className="info-group">
              <label>Ghi chú</label>
              <div className="notes-box">{actualEvent.notes}</div>
            </div>
          )}

          {/* Subject - for employee leaves */}
          {isEmployeeLeave && actualEvent.subject && (
            <div className="info-group">
              <label>Tiêu đề</label>
              <p className="description-text">{actualEvent.subject}</p>
            </div>
          )}

          {/* Metadata */}
          {actualEvent.createdAt && (
            <div className="info-meta">
              <small>
                {actualEvent.year && `📅 Năm: ${actualEvent.year} | `}
                🕐 Tạo lúc:{" "}
                {new Date(actualEvent.createdAt).toLocaleString("vi-VN")}
              </small>
            </div>
          )}
    </ModalWrapper>
  );
};

export default HolidayViewModal;
