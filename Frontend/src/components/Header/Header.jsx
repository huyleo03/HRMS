/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Header.css";
import { useAuth } from "../../contexts/AuthContext";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { user, logout } = useAuth();

  console.log("User object in Header:", user);

  // Mapping routes to header titles and descriptions
  const getHeaderContent = () => {
    const path = location.pathname;

    switch (path) {
      case "/":
      case "/dashboard":
        return {
          title: "Welcome",
          description: "Have a nice day at work!",
        };
      case "/employees":
        return {
          title: "All Employees",
          description: "All Employee Information",
        };
      case '/employees/add':
        return {
          title: 'Add New Employee',
          description: 'Create a new employee account'
        };
      case "/profile":
        return {
          title: "My Profile",
          description: "Manage your personal information",
        };
      case "/departments":
        return {
          title: "All Departments",
          description: "Department Information",
        };
      case "/attendance":
        return {
          title: "Attendance",
          description: "Employee Attendance Management",
        };
      case "/payroll":
        return {
          title: "Payroll",
          description: "Salary and Payment Management",
        };
      case "/leaves":
        return {
          title: "Leave Management",
          description: "Employee Leave Requests",
        };
      case "/holidays":
        return {
          title: "Holidays",
          description: "Company Holiday Calendar",
        };
      case "/settings":
        return {
          title: "Settings",
          description: "System Configuration",
        };
      default:
        return {
          title: "HRMS",
          description: "Human Resource Management System",
        };
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    setIsDropdownOpen(false);
  };

  const handleMyProfile = () => {
    navigate("/profile");
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const { title, description } = getHeaderContent();

  return (
    <div className="header">
      <div className="header-background" />

      {/* Page Title and Description */}
      <div className="header-title-section">
        <div className="header-title">{title}</div>
        <div className="header-description">
          {description}
        </div>
      </div>

      {/* Right Section: Notification + User Profile */}
      <div className="header-right-section">
        {/* Notification Icon */}
        <div className="header-notification">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5.67964 8.79403C6.05382 5.49085 8.77095 3 12 3C15.2291 3 17.9462 5.49085 18.3204 8.79403L18.6652 11.8385C18.7509 12.595 19.0575 13.3069 19.5445 13.88C20.5779 15.0964 19.7392 17 18.1699 17H5.83014C4.26081 17 3.42209 15.0964 4.45549 13.88C4.94246 13.3069 5.24906 12.595 5.33476 11.8385L5.67964 8.79403Z"
              stroke="#16151C"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M15 19C14.5633 20.1652 13.385 21 12 21C10.615 21 9.43668 20.1652 9 19"
              stroke="#16151C"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* User Profile Section */}
        {user && (
          <div className="header-profile" onClick={toggleDropdown}>
            <div className="profile-container">
              <div className="profile-avatar">
                <img src={user.avatar} alt="User Avatar" />
              </div>
              <div className="profile-info">
                <div className="profile-name">{user.name}</div>
                <div className="profile-role">{user.role}</div>
              </div>
              <div className="profile-dropdown-icon">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5.83325 8.33325L9.99992 11.6666L14.1666 8.33325"
                    stroke="#16151C"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="profile-dropdown">
                <button className="dropdown-item" onClick={handleMyProfile}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
                      stroke="#16151C"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M20.5899 22C20.5899 18.13 16.7399 15 11.9999 15C7.25991 15 3.40991 18.13 3.40991 22"
                      stroke="#16151C"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  My Profile
                </button>
                <button className="dropdown-item" onClick={handleLogout}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8.90002 7.55999C9.21002 3.95999 11.06 2.48999 15.11 2.48999H15.24C19.71 2.48999 21.5 4.27999 21.5 8.74999V15.27C21.5 19.74 19.71 21.53 15.24 21.53H15.11C11.09 21.53 9.24002 20.08 8.91002 16.54"
                      stroke="#16151C"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M15 12H3.62"
                      stroke="#16151C"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M5.85 8.6499L2.5 11.9999L5.85 15.3499"
                      stroke="#16151C"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
