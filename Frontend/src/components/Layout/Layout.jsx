import React from "react";
import ManagerSidebar from "../common/Sidebar/components/ManagerSidebar";
import EmployeeSidebar from "../common/Sidebar/components/EmployeeSidebar";
import AdminSidebar from "../common/Sidebar/components/AdminSidebar";
import Header from "../common/Header/Header";
import { useAuth } from "../../contexts/AuthContext";
import "./Layout.css";

const Layout = ({ children }) => {
  const { user } = useAuth();

  const SidebarComponent =
    user?.role === "Admin"
      ? AdminSidebar
      : user?.role === "Manager"
      ? ManagerSidebar
      : EmployeeSidebar;

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
