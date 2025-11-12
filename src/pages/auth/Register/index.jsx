import { useState } from "react";
import Button from "~/components/Button";
import Input from "~/components/Input";
import styles from "./Register.module.scss";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faEnvelope,
  faLock,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { Link } from "react-router-dom";

const cx = classNames.bind(styles);

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Mật khẩu không khớp!");
      return;
    }

    if (!formData.agreeToTerms) {
      alert("Vui lòng đồng ý với điều khoản sử dụng");
      return;
    }

    console.log("[Signup attempt]", formData);
  };

  return (
    <div className={cx("wrapper")}>
      <div className={cx("card")}>
        {/* Back to home */}
        <Button
          to="/"
          text
          className={"back-link"}
          leftIcon={<FontAwesomeIcon icon={faArrowLeft} />}
        >
          Quay lại trang chủ
        </Button>

        {/* Header */}
        <div className={cx("header")}>
          <h1>Tạo tài khoản</h1>
          <p>Bắt đầu hành trình học tiếng Nhật của bạn</p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className={cx("form")}>
          {/* Họ và tên */}
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
            />
          </div>

          {/* Email */}
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
            />
          </div>

          {/* Mật khẩu */}
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
            />
            <p className={cx("hint-text")}>Tối thiểu 8 ký tự</p>
          </div>

          {/* Xác nhận mật khẩu */}
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
            />
          </div>

          {/* Checkbox điều khoản */}
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
              Tôi đồng ý với{" "}
              <Link to="/terms" className={cx("link")}>
                Điều khoản sử dụng
              </Link>{" "}
              và{" "}
              <Link to="/privacy" className={cx("link")}>
                Chính sách bảo mật
              </Link>
            </label>
          </div>

          {/* Submit */}
          <Button primary type="submit" className={"submit"}>
            Đăng ký
          </Button>
        </form>

        {/* Divider */}
        <div className={cx("divider")}>
          <span>hoặc</span>
        </div>

        {/* Google Signup */}
        <Button
          outline
          className={"google"}
          onClick={() => console.log("[Google signup]")}
          leftIcon={<FontAwesomeIcon icon={faGoogle} />}
        >
          Đăng ký với Google
        </Button>

        {/* Login link */}
        <p className={cx("register-text")}>
          Đã có tài khoản?
          <Button to="/login" text className={"link"}>
            Đăng nhập
          </Button>
        </p>
      </div>
    </div>
  );
}

export default Register;
