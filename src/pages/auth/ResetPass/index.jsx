import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faLock } from "@fortawesome/free-solid-svg-icons";

import styles from "./resetPass.module.scss";
import Button from "~/components/Button";
import Input from "~/components/Input";
import Card from "~/components/Card";
import authService from "~/services/authService";
import { useToast } from "~/context/ToastContext";

const cx = classNames.bind(styles);

function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { addToast } = useToast();

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const emailParam = searchParams.get("email");
        const otpParam = searchParams.get("otp");

        if (!emailParam || !otpParam) {
            addToast("Link không hợp lệ!", "error");
            navigate("/forgot-password");
            return;
        }

        setEmail(emailParam);
        setOtp(otpParam);
    }, [searchParams, navigate, addToast]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            addToast("Mật khẩu không khớp", "error");
            return;
        }

        if (newPassword.length < 8) {
            addToast("Mật khẩu phải có ít nhất 8 ký tự!", "error");
            return;
        }

        setIsLoading(true);

        try {
            await authService.verifyResetPassword(email, otp, newPassword);

            addToast("Đặt lại mật khẩu thành công!", "success");
            navigate("/login");
        } catch (error) {
            addToast(error.message || "Đặt lại mật khẩu thất bại. Vui lòng thử lại!", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
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
                    <h1>Đặt lại mật khẩu</h1>
                    <p>Nhập mật khẩu mới cho tài khoản của bạn</p>
                </div>

                <form onSubmit={handleSubmit} className={cx("form")}>
                    <div className={cx("form-group")}>
                        <label htmlFor="newPassword">Mật khẩu mới</label>
                        <Input
                            type="password"
                            name="newPassword"
                            placeholder="••••••••"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            leftIcon={<FontAwesomeIcon icon={faLock} />}
                            showToggleIcon
                            required
                            disabled={isLoading}
                        />
                        <p className={cx("hint-text")}>Tối thiểu 8 ký tự</p>
                    </div>

                    <div className={cx("form-group")}>
                        <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                        <Input
                            type="password"
                            name="confirmPassword"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            leftIcon={<FontAwesomeIcon icon={faLock} />}
                            showToggleIcon
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div style={{ display: "flex", flexDirection: "row", justifyContent: "center" }}>
                        <Button primary type="submit" disabled={isLoading}>
                            {isLoading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}

export default ResetPassword;
