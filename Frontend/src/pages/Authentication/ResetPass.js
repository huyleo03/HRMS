import { useState } from "react";

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isNewFocused, setIsNewFocused] = useState(false);
  const [isConfirmFocused, setIsConfirmFocused] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleReset = () => {
    if (!newPassword || !confirmPassword) {
      alert("Vui lòng nhập đầy đủ mật khẩu");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Mật khẩu không khớp");
      return;
    }
    console.log("Mật khẩu mới:", newPassword);
    // Gọi API reset password ở đây
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
        <h1 style={{ textAlign: "center", marginBottom: 40 }}>Reset Password</h1>

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
            display: "block",
          }}
        >
          Reset Password
        </button>
      </div>
    </div>
  );
}
