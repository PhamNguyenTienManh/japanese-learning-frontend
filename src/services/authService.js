// src/services/authService.js

const API_BASE_URL = "http://localhost:9090/api";

class AuthService {
  // Đăng nhập bằng email và password
  async login(email, password) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
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

  // Lưu token vào localStorage
  saveToken(token) {
    localStorage.setItem("token", token);
  }

  // Lấy token từ localStorage
  getToken() {
    return localStorage.getItem("token");
  }

  // Xóa token (logout)
  removeToken() {
    localStorage.removeItem("token");
    localStorage.removeItem("study_login_time");
  }

  // Kiểm tra đã đăng nhập chưa
  isAuthenticated() {
    return !!this.getToken();
  }

  // Đăng ký tài khoản mới
  async register(email, username, password) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
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

  // Lấy URL đăng nhập Google
  getGoogleLoginUrl() {
    return `${API_BASE_URL}/auth/google`;
  }

  // Xử lý callback từ Google (lấy token từ URL params)
  handleGoogleCallback() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      this.saveToken(token);
      // Xóa token khỏi URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return token;
    }

    return null;
  }
}

// Export instance để sử dụng như singleton
export default new AuthService();