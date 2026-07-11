import { useState } from "react";
import classNames from "classnames/bind";
import { faChevronDown, faCrown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Button from "~/components/Button";
import styles from "./Header.module.scss";
import Logo from "~/components/Logo";
import { useAuth } from "~/context/AuthContext";
import NotificationDropdown from "~/components/NotificationDropdown";
import { useNavigate } from "react-router-dom";
import { getAvatarUrl, handleAvatarError } from "~/utils/avatar";
const cx = classNames.bind(styles);

function Header() {
  const [openMenu, setOpenMenu] = useState(null);
  const { logout, isAdmin, name, avatar, email, isLoggedIn, isPremium } = useAuth();
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
              <Button to="/practice" text>
                Thi Thử
              </Button>
              <Button to="/reading" text>
                Luyện đọc
              </Button>
              <Button to="/radicals" text>
                Bộ thủ
              </Button>
              <Button to="/conversation" text>
                Luyện hội thoại
              </Button>
            </div>
          </div>

          <div
            className={cx("nav-dropdown", { open: openMenu === "chat" })}
            onMouseEnter={() => toggleMenu("chat")}
            onMouseLeave={() => toggleMenu(null)}
          >
            <Button text to="/chat-ai">
              AI Chat
            </Button>
            
          </div>

          <div
            className={cx("nav-dropdown", { open: openMenu === "community" })}
            onMouseEnter={() => toggleMenu("community")}
            onMouseLeave={() => toggleMenu(null)}
          >
            <Button to="/community" text >
              Cộng đồng
            </Button>
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
                <button type="button" className={cx("userTrigger")}>
                  <span className={cx("avatarWrap")}>
                    <span className={cx("avatar")}>
                      <img
                        src={getAvatarUrl(avatar)}
                        alt={name || "Avatar"}
                        onError={handleAvatarError}
                      />
                    </span>
                    {isPremium && (
                      <span className={cx("premiumBadge")} title="Premium">
                        <FontAwesomeIcon icon={faCrown} />
                      </span>
                    )}
                  </span>
                  <span className={cx("userName")}>
                    {name || email || "Tài khoản"}
                  </span>
                  <FontAwesomeIcon icon={faChevronDown} className={cx("userCaret")} />
                </button>
                <div className={cx("dropdown-menu", "right")}>
                  <div className={cx("userMenuHeader")}>
                    <span className={cx("userMenuAvatarWrap")}>
                      <span className={cx("userMenuAvatar")}>
                        <img
                          src={getAvatarUrl(avatar)}
                          alt={name || "Avatar"}
                          onError={handleAvatarError}
                        />
                      </span>
                      {isPremium && (
                        <span className={cx("premiumBadge", "menu")} title="Premium">
                          <FontAwesomeIcon icon={faCrown} />
                        </span>
                      )}
                    </span>
                    <div className={cx("userMenuInfo")}>
                      <p className={cx("userMenuName")}>{name || "Người dùng"}</p>
                      {email && (
                        <p className={cx("userMenuEmail")}>{email}</p>
                      )}
                    </div>
                  </div>

                  {isAdmin() && (
                    <Button to="/admin" text>
                      Quản trị
                    </Button>
                  )}
                  <Button to="/dashboard" text>
                    Bảng điều khiển
                  </Button>
                  <Button to="/dashboard/learning-path" text>
                    Lộ trình học
                  </Button>
                  <Button to="/profile" text>
                    Hồ sơ
                  </Button>

                  <div className={cx("userMenuDivider")} />

                  <Button text onClick={handleLogout} className={cx("logoutBtn")}>
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
