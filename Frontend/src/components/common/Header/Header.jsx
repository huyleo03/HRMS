/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Header.css";
import { useAuth } from "../../../contexts/AuthContext";
import NotificationDropdown from "../NotificationDropdown/NotificationDropdown";
import SendNotificationModal from "../SendNotificationModal/SendNotificationModal";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSendNotificationModalOpen, setIsSendNotificationModalOpen] = useState(false);
  const { user, logout } = useAuth();
  const dropdownRef = useRef(null);

  // Lưu tên phòng ban vào sessionStorage khi điều hướng có state
  useEffect(() => {
    const path = location.pathname || "";
    if (path.startsWith("/view-department/")) {
      const fromStateName = location.state?.departmentName;
      if (fromStateName) {
        sessionStorage.setItem("currentDepartmentName", fromStateName);
      }
    }
  }, [location.pathname, location.state]);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const getHeaderContent = () => {
    const path = location.pathname;

    switch (path) {
      case "/":
      case "/dashboard":
        return { title: "Welcome", description: "Have a nice day at work!" };
      case "/employees":
        return { title: "All Employees", description: "All Employee Information" };
      case "/employees/add":
        return { title: "Add New Employee", description: "Create a new employee account" };
      case "/profile":
        return { title: "Hồ sơ cá nhân", description: "Quản lý thông tin cá nhân của bạn" };
      case "/departments":
        return { title: "All Departments", description: "Department Information" };
      case "/attendance":
        return { title: "Chấm công", description: "Quản lý chấm công toàn công ty" };
      case "/manager/attendance":
        return { 
          title: "Chấm công phòng ban", 
          description: `Quản lý chấm công - ${user?.department?.department_name || "Phòng ban"}` 
        };
      case "/payroll":
        return { title: "Payroll", description: "Salary and Payment Management" };
      case "/leaves":
        return { title: "Leave Management", description: "Employee Leave Requests" };
      case "/holidays":
        return { title: "Holidays", description: "Company Holiday Calendar" };
      case "/settings":
        return { title: "Settings", description: "System Configuration" };
      default: {
        // ====== Route động: View Department ======
        if (path.startsWith("/view-department/")) {
          const deptName =
            location.state?.departmentName ||
            sessionStorage.getItem("currentDepartmentName") ||
            "Department";
          return {
            title: deptName,
            description: `All Departments > ${deptName}`,
          };
        }

        // ====== Route động: Employee detail (giữ logic cũ) ======
        if (path.startsWith("/employees/") && path !== "/employees/add") {
          const employeeName =
            sessionStorage.getItem("currentEmployeeName") || "Employee Details";
          return {
            title: employeeName,
            description: `All Employee > ${employeeName}`,
          };
        }

        return { title: "HRMS", description: "Human Resource Management System" };
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    setIsDropdownOpen(false);
  };

  const handleMyProfile = () => {
    navigate("/my-profile");
    setIsDropdownOpen(false);
  };

  const openSendNotificationModal = () => {
    setIsSendNotificationModalOpen(true);
  };

  const closeSendNotificationModal = () => {
    setIsSendNotificationModalOpen(false);
  };

  const toggleDropdown = () => setIsDropdownOpen((v) => !v);

  const { title, description } = getHeaderContent();

  return (
    <div className="header">
      <div className="header-background" />

      {/* Page Title and Description */}
      <div className="header-title-section">
        <div className="header-title">{title}</div>
        <div className="header-description">{description}</div>
      </div>

      {/* Right Section: Notification + User Profile */}
      <div className="header-right-section">
        <NotificationDropdown />

        {user && (
          <div className="header-profile" onClick={toggleDropdown} ref={dropdownRef}>
            <div className="profile-container">
              <div className="profile-avatar">
                {(user.avatar && user.avatar !== 'https://i.pravatar.cc/150') ? (
                  <img src={user.avatar} alt="User Avatar" />
                ) : (
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #7152F3 0%, #9D7EF2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '16px',
                    letterSpacing: '1px'
                  }}>
                    {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                  </div>
                )}
              </div>
              <div className="profile-info">
                <div className="profile-name">{user.name}</div>
                <div className="profile-role">{user.role}</div>
              </div>
              <div className="profile-dropdown-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M5.83325 8.33325L9.99992 11.6666L14.1666 8.33325" stroke="#16151C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {isDropdownOpen && (
              <div className="profile-dropdown">
                <button className="dropdown-item" onClick={handleMyProfile}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="#16151C" strokeWidth="1.5" />
                    <path d="M20.5899 22C20.5899 18.13 16.7399 15 11.9999 15C7.25991 15 3.40991 18.13 3.40991 22" stroke="#16151C" strokeWidth="1.5" />
                  </svg>
                  Hồ sơ cá nhân
                </button>
                <button className="dropdown-item" onClick={() => { navigate("/change-password"); setIsDropdownOpen(false); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 15C14.2091 15 16 13.2091 16 11C16 8.79086 14.2091 7 12 7C9.79086 7 8 8.79086 8 11C8 13.2091 9.79086 15 12 15Z" stroke="#16151C" strokeWidth="1.5" />
                    <path d="M4 21V19C4 16.2386 6.23858 14 9 14H15C17.7614 14 20 16.2386 20 19V21" stroke="#16151C" strokeWidth="1.5" />
                  </svg>
                  Đổi mật khẩu
                </button>
                <button className="dropdown-item" onClick={handleLogout}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M8.90002 7.55999C9.21002 3.95999 11.06 2.48999 15.11 2.48999H15.24C19.71 2.48999 21.5 4.27999 21.5 8.74999V15.27C21.5 19.74 19.71 21.53 15.24 21.53H15.11C11.09 21.53 9.24002 20.08 8.91002 16.54" stroke="#16151C" strokeWidth="1.5" />
                    <path d="M15 12H3.62" stroke="#16151C" strokeWidth="1.5" />
                    <path d="M5.85 8.6499L2.5 11.9999L5.85 15.3499" stroke="#16151C" strokeWidth="1.5" />
                  </svg>
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Send Notification Modal */}
      <SendNotificationModal 
        isOpen={isSendNotificationModalOpen}
        onClose={closeSendNotificationModal}
      />
    </div>
  );
};

export default Header;
