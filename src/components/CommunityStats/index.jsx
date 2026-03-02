import Card from "~/components/Card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMessage, faUsers } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartSolid } from "@fortawesome/free-solid-svg-icons";
import classNames from "classnames/bind";
import styles from "./CommunityStats.module.scss";

const cx = classNames.bind(styles);

function CommunityStats({ stats }) {
  const statItems = [
    { icon: faMessage, value: stats.totalPosts, label: "Bài viết" },
    { icon: faUsers, value: stats.totalMembers, label: "Thành viên" },
    { icon: faHeartSolid, value: stats.totalLikes, label: "Lượt thích" },
  ];

  return (
    <div className={cx("stats-grid")}>
      {statItems.map(({ icon, value, label }) => (
        <Card key={label} className={cx("stat-card")}>
          <div className={cx("stat-inner")}>
            <div className={cx("stat-icon-wrap")}>
              <FontAwesomeIcon icon={icon} className={cx("stat-icon")} />
            </div>
            <div>
              <p className={cx("stat-value")}>{value}</p>
              <p className={cx("stat-label")}>{label}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default CommunityStats;
