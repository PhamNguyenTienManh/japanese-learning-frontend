import { useState } from "react";
import classNames from "classnames/bind";
import { faChevronDown, faUser, faBell } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Button from "~/components/Button";
import styles from "./Header.module.scss";
import Logo from "~/components/Logo";
import { useAuth } from "~/context/AuthContext";
import NotificationDropdown from "~/components/NotificationDropdown";
import { useNavigate } from "react-router-dom";
const cx = classNames.bind(styles);

function Header() {
  const [openMenu, setOpenMenu] = useState(null);
  const { logout, isAdmin, userId, role, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = (menuName) => {
    setOpenMenu(openMenu === menuName ? null : menuName);
  };

  const handleLogout = async () => {
    await logout();
    setOpenMenu(null);
    navigate("/", { replace: true });
  };
  return (
    <header className={cx("header")}>
      <div className={cx("container")}>
        {/* Logo */}
        <Logo />

        {/* Navigation */}
        <nav className={cx("nav")}>
          <Button to="/about" text>
            Giới thiệu
          </Button>
          <div
            className={cx("nav-dropdown", { open: openMenu === "dict" })}
            onMouseEnter={() => toggleMenu("dict")}
            onMouseLeave={() => toggleMenu(null)}
          >
            <Button text rightIcon={<FontAwesomeIcon icon={faChevronDown} />}>
              Từ điển
            </Button>
            <div className={cx("dropdown-menu")}>
              <Button to="/translate" text>
                Dịch thuật
              </Button>
              <Button to="/kanji" text>
                Tra cứu từ điển
              </Button>
              <Button to="/jlpt" text>
                JLPT
              </Button>
              <Button to="/dictionary/notebook" text>
                Sổ tay từ vựng
              </Button>
            </div>
          </div>

          <div
            className={cx("nav-dropdown", { open: openMenu === "practice" })}
            onMouseEnter={() => toggleMenu("practice")}
            onMouseLeave={() => toggleMenu(null)}
          >
            <Button text rightIcon={<FontAwesomeIcon icon={faChevronDown} />}>
              Luyện tập
            </Button>
            <div className={cx("dropdown-menu")}>
              <Button to="/practice" text>
                Tổng quan
              </Button>
              <Button to="/practice/n5" text>
                Thi Thử N5
              </Button>
              <Button to="/reading" text>
                Luyện đọc
              </Button>
            </div>
          </div>

          <div
            className={cx("nav-dropdown", { open: openMenu === "chat" })}
            onMouseEnter={() => toggleMenu("chat")}
            onMouseLeave={() => toggleMenu(null)}
          >
            <Button text rightIcon={<FontAwesomeIcon icon={faChevronDown} />}>
              AI Chat
            </Button>
            <div className={cx("dropdown-menu")}>
              <Button to="/chat-ai" text>
                Trò chuyện AI
              </Button>
            </div>
          </div>

          <div
            className={cx("nav-dropdown", { open: openMenu === "community" })}
            onMouseEnter={() => toggleMenu("community")}
            onMouseLeave={() => toggleMenu(null)}
          >
            <Button text rightIcon={<FontAwesomeIcon icon={faChevronDown} />}>
              Cộng đồng
            </Button>
            <div className={cx("dropdown-menu")}>
              <Button to="/community" text>
                Diễn đàn
              </Button>
              <Button to="/community/new" text>
                Tạo bài viết
              </Button>
            </div>
          </div>
        </nav>

        {/* Actions */}
        <div className={cx("actions")}>
          {!isLoggedIn ? (
            <div>
              <Button to="/login" primary>
                Đăng nhập
              </Button>
              {"    "}
              <Button to="/signup" primary className={"white"}>
                Đăng ký
              </Button>
            </div>
          ) : (
            <>
              {/* Notification Bell */}
              <NotificationDropdown
                isOpen={openMenu === "notification"}
                onToggle={() => toggleMenu("notification")}
                onClose={() => setOpenMenu(null)}
              />

              {/* User Account */}
              <div
                className={cx("nav-dropdown", { open: openMenu === "account" })}
                onMouseEnter={() => toggleMenu("account")}
                onMouseLeave={() => toggleMenu(null)}
              >
                <Button
                  primary
                  leftIcon={<FontAwesomeIcon icon={faUser} />}
                  className={"user"}
                >
                  Tài khoản
                </Button>
                <div className={cx("dropdown-menu", "right")}>
                  {isAdmin() && (
                    <Button to="/admin" text>
                      Quản trị
                    </Button>
                  )}
                  <Button to="/dashboard" text>
                    Bảng điều khiển
                  </Button>
                  <Button to="/dashboard/achievements" text>
                    Thành tích
                  </Button>
                  <Button to="/dashboard/goals" text>
                    Mục tiêu
                  </Button>
                  <Button to="/dashboard/settings" text>
                    Cài đặt
                  </Button>
                  <Button text onClick={handleLogout}>
                    Đăng xuất
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;