import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
export default function OtpPage() {
  const [otp, setOtp] = useState(Array(5).fill(""));
  const location = useLocation();
  const navigate = useNavigate();

  const email = location?.state?.email || "";

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

  const handleVerify = () => {
    const code = otp.join("");
    console.log("OTP nhập vào:", code);

    if (otp.includes("") || code.length < otp.length) {
      toast.warn("Vui lòng nhập đầy đủ mã OTP");
      return;
    }

    localStorage.setItem("reset_email", email);
    localStorage.setItem("reset_otp", code);
    navigate("/reset-password");
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
          Verify
        </button>
      </div>
    </div>
  );
}
