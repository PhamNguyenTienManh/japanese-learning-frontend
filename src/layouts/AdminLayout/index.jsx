import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import classNames from "classnames/bind";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGaugeHigh,
  faUsers,
  faBookOpen,
  faFileLines,
  faComments,
  faBookReader,
  faArrowLeft,
  faChevronLeft,
  faRightFromBracket,
  faBars,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

import styles from "./AdminLayout.module.scss";
import { useAuth } from "~/context/AuthContext";

const cx = classNames.bind(styles);

const navItems = [
  {
    to: "/admin",
    icon: faGaugeHigh,
    label: "Dashboard",
    end: true,
  },
  { to: "/admin/users", icon: faUsers, label: "Người dùng" },
  { to: "/admin/dictionary", icon: faBookOpen, label: "Từ điển" },
  { to: "/admin/tests", icon: faFileLines, label: "Đề thi" },
  { to: "/admin/posts", icon: faComments, label: "Bài viết" },
  { to: "/admin/reading", icon: faBookReader, label: "Luyện đọc" },
];

function AdminLayout({ children }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      // fallback nếu logout API lỗi
      localStorage.removeItem("token");
    }
    navigate("/login", { replace: true });
  };

  return (
    <div className={cx("layout", { collapsed })}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className={cx("mobile-overlay")}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={cx("sidebar", { "mobile-open": mobileOpen })}>
        <div className={cx("brand")}>
          <div className={cx("brand-logo")}>日</div>
          {!collapsed && (
            <div className={cx("brand-text")}>
              <div className={cx("brand-name")}>Admin</div>
              <div className={cx("brand-tag")}>Bảng điều khiển</div>
            </div>
          )}
          <button
            className={cx("mobile-close")}
            onClick={() => setMobileOpen(false)}
            aria-label="Đóng menu"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <nav className={cx("nav")}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cx("nav-item", { active: isActive })
              }
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : undefined}
            >
              <span className={cx("nav-icon")}>
                <FontAwesomeIcon icon={item.icon} />
              </span>
              {!collapsed && (
                <span className={cx("nav-label")}>{item.label}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className={cx("sidebar-bottom")}>
          <button
            className={cx("collapse-btn")}
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Mở rộng" : "Thu gọn"}
            title={collapsed ? "Mở rộng" : "Thu gọn"}
          >
            <FontAwesomeIcon
              icon={faChevronLeft}
              className={cx("collapse-icon", { rotated: collapsed })}
            />
            {!collapsed && <span>Thu gọn</span>}
          </button>

          <button
            className={cx("back-btn")}
            onClick={() => navigate("/")}
            title="Về trang người dùng"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            {!collapsed && <span>Về trang người dùng</span>}
          </button>

          <button
            className={cx("logout-btn")}
            onClick={handleLogout}
            title="Đăng xuất"
          >
            <FontAwesomeIcon icon={faRightFromBracket} />
            {!collapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      <div className={cx("content-wrap")}>
        <header className={cx("topbar")}>
          <button
            className={cx("mobile-menu-btn")}
            onClick={() => setMobileOpen(true)}
            aria-label="Mở menu"
          >
            <FontAwesomeIcon icon={faBars} />
          </button>
          <div className={cx("topbar-right")}>
            <button
              className={cx("topbar-back")}
              onClick={() => navigate("/")}
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              <span>Trang người dùng</span>
            </button>
          </div>
        </header>

        <main className={cx("content")}>{children}</main>
      </div>
    </div>
  );
}

AdminLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AdminLayout;
