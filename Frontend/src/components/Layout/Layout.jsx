import React from "react";
import Sidebar from "../common/Sidebar/Sidebar";
import Header from "../common/Header/Header";
import "./Layout.css";

const Layout = ({ children }) => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="content-area">
        <Header />
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
