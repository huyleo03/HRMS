import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isNewFocused, setIsNewFocused] = useState(false);
  const [isConfirmFocused, setIsConfirmFocused] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const email =
    location.state?.email ||
    searchParams.get("email") ||
    localStorage.getItem("reset_email");
  const otp =
    location.state?.otp ||
    searchParams.get("otp") ||
    localStorage.getItem("reset_otp");

  useEffect(() => {
  const resetToken = localStorage.getItem("reset_token");
  if (!resetToken || !email) {
    toast.error("Quy trình đặt lại mật khẩu không hợp lệ");
    navigate("/forgot-password");
  }
}, [email, navigate]);

  const handleReset = async () => {
    if (!newPassword || !confirmPassword) {
      toast.warn("Vui lòng nhập đầy đủ mật khẩu");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu không khớp");
      return;
    }

    if (newPassword.length < 8) {
      toast.warn("Mật khẩu phải có ít nhất 8 ký tự");
      return;
    }

    try {
      setIsSubmitting(true);

      // Lấy reset token từ localStorage
      const resetToken = localStorage.getItem("reset_token");

      if (!resetToken) {
        toast.error("Phiên làm việc đã hết hạn");
        navigate("/forgot-password");
        return;
      }

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL_BACKEND}/auth/reset-password`,
        {
          email,
          otp,
          newPassword,
          confirmPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${resetToken}`,
          },
        }
      );

      // Xoá reset token vì không cần nữa
      localStorage.removeItem("reset_token");

      toast.success("Đặt lại mật khẩu thành công!");

      // Chuyển hướng đến trang đăng nhập sau 1.5 giây
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Không thể đặt lại mật khẩu";

      toast.error(errorMessage);
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
          Reset Password
        </h1>

        {/* New Password */}
        <div style={{ position: "relative", marginBottom: 16 }}>
          <input
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            onFocus={() => setIsNewFocused(true)}
            onBlur={() => setIsNewFocused(false)}
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
          <label
            style={{
              position: "absolute",
              left: 16,
              top: isNewFocused || newPassword ? 7 : "50%",
              transform:
                isNewFocused || newPassword
                  ? "translateY(0)"
                  : "translateY(-50%)",
              fontSize: isNewFocused || newPassword ? 12 : 16,
              color: "#7152F3",
              pointerEvents: "none",
              transition: "all 0.2s ease",
            }}
          >
            New Password
          </label>

          <i
            className={showNewPassword ? "bi bi-eye" : "bi bi-eye-slash"}
            onClick={() => setShowNewPassword(!showNewPassword)}
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
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onFocus={() => setIsConfirmFocused(true)}
            onBlur={() => setIsConfirmFocused(false)}
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
          <label
            style={{
              position: "absolute",
              left: 16,
              top: isConfirmFocused || confirmPassword ? 7 : "50%",
              transform:
                isConfirmFocused || confirmPassword
                  ? "translateY(0)"
                  : "translateY(-50%)",
              fontSize: isConfirmFocused || confirmPassword ? 12 : 16,
              color: "#7152F3",
              pointerEvents: "none",
              transition: "all 0.2s ease",
            }}
          >
            Confirm New Password
          </label>

          <i
            className={showConfirmPassword ? "bi bi-eye" : "bi bi-eye-slash"}
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
          onClick={handleReset}
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
          {isSubmitting ? "Đang xử lý..." : "Reset Password"}
        </button>
      </div>
    </div>
  );
}
