import { useState } from "react";
import Button from "~/components/Button";
import Input from "~/components/Input";
import styles from "./ForgotPass.module.scss";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faEnvelope } from "@fortawesome/free-solid-svg-icons";

const cx = classNames.bind(styles);

function ForgotPass() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      alert("Vui lòng nhập email!");
      return;
    }

    console.log("[Forgot password request]", email);
    alert(
      "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu."
    );
  };

  return (
    <div className={cx("wrapper")}>
      <div className={cx("card")}>
        {/* Back to home */}
        <Button
          to="/login"
          text
          className={"back-link"}
          leftIcon={<FontAwesomeIcon icon={faArrowLeft} />}
        >
          Quay lại đăng nhập
        </Button>

        {/* Header */}
        <div className={cx("header")}>
          <h1>Quên mật khẩu</h1>
          <p>Nhập email của bạn để đặt lại mật khẩu</p>
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
              required
            />
          </div>

          <Button primary type="submit" className={"submit"}>
            Gửi yêu cầu
          </Button>
        </form>
      </div>
    </div>
  );
}

export default ForgotPass;
