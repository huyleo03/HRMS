import React, { useState } from "react";
import "../css/HolidayCalendarGrid.css";
import DayEventsModal from "./DayEventsModal";

const HolidayCalendarGrid = ({ 
  currentDate, 
  holidays, 
  employeeLeaves = [],
  departments = [],
  selectedDepartment = "",
  onDepartmentChange,
  onDateClick, 
  onHolidayClick 
}) => {
  const [selectedDay, setSelectedDay] = useState(null);
  const MAX_VISIBLE_ITEMS = 2;
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Lấy ngày đầu tiên của tháng
  const firstDay = new Date(year, month, 1);
  
  // Tính ngày đầu tiên hiển thị (có thể là ngày của tháng trước)
  // getDay() returns 0-6 (Sunday-Saturday), we want Monday = 0
  const startDate = new Date(firstDay);
  const dayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, ...
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Monday = 0
  startDate.setDate(startDate.getDate() - daysToSubtract);
  
  // Tạo mảng 6 tuần (42 ngày)
  const weeks = [];
  const currentDatePointer = new Date(startDate);
  
  for (let week = 0; week < 6; week++) {
    const days = [];
    for (let day = 0; day < 7; day++) {
      const date = new Date(currentDatePointer);
      const isCurrentMonth = date.getMonth() === month;
      const isToday = 
        date.getDate() === new Date().getDate() &&
        date.getMonth() === new Date().getMonth() &&
        date.getFullYear() === new Date().getFullYear();
      
      // Tìm holidays trong ngày này (company holidays)
      const dayHolidays = holidays.filter(h => {
        const holidayDate = new Date(h.date);
        holidayDate.setHours(0, 0, 0, 0);
        const endDate = h.endDate ? new Date(h.endDate) : new Date(h.date);
        endDate.setHours(0, 0, 0, 0);
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        return checkDate >= holidayDate && checkDate <= endDate;
      });

      // Tìm employee leaves trong ngày này
      const dayLeaves = employeeLeaves.filter(leave => {
        const leaveStartDate = new Date(leave.startDate);
        leaveStartDate.setHours(0, 0, 0, 0);
        const leaveEndDate = new Date(leave.endDate || leave.startDate);
        leaveEndDate.setHours(0, 0, 0, 0);
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        return checkDate >= leaveStartDate && checkDate <= leaveEndDate;
      });

      // Gộp cả holidays và leaves
      const allEvents = [
        ...dayHolidays,
        ...dayLeaves.map(leave => ({
          ...leave,
          itemType: 'leave'
        }))
      ];
      
      days.push({
        date: new Date(date),
        dayNumber: date.getDate(),
        isCurrentMonth,
        isToday,
        holidays: allEvents, 
      });
      
      currentDatePointer.setDate(currentDatePointer.getDate() + 1);
    }
    weeks.push(days);
  }
  
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  
  return (
    <div className="holiday-calendar-grid">
      {/* Department Filter */}
      {departments && departments.length > 0 && onDepartmentChange && (
        <div className="calendar-department-filter">
          <label>🏢 Phòng ban:</label>
          <select 
            value={selectedDepartment} 
            onChange={(e) => onDepartmentChange(e.target.value)}
            className="department-filter-select"
          >
            <option value="">-- Lịch nghỉ chung --</option>
            {departments.map(dept => (
              <option key={dept._id} value={dept.department_name}>
                {dept.department_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Header - Weekday names */}
      <div className="calendar-weekdays">
        {weekDays.map(day => (
          <div key={day} className="weekday-header">{day}</div>
        ))}
      </div>
      
      {/* Calendar body */}
      <div className="calendar-body">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="calendar-week">
            {week.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className={`calendar-day ${!day.isCurrentMonth ? "other-month" : ""} ${day.isToday ? "today" : ""}`}
                onClick={() => day.isCurrentMonth && onDateClick && onDateClick(day.date)}
              >
                <div className="day-number">{day.dayNumber}</div>
                <div className="day-holidays">
                  {day.holidays.slice(0, MAX_VISIBLE_ITEMS).map(holiday => (
                    <div
                      key={holiday._id}
                      className={`holiday-item holiday--${holiday.itemType === 'leave' ? 'leave' : holiday.type?.toLowerCase()}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onHolidayClick && onHolidayClick(holiday);
                      }}
                      title={holiday.description || holiday.name || `${holiday.employeeName} - ${holiday.subject}`}
                    >
                      {holiday.itemType === 'leave' 
                        ? `${holiday.requestType === 'BusinessTrip' ? '✈️' : '👤'} ${holiday.employeeName}`
                        : `${getHolidayIcon(holiday.type)} ${holiday.name}`
                      }
                    </div>
                  ))}
                  {day.holidays.length > MAX_VISIBLE_ITEMS && (
                    <button
                      className="more-events-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDay(day);
                      }}
                    >
                      +{day.holidays.length - MAX_VISIBLE_ITEMS} thêm
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Modal hiển thị tất cả events của ngày */}
      {selectedDay && (
        <DayEventsModal
          day={selectedDay}
          onClose={() => setSelectedDay(null)}
          onEventClick={(event) => {
            setSelectedDay(null);
            onHolidayClick && onHolidayClick(event);
          }}
        />
      )}
    </div>
  );
};

// Helper function để lấy icon theo loại holiday
function getHolidayIcon(type) {
  const icons = {
    National: "🎆",
    Company: "🎉",
    Optional: "⭐",
    Regional: "🏖️",
  };
  return icons[type] || "📅";
}

export default HolidayCalendarGrid;
