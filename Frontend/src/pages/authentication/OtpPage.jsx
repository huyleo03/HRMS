import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

export default function OtpPage() {
  const [otp, setOtp] = useState(new Array(5).fill(""));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prevCountdown) => prevCountdown - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (value, index) => {
    if (/^[0-9]?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < otp.length - 1) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL_BACKEND}/auth/forgot-password`,
        { email }
      );
      toast.success("Một mã OTP mới đã được gửi đến email của bạn.");
      setCountdown(60);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Không thể gửi lại OTP";
      toast.error(errorMessage);
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (otp.includes("") || code.length < otp.length) {
      toast.warn("Vui lòng nhập đầy đủ mã OTP");
      return;
    }

    try {
      setIsSubmitting(true);
      // Gọi API verify-otp của backend
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL_BACKEND}/auth/verify-otp`,
        {
          email: email,
          otp: code,
        }
      );

      // Lấy resetToken từ response và lưu vào localStorage
      const { resetToken } = response.data;
      if (resetToken) {
        localStorage.setItem("reset_token", resetToken);
        toast.success("Xác thực OTP thành công!");

        setTimeout(() => {
          navigate("/reset-password", { state: { email } });
        }, 1500);
      } else {
        toast.error("Không nhận được token xác thực. Vui lòng thử lại.");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Xác thực OTP thất bại";
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
        {/* Back */}
        <div
          style={{
            marginBottom: 24,
            color: "#333",
            cursor: "pointer",
            fontSize: 16,
          }}
        >
          <Link
            to="/forgot-password"
            style={{ textDecoration: "none", color: "#333" }}
          >
            &#60; Back
          </Link>
        </div>

        {/* Title */}
        <div style={{ margin: "30px 0" }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>
            Enter OTP
          </h1>
          <p style={{ color: "#7d7d7d" }}>
            We have shared a code to your registered email address
            <br />
            <b>{email || "your email"}</b>
          </p>
        </div>

        {/* OTP inputs */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "12px",
            margin: "20px 0",
          }}
        >
          {otp.map((digit, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              type="text"
              value={digit}
              maxLength={1}
              onChange={(e) => handleChange(e.target.value, i)}
              style={{
                width: "60px",
                height: "60px",
                textAlign: "center",
                fontSize: "24px",
                borderRadius: 12,
                border: "1px solid #7152F3",
                outline: "none",
              }}
            />
          ))}
        </div>

        {/* Verify button */}
        <button
          onClick={handleVerify}
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
            boxSizing: "border-box",
            display: "block",
            opacity: isSubmitting ? 0.7 : 1,
          }}
        >
          {isSubmitting ? "Đang xác thực..." : "Verify"}
        </button>

        <div style={{ marginTop: 24, textAlign: "center", color: "#7d7d7d" }}>
          Không nhận được mã?{" "}
          {countdown > 0 ? (
            <span style={{ color: "#333" }}>Gửi lại sau {countdown}s</span>
          ) : (
            <span
              onClick={handleResendOtp}
              style={{
                color: "#7152F3",
                fontWeight: 500,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Gửi lại mã
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
