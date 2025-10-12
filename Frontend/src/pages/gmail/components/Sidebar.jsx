import React, { useState } from "react";
import {
  InboxOutlined,
  StarOutlined,
  ClockCircleOutlined,
  SendOutlined,
  FileOutlined,
  DeleteOutlined,
  EditOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import "../css/Sidebar.css";

// Mock data cho sidebar items
const sidebarItems = [
  {
    id: "inbox",
    label: "Inbox",
    icon: <InboxOutlined />,
    count: 3,
    active: true,
  },
  {
    id: "starred",
    label: "Starred",
    icon: <StarOutlined />,
    count: 0,
    active: false,
  },
  {
    id: "snoozed",
    label: "Snoozed",
    icon: <ClockCircleOutlined />,
    count: 0,
    active: false,
  },
  {
    id: "sent",
    label: "Sent",
    icon: <SendOutlined />,
    count: 0,
    active: false,
  },
  {
    id: "drafts",
    label: "Drafts",
    icon: <FileOutlined />,
    count: 1,
    active: false,
  },
  {
    id: "trash",
    label: "Trash",
    icon: <DeleteOutlined />,
    count: 0,
    active: false,
  },
];

const Sidebar = () => {
  const [activeItem, setActiveItem] = useState("inbox");
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleItemClick = (itemId) => {
    setActiveItem(itemId);
  };

  const handleComposeClick = () => {
    console.log("Compose new request");
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`sidebar-container ${isCollapsed ? "collapsed" : ""}`}>
      {/* Toggle Button */}
      <div className="sidebar-toggle-wrapper">
        <button 
          className="sidebar-toggle-btn" 
          onClick={toggleSidebar}
          title={isCollapsed ? "Mở rộng" : "Thu gọn"}
        >
          {isCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </button>
      </div>

      {/* Compose Button */}
      {!isCollapsed && (
        <div className="compose-button-wrapper">
          <button className="compose-button" onClick={handleComposeClick}>
            <EditOutlined className="compose-icon" />
            <span className="compose-text">Soạn thư</span>
          </button>
        </div>
      )}

      {/* Compose Button - Collapsed Mode */}
      {isCollapsed && (
        <div className="compose-button-wrapper">
          <button 
            className="compose-button-icon" 
            onClick={handleComposeClick}
            title="Soạn thư"
          >
            <EditOutlined />
          </button>
        </div>
      )}

      {/* Main navigation items */}
      <div className="sidebar-items">
        {sidebarItems.map((item) => (
          <div
            key={item.id}
            className={`sidebar-item ${activeItem === item.id ? "active" : ""}`}
            onClick={() => handleItemClick(item.id)}
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

export default Sidebar;