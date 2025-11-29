import { createContext, useContext, useEffect, useState } from "react";
import decodeToken from "~/services/pairToken";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({
    isLoggedIn: false,
    userId: null,
    role: null,
    email: null,
    exp: null,
  });

  const loadAuth = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setAuth({
        isLoggedIn: false,
        userId: null,
        role: null,
        email: null,
        exp: null,
      });
      return;
    }

    try {
      const payload = decodeToken(token);
      const isExpired = payload.exp * 1000 < Date.now();

      setAuth({
        isLoggedIn: !isExpired,
        userId: payload.sub || null,
        role: payload.role || null,
        email: payload.email || null,
        exp: payload.exp || null,
      });
    } catch (err) {
      console.error("Token decode failed:", err);
      setAuth({
        isLoggedIn: false,
        userId: null,
        role: null,
        email: null,
        exp: null,
      });
    }
  };

  // ✔ LOGOUT: xóa token + reload context
  const logout = () => {
    localStorage.clear();
    loadAuth();
  };

  // ✔ Check admin
  const isAdmin = () => auth.role === "admin";

  // ✔ Check role bất kỳ
  const hasRole = (role) => auth.role === role;

  useEffect(() => {
    loadAuth();

    // Lắng nghe token thay đổi ở tab khác
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
