import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import 'antd/dist/reset.css'; 
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
          {/* --- Public Routes --- */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPass />} />
          <Route path="/otp-page" element={<OtpPage />} />
          <Route path="/reset-password" element={<ResetPass />} />

          {/* --- Protected Routes --- */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/employees/add" element={<AddNewEmployee />} />
            <Route path="/employees/:id" element={<ViewEmployeeDetailsPage />} />
            <Route path="/profile" element={<MyProfile />} />
            <Route
              path="/departments"
              element={<><Department /></>}
            />
            <Route path="/view-department/:id" element={<DepartmentMembers />} />
            <Route
              path="/attendance"
              element={
                <div style={{ padding: "24px" }}>
                  <h1>Attendance Page</h1>
                  <p>This page is under development</p>
                </div>
              }
            />
            <Route
              path="/payroll"
              element={
                <div style={{ padding: "24px" }}>
                  <h1>Payroll Page</h1>
                  <p>This page is under development</p>
                </div>
              }
            />
            <Route
              path="/leaves"
              element={
                <div style={{ padding: "24px" }}>
                  <h1>Leaves Page</h1>
                  <p>This page is under development</p>
                </div>
              }
            />
            <Route
              path="/holidays"
              element={
                <div style={{ padding: "24px" }}>
                  <h1>Holidays Page</h1>
                  <p>This page is under development</p>
                </div>
              }
            />
            <Route
              path="/settings"
              element={
                <div style={{ padding: "24px" }}>
                  <h1>Settings Page</h1>
                  <p>This page is under development</p>
                </div>
              }
            />
          </Route>
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
