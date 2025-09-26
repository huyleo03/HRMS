import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import ForgotPass from './pages/ForgotPass';
import OtpPage from './pages/OtpPage';
import ResetPass from './pages/ResetPass';
import Dashboard from './pages/Dashboard/Dashboard';
import Employees from './pages/AllEmpoyeePage/AllEmployeePage.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Authentication Routes - No Layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPass />} />
        <Route path="/otp-page" element={<OtpPage />} />
        <Route path="/reset-password" element={<ResetPass />} />
        
        {/* Application Routes - With Layout */}
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/employees" element={<Layout><Employees /></Layout>} />
        <Route path="/departments" element={<Layout><div style={{padding: '24px'}}><h1>Departments Page</h1><p>This page is under development</p></div></Layout>} />
        <Route path="/attendance" element={<Layout><div style={{padding: '24px'}}><h1>Attendance Page</h1><p>This page is under development</p></div></Layout>} />
        <Route path="/payroll" element={<Layout><div style={{padding: '24px'}}><h1>Payroll Page</h1><p>This page is under development</p></div></Layout>} />
        <Route path="/leaves" element={<Layout><div style={{padding: '24px'}}><h1>Leaves Page</h1><p>This page is under development</p></div></Layout>} />
        <Route path="/holidays" element={<Layout><div style={{padding: '24px'}}><h1>Holidays Page</h1><p>This page is under development</p></div></Layout>} />
        <Route path="/settings" element={<Layout><div style={{padding: '24px'}}><h1>Settings Page</h1><p>This page is under development</p></div></Layout>} /> 
      </Routes>
    </BrowserRouter>
  );
}

export default App;
