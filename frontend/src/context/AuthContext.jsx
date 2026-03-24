import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem("ce-user");
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, role) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, role });
      setUser(data);
      localStorage.setItem("ce-user", JSON.stringify(data));
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, message: error.response?.data?.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("ce-user");
  };

  const value = { user, login, logout, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

