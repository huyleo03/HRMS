import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../../contexts/AuthContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const rememberedEmail = localStorage.getItem("remember_email");
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    if (!email || !password) {
      setErrorMessage("Vui lòng nhập email và mật khẩu.");
      return;
    }
    try {
      setIsSubmitting(true);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL_BACKEND}/auth/login`,
        {
          email,
          password,
        }
      );
      const data = response.data;
      console.log("Received Token:", data.token);
      if (data && data.token) {
        localStorage.setItem("auth_token", data.token);
        const decodedToken = jwtDecode(data.token);
        const userInfo = {
          id: decodedToken.sub,
          role: decodedToken.role,
          name: decodedToken.name,
          avatar: decodedToken.avatar,
          email: decodedToken.email,
          profileCompleted: decodedToken.profileCompleted,
        };

        login(data.token, userInfo);
        if (rememberMe) {
          localStorage.setItem("remember_email", email);
        } else {
          localStorage.removeItem("remember_email");
        }
        toast.success("Đăng nhập thành công!");
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Có lỗi xảy ra, vui lòng thử lại.";

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
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 400, padding: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 40,
          }}
        >
          <img src="/logo.png" alt="logo" style={{ width: 50, height: 50 }} />
          <h1>HRMS</h1>
        </div>

        <div>
          <h1 style={{ margin: 0 }}>Welcome 👋</h1>
          <p style={{ marginTop: 0, color: "#A2A1A8" }}>Please login here</p>
        </div>

        {errorMessage ? (
          <div
            style={{
              marginBottom: 16,
              padding: "10px 12px",
              background: "#fef2f2",
              color: "#b42318",
              border: "1px solid #fecaca",
              borderRadius: 8,
            }}
          >
            {errorMessage}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} style={{ marginTop: 30 }}>
          <div style={{ position: "relative", marginBottom: 16 }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setIsEmailFocused(true)}
              onBlur={() => setIsEmailFocused(false)}
              style={{
                width: "100%",
                padding: "16px 12px 0 16px",
                border: "1px solid #7152F3",
                borderRadius: 8,
                height: 50,
                fontSize: 16,
                boxSizing: "border-box",
              }}
              autoComplete="username"
            />
            <label
              style={{
                position: "absolute",
                left: 16,
                top: isEmailFocused || email ? 7 : "50%",
                transform:
                  isEmailFocused || email
                    ? "translateY(0)"
                    : "translateY(-50%)",
                fontSize: isEmailFocused || email ? 12 : 16,
                color: "#7152F3",
                pointerEvents: "none",
                transition: "all 0.2s ease",
              }}
            >
              Email
            </label>
          </div>

          <div style={{ position: "relative", marginBottom: 16 }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
              style={{
                width: "100%",
                padding: "16px 12px 0 16px",
                border: "1px solid #7152F3",
                borderRadius: 8,
                height: 50,
                fontSize: 16,
                boxSizing: "border-box",
              }}
              autoComplete="current-password"
            />
            <label
              style={{
                position: "absolute",
                left: 16,
                top: isPasswordFocused || password ? 7 : "50%",
                transform:
                  isPasswordFocused || password
                    ? "translateY(0)"
                    : "translateY(-50%)",
                fontSize: isPasswordFocused || password ? 12 : 16,
                color: "#7152F3",
                pointerEvents: "none",
                transition: "all 0.2s ease",
              }}
            >
              Password
            </label>

            <i
              className={showPassword ? "bi bi-eye" : "bi bi-eye-slash"}
              onClick={() => setShowPassword(!showPassword)}
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

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 16,
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  marginRight: 8,
                  background: "#7152F3",
                  height: 24,
                  width: 24,
                  accentColor: "#7152F3",
                }}
              />
              <label
                htmlFor="rememberMe"
                style={{ color: "#344054", fontSize: 16 }}
              >
                Remember me
              </label>
            </div>
            <Link
              to="/forgot-password"
              style={{ color: "#7152F3", fontSize: 14, textDecoration: "none" }}
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: "100%",
              padding: "20px",
              background: "#7152F3",
              color: "#ffffff",
              border: "none",
              borderRadius: 8,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              fontWeight: 500,
              fontSize: 16,
              display: "block",
              boxSizing: "border-box",
            }}
          >
            {isSubmitting ? "Logging..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
