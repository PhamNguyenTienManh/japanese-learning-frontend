import { createContext, useCallback, useContext, useEffect, useState } from "react";
import authService from "~/services/authService";
import { getProfile } from "~/services/profileService";
import { extractPremiumState } from "~/utils/premium";

const AuthContext = createContext(null);

const EMPTY_AUTH = {
  isLoggedIn: false,
  userId: null,
  role: null,
  email: null,
  exp: null,
  isPremium: false,
  premiumDate: null,
  premiumExpiredDate: null,
  name: null,
  avatar: null,
};

const SESSION_REFRESH_THRESHOLD_MS = 60 * 1000;

function buildAuthFromSession(session) {
  if (!session) return EMPTY_AUTH;

  const isExpired = session.exp ? session.exp * 1000 < Date.now() : false;
  if (isExpired) return EMPTY_AUTH;

  const cachedPremium = {
    isPremium: localStorage.getItem("isPremium") === "true",
    premiumDate: localStorage.getItem("premiumDate") || null,
    premiumExpiredDate: localStorage.getItem("premiumExpiredDate") || null,
  };
  const premiumState = extractPremiumState(session, cachedPremium);

  return {
    isLoggedIn: true,
    userId: session.sub || null,
    role: session.role || null,
    email: session.email || null,
    exp: session.exp || null,
    ...premiumState,
    name: localStorage.getItem("userName") || null,
    avatar: localStorage.getItem("userAvatar") || null,
  };
}

function persistPremiumState({ isPremium, premiumDate, premiumExpiredDate }) {
  if (isPremium) {
    localStorage.setItem("isPremium", "true");
  } else {
    localStorage.removeItem("isPremium");
  }

  if (premiumDate) {
    localStorage.setItem("premiumDate", premiumDate);
  } else {
    localStorage.removeItem("premiumDate");
  }

  if (premiumExpiredDate) {
    localStorage.setItem("premiumExpiredDate", premiumExpiredDate);
  } else {
    localStorage.removeItem("premiumExpiredDate");
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(EMPTY_AUTH);
  const [isLoading, setIsLoading] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const fetchUserProfile = useCallback(async () => {
    try {
      const profile = await getProfile();
      const data = profile?.data ?? profile;
      if (!data) return;

      const name = data.name || "";
      const avatar = data.image_url || null;
      if (name) localStorage.setItem("userName", name);
      if (avatar) {
        localStorage.setItem("userAvatar", avatar);
      } else {
        localStorage.removeItem("userAvatar");
      }

      setAuth((prev) => {
        const premiumState = extractPremiumState(data, prev);
        persistPremiumState(premiumState);
        return { ...prev, ...premiumState, name, avatar };
      });
    } catch (err) {
      console.error("Failed to load user profile:", err);
    } finally {
      setProfileLoaded(true);
    }
  }, []);

  const loadAuth = useCallback(async (options = {}) => {
    const { showLoading = true } = options;
    if (showLoading) {
      setIsLoading(true);
    }
    setProfileLoaded(false);
    try {
      const session = await authService.getSession();
      const nextAuth = buildAuthFromSession(session);
      if (nextAuth.isLoggedIn) {
        persistPremiumState(nextAuth);
      }
      setAuth(nextAuth);
    } catch (err) {
      console.error("Failed to load auth session:", err);
      setAuth(EMPTY_AUTH);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    await loadAuth();
  }, [loadAuth]);

  const logout = useCallback(async () => {
    await authService.logout();
    setAuth(EMPTY_AUTH);
    setProfileLoaded(false);
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
    if (!auth.isLoggedIn || !auth.exp) return undefined;

    const expiresAt = auth.exp * 1000;
    const refreshDelay = Math.max(
      0,
      expiresAt - Date.now() - SESSION_REFRESH_THRESHOLD_MS,
    );

    const timeoutId = window.setTimeout(() => {
      loadAuth({ showLoading: false });
    }, refreshDelay);

    return () => window.clearTimeout(timeoutId);
  }, [auth.isLoggedIn, auth.exp, loadAuth]);

  useEffect(() => {
    if (auth.isLoggedIn && !profileLoaded) {
      fetchUserProfile();
    }
  }, [auth.isLoggedIn, profileLoaded, fetchUserProfile]);

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
