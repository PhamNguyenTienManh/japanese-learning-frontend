import { Navigate } from "react-router-dom";
import { useAuth } from "~/context/AuthContext";
import { useGlobalModal } from "~/context/GlobalModalContext";

export function RequireAdmin({ children }) {
    const { isLoggedIn, role } = useAuth();
    const { openGlobalModal } = useGlobalModal();

    if (!isLoggedIn) {
        openGlobalModal({
            title: "Yêu cầu đăng nhập",
            message: "Bạn cần đăng nhập để truy cập trang quản trị!",
            confirmText: "Đăng nhập ngay",
            onConfirm: () => (window.location.href = "/login"),
        });
        return null; // Không render gì
    }

    if (role !== "admin") {
        openGlobalModal({
            title: "Truy cập bị từ chối",
            message: "Bạn không có quyền truy cập trang quản trị!",
            confirmText: "Quay lại trang chủ",
            onConfirm: () => (window.location.href = "/"),
        });
        return null;
    }

    return children;
}
