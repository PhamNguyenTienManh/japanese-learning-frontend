import { createContext, useCallback, useContext, useEffect, useState } from "react";
import authService from "~/services/authService";
import { getProfile } from "~/services/profileService";

const AuthContext = createContext(null);

const EMPTY_AUTH = {
  isLoggedIn: false,
  userId: null,
  role: null,
  email: null,
  exp: null,
  isPremium: false,
  premiumExpiredDate: null,
  name: null,
  avatar: null,
};

function buildAuthFromSession(session) {
  if (!session) return EMPTY_AUTH;

  const isExpired = session.exp ? session.exp * 1000 < Date.now() : false;
  if (isExpired) return EMPTY_AUTH;

  return {
    isLoggedIn: true,
    userId: session.sub || null,
    role: session.role || null,
    email: session.email || null,
    exp: session.exp || null,
    isPremium: Boolean(session.isPremium),
    premiumExpiredDate: session.premiumExpiredDate || null,
    name: localStorage.getItem("userName") || null,
    avatar: localStorage.getItem("userAvatar") || null,
  };
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(EMPTY_AUTH);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = useCallback(async () => {
    try {
      const profile = await getProfile();
      const data = profile?.data;
      if (!data) return;

      const name = data.name || "";
      const avatar = data.image_url || "";
      if (name) localStorage.setItem("userName", name);
      if (avatar) localStorage.setItem("userAvatar", avatar);

      setAuth((prev) => ({ ...prev, name, avatar }));
    } catch (err) {
      console.error("Failed to load user profile:", err);
    }
  }, []);

  const loadAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const session = await authService.getSession();
      setAuth(buildAuthFromSession(session));
    } catch (err) {
      console.error("Failed to load auth session:", err);
      setAuth(EMPTY_AUTH);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    await loadAuth();
  }, [loadAuth]);

  const logout = useCallback(async () => {
    await authService.logout();
    setAuth(EMPTY_AUTH);
  }, []);

  const isAdmin = () => auth.role === "admin";
  const hasRole = (role) => auth.role === role;

  useEffect(() => {
    loadAuth();
    window.addEventListener("storage", loadAuth);
    return () => {
      window.removeEventListener("storage", loadAuth);
    };
  }, [loadAuth]);

  useEffect(() => {
    if (auth.isLoggedIn && (auth.name === null || auth.avatar === null)) {
      fetchUserProfile();
    }
  }, [auth.isLoggedIn, auth.name, auth.avatar, fetchUserProfile]);

  return (
    <AuthContext.Provider
      value={{
        ...auth,
        isLoading,
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
