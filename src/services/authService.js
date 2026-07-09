// src/services/authService.js

const API_BASE_URL = process.env.REACT_APP_API_URL;
const SESSION_REFRESH_THRESHOLD_MS = 60 * 1000;

class AuthService {
  // Đăng nhập bằng email và password
  async login(email, password) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Đăng nhập thất bại");
      }

      return data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  // Token is set by the backend as an HttpOnly cookie.
  saveToken(token) {
    return token;
  }

  // JavaScript cannot read the HttpOnly auth cookie.
  getToken() {
    return null;
  }

  // Xóa token (logout)
  removeToken() {
    localStorage.removeItem("study_login_time");
    localStorage.removeItem("userName");
    localStorage.removeItem("userAvatar");
    localStorage.removeItem("isPremium");
    localStorage.removeItem("premiumDate");
    localStorage.removeItem("premiumExpiredDate");
  }

  // Kiểm tra đã đăng nhập chưa
  isAuthenticated() {
    return false;
  }

  async refreshSession() {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (res.status === 401) {
      return null;
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || "Khong the lam moi phien dang nhap");
    }

    return data;
  }

  async getSession(options = {}) {
    const { allowRefresh = true } = options;
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (res.status === 401) {
      if (allowRefresh) {
        const refreshed = await this.refreshSession();
        if (refreshed) {
          return this.getSession({ allowRefresh: false });
        }
      }
      return null;
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Không thể lấy phiên đăng nhập");
    }

    const session = data.data || data;
    const expiresAt = session?.exp ? session.exp * 1000 : null;
    if (
      allowRefresh &&
      expiresAt &&
      expiresAt - Date.now() <= SESSION_REFRESH_THRESHOLD_MS
    ) {
      const refreshed = await this.refreshSession();
      if (refreshed) {
        return this.getSession({ allowRefresh: false });
      }
    }

    return session;
  }

  async logout() {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok && res.status !== 401) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Đăng xuất thất bại");
      }
    } finally {
      this.removeToken();
    }
  }

  // Đăng ký tài khoản mới
  async register(email, username, password) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Đăng ký thất bại");
      }

      return data;
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    }
  }

  // Xác thực OTP sau khi đăng ký
  async verifyRegister(email, otp) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-register`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Xác thực OTP thất bại");
      }

      return data;
    } catch (error) {
      console.error("Verify OTP error:", error);
      throw error;
    }
  }

  // Gửi yêu cầu reset mật khẩu
  async forgotPassword(email) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gửi yêu cầu thất bại");
      }

      return data;
    } catch (error) {
      console.error("Forgot password error:", error);
      throw error;
    }
  }

  // Xác thực OTP reset mật khẩu
  async verifyResetPassword(email, otp, password) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Đặt lại mật khẩu thất bại");
      }

      return data;
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    }
  }

  async changePassword({ currentPassword, newPassword }) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Đổi mật khẩu thất bại");
      }

      return data;
    } catch (error) {
      console.error("Change password error:", error);
      throw error;
    }
  }

  // Lấy URL đăng nhập Google
  getGoogleLoginUrl() {
    return `${API_BASE_URL}/auth/google`;
  }

  // Xử lý callback từ Google (lấy token từ URL params)
  handleGoogleCallback() {
    const params = new URLSearchParams(window.location.search);
    const isGoogleSuccess = params.get("google") === "success";

    if (isGoogleSuccess) {
      // Xóa token khỏi URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return true;
    }

    return false;
  }
}

// Export instance để sử dụng như singleton
const authService = new AuthService();

export default authService;
