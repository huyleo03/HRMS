import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import ForgotPass from './pages/ForgotPass';
import OtpPage from './pages/OtpPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPass />} />
        <Route path="/otp-page" element={<OtpPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
