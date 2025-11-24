import classNames from "classnames/bind";
import styles from "./Dashboard.module.scss";

import Card from "~/components/Card";
import Button from "~/components/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrophy,
  faBullseye,
  faBookOpen,
  faClock,
  faArrowTrendUp,
  faCalendarDays,
  faMedal,
  faFire,
  faStar,
} from "@fortawesome/free-solid-svg-icons";

const cx = classNames.bind(styles);

const mockUserData = {
  name: "Nguyễn Văn A",
  email: "nguyenvana@example.com",
  avatar: "/current-user.jpg",
  level: "N5",
  joinedDate: "3 tháng trước",
  stats: {
    studyDays: 45,
    currentStreak: 7,
    longestStreak: 15,
    totalStudyTime: 2340, // minutes
    wordsLearned: 234,
    kanjiLearned: 89,
    testsCompleted: 12,
    averageScore: 85,
  },
  recentActivity: [
    {
      type: "test",
      title: "Hoàn thành đề thi N5 - Đề số 3",
      score: 88,
      date: "Hôm nay",
    },
    { type: "dictionary", title: "Tra cứu 15 từ mới", date: "Hôm nay" },
    { type: "chat", title: "Luyện hội thoại với AI", date: "Hôm qua" },
    {
      type: "community",
      title: "Đăng bài về ngữ pháp て形",
      date: "2 ngày trước",
    },
  ],
  achievements: [
    {
      id: 1,
      name: "Người mới",
      description: "Hoàn thành bài học đầu tiên",
      icon: "🎯",
      unlocked: true,
    },
    {
      id: 2,
      name: "Kiên trì",
      description: "Học liên tục 7 ngày",
      icon: "🔥",
      unlocked: true,
    },
    {
      id: 3,
      name: "Từ vựng",
      description: "Học 100 từ mới",
      icon: "📚",
      unlocked: true,
    },
    {
      id: 4,
      name: "Kanji Master",
      description: "Học 50 chữ Kanji",
      icon: "✍️",
      unlocked: true,
    },
    {
      id: 5,
      name: "Thử thách",
      description: "Hoàn thành 10 đề thi",
      icon: "🏆",
      unlocked: true,
    },
    {
      id: 6,
      name: "Cộng đồng",
      description: "Đăng 5 bài viết",
      icon: "💬",
      unlocked: false,
    },
  ],
  weeklyProgress: [
    { day: "T2", minutes: 45 },
    { day: "T3", minutes: 60 },
    { day: "T4", minutes: 30 },
    { day: "T5", minutes: 75 },
    { day: "T6", minutes: 50 },
    { day: "T7", minutes: 0 },
    { day: "CN", minutes: 40 },
  ],
  goals: [
    {
      id: 1,
      title: "Học 50 từ mới mỗi tuần",
      current: 34,
      target: 50,
      unit: "từ",
    },
    { id: 2, title: "Hoàn thành 3 đề thi", current: 2, target: 3, unit: "đề" },
    {
      id: 3,
      title: "Học 30 phút mỗi ngày",
      current: 5,
      target: 7,
      unit: "ngày",
    },
  ],
};

function Dashboard() {
  const totalMinutes = mockUserData.stats.totalStudyTime;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const maxMinutes = Math.max(
    ...mockUserData.weeklyProgress.map((d) => d.minutes),
    1
  );

  return (
    <div className={cx("wrapper")}>
      <main className={cx("main")}>
        <div className={cx("container")}>
          {/* Header */}
          <div className={cx("header")}>
            <div className={cx("header-left")}>
              <img
                src={mockUserData.avatar || "/placeholder.svg"}
                alt={mockUserData.name}
                className={cx("avatar")}
              />
              <div>
                <h1 className={cx("title")}>{mockUserData.name}</h1>
                <div className={cx("meta-row")}>
                  <span className={cx("badge", "badge-level")}>
                    {mockUserData.level}
                  </span>
                  <span className={cx("joined")}>
                    Tham gia {mockUserData.joinedDate}
                  </span>
                </div>
              </div>
            </div>
            <Button outline href="/dashboard/settings">
              Cài đặt
            </Button>
          </div>

          {/* Stats Grid */}
          <div className={cx("stats-grid")}>
            <Card className={cx("stat-card")}>
              <div className={cx("stat-inner")}>
                <div className={cx("stat-icon-wrap")}>
                  <FontAwesomeIcon
                    icon={faCalendarDays}
                    className={cx("stat-icon")}
                  />
                </div>
                <div>
                  <p className={cx("stat-value")}>
                    {mockUserData.stats.studyDays}
                  </p>
                  <p className={cx("stat-label")}>Ngày học</p>
                </div>
              </div>
            </Card>

            <Card className={cx("stat-card")}>
              <div className={cx("stat-inner")}>
                <div className={cx("stat-icon-wrap", "stat-icon-orange")}>
                  <FontAwesomeIcon icon={faFire} className={cx("stat-icon")} />
                </div>
                <div>
                  <p className={cx("stat-value")}>
                    {mockUserData.stats.currentStreak}
                  </p>
                  <p className={cx("stat-label")}>Chuỗi ngày</p>
                </div>
              </div>
            </Card>

            <Card className={cx("stat-card")}>
              <div className={cx("stat-inner")}>
                <div className={cx("stat-icon-wrap")}>
                  <FontAwesomeIcon icon={faClock} className={cx("stat-icon")} />
                </div>
                <div>
                  <p className={cx("stat-value")}>
                    {hours}h {minutes}m
                  </p>
                  <p className={cx("stat-label")}>Thời gian học</p>
                </div>
              </div>
            </Card>

            <Card className={cx("stat-card")}>
              <div className={cx("stat-inner")}>
                <div className={cx("stat-icon-wrap")}>
                  <FontAwesomeIcon
                    icon={faTrophy}
                    className={cx("stat-icon")}
                  />
                </div>
                <div>
                  <p className={cx("stat-value")}>
                    {mockUserData.stats.averageScore}%
                  </p>
                  <p className={cx("stat-label")}>Điểm TB</p>
                </div>
              </div>
            </Card>
          </div>

          <div className={cx("layout")}>
            {/* Main column */}
            <div className={cx("main-col")}>
              {/* Weekly progress */}
              <Card className={cx("card")}>
                <div className={cx("card-header")}>
                  <h2 className={cx("card-title")}>Tiến độ tuần này</h2>
                  <span className={cx("badge", "badge-trend")}>
                    <FontAwesomeIcon
                      icon={faArrowTrendUp}
                      className={cx("badge-icon")}
                    />
                    +15%
                  </span>
                </div>

                <div className={cx("weekly-chart")}>
                  {mockUserData.weeklyProgress.map((day) => {
                    const height = (day.minutes / maxMinutes) * 100;
                    return (
                      <div key={day.day} className={cx("weekly-item")}>
                        <div className={cx("bar-wrapper")}>
                          <div
                            className={cx("bar", {
                              "bar-active": day.minutes > 0,
                            })}
                            style={{ height: `${height}%` }}
                          />
                        </div>
                        <div className={cx("bar-labels")}>
                          <p className={cx("bar-day")}>{day.day}</p>
                          <p className={cx("bar-minutes")}>{day.minutes}m</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Goals */}
              <Card className={cx("card")}>
                <div className={cx("card-header")}>
                  <h2 className={cx("card-title")}>Mục tiêu tuần này</h2>
                  <Button
                    outline
                    href="/dashboard/goals"
                    className={cx("small-btn")}
                  >
                    Xem tất cả
                  </Button>
                </div>
                <div className={cx("goals-list")}>
                  {mockUserData.goals.map((goal) => {
                    const progress = (goal.current / goal.target) * 100;
                    return (
                      <div key={goal.id} className={cx("goal-item")}>
                        <div className={cx("goal-header")}>
                          <p className={cx("goal-title")}>{goal.title}</p>
                          <span className={cx("goal-value")}>
                            {goal.current}/{goal.target} {goal.unit}
                          </span>
                        </div>
                        <div className={cx("progress")}>
                          <div
                            className={cx("progress-bar")}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Recent activity */}
              <Card className={cx("card")}>
                <h2 className={cx("card-title", "mb-6")}>Hoạt động gần đây</h2>
                <div className={cx("activity-list")}>
                  {mockUserData.recentActivity.map((activity, index) => (
                    <div
                      key={index}
                      className={cx("activity-item", {
                        "activity-last":
                          index === mockUserData.recentActivity.length - 1,
                      })}
                    >
                      <div
                        className={cx("activity-icon-wrap", {
                          "activity-test": activity.type === "test",
                          "activity-dict": activity.type === "dictionary",
                          "activity-chat": activity.type === "chat",
                          "activity-community": activity.type === "community",
                        })}
                      >
                        {activity.type === "test" && (
                          <FontAwesomeIcon
                            icon={faTrophy}
                            className={cx("activity-icon")}
                          />
                        )}
                        {activity.type === "dictionary" && (
                          <FontAwesomeIcon
                            icon={faBookOpen}
                            className={cx("activity-icon")}
                          />
                        )}
                        {activity.type === "chat" && (
                          <FontAwesomeIcon
                            icon={faStar}
                            className={cx("activity-icon")}
                          />
                        )}
                        {activity.type === "community" && (
                          <FontAwesomeIcon
                            icon={faMedal}
                            className={cx("activity-icon")}
                          />
                        )}
                      </div>
                      <div className={cx("activity-body")}>
                        <p className={cx("activity-title")}>{activity.title}</p>
                        <div className={cx("activity-meta")}>
                          <span>{activity.date}</span>
                          {activity.score && (
                            <>
                              <span className={cx("dot")}>•</span>
                              <span className={cx("activity-score")}>
                                Điểm: {activity.score}%
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <aside className={cx("sidebar")}>
              {/* Learning stats */}
              <Card className={cx("card")}>
                <h3 className={cx("side-title")}>Thống kê học tập</h3>
                <div className={cx("side-stats")}>
                  <div className={cx("side-stat-row")}>
                    <div className={cx("side-stat-label")}>
                      <FontAwesomeIcon
                        icon={faBookOpen}
                        className={cx("side-stat-icon")}
                      />
                      <span>Từ vựng</span>
                    </div>
                    <span className={cx("side-stat-value")}>
                      {mockUserData.stats.wordsLearned}
                    </span>
                  </div>

                  <div className={cx("side-stat-row")}>
                    <div className={cx("side-stat-label")}>
                      <FontAwesomeIcon
                        icon={faBullseye}
                        className={cx("side-stat-icon")}
                      />
                      <span>Kanji</span>
                    </div>
                    <span className={cx("side-stat-value")}>
                      {mockUserData.stats.kanjiLearned}
                    </span>
                  </div>

                  <div className={cx("side-stat-row")}>
                    <div className={cx("side-stat-label")}>
                      <FontAwesomeIcon
                        icon={faTrophy}
                        className={cx("side-stat-icon")}
                      />
                      <span>Đề thi</span>
                    </div>
                    <span className={cx("side-stat-value")}>
                      {mockUserData.stats.testsCompleted}
                    </span>
                  </div>

                  <div className={cx("side-stat-row")}>
                    <div className={cx("side-stat-label")}>
                      <FontAwesomeIcon
                        icon={faFire}
                        className={cx("side-stat-icon", "orange")}
                      />
                      <span>Chuỗi dài nhất</span>
                    </div>
                    <span className={cx("side-stat-value")}>
                      {mockUserData.stats.longestStreak} ngày
                    </span>
                  </div>
                </div>
              </Card>

              {/* Achievements */}
              <Card className={cx("card")}>
                <div className={cx("card-header")}>
                  <h3 className={cx("side-title")}>Thành tích</h3>
                  <Button
                    outline
                    href="/dashboard/achievements"
                    className={cx("small-btn")}
                  >
                    Xem tất cả
                  </Button>
                </div>
                <div className={cx("achievements-grid")}>
                  {mockUserData.achievements.map((a) => (
                    <div
                      key={a.id}
                      className={cx("achievement", {
                        unlocked: a.unlocked,
                      })}
                      title={a.description}
                    >
                      {a.icon}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Quick actions */}
              <Card className={cx("card")}>
                <h3 className={cx("side-title")}>Hành động nhanh</h3>
                <div className={cx("quick-actions")}>
                  <Button
                    primary
                    href="/practice"
                    className={cx("quick-btn")}
                    leftIcon={
                      <FontAwesomeIcon
                        icon={faTrophy}
                        className={cx("quick-icon")}
                      />
                    }
                  >
                    Luyện thi JLPT
                  </Button>

                  <Button
                    outline
                    href="/dictionary"
                    className={cx("quick-btn")}
                    leftIcon={
                      <FontAwesomeIcon
                        icon={faBookOpen}
                        className={cx("quick-icon")}
                      />
                    }
                  >
                    Tra từ điển
                  </Button>

                  <Button
                    outline
                    href="/chat"
                    className={cx("quick-btn")}
                    leftIcon={
                      <FontAwesomeIcon
                        icon={faStar}
                        className={cx("quick-icon")}
                      />
                    }
                  >
                    Chat với AI
                  </Button>
                </div>
              </Card>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
