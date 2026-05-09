import { createContext, useContext, useEffect, useState } from "react";
import decodeToken from "~/services/pairToken";

const AuthContext = createContext(null);

const EMPTY_AUTH = {
  isLoggedIn: false,
  userId: null,
  role: null,
  email: null,
  exp: null,
};

// Đọc auth state từ localStorage một cách synchronous —
// dùng cho useState initializer để render đầu tiên đã có giá trị đúng,
// tránh case các trang phụ thuộc isLoggedIn render trước khi useEffect chạy.
function readAuthFromStorage() {
  if (typeof window === "undefined") return EMPTY_AUTH;
  const token = localStorage.getItem("token");
  if (!token) return EMPTY_AUTH;
  try {
    const payload = decodeToken(token);
    if (!payload) return EMPTY_AUTH;
    const isExpired = payload.exp ? payload.exp * 1000 < Date.now() : false;
    return {
      isLoggedIn: !isExpired,
      userId: payload.sub || null,
      role: payload.role || null,
      email: payload.email || null,
      exp: payload.exp || null,
    };
  } catch (err) {
    console.error("Token decode failed:", err);
    return EMPTY_AUTH;
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readAuthFromStorage);

  const loadAuth = () => {
    setAuth(readAuthFromStorage());
  };

  const logout = () => {
    localStorage.clear();
    loadAuth();
  };

  const isAdmin = () => auth.role === "admin";

  const hasRole = (role) => auth.role === role;

  useEffect(() => {
    loadAuth();

    window.addEventListener("storage", loadAuth);

    return () => {
      window.removeEventListener("storage", loadAuth);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...auth,
        refreshAuth: loadAuth,
        logout,
        isAdmin,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
