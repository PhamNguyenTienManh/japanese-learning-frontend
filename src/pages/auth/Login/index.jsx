import { useState } from "react";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import {
  faArrowLeft,
  faEnvelope,
  faLock,
} from "@fortawesome/free-solid-svg-icons";

import styles from "./LoginPage.module.scss";
import Button from "~/components/Button";
import Input from "~/components/Input";
import Card from "~/components/Card";

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
      <Card className={"auth"}>
        <Button to="/" back leftIcon={<FontAwesomeIcon icon={faArrowLeft} />}>
          Quay lại trang chủ
        </Button>

        <div className={cx("header")}>
          <h1>Đăng nhập</h1>
          <p>Chào mừng bạn quay trở lại!</p>
        </div>

        {/* Form */}
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
            />
          </div>

          <div className={cx("form-group")}>
            <div className={cx("label-row")}>
              <label htmlFor="password">Mật khẩu</label>
              <Button to="/forgot-password" link>
                Quên mật khẩu?
              </Button>
            </div>
            <Input
              type="password"
              name="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<FontAwesomeIcon icon={faLock} />}
              showToggleIcon
            />
          </div>

          <Button primary type="submit">
            Đăng nhập
          </Button>
        </form>

        <div className={cx("divider")}>
          <span>hoặc</span>
        </div>

        <Button
          outline
          full
          onClick={() =>     window.location.href = "http://localhost:9090/api/auth/google"}
          leftIcon={<FontAwesomeIcon icon={faGoogle} />}
        >
          Đăng nhập với Google
        </Button>

        <p className={cx("register-text")}>
          Chưa có tài khoản?
          <Button to="/signup" link>
            Đăng ký ngay
          </Button>
        </p>
      </Card>
    </div>
  );
}

export default LoginPage;
