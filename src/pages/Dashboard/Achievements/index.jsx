import classNames from "classnames/bind";
import styles from "./Achievements.module.scss";

import Card from "~/components/Card";
import Button from "~/components/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faLock } from "@fortawesome/free-solid-svg-icons";

const cx = classNames.bind(styles);

const achievements = [
  {
    id: 1,
    name: "Người mới",
    description: "Hoàn thành bài học đầu tiên",
    icon: "🎯",
    unlocked: true,
    unlockedDate: "3 tháng trước",
    category: "Bắt đầu",
  },
  {
    id: 2,
    name: "Kiên trì",
    description: "Học liên tục 7 ngày",
    icon: "🔥",
    unlocked: true,
    unlockedDate: "1 tuần trước",
    category: "Chuỗi ngày",
  },
  {
    id: 3,
    name: "Từ vựng cơ bản",
    description: "Học 100 từ mới",
    icon: "📚",
    unlocked: true,
    unlockedDate: "2 tuần trước",
    category: "Từ vựng",
  },
  {
    id: 4,
    name: "Kanji Beginner",
    description: "Học 50 chữ Kanji",
    icon: "✍️",
    unlocked: true,
    unlockedDate: "1 tháng trước",
    category: "Kanji",
  },
  {
    id: 5,
    name: "Thử thách",
    description: "Hoàn thành 10 đề thi",
    icon: "🏆",
    unlocked: true,
    unlockedDate: "3 ngày trước",
    category: "Luyện thi",
  },
  {
    id: 6,
    name: "Cộng đồng",
    description: "Đăng 5 bài viết",
    icon: "💬",
    unlocked: false,
    progress: 3,
    target: 5,
    category: "Cộng đồng",
  },
  {
    id: 7,
    name: "Marathon",
    description: "Học liên tục 30 ngày",
    icon: "🏃",
    unlocked: false,
    progress: 7,
    target: 30,
    category: "Chuỗi ngày",
  },
  {
    id: 8,
    name: "Từ vựng Master",
    description: "Học 500 từ mới",
    icon: "📖",
    unlocked: false,
    progress: 234,
    target: 500,
    category: "Từ vựng",
  },
  {
    id: 9,
    name: "Kanji Master",
    description: "Học 200 chữ Kanji",
    icon: "🖋️",
    unlocked: false,
    progress: 89,
    target: 200,
    category: "Kanji",
  },
  {
    id: 10,
    name: "Chuyên gia",
    description: "Hoàn thành 50 đề thi",
    icon: "🎓",
    unlocked: false,
    progress: 12,
    target: 50,
    category: "Luyện thi",
  },
  {
    id: 11,
    name: "Điểm cao",
    description: "Đạt 95% trong một đề thi",
    icon: "⭐",
    unlocked: false,
    category: "Luyện thi",
  },
  {
    id: 12,
    name: "Trợ giúp",
    description: "Giúp đỡ 10 người trong cộng đồng",
    icon: "🤝",
    unlocked: false,
    progress: 4,
    target: 10,
    category: "Cộng đồng",
  },
];

const categories = [
  "Tất cả",
  "Bắt đầu",
  "Chuỗi ngày",
  "Từ vựng",
  "Kanji",
  "Luyện thi",
  "Cộng đồng",
];

function Achievements() {
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;
  const percent = Math.round((unlockedCount / totalCount) * 100);

  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className={cx("wrapper")}>
      <main className={cx("main")}>
        <div className={cx("container")}>
          {/* Header */}
          <div className={cx("header")}>
            <button
              type="button"
              onClick={handleBack}
              className={cx("back-link")}
            >
              <FontAwesomeIcon icon={faArrowLeft} className={cx("back-icon")} />
              <span>Quay lại bảng điều khiển</span>
            </button>
            <h1 className={cx("title")}>Thành tích</h1>
            <p className={cx("subtitle")}>
              Đã mở khóa {unlockedCount}/{totalCount} thành tích
            </p>
          </div>

          {/* Overall progress */}
          <Card className={cx("progress-card")}>
            <div className={cx("progress-header")}>
              <span className={cx("progress-label")}>Tiến độ tổng thể</span>
              <span className={cx("progress-percent")}>{percent}%</span>
            </div>
            <div className={cx("progress")}>
              <div
                className={cx("progress-bar")}
                style={{ width: `${percent}%` }}
              />
            </div>
          </Card>

          {/* Category chips (hiện tại chỉ UI, chưa filter) */}
          <div className={cx("categories")}>
            {categories.map((c) => (
              <button key={c} type="button" className={cx("category-chip")}>
                {c}
              </button>
            ))}
          </div>

          {/* Achievements grid */}
          <div className={cx("grid")}>
            {achievements.map((a) => {
              const hasProgress =
                typeof a.progress === "number" && typeof a.target === "number";
              const progressPercent = hasProgress
                ? Math.min(100, (a.progress / a.target) * 100)
                : 0;

              return (
                <Card
                  key={a.id}
                  className={cx("achievement-card", {
                    unlocked: a.unlocked,
                    locked: !a.unlocked,
                  })}
                >
                  <div className={cx("achievement-header")}>
                    <div
                      className={cx("achievement-icon-wrap", {
                        unlocked: a.unlocked,
                      })}
                    >
                      {a.unlocked ? (
                        <span className={cx("achievement-emoji")}>
                          {a.icon}
                        </span>
                      ) : (
                        <FontAwesomeIcon
                          icon={faLock}
                          className={cx("lock-icon")}
                        />
                      )}
                    </div>

                    <div className={cx("achievement-header-main")}>
                      <div className={cx("achievement-title-row")}>
                        <h3 className={cx("achievement-name")}>{a.name}</h3>
                        {a.unlocked && (
                          <span className={cx("badge", "badge-unlocked")}>
                            Đã mở
                          </span>
                        )}
                      </div>
                      <span className={cx("badge", "badge-category")}>
                        {a.category}
                      </span>
                    </div>
                  </div>

                  <p className={cx("achievement-desc")}>{a.description}</p>

                  {a.unlocked ? (
                    <p className={cx("achievement-meta")}>
                      Mở khóa: {a.unlockedDate}
                    </p>
                  ) : hasProgress ? (
                    <div className={cx("achievement-progress-block")}>
                      <div className={cx("achievement-progress-header")}>
                        <span className={cx("progress-small-label")}>
                          Tiến độ
                        </span>
                        <span className={cx("progress-small-value")}>
                          {a.progress}/{a.target}
                        </span>
                      </div>
                      <div className={cx("progress", "progress-small")}>
                        <div
                          className={cx("progress-bar")}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className={cx("achievement-meta")}>Chưa bắt đầu</p>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Achievements;
