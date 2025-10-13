import React, { createContext, useState, useContext, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("auth_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    if (storedToken) {
      try {
        const decodedToken = jwtDecode(storedToken);
        if (decodedToken.exp * 1000 > Date.now()) {
          const userInfo = JSON.parse(localStorage.getItem("user_info"));
          if (userInfo) {
            setUser(userInfo);
            setToken(storedToken);
          }
        } else {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user_info");
        }
      } catch (error) {
        console.error("Invalid token:", error);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_info");
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken, newUserInfo) => {
    localStorage.setItem("auth_token", newToken);
    localStorage.setItem("user_info", JSON.stringify(newUserInfo));
    setToken(newToken);
    setUser(newUserInfo);
  };

  const updateUser = (updatedUserInfo) => {
    const newUserInfo = { ...user, ...updatedUserInfo };
    localStorage.setItem("user_info", JSON.stringify(newUserInfo));
    setUser(newUserInfo);
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_info");
    localStorage.removeItem("remember_email");
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === "Admin",
    isManager: user?.role === "Manager",
    isEmployee: user?.role === "Employee",
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext);
}
