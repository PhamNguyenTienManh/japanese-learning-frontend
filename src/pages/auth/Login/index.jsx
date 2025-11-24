import { useState } from "react";
import Button from "~/components/Button";
import styles from "./LoginPage.module.scss";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faEnvelope,
  faLock,
} from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import Input from "~/components/Input";

const cx = classNames.bind(styles);

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("[Login attempt]", { email, password });
  };

  return (
    <div className={cx("wrapper")}>
      <div className={cx("card")}>
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
          <h1>Đăng nhập</h1>
          <p>Chào mừng bạn quay trở lại!</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={cx("form")}>
          {/* Email */}
          <div className={cx("form-group")}>
            <label htmlFor="email">Email</label>
            <Input
              className={"auth"}
              type="email"
              name="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<FontAwesomeIcon icon={faEnvelope} />}
            />
          </div>

          {/* Password */}
          <div className={cx("form-group")}>
            <div className={cx("label-row")}>
              <label htmlFor="password">Mật khẩu</label>
              <Button to="/forgot-password" text className={"link"}>
                Quên mật khẩu?
              </Button>
            </div>
            <Input
              className={"auth"}
              type="password"
              name="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<FontAwesomeIcon icon={faLock} />}
              showToggleIcon
            />
          </div>

          <Button primary className={"submit"} type="submit">
            Đăng nhập
          </Button>
        </form>

        {/* Divider */}
        <div className={cx("divider")}>
          <span>hoặc</span>
        </div>

        {/* Google Login */}
        <Button
          outline
          className={"google"}
          onClick={() =>     window.location.href = "http://localhost:9090/api/auth/google"}
          leftIcon={<FontAwesomeIcon icon={faGoogle} />}
        >
          Đăng nhập với Google
        </Button>

        {/* Sign up link */}
        <p className={cx("register-text")}>
          Chưa có tài khoản?
          <Button to="/signup" text className={"link"}>
            Đăng ký ngay
          </Button>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
