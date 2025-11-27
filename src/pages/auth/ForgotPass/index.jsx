import { useState } from "react";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faEnvelope } from "@fortawesome/free-solid-svg-icons";

import styles from "./ForgotPass.module.scss";
import Button from "~/components/Button";
import Input from "~/components/Input";
import Card from "~/components/Card";
import OTPModal from "~/components/OTPModal";
import authService from "~/services/authService";

const cx = classNames.bind(styles);

function ForgotPass() {
  const [email, setEmail] = useState("");
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      alert("Vui lòng nhập email!");
      return;
    }

    setIsLoading(true);

    try {
      await authService.forgotPassword(email);
      
      // Hiển thị modal OTP để reset password
      setShowOTPModal(true);
      
      alert("Mã OTP đã được gửi đến email của bạn!");
    } catch (error) {
      alert(error.message || "Gửi yêu cầu thất bại. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (otpCode) => {
    // Sẽ được xử lý trong ResetPasswordModal
    // Ở đây chỉ cần chuyển sang bước nhập mật khẩu mới
    try {
      // Tùy vào flow của bạn:
      // Option 1: Redirect sang trang reset password với OTP
      window.location.href = `/reset-password?email=${email}&otp=${otpCode}`;
      
      // Option 2: Hoặc hiển thị form nhập password mới ngay trong modal
      // (Cần tạo thêm ResetPasswordModal)
    } catch (error) {
      throw error;
    }
  };

  return (
    <>
      <div className={cx("wrapper")}>
        <Card className={"auth"}>
          <Button
            to="/login"
            back
            leftIcon={<FontAwesomeIcon icon={faArrowLeft} />}
          >
            Quay lại đăng nhập
          </Button>

          <div className={cx("header")}>
            <h1>Quên mật khẩu</h1>
            <p>Nhập email của bạn để đặt lại mật khẩu</p>
          </div>

          <form onSubmit={handleSubmit} className={cx("form")}>
            <div className={cx("form-group")}>
              <label htmlFor="email">Email</label>
              <Input
                type="email"
                name="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<FontAwesomeIcon icon={faEnvelope} />}
                required
                disabled={isLoading}
              />
            </div>

            <Button primary type="submit" className={"submit"} disabled={isLoading}>
              {isLoading ? "Đang gửi..." : "Gửi yêu cầu"}
            </Button>
          </form>
        </Card>
      </div>

      {/* OTP Modal */}
      {showOTPModal && (
        <OTPModal
          email={email}
          onClose={() => setShowOTPModal(false)}
          onVerify={handleVerifyOTP}
        />
      )}
    </>
  );
}

export default ForgotPass;