import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SendNotificationModal from "../../../common/SendNotificationModal/SendNotificationModal";
import "../css/Sidebar.css";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSendNotificationModalOpen, setIsSendNotificationModalOpen] = useState(false);

  const menuItems = [
    {
      path: "/dashboard",
      label: "Trang Chủ",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="14" y="3" width="7" height="7" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="14" y="14" width="7" height="7" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="3" y="14" width="7" height="7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      path: "/employees",
      label: "Nhân Viên",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      path: "/departments",
      label: "Phòng Ban",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="9 22 9 12 15 12 15 22" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      path: "/attendance",
      label: "Chấm Công",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      path: "/admin/workflow",
      label: "Quy Trình",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      path: "/payroll",
      label: "Lương",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="1" x2="12" y2="23" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      path: "/request",
      label: "Đơn Từ",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="14 2 14 8 20 8" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="16" y1="13" x2="8" y2="13" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="16" y1="17" x2="8" y2="17" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="10 9 9 9 8 9" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      path: "/admin/holidays",
      label: "Ngày Nghỉ",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 14h.01" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 14h.01" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 14h.01" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 18h.01" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 18h.01" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      path: "/settings",
      label: "Cài Đặt",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 1v6m0 6v6m-9-9h6m6 0h6M4.22 4.22l4.24 4.24m7.08 7.08l4.24 4.24M4.22 19.78l4.24-4.24m7.08-7.08l4.24-4.24" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  const openSendNotificationModal = () => {
    setIsSendNotificationModalOpen(true);
  };

  const closeSendNotificationModal = () => {
    setIsSendNotificationModalOpen(false);
  };

  const isActiveRoute = (path) => {
    return (
      location.pathname === path ||
      (path === "/employees" && location.pathname.startsWith("/employees")) ||
      (path === "/departments" && location.pathname.startsWith("/view-department")) ||
      (path === "/admin/workflow" && location.pathname.startsWith("/admin/workflow")) ||
      (path === "/admin/holidays" && location.pathname.startsWith("/admin/holidays"))
    );
  };

  return (
    <div className="side-menu">
      {/* Background */}
      <div className="sidebar-background" />
      {/* Logo + Text */}
      <div className="logo-section">
        <div className="logo-container">
          <div className="logo-icon">
            <svg
              width="21"
              height="20"
              viewBox="0 0 21 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19.3192 11.63C19.3192 12.9181 19.0614 14.0264 18.5734 14.8356C17.947 15.8751 16.9733 16.425 15.7579 16.425C13.4381 16.425 11.8785 13.5147 10.2279 10.4338C9.02863 8.19577 7.5402 5.41088 6.31641 5.41088C5.72669 5.41088 5.00389 6.12756 4.43024 7.28099C3.77407 8.63786 3.42566 10.1229 3.4099 11.63C3.4099 12.5708 3.58123 13.3724 3.89177 13.8879C4.18013 14.3667 4.57556 14.5893 5.13545 14.5893C6.18714 14.5893 7.47824 12.3712 7.90274 11.6453C8.02537 11.435 8.22654 11.2819 8.462 11.2199C8.69746 11.1579 8.94792 11.1919 9.15828 11.3145C9.36864 11.4371 9.52167 11.6383 9.58371 11.8738C9.64575 12.1092 9.61171 12.3597 9.48908 12.5701C8.80759 13.7388 8.22475 14.5587 7.6534 15.1538C6.83269 16.0089 6.01046 16.425 5.13545 16.425C3.92007 16.425 2.94639 15.8751 2.31997 14.8356C1.83198 14.0264 1.57422 12.9181 1.57422 11.63C1.57422 8.2669 3.37778 3.5752 6.31641 3.5752C8.63625 3.5752 10.1958 6.48552 11.8464 9.56641C13.0473 11.8044 14.5365 14.5893 15.7579 14.5893C16.3178 14.5893 16.7133 14.3667 17.0016 13.8879C17.3122 13.3724 17.4835 12.5708 17.4835 11.63C17.468 10.123 17.1198 8.63792 16.4639 7.28099C15.8903 6.12756 15.1675 5.41088 14.577 5.41088C14.1395 5.41088 13.6125 5.79332 13.0098 6.54518C12.8576 6.73526 12.6362 6.85711 12.3942 6.88393C12.1522 6.91076 11.9095 6.84035 11.7194 6.68821C11.5294 6.53607 11.4075 6.31465 11.3807 6.07267C11.3539 5.83068 11.4243 5.58795 11.5764 5.39788C12.5593 4.17179 13.5406 3.5752 14.577 3.5752C15.927 3.5752 17.1775 4.60088 18.1069 6.46334C18.8864 8.07532 19.3004 9.83955 19.3192 11.63Z"
                fill="white"
              />
            </svg>
          </div>
          <div className="logo-text">
            <svg
              width="79"
              height="21"
              viewBox="0 0 79 21"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M13.0391 20.3222V0.824678H16.0473V20.3222H13.0391ZM0.310059 20.3222V0.824678H3.31825V20.3222H0.310059ZM1.61918 12.0497V9.1529H14.3761V12.0497H1.61918Z"
                fill="#16151C"
              />
              <path
                d="M21.4995 20.3222V0.824678H29.7998C30.914 0.824678 31.9353 1.10321 32.8637 1.66029C33.8107 2.19879 34.5628 2.94155 35.1199 3.88857C35.6769 4.81702 35.9555 5.86618 35.9555 7.03603C35.9555 8.09446 35.6769 9.07862 35.1199 9.98851C34.5628 10.8984 33.82 11.6319 32.8916 12.1889C31.9631 12.7274 30.9325 12.9967 29.7998 12.9967H24.5076V20.3222H21.4995ZM33.0865 20.3222L28.1286 11.5205L31.2204 10.8241L36.7354 20.35L33.0865 20.3222ZM24.5076 10.0999H30.0784C30.6169 10.0999 31.0997 9.96994 31.5267 9.70997C31.9538 9.43143 32.2881 9.06005 32.5295 8.59583C32.7709 8.11303 32.8916 7.58381 32.8916 7.00817C32.8916 6.35826 32.7337 5.7919 32.4181 5.3091C32.1209 4.80774 31.6939 4.41779 31.1368 4.13925C30.5983 3.86072 29.9855 3.72145 29.2985 3.72145H24.5076V10.0999Z"
                fill="#16151C"
              />
              <path
                d="M40.8664 20.3222V0.824678H43.8189L50.9215 12.3839L49.501 12.3561L56.6872 0.824678H59.4726V20.3222H56.4644V12.3282C56.4644 10.657 56.5015 9.1529 56.5758 7.81593C56.6687 6.47896 56.8172 5.15127 57.0215 3.83287L57.4114 4.86345L51.0329 14.7236H49.1946L43.0111 4.97486L43.3175 3.83287C43.5218 5.07699 43.661 6.35826 43.7353 7.67666C43.8282 8.97649 43.8746 10.527 43.8746 12.3282V20.3222H40.8664Z"
                fill="#16151C"
              />
              <path
                d="M70.9554 20.6007C69.897 20.6007 68.9128 20.4615 68.003 20.1829C67.1116 19.9044 66.2946 19.4866 65.5518 18.9295C64.8277 18.3539 64.1777 17.6482 63.6021 16.8126L65.6633 14.4451C66.5731 15.7449 67.4459 16.6455 68.2815 17.1469C69.1171 17.6482 70.1105 17.8989 71.2618 17.8989C71.9675 17.8989 72.6081 17.7875 73.1837 17.5647C73.7594 17.3419 74.2143 17.0355 74.5485 16.6455C74.8828 16.2556 75.0499 15.8099 75.0499 15.3085C75.0499 14.9743 74.9942 14.6586 74.8828 14.3615C74.7714 14.0644 74.595 13.7952 74.3536 13.5538C74.1308 13.3124 73.8336 13.0895 73.4623 12.8853C73.1095 12.681 72.6916 12.5046 72.2088 12.3561C71.7261 12.1889 71.169 12.0497 70.5376 11.9383C69.5349 11.734 68.6622 11.4647 67.9194 11.1305C67.1766 10.7963 66.5546 10.3785 66.0532 9.87709C65.5518 9.37573 65.1805 8.80937 64.9391 8.17802C64.6977 7.52811 64.577 6.80391 64.577 6.00544C64.577 5.22554 64.7441 4.50135 65.0783 3.83287C65.4311 3.16438 65.9047 2.58874 66.4989 2.10594C67.1116 1.60458 67.8266 1.22391 68.6436 0.963946C69.4606 0.68541 70.3427 0.546143 71.2897 0.546143C72.2924 0.546143 73.2116 0.676126 74.0472 0.936093C74.8828 1.19606 75.6256 1.58601 76.2755 2.10594C76.9254 2.60731 77.4639 3.22937 77.891 3.97213L75.7741 6.06115C75.4027 5.44837 74.9849 4.93772 74.5207 4.5292C74.0565 4.10212 73.5458 3.78644 72.9888 3.58218C72.4317 3.35935 71.8375 3.24794 71.2061 3.24794C70.4819 3.24794 69.8506 3.35935 69.3121 3.58218C68.7736 3.80501 68.3465 4.12068 68.0308 4.5292C67.7337 4.91915 67.5852 5.38338 67.5852 5.92188C67.5852 6.31183 67.6594 6.67393 67.808 7.00817C67.9565 7.32385 68.1794 7.61167 68.4765 7.87163C68.7921 8.11303 69.2099 8.33586 69.7299 8.54012C70.2498 8.72581 70.8719 8.89293 71.5961 9.04148C72.6174 9.26431 73.5273 9.55213 74.3257 9.90495C75.1242 10.2392 75.802 10.6384 76.359 11.1026C76.9161 11.5669 77.3339 12.0868 77.6124 12.6624C77.9096 13.2381 78.0581 13.8602 78.0581 14.5286C78.0581 15.7728 77.7703 16.8498 77.1946 17.7597C76.619 18.6695 75.802 19.3752 74.7435 19.8765C73.6851 20.3593 72.4224 20.6007 70.9554 20.6007Z"
                fill="#16151C"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="nav-menu">
        {menuItems.map((item, index) => (
          <div key={index} className="nav-item-container">
            <div
              className={`nav-item-background ${
                isActiveRoute(item.path) ? "active" : ""
              }`}
            />
            <div
              className={`nav-item ${isActiveRoute(item.path) ? "active" : ""}`}
              onClick={() => handleNavigation(item.path)}
            >
              <div className="nav-icon">{item.icon}</div>
              <div className="nav-label">{item.label}</div>
            </div>
            <div
              className={`nav-indicator ${
                isActiveRoute(item.path) ? "active" : ""
              }`}
            />
          </div>
        ))}
      </div>

      {/* Quick Access: Send Notification */}
      <div className="sidebar-quick-action">
        <button 
          className="quick-action-btn send-notification-quick-btn"
          onClick={openSendNotificationModal}
          title="Gửi Thông Báo"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Gửi Thông Báo</span>
        </button>
      </div>

      {/* Send Notification Modal */}
      <SendNotificationModal 
        isOpen={isSendNotificationModalOpen}
        onClose={closeSendNotificationModal}
      />
    </div>
  );
};

export default Sidebar;
