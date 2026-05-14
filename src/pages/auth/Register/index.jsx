import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { faEnvelope, faLock, faUser } from "@fortawesome/free-solid-svg-icons";

import styles from "./Register.module.scss";
import AuthShell from "~/pages/auth/AuthShell";
import Input from "~/components/Input";
import OTPModal from "~/components/OTPModal";
import authService from "~/services/authService";
import { useToast } from "~/context/ToastContext";

const cx = classNames.bind(styles);

function getPasswordStrength(pw) {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8) score += 1;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
    if (/\d/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;
    return score;
}

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

    const strength = useMemo(
        () => getPasswordStrength(formData.password),
        [formData.password]
    );

    const handleSubmit = async (e) => {
        e.preventDefault();

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

            window.location.href = "/login";
        } catch (error) {
            throw error;
        }
    };

    const handleGoogleSignup = () => {
        window.location.href = authService.getGoogleLoginUrl();
    };

    const strengthLabel = ["Quá yếu", "Yếu", "Khá", "Tốt", "Rất mạnh"][strength];
    const strengthBarClass = (idx) => {
        if (strength === 0) return null;
        if (idx >= strength) return null;
        if (strength <= 1) return "strengthBarLow";
        if (strength <= 2) return "strengthBarMed";
        return "strengthBarActive";
    };

    return (
        <>
            <AuthShell
                title="Tạo tài khoản mới ✨"
                subtitle="Bắt đầu hành trình học tiếng Nhật chỉ trong vài bước."
                backTo="/"
                backLabel="Trang chủ"
                brandTitle="Cùng nhau chinh phục JLPT từ N5 đến N1."
                brandSub="Tham gia cộng đồng học viên tiếng Nhật và mở khóa lộ trình học cá nhân hoá."
                features={[
                    { icon: "🎯", label: "Lộ trình học cá nhân hóa theo cấp độ JLPT" },
                    { icon: "✍️", label: "Sổ tay từ vựng + flashcard không giới hạn" },
                    { icon: "💬", label: "Trợ lý AI luyện hội thoại 24/7" },
                ]}
            >
                <form onSubmit={handleSubmit} className={cx("form")}>
                    <div className={cx("form-group")}>
                        <label className={cx("label")} htmlFor="name">Họ và tên</label>
                        <div className={cx("inputWrap")}>
                            <Input
                                type="text"
                                name="name"
                                id="name"
                                placeholder="Nguyễn Văn A"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                leftIcon={<FontAwesomeIcon icon={faUser} />}
                                required
                            />
                        </div>
                    </div>

                    <div className={cx("form-group")}>
                        <label className={cx("label")} htmlFor="email">Email</label>
                        <div className={cx("inputWrap")}>
                            <Input
                                type="email"
                                name="email"
                                id="email"
                                placeholder="your@email.com"
                                value={formData.email}
                                onChange={(e) =>
                                    setFormData({ ...formData, email: e.target.value })
                                }
                                leftIcon={<FontAwesomeIcon icon={faEnvelope} />}
                                required
                            />
                        </div>
                    </div>

                    <div className={cx("form-group")}>
                        <label className={cx("label")} htmlFor="password">Mật khẩu</label>
                        <div className={cx("inputWrap")}>
                            <Input
                                type="password"
                                name="password"
                                id="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) =>
                                    setFormData({ ...formData, password: e.target.value })
                                }
                                showToggleIcon
                                leftIcon={<FontAwesomeIcon icon={faLock} />}
                                required
                            />
                        </div>
                        {formData.password ? (
                            <>
                                <div className={cx("strength")}>
                                    {[0, 1, 2, 3].map((i) => (
                                        <span
                                            key={i}
                                            className={cx("strengthBar", strengthBarClass(i))}
                                        />
                                    ))}
                                </div>
                                <div className={cx("strengthLabel")}>{strengthLabel}</div>
                            </>
                        ) : (
                            <p className={cx("hint-text")}>Tối thiểu 8 ký tự, nên có chữ hoa, số & ký tự đặc biệt</p>
                        )}
                    </div>

                    <div className={cx("form-group")}>
                        <label className={cx("label")} htmlFor="confirmPassword">
                            Xác nhận mật khẩu
                        </label>
                        <div className={cx("inputWrap")}>
                            <Input
                                type="password"
                                name="confirmPassword"
                                id="confirmPassword"
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
                            <Link to="/terms" className={cx("termsLink")}>Điều khoản</Link>
                            và
                            <Link to="/privacy" className={cx("termsLink")}>Chính sách bảo mật</Link>
                        </label>
                    </div>

                    <button type="submit" className={cx("submit")} disabled={isLoading}>
                        {isLoading ? "Đang xử lý..." : "Tạo tài khoản"}
                    </button>
                </form>

                <div className={cx("divider")}>
                    <span>hoặc</span>
                </div>

                <button type="button" className={cx("googleBtn")} onClick={handleGoogleSignup}>
                    <FontAwesomeIcon icon={faGoogle} className={cx("googleIcon")} />
                    <span>Đăng ký với Google</span>
                </button>

                <p className={cx("register-text")}>
                    Đã có tài khoản?
                    <Link to="/login" className={cx("register-link")}>
                        Đăng nhập
                    </Link>
                </p>
            </AuthShell>

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
