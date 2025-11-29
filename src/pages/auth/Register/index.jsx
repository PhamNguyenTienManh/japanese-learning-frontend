import { useState } from "react";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import {
  faArrowLeft,
  faEnvelope,
  faLock,
  faUser,
} from "@fortawesome/free-solid-svg-icons";

import styles from "./Register.module.scss";
import Button from "~/components/Button";
import Input from "~/components/Input";
import Card from "~/components/Card";
import OTPModal from "~/components/OTPModal";
import authService from "~/services/authService";
import { useToast } from "~/context/ToastContext";

const cx = classNames.bind(styles);

function Register() {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  const [showOTPModal, setShowOTPModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      addToast("Mật khẩu không khớp!", "error");
      return;
    }

    if (formData.password.length < 8) {
      addToast("Mật khẩu phải có ít nhất 8 ký tự!", "error");
      return;
    }

    if (!formData.agreeToTerms) {
      addToast("Vui lòng đồng ý với điều khoản sử dụng", "error");
      return;
    }

    setIsLoading(true);

    try {
      await authService.register(
        formData.email,
        formData.name,
        formData.password
      );

      addToast("Đăng ký thành công! Vui lòng xác thực OTP", "success");
      setShowOTPModal(true);
    } catch (error) {
      addToast(error.message || "Đăng ký thất bại. Vui lòng thử lại!", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (otpCode) => {
    try {
      const data = await authService.verifyRegister(formData.email, otpCode);

      if (data.data?.access_token) {
        authService.saveToken(data.data.access_token);
      }

      addToast("Đăng ký thành công!", "success");
      setShowOTPModal(false);

      // Chuyển hướng đến trang đăng nhập
      window.location.href = "/login";
    } catch (error) {
      throw error; // OTPModal sẽ hiển thị lỗi
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = authService.getGoogleLoginUrl();
  };

  return (
    <>
      <div className={cx("wrapper")}>
        <Card className={"auth"}>
          <Button to="/" back leftIcon={<FontAwesomeIcon icon={faArrowLeft} />}>
            Quay lại trang chủ
          </Button>

          <div className={cx("header")}>
            <h1>Tạo tài khoản</h1>
            <p>Bắt đầu hành trình học tiếng Nhật của bạn</p>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className={cx("form")}>
            <div className={cx("form-group")}>
              <label htmlFor="name">Họ và tên</label>
              <Input
                type="text"
                name="name"
                placeholder="Nguyễn Văn A"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                leftIcon={<FontAwesomeIcon icon={faUser} />}
                required
              />
            </div>

            <div className={cx("form-group")}>
              <label htmlFor="email">Email</label>
              <Input
                type="email"
                name="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                leftIcon={<FontAwesomeIcon icon={faEnvelope} />}
                required
              />
            </div>

            <div className={cx("form-group")}>
              <label htmlFor="password">Mật khẩu</label>
              <Input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                showToggleIcon
                leftIcon={<FontAwesomeIcon icon={faLock} />}
                required
              />
              <p className={cx("hint-text")}>Tối thiểu 8 ký tự</p>
            </div>

            <div className={cx("form-group")}>
              <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
              <Input
                type="password"
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                showToggleIcon
                leftIcon={<FontAwesomeIcon icon={faLock} />}
                required
              />
            </div>

            <div className={cx("terms")}>
              <input
                id="terms"
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={(e) =>
                  setFormData({ ...formData, agreeToTerms: e.target.checked })
                }
              />
              <label htmlFor="terms">
                Tôi đồng ý với
                <Button to="/terms" link>
                  Điều khoản sử dụng
                </Button>
                và
                <Button to="/privacy" link>
                  Chính sách bảo mật
                </Button>
              </label>
            </div>

            <Button primary type="submit" disabled={isLoading}>
              {isLoading ? "Đang xử lý..." : "Đăng ký"}
            </Button>
          </form>

          <div className={cx("divider")}>
            <span>hoặc</span>
          </div>

          <Button
            outline
            full
            onClick={handleGoogleSignup}
            leftIcon={<FontAwesomeIcon icon={faGoogle} />}
          >
            Đăng ký với Google
          </Button>

          <p className={cx("register-text")}>
            Đã có tài khoản?
            <Button to="/login" link>
              Đăng nhập
            </Button>
          </p>
        </Card>
      </div>

      {/* OTP Modal */}
      {showOTPModal && (
        <OTPModal
          email={formData.email}
          onClose={() => setShowOTPModal(false)}
          onVerify={handleVerifyOTP}
        />
      )}
    </>
  );
}

export default Register;
