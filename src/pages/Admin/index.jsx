import { Link } from "react-router-dom";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faBookOpen,
  faFileLines,
  faComments,
  faBookReader,
  faArrowTrendUp,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";

import styles from "./Admin.module.scss";
import { useEffect, useState } from "react";
import { getStatistics } from "~/services/statistic";

const cx = classNames.bind(styles);

function Admin() {
  const [stats, setStats] = useState({
    profileNumber: 0,
    postsNumber: 0,
    newsNumber: 0,
    jlptNumber: 0,
    examNumber: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatistic = async () => {
      try {
        const response = await getStatistics();
        setStats(response.data || {});
      } catch (e) {
        console.error("Failed to load stats:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchStatistic();
  }, []);

  const cards = [
    {
      to: "/admin/users",
      icon: faUsers,
      label: "Người dùng",
      value: stats.profileNumber,
      sub: "Tổng tài khoản",
      tone: "blue",
    },
    {
      to: "/admin/dictionary",
      icon: faBookOpen,
      label: "Từ vựng JLPT",
      value: stats.jlptNumber,
      sub: "Trong từ điển",
      tone: "green",
    },
    {
      to: "/admin/reading",
      icon: faBookReader,
      label: "Luyện đọc",
      value: stats.newsNumber,
      sub: "Bài đọc đã đăng",
      tone: "teal",
    },
    {
      to: "/admin/tests",
      icon: faFileLines,
      label: "Đề thi",
      value: stats.examNumber,
      sub: "JLPT N5 - N1",
      tone: "purple",
    },
    {
      to: "/admin/posts",
      icon: faComments,
      label: "Bài viết",
      value: stats.postsNumber,
      sub: "Trong cộng đồng",
      tone: "orange",
    },
  ];

  return (
    <div className={cx("page")}>
      <header className={cx("page-header")}>
        <div>
          <h1 className={cx("page-title")}>Bảng quản trị</h1>
          <p className={cx("page-subtitle")}>
            Tổng quan hệ thống — quản lý nội dung & người dùng
          </p>
        </div>
        <div className={cx("page-badge")}>
          <FontAwesomeIcon icon={faArrowTrendUp} />
          <span>Hệ thống đang hoạt động</span>
        </div>
      </header>

      <section className={cx("stats-grid")}>
        {cards.map((c) => (
          <Link key={c.to} to={c.to} className={cx("stat-card", `tone-${c.tone}`)}>
            <div className={cx("stat-top")}>
              <div className={cx("stat-icon")}>
                <FontAwesomeIcon icon={c.icon} />
              </div>
              <span className={cx("stat-arrow")}>
                <FontAwesomeIcon icon={faArrowRight} />
              </span>
            </div>
            <div className={cx("stat-value")}>
              {loading ? <span className={cx("skeleton-text")} /> : c.value ?? 0}
            </div>
            <div className={cx("stat-meta")}>
              <span className={cx("stat-label")}>{c.label}</span>
              <span className={cx("stat-sub")}>{c.sub}</span>
            </div>
          </Link>
        ))}
      </section>

      <section className={cx("quick-section")}>
        <h2 className={cx("section-title")}>Truy cập nhanh</h2>
        <div className={cx("quick-grid")}>
          <Link to="/admin/users" className={cx("quick-item")}>
            <FontAwesomeIcon icon={faUsers} />
            <span>Quản lý người dùng</span>
          </Link>
          <Link to="/admin/dictionary" className={cx("quick-item")}>
            <FontAwesomeIcon icon={faBookOpen} />
            <span>Quản lý từ điển</span>
          </Link>
          <Link to="/admin/tests" className={cx("quick-item")}>
            <FontAwesomeIcon icon={faFileLines} />
            <span>Quản lý đề thi</span>
          </Link>
          <Link to="/admin/posts" className={cx("quick-item")}>
            <FontAwesomeIcon icon={faComments} />
            <span>Quản lý bài viết</span>
          </Link>
          <Link to="/admin/reading" className={cx("quick-item")}>
            <FontAwesomeIcon icon={faBookReader} />
            <span>Quản lý luyện đọc</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Admin;
