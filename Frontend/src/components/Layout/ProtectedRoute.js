import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Layout from "./Layout";
import Header from "../common/Header/Header.jsx"; 
import { toast } from "react-toastify";

/**
 * @param {boolean} noSidebar - Nếu true → chỉ hiện Header, ẩn Sidebar (dùng cho trang đổi mật khẩu,...)
 */
const ProtectedRoute = ({ noSidebar = false }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Bạn phải đăng nhập để truy cập trang này!");
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ✅ Nếu không dùng sidebar, nhưng vẫn có header
  if (noSidebar) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 p-4">
          <Outlet />
        </div>
      </div>
    );
  }

  // ✅ Mặc định: dùng Layout đầy đủ (Header + Sidebar)
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default ProtectedRoute;
