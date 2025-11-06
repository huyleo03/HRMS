import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Dropdown } from "antd";
import { MoreOutlined, FileTextOutlined, SyncOutlined } from "@ant-design/icons";
import { getCalendarHolidays, createHoliday, updateHoliday, deleteHoliday } from "../../../service/HolidayService";
import { getAllCompanyLeavesForCalendar } from "../../../service/RequestService";
import { getDepartmentOptions } from "../../../service/DepartmentService";
import HolidayCalendarGrid from "../components/HolidayCalendarGrid";
import QuickAddModal from "../components/QuickAddModal";
import HolidayDetailModal from "../components/HolidayDetailModal";
import BulkImportModal from "../components/BulkImportModal";
import GenerateRecurringModal from "../components/GenerateRecurringModal";
import HolidayCheckWidget from "../components/HolidayCheckWidget";
import HolidayViewModal from "../components/HolidayViewModal";
import "../css/AdminHolidayCalendar.css";
import "../css/DepartmentCalendarPage.css";

const AdminHolidayPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [holidays, setHolidays] = useState([]);
  const [companyLeaves, setCompanyLeaves] = useState([]); // All employee leaves
  const [selectedDate, setSelectedDate] = useState(null); // For quick add
  const [selectedHoliday, setSelectedHoliday] = useState(null); // For edit
  const [selectedDateEvents, setSelectedDateEvents] = useState(null); // For viewing events on a date
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false); // For bulk import
  const [showGenerateRecurring, setShowGenerateRecurring] = useState(false); // For generate recurring
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Filter states - department filter
  const [selectedDepartment, setSelectedDepartment] = useState(""); // "" = default (only company holidays)
  const [departments, setDepartments] = useState([]); // List of all departments from DB
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  
  // Fetch departments list (only once on mount)
  useEffect(() => {
    fetchDepartments();
  }, []);

  // Fetch calendar data when date or department filter changes
  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, selectedDepartment]);

  const fetchDepartments = async () => {
    try {
      const response = await getDepartmentOptions();
      // getDepartmentOptions returns { success, data: [...] }
      setDepartments(response.data || []);
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast.error("Không thể tải danh sách phòng ban");
    }
  };
  
  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Only fetch holidays when no department is selected
      // Only fetch leaves when a department is selected
      if (selectedDepartment === "") {
        // Default mode: Show company holidays only
        const holidaysData = await getCalendarHolidays({ year, month });
        setHolidays(holidaysData || []);
        setCompanyLeaves([]); // Clear leaves data
      } else {
        // Department selected: Show employee leaves only
        const leavesData = await getAllCompanyLeavesForCalendar({ year, month });
        setCompanyLeaves(leavesData || []);
        setHolidays([]); // Clear holidays data
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Không thể tải dữ liệu lịch nghỉ. Vui lòng thử lại.");
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
  
  const handleHolidayClick = (holiday) => {
    if (holiday.itemType === 'leave') {
      setSelectedDateEvents({
        date: new Date(holiday.startDate).toLocaleDateString('vi-VN'),
        events: [holiday]
      });
      setIsViewModalOpen(true);
    } else {
      setSelectedHoliday(holiday);
    }
  };
  
  
  const displayHolidays = React.useMemo(() => {
    if (selectedDepartment === "") {
      return holidays;
    } else {
      return [];
    }
  }, [holidays, selectedDepartment]);

  const displayLeaves = React.useMemo(() => {
    if (selectedDepartment === "") {
      return [];
    } else {
      return companyLeaves.filter(leave => leave.departmentName === selectedDepartment);
    }
  }, [companyLeaves, selectedDepartment]);

  const handleCreateHoliday = async (data) => {
    try {
      await createHoliday(data);
      await fetchAllData();
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
      
      // Check if the updated date is in a different month/year
      const updatedDate = new Date(data.date);
      const updatedYear = updatedDate.getFullYear();
      const updatedMonth = updatedDate.getMonth() + 1;
      
      // If date changed to different month, navigate to that month
      if (updatedYear !== year || updatedMonth !== month) {
        setCurrentDate(updatedDate);
        // fetchAllData will be called automatically by useEffect
      } else {
        // Update local state immediately for same month
        setHolidays(prevHolidays => 
          prevHolidays.map(h => h._id === id ? { ...h, ...data, _id: id } : h)
        );
        // Still fetch to ensure consistency
        await fetchAllData();
      }
      
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
      await fetchAllData();
      setSelectedHoliday(null);
      toast.success("Xóa ngày lễ thành công!");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Lỗi: " + (error.message || "Không thể xóa ngày lễ"));
    }
  };

  const handleDateClickOnCalendar = (dateStr, events) => {
    if (events && events.length > 0) {
      setSelectedDateEvents({
        date: dateStr,
        events: events
      });
      setIsViewModalOpen(true);
    } else {
      // Click vào ô trống → mở quick add modal
      setSelectedDate(dateStr);
    }
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedDateEvents(null);
  };
  
  return (
    <div className="holiday-calendar-page">
      {/* Holiday Check Widget */}
      <HolidayCheckWidget compact={true} defaultCollapsed={true} />
      
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
          {/* <button 
            className="btn btn--primary" 
            onClick={() => window.location.href = "/admin/company-calendar"}
          >
            📅 Xem lịch nghỉ toàn công ty
          </button> */}
          
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
          holidays={displayHolidays}
          employeeLeaves={displayLeaves}
          departments={departments}
          selectedDepartment={selectedDepartment}
          onDepartmentChange={setSelectedDepartment}
          onDateClick={handleDateClickOnCalendar}
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

      {/* View Events Modal (khi click vào date có events) */}
      {isViewModalOpen && selectedDateEvents && (
        <HolidayViewModal
          holiday={selectedDateEvents}
          onClose={handleCloseViewModal}
        />
      )}

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <BulkImportModal
          isOpen={showBulkImport}
          onClose={() => setShowBulkImport(false)}
          onSuccess={fetchAllData}
        />
      )}

      {/* Generate Recurring Modal */}
      {showGenerateRecurring && (
        <GenerateRecurringModal
          isOpen={showGenerateRecurring}
          onClose={() => setShowGenerateRecurring(false)}
          onSuccess={fetchAllData}
        />
      )}
    </div>
  );
};

export default AdminHolidayPage;
