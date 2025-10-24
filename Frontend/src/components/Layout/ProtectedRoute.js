import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Layout from "./Layout";
import Header from "../common/Header/Header.jsx"; 
import { toast } from "react-toastify";


const ProtectedRoute = ({ noSidebar = false, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();
  const [hasShownError, setHasShownError] = useState(false);
  useEffect(() => {
    if (!loading && allowedRoles.length > 0 && user && !allowedRoles.includes(user?.role) && !hasShownError) {
      toast.error("Bạn không có quyền truy cập trang này!");
      setHasShownError(true);
    }
  }, [user, allowedRoles, hasShownError, loading]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Đang tải...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

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

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default ProtectedRoute;
