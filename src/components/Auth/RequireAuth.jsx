import { useAuth } from "~/context/AuthContext";
import { useGlobalModal } from "~/context/GlobalModalContext";

export function RequireAuth({ children }) {
    const { isLoggedIn } = useAuth();
    const { openGlobalModal } = useGlobalModal();

    if (!isLoggedIn) {
        openGlobalModal({
            title: "Yêu cầu đăng nhập",
            message: "Bạn cần đăng nhập để thực hiện chức năng này.",
            confirmText: "Đăng nhập ngay",
            onConfirm: () => (window.location.href = "/login"),
        });
        return null;
    }

    return children;
}
