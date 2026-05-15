import { createContext, useContext, useEffect, useState, useCallback } from "react";
import decodeToken from "~/services/pairToken";
import { getProfile } from "~/services/profileService";

const AuthContext = createContext(null);

const EMPTY_AUTH = {
  isLoggedIn: false,
  userId: null,
  role: null,
  email: null,
  exp: null,
  isPremium: false,
  name: null,
  avatar: null,
};

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
      isPremium: localStorage.getItem("isPremium") === "true",
      name: localStorage.getItem("userName") || null,
      avatar: localStorage.getItem("userAvatar") || null,
    };
  } catch (err) {
    console.error("Token decode failed:", err);
    return EMPTY_AUTH;
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readAuthFromStorage);

  const loadAuth = useCallback(() => {
    setAuth(readAuthFromStorage());
  }, []);

  const fetchUserProfile = useCallback(async () => {
    if (!localStorage.getItem("token")) return;
    try {
      const profile = await getProfile();
      const data = profile?.data;
      if (!data) return;

      const name = data.name || "";
      const avatar = data.image_url || "";
      localStorage.setItem("userName", name);
      localStorage.setItem("userAvatar", avatar);

      setAuth((prev) => ({ ...prev, name, avatar }));
    } catch (err) {
      console.error("Failed to load user profile:", err);
    }
  }, []);

  const refreshAuth = useCallback(() => {
    loadAuth();
    fetchUserProfile();
  }, [loadAuth, fetchUserProfile]);

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
  }, [loadAuth]);

  // Fetch profile whenever we transition into a logged-in state
  useEffect(() => {
    if (auth.isLoggedIn && (!auth.name || !auth.avatar)) {
      fetchUserProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.isLoggedIn]);

  return (
    <AuthContext.Provider
      value={{
        ...auth,
        refreshAuth,
        refreshProfile: fetchUserProfile,
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
