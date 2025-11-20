import styles from "./Footer.module.scss";
import classNames from "classnames/bind";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTwitter, faGithub } from "@fortawesome/free-brands-svg-icons";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import Logo from "~/components/Logo";

const cx = classNames.bind(styles);

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={cx("footer")}>
      <div className={cx("container")}>
        {/* Grid */}
        <div className={cx("grid")}>
          {/* Brand */}
          <div>
            <div className={cx("brand")}>
              <Logo color="green" />
            </div>
            <p className={cx("desc")}>
              Nền tảng học tiếng Nhật với AI, luyện thi JLPT và cộng đồng toàn
              cầu
            </p>
          </div>

          {/* Tính năng */}
          <div>
            <h4 className={cx("title")}>Tính năng</h4>
            <ul className={cx("list")}>
              <li>
                <a href="/" className={cx("link")}>
                  Tra cứu từ điển
                </a>
              </li>
              <li>
                <a href="/practice" className={cx("link")}>
                  Luyện thi JLPT
                </a>
              </li>
              <li>
                <a href="/chat" className={cx("link")}>
                  AI Chat
                </a>
              </li>
              <li>
                <a href="/community" className={cx("link")}>
                  Cộng đồng
                </a>
              </li>
            </ul>
          </div>

          {/* Tài nguyên */}
          <div>
            <h4 className={cx("title")}>Tài nguyên</h4>
            <ul className={cx("list")}>
              <li>
                <a href="/dashboard" className={cx("link")}>
                  Bảng điều khiển
                </a>
              </li>
              <li>
                <a href="/dictionary/notebook" className={cx("link")}>
                  Sổ tay từ vựng
                </a>
              </li>
              <li>
                <a href="/dashboard/achievements" className={cx("link")}>
                  Thành tích
                </a>
              </li>
              <li>
                <a href="/dashboard/goals" className={cx("link")}>
                  Mục tiêu học tập
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className={cx("title")}>Theo dõi chúng tôi</h4>
            <div className={cx("social")}>
              <a href="#" className={cx("icon")}>
                <FontAwesomeIcon icon={faTwitter} />
              </a>
              <a href="#" className={cx("icon")}>
                <FontAwesomeIcon icon={faGithub} />
              </a>
              <a href="mailto:contact@japaneselearn.com" className={cx("icon")}>
                <FontAwesomeIcon icon={faEnvelope} />
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className={cx("divider")} />

        {/* Bottom */}
        <div className={cx("bottom")}>
          <p className={cx("copy")}>
            © {currentYear} 日本語Learn. Tất cả các quyền được bảo lưu.
          </p>

          <div className={cx("bottom-links")}>
            <a href="#" className={cx("link")}>
              Chính sách riêng tư
            </a>
            <a href="#" className={cx("link")}>
              Điều khoản dịch vụ
            </a>
            <a href="#" className={cx("link")}>
              Liên hệ
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
