import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
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
  faCommentDots,
  faRoute,
  faTriangleExclamation,
  faReceipt,
  faArrowLeft,
  faChevronLeft,
  faRightFromBracket,
  faBars,
  faXmark,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";

import styles from "./AdminLayout.module.scss";
import { useAuth } from "~/context/AuthContext";
import { getAvatarUrl, handleAvatarError } from "~/utils/avatar";
import moderationService, {
  MODERATION_COUNTS_REFRESH_EVENT,
} from "~/services/moderationService";

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
  { to: "/admin/violations", icon: faTriangleExclamation, label: "Báo cáo vi phạm" },
  { to: "/admin/transactions", icon: faReceipt, label: "Giao dịch" },
  { to: "/admin/reading", icon: faBookReader, label: "Luyện đọc" },
  { to: "/admin/conversation", icon: faCommentDots, label: "Hội thoại" },
  { to: "/admin/learning-paths", icon: faRoute, label: "Lộ trình" },
];

function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, name, avatar, email } = useAuth();
  const accountRef = useRef(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [caseCounts, setCaseCounts] = useState({
    actionableTotal: 0,
  });

  const loadCaseCounts = useCallback(async () => {
    try {
      const response = await moderationService.getCaseCounts();
      const data = response?.success ? response.data : response;
      setCaseCounts({
        actionableTotal: Number(data?.actionableTotal) || 0,
      });
    } catch {
      setCaseCounts({ actionableTotal: 0 });
    }
  }, []);

  useEffect(() => {
    loadCaseCounts();
  }, [loadCaseCounts, location.pathname]);

  useEffect(() => {
    window.addEventListener(MODERATION_COUNTS_REFRESH_EVENT, loadCaseCounts);
    return () => {
      window.removeEventListener(MODERATION_COUNTS_REFRESH_EVENT, loadCaseCounts);
    };
  }, [loadCaseCounts]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!accountRef.current || accountRef.current.contains(event.target)) {
        return;
      }
      setAccountOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGoUserPage = () => {
    setAccountOpen(false);
    navigate("/");
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      // fallback nếu logout API lỗi
      localStorage.removeItem("study_login_time");
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
              {item.to === "/admin/violations" &&
                caseCounts.actionableTotal > 0 && (
                  <span className={cx("nav-badge")}>
                    {caseCounts.actionableTotal > 99
                      ? "99+"
                      : caseCounts.actionableTotal}
                  </span>
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
            <div className={cx("admin-account")} ref={accountRef}>
              <button
                type="button"
                className={cx("admin-trigger", { open: accountOpen })}
                onClick={() => setAccountOpen((value) => !value)}
                aria-haspopup="menu"
                aria-expanded={accountOpen}
              >
                <span className={cx("admin-avatar")}>
                  <img
                    src={getAvatarUrl(avatar)}
                    alt={name || "Admin"}
                    onError={handleAvatarError}
                  />
                </span>
                <span className={cx("admin-name")}>
                  {name || email || "Admin"}
                </span>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className={cx("admin-caret")}
                />
              </button>

              {accountOpen && (
                <div className={cx("admin-menu")} role="menu">
                  <div className={cx("admin-menu-head")}>
                    <span className={cx("admin-menu-avatar")}>
                      <img
                        src={getAvatarUrl(avatar)}
                        alt={name || "Admin"}
                        onError={handleAvatarError}
                      />
                    </span>
                    <div className={cx("admin-menu-info")}>
                      <p className={cx("admin-menu-name")}>
                        {name || "Admin"}
                      </p>
                      {email && (
                        <p className={cx("admin-menu-email")}>{email}</p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    className={cx("admin-menu-item")}
                    onClick={handleGoUserPage}
                    role="menuitem"
                  >
                    <FontAwesomeIcon icon={faArrowLeft} />
                    <span>Về trang người dùng</span>
                  </button>

                  <button
                    type="button"
                    className={cx("admin-menu-item", "danger")}
                    onClick={handleLogout}
                    role="menuitem"
                  >
                    <FontAwesomeIcon icon={faRightFromBracket} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
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
