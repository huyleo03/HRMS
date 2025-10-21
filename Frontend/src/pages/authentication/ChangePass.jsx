import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

export default function ChangePasswordPage() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.warn("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu mới và xác nhận không khớp");
      return;
    }

    try {
      setIsSubmitting(true);

      // Lấy token từ localStorage (token đăng nhập)
      const token = localStorage.getItem("auth_token");
      if (!token) {
        toast.error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
        navigate("/login");
        return;
      }

      const apiBaseUrl = window.location.hostname.includes('onrender.com')
        ? 'https://hrms-1-2h7w.onrender.com'
        : (process.env.REACT_APP_API_BASE_URL || 'http://localhost:9999');
      
      const res = await axios.post(
        `${apiBaseUrl}/api/auth/change-password`,
        { oldPassword, newPassword, confirmPassword },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success(res.data.message || "Đổi mật khẩu thành công!");

      setTimeout(() => {
        navigate("/dashboard"); // hoặc /login nếu bạn muốn bắt đăng nhập lại
      }, 1500);
    } catch (err) {
      const msg =
        err.response?.data?.message || "Không thể đổi mật khẩu, vui lòng thử lại.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f9f8fc",
        padding: 20,
      }}
    >
      <div style={{ maxWidth: 430, width: "100%" }}>
        <h1 style={{ textAlign: "center", marginBottom: 40 }}>
          Change Password
        </h1>

        {/* Old Password */}
        <div style={{ position: "relative", marginBottom: 16 }}>
          <input
            type={showOld ? "text" : "password"}
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="Old Password"
            style={{
              width: "100%",
              padding: "16px 12px 0 16px",
              border: "1px solid #7152F3",
              borderRadius: 8,
              height: 50,
              fontSize: 16,
              boxSizing: "border-box",
            }}
          />
          <i
            className={showOld ? "bi bi-eye" : "bi bi-eye-slash"}
            onClick={() => setShowOld(!showOld)}
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              cursor: "pointer",
              fontSize: 18,
            }}
          ></i>
        </div>

        {/* New Password */}
        <div style={{ position: "relative", marginBottom: 16 }}>
          <input
            type={showNew ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New Password"
            style={{
              width: "100%",
              padding: "16px 12px 0 16px",
              border: "1px solid #7152F3",
              borderRadius: 8,
              height: 50,
              fontSize: 16,
              boxSizing: "border-box",
            }}
          />
          <i
            className={showNew ? "bi bi-eye" : "bi bi-eye-slash"}
            onClick={() => setShowNew(!showNew)}
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              cursor: "pointer",
              fontSize: 18,
            }}
          ></i>
        </div>

        {/* Confirm Password */}
        <div style={{ position: "relative", marginBottom: 24 }}>
          <input
            type={showConfirm ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm Password"
            style={{
              width: "100%",
              padding: "16px 12px 0 16px",
              border: "1px solid #7152F3",
              borderRadius: 8,
              height: 50,
              fontSize: 16,
              boxSizing: "border-box",
            }}
          />
          <i
            className={showConfirm ? "bi bi-eye" : "bi bi-eye-slash"}
            onClick={() => setShowConfirm(!showConfirm)}
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              cursor: "pointer",
              fontSize: 18,
            }}
          ></i>
        </div>

        {/* Button */}
        <button
          onClick={handleChangePassword}
          disabled={isSubmitting}
          style={{
            width: "100%",
            height: 55,
            background: "#7152F3",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 500,
            cursor: isSubmitting ? "not-allowed" : "pointer",
            opacity: isSubmitting ? 0.7 : 1,
            display: "block",
          }}
        >
          {isSubmitting ? "Đang xử lý..." : "Change Password"}
        </button>
      </div>
    </div>
  );
}
