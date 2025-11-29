import { useState, useEffect } from "react";
import classNames from "classnames/bind";
import styles from "./otpModal.module.scss";
import Card from "../Card";
import Button from "../Button";
import { useToast } from "~/context/ToastContext";

const cx = classNames.bind(styles);

function OTPModal({ email, onClose, onVerify }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { addToast } = useToast();
  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    const newOtp = pastedData.split("").filter((char) => /^\d$/.test(char));

    if (newOtp.length === 6) {
      setOtp(newOtp);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      addToast("Vui lòng nhập đủ 6 số", "error");
      return;
    }

    setIsLoading(true);

    try {
      await onVerify(otpCode);
      addToast("Xác thực OTP thành công!", "success");
      onClose(); // nếu muốn đóng modal ngay
    } catch (err) {
      addToast(err.message || "Mã OTP không đúng", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    document.getElementById("otp-0")?.focus();
  }, []);

  return (
    <div className={cx("overlay")} onClick={onClose}>
      <Card className={"flex-colum"} onClick={(e) => e.stopPropagation()}>
        <button className={cx("closeBtn")} onClick={onClose}>
          ✕
        </button>

        <h2 className={cx("title")}>Xác thực Email</h2>
        <p className={cx("description")}>
          Mã OTP đã được gửi đến email <strong>{email}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <div className={cx("otpInputs")} onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={cx("otpInput", { disabled: isLoading })}
                disabled={isLoading}
              />
            ))}
          </div>

          {error && <p className={cx("error")}>{error}</p>}

          <Button
            type="submit"
            primary
            full
            disabled={isLoading}
          >
            {isLoading ? "Đang xác thực..." : "Xác nhận"}
          </Button>
        </form>

        <p className={cx("resendText")}>
          Không nhận được mã?
          <Button
            link
            disabled={isLoading}
            onClick={() => alert("Chức năng gửi lại OTP sẽ được cập nhật")}
          >
            Gửi lại
          </Button>
        </p>
      </Card>
    </div>
  );
}

export default OTPModal;
