import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock } from "@fortawesome/free-solid-svg-icons";

import styles from "./resetPass.module.scss";
import AuthShell from "~/pages/auth/AuthShell";
import Input from "~/components/Input";
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
        <AuthShell
            title="Tạo mật khẩu mới 🔒"
            subtitle="Chọn một mật khẩu mạnh để bảo vệ tài khoản của bạn."
            backTo="/login"
            backLabel="Quay lại đăng nhập"
            brandTitle="Bước cuối — tạo mật khẩu mới."
            brandSub="Một mật khẩu mạnh sẽ giúp tài khoản của bạn an toàn hơn."
            features={[
                { icon: "🔐", label: "Tối thiểu 8 ký tự" },
                { icon: "🅰️", label: "Kết hợp chữ hoa, chữ thường và số" },
                { icon: "✨", label: "Thêm ký tự đặc biệt để tăng độ mạnh" },
            ]}
        >
            {email && (
                <div className={cx("callout")}>
                    Đặt lại mật khẩu cho tài khoản <strong>{email}</strong>
                </div>
            )}

            <form onSubmit={handleSubmit} className={cx("form")}>
                <div className={cx("form-group")}>
                    <label className={cx("label")} htmlFor="newPassword">Mật khẩu mới</label>
                    <div className={cx("inputWrap")}>
                        <Input
                            type="password"
                            name="newPassword"
                            id="newPassword"
                            placeholder="••••••••"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            leftIcon={<FontAwesomeIcon icon={faLock} />}
                            showToggleIcon
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <p className={cx("hint-text")}>Tối thiểu 8 ký tự</p>
                </div>

                <div className={cx("form-group")}>
                    <label className={cx("label")} htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                    <div className={cx("inputWrap")}>
                        <Input
                            type="password"
                            name="confirmPassword"
                            id="confirmPassword"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            leftIcon={<FontAwesomeIcon icon={faLock} />}
                            showToggleIcon
                            required
                            disabled={isLoading}
                        />
                    </div>
                </div>

                <button type="submit" className={cx("submit")} disabled={isLoading}>
                    {isLoading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
                </button>
            </form>
        </AuthShell>
    );
}

export default ResetPassword;
