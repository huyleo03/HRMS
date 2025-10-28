import React, { useState } from "react";
import {
  Inbox,
  Send,
  Edit,
  ChevronLeft,
  ChevronRight,
  Users,
  Shield,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

const RequestSidebar = ({
  activeTab,
  setActiveTab,
  counts = {},
  onComposeClick,
  userRole, 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Debug: Log counts prop
  console.log("🔍 [RequestSidebar] Received counts:", counts);
  console.log("🔍 [RequestSidebar] Sample item.count:", counts.myPending);

  // ✅ MENU CHO MANAGER VÀ EMPLOYEE - HỘP THƯ
  const sidebarItems = [
    {
      id: "inbox",
      label: "Hộp thư đến",
      icon: <Inbox size={20} />,
      count: counts.inbox || 0,
    },
    {
      id: "sent",
      label: "Đã gửi",
      icon: <Send size={20} />,
      count: counts.sent || 0,
    },
    {
      id: "cc",
      label: "Đơn CC",
      icon: <Users size={20} />,
      count: counts.cc || 0,
    },
    {
      id: "my-approved",
      label: "Đơn đã được duyệt",
      icon: <CheckCircle size={20} />,
      count: counts.myApproved || 0,
    },
    {
      id: "my-rejected",
      label: "Đơn bị từ chối",
      icon: <XCircle size={20} />,
      count: counts.myRejected || 0,
    },
    {
      id: "my-pending",
      label: "Đơn đang chờ",
      icon: <Clock size={20} />,
      count: counts.myPending || 0,
    },
    {
      id: "my-needs-review",
      label: "Cần bổ sung",
      icon: <AlertCircle size={20} />,
      count: counts.myNeedsReview || 0,
    },
  ];

  

  // ✅ ĐƠN TÔI XỬ LÝ (Manager only)
  const myActionsItems = [
    {
      id: "approved-by-me",
      label: "Tôi đã duyệt",
      icon: <CheckCircle size={20} />,
      count: counts.approvedByMe || 0,
    },
    {
      id: "rejected-by-me",
      label: "Tôi đã từ chối",
      icon: <XCircle size={20} />,
      count: counts.rejectedByMe || 0,
    },
  ];

  // ✅ MENU RIÊNG CHO ADMIN (chỉ inbox)
  const adminSidebarItems = [
    {
      id: "inbox",
      label: "Hộp thư đến",
      icon: <Inbox size={20} />,
      count: counts.inbox || 0,
    },
  ];

  // ✅ MENU ADMIN SECTION
  const adminItems = [
    {
      id: "admin-all",
      label: "Tất cả đơn",
      icon: <Shield size={20} />,
      count: counts.adminAll || 0,
    },
    {
      id: "admin-stats",
      label: "Thống kê",
      icon: <BarChart3 size={20} />,
      count: null,
    },
  ];

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleComposeClick = () => {
    if (onComposeClick) {
      onComposeClick();
    }
  };

  return (
    <div className={`request-sidebar ${isCollapsed ? "collapsed" : ""}`}>
      {/* Toggle Button */}
      <div className="sidebar-toggle-wrapper">
        <button
          className="sidebar-toggle-btn"
          onClick={toggleSidebar}
          title={isCollapsed ? "Mở rộng" : "Thu gọn"}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* ✅ Compose Button - ẨN KHI ADMIN */}
      {userRole !== "Admin" && (
        <>
          {!isCollapsed && (
            <div className="compose-button-wrapper">
              <button className="compose-button" onClick={handleComposeClick}>
                <Edit className="compose-icon" size={18} />
                <span className="compose-text">Tạo đơn mới</span>
              </button>
            </div>
          )}

          {isCollapsed && (
            <div className="compose-button-wrapper">
              <button
                className="compose-button-icon"
                onClick={handleComposeClick}
                title="Tạo đơn mới"
              >
                <Edit size={20} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Navigation Items - User Menu */}
      <div className="sidebar-items">
        {/* ✅ HỘP THƯ (bao gồm cả đơn của tôi) */}
        {(userRole === "Admin" ? adminSidebarItems : sidebarItems).map((item) => (
          <div
            key={item.id}
            className={`sidebar-item ${activeTab === item.id ? "active" : ""}`}
            onClick={() => setActiveTab(item.id)}
            title={isCollapsed ? item.label : ""}
          >
            <div className="item-content">
              <span className="item-icon">{item.icon}</span>
              {!isCollapsed && <span className="item-label">{item.label}</span>}
            </div>
            {!isCollapsed && (
              <span className="item-count">{item.count}</span>
            )}
            {isCollapsed && item.count > 0 && (
              <span className="item-count-dot"></span>
            )}
          </div>
        ))}

        {/* ✅ ĐƠN TÔI XỬ LÝ (chỉ Manager) */}
        {userRole !== "Employee" && userRole !== "Admin" && (
          <>
            {!isCollapsed && (
              <div className="sidebar-divider">
                <span className="divider-text">Đơn tôi xử lý</span>
              </div>
            )}
            {isCollapsed && <div className="sidebar-divider-line"></div>}

            {myActionsItems.map((item) => (
              <div
                key={item.id}
                className={`sidebar-item ${activeTab === item.id ? "active" : ""}`}
                onClick={() => setActiveTab(item.id)}
                title={isCollapsed ? item.label : ""}
              >
                <div className="item-content">
                  <span className="item-icon">{item.icon}</span>
                  {!isCollapsed && (
                    <span className="item-label">{item.label}</span>
                  )}
                </div>
                {!isCollapsed && item.count > 0 && (
                  <span className="item-count">{item.count}</span>
                )}
                {isCollapsed && item.count > 0 && (
                  <span className="item-count-dot"></span>
                )}
              </div>
            ))}
          </>
        )}

        {/* ✅ ADMIN SECTION */}
        {userRole === "Admin" && (
          <>
            {/* Divider */}
            {!isCollapsed && (
              <div className="sidebar-divider">
                <span className="divider-text">Quản trị viên</span>
              </div>
            )}
            {isCollapsed && <div className="sidebar-divider-line"></div>}

            {/* Admin Menu Items */}
            {adminItems.map((item) => (
              <div
                key={item.id}
                className={`sidebar-item admin-item ${
                  activeTab === item.id ? "active" : ""
                }`}
                onClick={() => setActiveTab(item.id)}
                title={isCollapsed ? item.label : ""}
              >
                <div className="item-content">
                  <span className="item-icon">{item.icon}</span>
                  {!isCollapsed && (
                    <span className="item-label">{item.label}</span>
                  )}
                </div>
                {!isCollapsed && item.count !== null && item.count > 0 && (
                  <span className="item-count">{item.count}</span>
                )}
                {isCollapsed && item.count !== null && item.count > 0 && (
                  <span className="item-count-dot"></span>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default RequestSidebar;