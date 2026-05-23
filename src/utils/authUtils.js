// ~/utils/authUtils.js
import { useLocation, Navigate } from "react-router-dom";
import decodeToken from "~/services/pairToken";
import { useAuth } from "~/context/AuthContext";

export function getToken() {
    return null;
}

export function decodeUser() {
    const token = getToken();
    if (!token) return null;

    try {
        return decodeToken(token); // payload: { sub, email, role, exp, ... }
    } catch (err) {
        console.error("Token decode error:", err);
        return null;
    }
}

export function isTokenExpired() {
    const payload = decodeUser();
    if (!payload || !payload.exp) return true;

    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
}

export function getUserId() {
    const payload = decodeUser();
    return payload?.sub || null;
}

export function getUserRole() {
    const payload = decodeUser();
    return payload?.role || null;
}

export function isLoggedIn() {
    const token = getToken();
    if (!token) return false;

    return !isTokenExpired();
}

// Trả về info đầy đủ để component sử dụng
export function getAuthInfo() {
    const payload = decodeUser();

    return {
        isLoggedIn: !!payload && !isTokenExpired(),
        userId: payload?.sub || null,
        email: payload?.email || null,
        role: payload?.role || null,
        exp: payload?.exp || null
    };
}
export const AdminGuard = ({ children }) => {
    const { role, isLoading } = useAuth();
    const location = useLocation();
    
    if (isLoading) return null;

    if (role !== "admin") {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  return children;
};

