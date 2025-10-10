import React, { useState } from "react";
import { Inbox, Send, FileText, Star, Trash2, Edit, ChevronLeft, ChevronRight } from "lucide-react";

const RequestSidebar = ({ activeTab, setActiveTab, unreadCount, onComposeClick }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sidebarItems = [
    {
      id: "inbox",
      label: "Hộp thư đến",
      icon: <Inbox size={20} />,
      count: unreadCount,
    },
    {
      id: "sent",
      label: "Đã gửi",
      icon: <Send size={20} />,
      count: 0,
    },
    {
      id: "drafts",
      label: "Nháp",
      icon: <FileText size={20} />,
      count: 0,
    },
    {
      id: "starred",
      label: "Đã đánh dấu",
      icon: <Star size={20} />,
      count: 0,
    },
    {
      id: "trash",
      label: "Thùng rác",
      icon: <Trash2 size={20} />,
      count: 0,
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

      {/* Compose Button - Expanded Mode */}
      {!isCollapsed && (
        <div className="compose-button-wrapper">
          <button className="compose-button" onClick={handleComposeClick}>
            <Edit className="compose-icon" size={18} />
            <span className="compose-text">Tạo đơn mới</span>
          </button>
        </div>
      )}

      {/* Compose Button - Collapsed Mode */}
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

      {/* Navigation Items */}
      <div className="sidebar-items">
        {sidebarItems.map((item) => (
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
            {!isCollapsed && item.count > 0 && (
              <span className="item-count">{item.count}</span>
            )}
            {isCollapsed && item.count > 0 && (
              <span className="item-count-dot"></span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RequestSidebar;