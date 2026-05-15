import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { faEnvelope, faLock } from "@fortawesome/free-solid-svg-icons";

import styles from "./LoginPage.module.scss";
import AuthShell from "~/pages/auth/AuthShell";
import Input from "~/components/Input";
import authService from "~/services/authService";
import { updateUserStreak } from "~/services/streakService";
import { studyTimeTracker } from "~/utils/studyTimeTracker";
import { useToast } from "~/context/ToastContext";
import { useAuth } from "~/context/AuthContext";

const cx = classNames.bind(styles);

function LoginPage() {
    const { addToast } = useToast();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { refreshAuth } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const data = await authService.login(email, password);

            if (data.data.access_token) {
                authService.saveToken(data.data.access_token);
                refreshAuth();
                studyTimeTracker.startTracking();
                await updateUserStreak();

                addToast("Đăng nhập thành công!", "success");
                setTimeout(() => navigate("/"), 500);
            }
        } catch (error) {
            addToast(error.message, "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = authService.getGoogleLoginUrl();
    };

    useEffect(() => {
        const token = authService.handleGoogleCallback();
        if (token) {
            updateUserStreak()
                .then(() => {
                    window.location.href = "/";
                })
                .catch((error) => {
                    console.error("Failed to update streak:", error);
                    window.location.href = "/";
                });
        }
    }, []);

    return (
        <AuthShell
            title="Chào mừng trở lại 👋"
            subtitle="Đăng nhập để tiếp tục hành trình tiếng Nhật của bạn."
            backTo="/"
            backLabel="Trang chủ"
            brandTitle="Tiếp tục hành trình bạn đã bắt đầu."
            brandSub="Chuỗi ngày học, từ vựng đã chinh phục và mục tiêu JLPT đang chờ bạn quay lại."
        >
            <form onSubmit={handleSubmit} className={cx("form")}>
                <div className={cx("form-group")}>
                    <label className={cx("label")} htmlFor="email">Email</label>
                    <div className={cx("inputWrap")}>
                        <Input
                            type="email"
                            name="email"
                            id="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            leftIcon={<FontAwesomeIcon icon={faEnvelope} />}
                        />
                    </div>
                </div>

                <div className={cx("form-group")}>
                    <div className={cx("label-row")}>
                        <label className={cx("label")} htmlFor="password">Mật khẩu</label>
                        <Link to="/forgot-password" className={cx("forgotLink")}>
                            Quên mật khẩu?
                        </Link>
                    </div>
                    <div className={cx("inputWrap")}>
                        <Input
                            type="password"
                            name="password"
                            id="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            leftIcon={<FontAwesomeIcon icon={faLock} />}
                            showToggleIcon
                        />
                    </div>
                </div>

                <button type="submit" className={cx("submit")} disabled={isLoading}>
                    {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
                </button>
            </form>

            <div className={cx("divider")}>
                <span>hoặc</span>
            </div>

            <button type="button" className={cx("googleBtn")} onClick={handleGoogleLogin}>
                <FontAwesomeIcon icon={faGoogle} className={cx("googleIcon")} />
                <span>Đăng nhập với Google</span>
            </button>

            <p className={cx("register-text")}>
                Chưa có tài khoản?
                <Link to="/signup" className={cx("register-link")}>
                    Đăng ký ngay
                </Link>
            </p>
        </AuthShell>
    );
}

export default LoginPage;
