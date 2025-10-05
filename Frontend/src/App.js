import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "antd/dist/reset.css";
import Login from "./pages/Authentication/Login";
import ForgotPass from "./pages/Authentication/ForgotPass";
import OtpPage from "./pages/Authentication/OtpPage";
import ResetPass from "./pages/Authentication/ResetPass";
import Dashboard from "./pages/Dashboard/Dashboard";
import Employees from "./pages/AllEmpoyeePage/AllEmployeePage.jsx";
import { AddNewEmployee } from "./pages/Employee";
import ViewEmployeeDetailsPage from "./pages/Employee/ViewEmployeeDetailsPage";
import MyProfile from "./pages/MyProfile/MyProfile";
import Department from "./pages/AllDepartMentPage/AllDepartMent.jsx";
import DepartmentMembers from "./pages/ViewDepartMentPage/ViewDepartMentPage.jsx";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute.js";
import { useAuth } from "./contexts/AuthContext";

const DashboardRedirect = () => {
  const { user } = useAuth();
  if (!user) {
    return <div>Loading...</div>; // Hoặc một spinner
  }
  return <Dashboard />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
                <Routes>
          {/* --- Public Routes (Không cần đăng nhập) --- */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPass />} />
          <Route path="/otp-page" element={<OtpPage />} />
          <Route path="/reset-password" element={<ResetPass />} />

          {/* --- Shared Protected Routes (Tất cả role đã đăng nhập đều có thể truy cập) --- */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardRedirect />} />
            <Route path="/profile" element={<MyProfile />} />
            <Route
              path="/settings"
              element={
                <div style={{ padding: "24px" }}>
                  <h1>Settings Page</h1>
                </div>
              }
            />
             <Route
              path="/holidays"
              element={
                <div style={{ padding: "24px" }}>
                  <h1>Holidays Page</h1>
                </div>
              }
            />
          </Route>

          {/* --- Admin-Only Routes (Chỉ Admin được truy cập) --- */}
          <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
            <Route path="/employees" element={<Employees />} />
            <Route path="/employees/add" element={<AddNewEmployee />} />
            <Route path="/employees/:id" element={<ViewEmployeeDetailsPage />} />
            <Route path="/departments" element={<Department />} />
          </Route>

          {/* --- Admin & Manager Routes (Admin và Manager được truy cập) --- */}
          <Route element={<ProtectedRoute allowedRoles={["Admin", "Manager"]} />}>
            <Route path="/view-department/:id" element={<DepartmentMembers />} />
            <Route
              path="/attendance"
              element={
                <div style={{ padding: "24px" }}>
                  <h1>Attendance Page</h1>
                </div>
              }
            />
            <Route
              path="/leaves"
              element={
                <div style={{ padding: "24px" }}>
                  <h1>Leaves Page</h1>
                </div>
              }
            />
          </Route>

           {/* --- Manager-Only Routes (Chỉ Manager được truy cập) --- */}
           {/* Ví dụ:
           <Route element={<ProtectedRoute allowedRoles={["Manager"]} />}>
              <Route path="/team-performance" element={<TeamPerformance />} />
           </Route>
           */}

          {/* --- Employee-Only Routes (Chỉ Employee được truy cập) --- */}
          {/* Ví dụ:
           <Route element={<ProtectedRoute allowedRoles={["Employee"]} />}>
              <Route path="/my-payslips" element={<MyPayslips />} />
           </Route>
           */}

          {/* --- Fallback Routes --- */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
