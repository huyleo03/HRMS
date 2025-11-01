import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "antd/dist/reset.css";
import Login from "./pages/authentication/Login.jsx";
import ForgotPass from "./pages/authentication/ForgotPass.jsx";
import OtpPage from "./pages/authentication/OtpPage.jsx";
import ResetPass from "./pages/authentication/ResetPass.jsx";
import AdminDashboard from "./pages/dashboard/components/AdminDashboard.jsx";
import Employees from "./pages/employee/pages/AllEmployeePage.jsx";
import AddNewEmployee from "./pages/employee/pages/AddNewEmployee.jsx";
import ViewEmployeeDetails from "./pages/employee/pages/ViewEmployeeDetails.jsx";
import MyProfile from "./pages/my-profile/MyProfile.jsx";
import Department from "./pages/department/pages/AllDepartMent.jsx";
import DepartmentMembers from "./pages/department/pages/ViewDepartMentPage.jsx";
import ManagerDashboard from "./pages/dashboard/components/ManagerDashboard.jsx";
import ManagerEmployees from "./pages/manager/pages/ManagerEmployees.jsx";
import ManagerViewEmployeeDetails from "./pages/manager/pages/ManagerViewEmployeeDetails.jsx";
import { AuthProvider } from "./contexts/AuthContext.js";
import ProtectedRoute from "./components/Layout/ProtectedRoute";
import ChangePass from "./pages/authentication/ChangePass.jsx";
import Request from "./pages/request/pages/Request.jsx";
import EmployeeDashboard from "./pages/dashboard/components/EmployeeDashboard.jsx";
import EmployeeAttendance from "./pages/attendance/EmployeeAttendance.jsx";
import ManagerAttendance from "./pages/attendance/ManagerAttendance.jsx"; // Manager chấm công cá nhân
import ManagerAttendancePage from "./pages/attendance/ManagerAttendancePage.jsx"; // Xem phòng ban
import AdminAttendancePage from "./pages/attendance/AdminAttendancePage.jsx";
import Settings from "./pages/settings/Settings.jsx";
import WorkflowManagement from "./pages/workflow/WorkflowManagement.jsx";
import WorkflowForm from "./pages/workflow/WorkflowForm.jsx";
import WorkflowDetailPage from "./pages/workflow/WorkflowDetailPage.jsx";
import AdminHolidayPage from "./pages/holiday/pages/AdminHolidayPage.jsx";
import DepartmentCalendarPage from "./pages/holiday/pages/DepartmentCalendarPage.jsx";

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
          style={{ zIndex: 9999999 }}
        />
        <Routes>
          {/* --- Public Routes --- */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPass />} />
          <Route path="/otp-page" element={<OtpPage />} />
          <Route path="/reset-password" element={<ResetPass />} />
          <Route element={<ProtectedRoute noSidebar={true} />}>
            <Route path="/change-password" element={<ChangePass />} />
          </Route>
          {/* --- Admin Routes --- */}
          <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/employees/add" element={<AddNewEmployee />} />
            <Route
              path="/employees/:id"
              element={<ViewEmployeeDetails />}
            />
            <Route path="/departments" element={<Department />} />
            <Route
              path="/view-department/:id"
              element={<DepartmentMembers />}
            />
            <Route path="/request" element={<Request />} />
            <Route path="/attendance" element={<AdminAttendancePage />} />
            {/* Workflow Routes */}
            <Route path="/admin/workflow" element={<WorkflowManagement />} />
            <Route path="/admin/workflow/create" element={<WorkflowForm />} />
            <Route
              path="/admin/workflow/:id"
              element={<WorkflowDetailPage />}
            />
            <Route path="/admin/workflow/edit/:id" element={<WorkflowForm />} />
            <Route path="/admin/holidays" element={<AdminHolidayPage />} />
            <Route path="/settings" element={<Settings />} />
          </Route>{" "}
          {/* --- Manager Routes --- */}
          <Route element={<ProtectedRoute allowedRoles={["Manager"]} />}>
            <Route path="/manager/dashboard" element={<ManagerDashboard />} />
            <Route path="/manager/employees" element={<ManagerEmployees />} />
            <Route
              path="/manager/employees/:id"
              element={<ManagerViewEmployeeDetails />}
            />
            <Route path="/manager/request" element={<Request />} />
            <Route
              path="/manager/my-attendance"
              element={<ManagerAttendance />}
            />{" "}
            {/* Chấm công cá nhân */}
            <Route
              path="/manager/attendance"
              element={<ManagerAttendancePage />}
            />{" "}
            {/* Xem phòng ban */}
            <Route path="/manager/holidays" element={<DepartmentCalendarPage />} />
          </Route>
          {/* --- Employee Routes --- */}
          <Route element={<ProtectedRoute allowedRoles={["Employee"]} />}>
            <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
            <Route path="/employee/requests" element={<Request />} />
            <Route
              path="/employee/attendance"
              element={<EmployeeAttendance />}
            />
            <Route path="/employee/holidays" element={<DepartmentCalendarPage />} />
          </Route>
          {/* --- Shared Routes (All roles can access) --- */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["Admin", "Manager", "Employee"]} />
            }
          >
            <Route path="/my-profile" element={<MyProfile />} />
          </Route>
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
