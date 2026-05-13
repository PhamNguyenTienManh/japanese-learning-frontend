import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMessage,
  faUsers,
  faHeart,
  faEye,
} from "@fortawesome/free-solid-svg-icons";
import classNames from "classnames/bind";
import styles from "./CommunityStats.module.scss";

const cx = classNames.bind(styles);

function CommunityStats({ stats }) {
  const statItems = [
    {
      icon: faMessage,
      value: stats.totalPosts,
      label: "Bài viết",
      tone: "teal",
    },
    {
      icon: faUsers,
      value: stats.totalMembers,
      label: "Thành viên",
      tone: "orange",
    },
    {
      icon: faHeart,
      value: stats.totalLikes,
      label: "Lượt thích",
      tone: "rose",
    },
    {
      icon: faEye,
      value: stats.totalViews,
      label: "Lượt xem",
      tone: "violet",
    },
  ];

  return (
    <div className={cx("stats-grid")}>
      {statItems.map(({ icon, value, label, tone }) => (
        <div key={label} className={cx("stat-card", tone)}>
          <div className={cx("stat-icon-wrap")}>
            <FontAwesomeIcon icon={icon} className={cx("stat-icon")} />
          </div>
          <div className={cx("stat-body")}>
            <p className={cx("stat-value")}>{value}</p>
            <p className={cx("stat-label")}>{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default CommunityStats;
