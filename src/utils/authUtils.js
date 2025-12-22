// ~/utils/authUtils.js
import { useLocation, Navigate } from "react-router-dom";
import decodeToken from "~/services/pairToken";

export function getToken() {
    return localStorage.getItem("token");
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
    const payload = decodeToken(localStorage.getItem('token'))
    const location = useLocation();
    
    if (!payload || payload.role !== "admin") {
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

