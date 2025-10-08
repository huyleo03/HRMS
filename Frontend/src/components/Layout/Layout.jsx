import React from "react";
import Sidebar from "../common/Sidebar/Sidebar";
import ManagerSidebar from "../manager/ManagerSidebar";
import Header from "../common/Header/Header";
import { useAuth } from "../../contexts/AuthContext";
import "./Layout.css";

const Layout = ({ children }) => {
  const { user } = useAuth();
  
  // Determine which sidebar to show based on user role
  const SidebarComponent = user?.role === 'Manager' ? ManagerSidebar : Sidebar;
  
  return (
    <div className="app-layout">
      <SidebarComponent />
      <div className="content-area">
        <Header />
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
