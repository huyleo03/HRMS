import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Layout from "./Layout";
import Header from "../common/Header/Header.jsx"; 
import { toast } from "react-toastify";

/**
 * @param {boolean} noSidebar - Nếu true → chỉ hiện Header, ẩn Sidebar
 * @param {string[]} allowedRoles - Danh sách role được phép truy cập route này
 */
const ProtectedRoute = ({ noSidebar = false, allowedRoles = [] }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Bạn phải đăng nhập để truy cập trang này!");
    }
  }, [isAuthenticated]);

  // 🔸 Chưa đăng nhập → quay về login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 🔸 Kiểm tra phân quyền nếu có
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    toast.error("Bạn không có quyền truy cập trang này!");
    return <Navigate to="/dashboard" replace />;
  }

  // 🔸 Không dùng sidebar → chỉ header
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

  // 🔸 Mặc định: dùng Layout đầy đủ
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default ProtectedRoute;
