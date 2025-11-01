import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Dropdown } from "antd";
import { MoreOutlined, FileTextOutlined, SyncOutlined } from "@ant-design/icons";
import { getCalendarHolidays, createHoliday, updateHoliday, deleteHoliday } from "../../../service/HolidayService";
import HolidayCalendarGrid from "../components/HolidayCalendarGrid";
import QuickAddModal from "../components/QuickAddModal";
import HolidayDetailModal from "../components/HolidayDetailModal";
import BulkImportModal from "../components/BulkImportModal";
import GenerateRecurringModal from "../components/GenerateRecurringModal";
import HolidayCheckWidget from "../components/HolidayCheckWidget";
import "../css/AdminHolidayCalendar.css";

const AdminHolidayPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [holidays, setHolidays] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null); // For quick add
  const [selectedHoliday, setSelectedHoliday] = useState(null); // For edit
  const [showBulkImport, setShowBulkImport] = useState(false); // For bulk import
  const [showGenerateRecurring, setShowGenerateRecurring] = useState(false); // For generate recurring
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  
  useEffect(() => {
    fetchHolidays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);
  
  const fetchHolidays = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCalendarHolidays({ year, month });
      setHolidays(data);
    } catch (error) {
      console.error("Error fetching holidays:", error);
      setError("Không thể tải danh sách ngày lễ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };
  
  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };
  
  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };
  
  const handleToday = () => {
    setCurrentDate(new Date());
  };
  
  const handleDateClick = (date) => {
    // Click vào ô trống → mở quick add modal
    setSelectedDate(date);
  };
  
  const handleHolidayClick = (holiday) => {
    // Click vào holiday → mở detail modal
    setSelectedHoliday(holiday);
  };
  
  const handleCreateHoliday = async (data) => {
    try {
      await createHoliday(data);
      await fetchHolidays();
      setSelectedDate(null);
      toast.success("Tạo ngày lễ thành công!");
    } catch (error) {
      console.error("Create error:", error);
      toast.error("Lỗi: " + (error.message || "Không thể tạo ngày lễ"));
    }
  };
  
  const handleUpdateHoliday = async (id, data) => {
    try {
      await updateHoliday(id, data);
      await fetchHolidays();
      setSelectedHoliday(null);
      toast.success("Cập nhật ngày lễ thành công!");
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Lỗi: " + (error.message || "Không thể cập nhật ngày lễ"));
    }
  };
  
  const handleDeleteHoliday = async (id) => {
    try {
      await deleteHoliday(id);
      await fetchHolidays();
      setSelectedHoliday(null);
      toast.success("Xóa ngày lễ thành công!");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Lỗi: " + (error.message || "Không thể xóa ngày lễ"));
    }
  };
  
  return (
    <div className="holiday-calendar-page">
      {/* Holiday Check Widget */}
      <HolidayCheckWidget defaultCollapsed={true} />
      
      {/* Header with navigation */}
      <div className="calendar-header">
        <h1>🎄 Holiday Calendar</h1>
        <div className="calendar-controls">
          <button className="btn btn--secondary" onClick={handlePrevMonth}>
            ◀
          </button>
          <h2 className="current-month">
            {currentDate.toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}
          </h2>
          <button className="btn btn--secondary" onClick={handleNextMonth}>
            ▶
          </button>
        </div>
        <div className="header-actions">
          <button className="btn btn--secondary" onClick={handleToday}>
            Today
          </button>
          
          {/* Secondary Actions Dropdown */}
          <Dropdown
            menu={{
              items: [
                {
                  key: 'bulk-import',
                  icon: <FileTextOutlined />,
                  label: 'Bulk Import',
                  onClick: () => setShowBulkImport(true)
                },
                {
                  key: 'generate-recurring',
                  icon: <SyncOutlined />,
                  label: 'Generate Recurring',
                  onClick: () => setShowGenerateRecurring(true)
                }
              ]
            }}
            trigger={['click']}
            placement="bottomRight"
          >
            <button 
              className="btn btn--secondary"
              title="More actions"
            >
              <MoreOutlined style={{ fontSize: '18px' }} />
            </button>
          </Dropdown>
          
          <button 
            className="btn btn--primary"
            onClick={() => setSelectedDate(new Date())}
          >
            ➕ New Holiday
          </button>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}
      
      {/* Calendar Grid Component */}
      {loading ? (
        <div className="calendar-loading">⏳ Loading...</div>
      ) : (
        <HolidayCalendarGrid
          currentDate={currentDate}
          holidays={holidays}
          onDateClick={handleDateClick}
          onHolidayClick={handleHolidayClick}
        />
      )}
      
      {/* Quick Add Modal (khi click vào ô trống) */}
      {selectedDate && (
        <QuickAddModal
          date={selectedDate}
          onClose={() => setSelectedDate(null)}
          onSubmit={handleCreateHoliday}
        />
      )}
      
      {/* Holiday Detail Modal (khi click vào holiday - View/Edit/Delete) */}
      {selectedHoliday && (
        <HolidayDetailModal
          holiday={selectedHoliday}
          onClose={() => setSelectedHoliday(null)}
          onUpdate={handleUpdateHoliday}
          onDelete={handleDeleteHoliday}
        />
      )}

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <BulkImportModal
          isOpen={showBulkImport}
          onClose={() => setShowBulkImport(false)}
          onSuccess={fetchHolidays}
        />
      )}

      {/* Generate Recurring Modal */}
      {showGenerateRecurring && (
        <GenerateRecurringModal
          isOpen={showGenerateRecurring}
          onClose={() => setShowGenerateRecurring(false)}
          onSuccess={fetchHolidays}
        />
      )}
    </div>
  );
};

export default AdminHolidayPage;
