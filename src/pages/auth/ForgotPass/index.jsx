import { useState } from "react";
import { Link } from "react-router-dom";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faKey } from "@fortawesome/free-solid-svg-icons";

import styles from "./ForgotPass.module.scss";
import AuthShell from "~/pages/auth/AuthShell";
import Input from "~/components/Input";
import OTPModal from "~/components/OTPModal";
import authService from "~/services/authService";
import { useToast } from "~/context/ToastContext";

const cx = classNames.bind(styles);

function ForgotPass() {
    const { addToast } = useToast();
    const [email, setEmail] = useState("");
    const [showOTPModal, setShowOTPModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            addToast("Vui lòng nhập email!", "error");
            return;
        }

        setIsLoading(true);

        try {
            await authService.forgotPassword(email);
            setShowOTPModal(true);
            addToast("Mã OTP đã được gửi đến email của bạn!", "success");
        } catch (error) {
            addToast(error.message || "Gửi yêu cầu thất bại. Vui lòng thử lại!", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async (otpCode) => {
        try {
            window.location.href = `/reset-password?email=${email}&otp=${otpCode}`;
        } catch (error) {
            throw error;
        }
    };

    return (
        <>
            <AuthShell
                title="Đặt lại mật khẩu 🔐"
                subtitle="Nhập email của bạn — chúng tôi sẽ gửi mã OTP để khôi phục tài khoản."
                backTo="/login"
                backLabel="Quay lại đăng nhập"
                brandTitle="Quên mật khẩu là chuyện thường thôi."
                brandSub="Chỉ vài bước nhỏ và bạn sẽ tiếp tục chinh phục JLPT ngay."
                features={[
                    { icon: "📧", label: "Nhận mã OTP qua email trong vài giây" },
                    { icon: "🛡️", label: "Bảo mật tài khoản với xác thực 2 bước" },
                    { icon: "⏱️", label: "Trở lại học chỉ trong dưới 1 phút" },
                ]}
            >
                <div className={cx("callout")}>
                    <span className={cx("calloutIcon")}>
                        <FontAwesomeIcon icon={faKey} />
                    </span>
                    <div className={cx("calloutBody")}>
                        Chúng tôi sẽ gửi <strong>mã OTP 6 chữ số</strong> đến email bạn đăng ký.
                        Hãy kiểm tra cả hộp thư spam nhé.
                    </div>
                </div>

                <form onSubmit={handleSubmit} className={cx("form")}>
                    <div className={cx("form-group")}>
                        <label className={cx("label")} htmlFor="email">
                            Email tài khoản
                        </label>
                        <div className={cx("inputWrap")}>
                            <Input
                                type="email"
                                name="email"
                                id="email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                leftIcon={<FontAwesomeIcon icon={faEnvelope} />}
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <button type="submit" className={cx("submit")} disabled={isLoading}>
                        {isLoading ? "Đang gửi..." : "Gửi mã OTP"}
                    </button>
                </form>

                <p className={cx("helper-text")}>
                    Nhớ mật khẩu rồi?
                    <Link to="/login" className={cx("helper-link")}>
                        Đăng nhập
                    </Link>
                </p>
            </AuthShell>

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
