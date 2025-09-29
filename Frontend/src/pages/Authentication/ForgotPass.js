import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.warn("Vui lòng nhập email");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL_BACKEND}/api/auth/forgot-password`,
        { email }
      );
      localStorage.setItem("reset_token", response.data.resetToken);

      toast.success("OTP đã được gửi đến email của bạn");

      setTimeout(() => {
        navigate("/otp-page", { state: { email } });
      }, 1500);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Không thể gửi OTP, vui lòng thử lại";

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
        <div
          style={{
            marginBottom: 24,
            color: "#333",
            cursor: "pointer",
            fontSize: 16,
          }}
        >
          <Link to="/" style={{ textDecoration: "none", color: "#333" }}>
            &#60; Back
          </Link>
        </div>

        <div style={{ margin: "30px 0" }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>
            Forgot Password
          </h1>
          <p style={{ color: "#7d7d7d" }}>
            Enter your registered email address. We’ll send you a code to reset
            your password.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ position: "relative", marginBottom: 24 }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              style={{
                width: "100%",
                padding: "16px 12px 0 16px",
                border: "1px solid #7152F3",
                borderRadius: 12,
                height: 55,
                fontSize: 16,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <label
              style={{
                position: "absolute",
                left: 16,
                top: isFocused || email ? 7 : "50%",
                transform:
                  isFocused || email ? "translateY(0)" : "translateY(-50%)",
                fontSize: isFocused || email ? 13 : 16,
                color: "#7152F3",
                pointerEvents: "none",
                transition: "all 0.2s ease",
              }}
            >
              Email Address
            </label>
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              height: 55,
              background: "#7152F3",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 500,
              cursor: "pointer",
              boxSizing: "border-box",
              display: "block",
            }}
          >
            Send OTP
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
