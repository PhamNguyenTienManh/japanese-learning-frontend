import classNames from "classnames/bind";
import styles from "./Dashboard.module.scss";

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
  faGear,
  faChartSimple,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import { getUserStatistics } from "~/services/statistic";
import { getTodayStudyTime, getWeekStudyMinutes } from "~/services/userStudy";
import { studyTimeTracker } from "~/utils/studyTimeTracker";

const cx = classNames.bind(styles);

const mockUserData = {
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
  const [userData, setUserData] = useState(null);
  const [studyTimeToday, setStudyTimeToday] = useState(0);
  const [currentSessionMinutes, setCurrentSessionMinutes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [weeklyProgress, setWeeklyProgress] = useState([]);

  const loadStudyTime = async () => {
    try {
      const data = await getTodayStudyTime();
      setStudyTimeToday(data?.data?.duration_minutes || 0);
    } catch (error) {
      console.error('Failed to load study time:', error);
      setStudyTimeToday(0);
    }
  };

  useEffect(() => {
    async function fetchUserData() {
      try {
        setLoading(true);

        const userResponse = await getUserStatistics();
        if (userResponse.success) {
          const user = userResponse.data;
          setUserData({
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            level: "N5",
            joinedDate: new Date(user.joinedDate).toLocaleDateString("vi-VN"),
            stats: user.stats,
          });
        }

        const weekResponse = await getWeekStudyMinutes();
        if (weekResponse.success) {
          const days = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
          const progress = weekResponse.data.map((minutes, index) => ({
            day: days[index],
            minutes,
          }));
          setWeeklyProgress(progress);
        }

        await loadStudyTime();
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();

    const interval = setInterval(() => {
      const sessionMinutes = studyTimeTracker.getCurrentMinutes();
      setCurrentSessionMinutes(sessionMinutes);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!userData) return <div>Loading...</div>;

  const totalMinutesToday = studyTimeToday + currentSessionMinutes;
  const hours = Math.floor(totalMinutesToday / 60);
  const minutes = totalMinutesToday % 60;

  const maxMinutes = Math.max(
    ...weeklyProgress.map((d) => d.minutes),
    1
  );

  return (
    <div className={cx("wrapper")}>
      <main className={cx("main")}>
        <div className={cx("container")}>
          {/* Hero */}
          <div className={cx("hero")}>
            <div className={cx("heroContent")}>
              <img
                src={userData.avatar || "/placeholder.svg"}
                alt={userData.name}
                className={cx("heroAvatar")}
              />
              <div>
                <h1 className={cx("heroName")}>{userData.name}</h1>
                <div className={cx("heroMeta")}>
                  <span className={cx("heroBadge")}>
                    {userData.level}
                  </span>
                  <span className={cx("heroJoined")}>
                    Tham gia {userData.joinedDate}
                  </span>
                </div>
              </div>
            </div>
            <div className={cx("heroActions")}>
              <Button
                href="/dashboard/settings"
                className={cx("heroBtn")}
                leftIcon={<FontAwesomeIcon icon={faGear} />}
              >
                Cài đặt
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className={cx("statsGrid")}>
            <div className={cx("statCard")}>
              <div className={cx("statInner")}>
                <div className={cx("statIconWrap")}>
                  <FontAwesomeIcon icon={faCalendarDays} className={cx("statIcon")} />
                </div>
                <div className={cx("statContent")}>
                  <p className={cx("statValue")}>
                    {userData.stats.studyDays}
                  </p>
                  <p className={cx("statLabel")}>Ngày học</p>
                </div>
              </div>
            </div>

            <div className={cx("statCard")}>
              <div className={cx("statInner")}>
                <div className={cx("statIconWrap", "statIconOrange")}>
                  <FontAwesomeIcon icon={faFire} className={cx("statIcon")} />
                </div>
                <div className={cx("statContent")}>
                  <p className={cx("statValue")}>
                    {userData.stats.currentStreak}
                  </p>
                  <p className={cx("statLabel")}>Chuỗi ngày</p>
                </div>
              </div>
            </div>

            <div className={cx("statCard")}>
              <div className={cx("statInner")}>
                <div className={cx("statIconWrap")}>
                  <FontAwesomeIcon icon={faClock} className={cx("statIcon")} />
                </div>
                <div className={cx("statContent")}>
                  <p className={cx("statValue")}>
                    {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
                  </p>
                  <p className={cx("statLabel")}>Thời gian học hôm nay</p>
                </div>
              </div>
            </div>

            <div className={cx("statCard")}>
              <div className={cx("statInner")}>
                <div className={cx("statIconWrap")}>
                  <FontAwesomeIcon icon={faTrophy} className={cx("statIcon")} />
                </div>
                <div className={cx("statContent")}>
                  <p className={cx("statValue")}>
                    {userData.stats.averageScore.toFixed(2)}
                  </p>
                  <p className={cx("statLabel")}>Điểm thi JLPT TB</p>
                </div>
              </div>
            </div>
          </div>

          {/* Layout */}
          <div className={cx("layout")}>
            {/* Main column */}
            <div className={cx("mainCol")}>
              {/* Weekly chart */}
              <div className={cx("section")}>
                <div className={cx("sectionHeader")}>
                  <h2 className={cx("sectionTitle")}>
                    <FontAwesomeIcon icon={faChartSimple} className={cx("sectionTitleIcon")} />
                    Tiến độ tuần này
                  </h2>
                  <span className={cx("badgeTrend")}>
                    <FontAwesomeIcon icon={faArrowTrendUp} className={cx("badgeIcon")} />
                    +15%
                  </span>
                </div>

                <div className={cx("weeklyChart")}>
                  {weeklyProgress.map((day) => {
                    const height = (day.minutes / maxMinutes) * 100;
                    return (
                      <div key={day.day} className={cx("weeklyItem")}>
                        <div className={cx("barWrapper")}>
                          <div
                            className={cx("bar", {
                              barActive: day.minutes > 0,
                            })}
                            style={{ height: `${height}%` }}
                          />
                        </div>
                        <div className={cx("barLabels")}>
                          <p className={cx("barDay")}>{day.day}</p>
                          <p className={cx("barMinutes")}>{day.minutes}m</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Goals */}
              <div className={cx("section")}>
                <div className={cx("sectionHeader")}>
                  <h2 className={cx("sectionTitle")}>
                    <FontAwesomeIcon icon={faBullseye} className={cx("sectionTitleIcon")} />
                    Mục tiêu tuần này
                  </h2>
                  <Button
                    outline
                    href="/dashboard/goals"
                    className={cx("sectionAction")}
                  >
                    Xem tất cả
                  </Button>
                </div>
                <div className={cx("goalsList")}>
                  {mockUserData.goals.map((goal) => {
                    const progress = (goal.current / goal.target) * 100;
                    return (
                      <div key={goal.id} className={cx("goalItem")}>
                        <div className={cx("goalHeader")}>
                          <p className={cx("goalTitle")}>{goal.title}</p>
                          <span className={cx("goalValue")}>
                            {goal.current}/{goal.target} {goal.unit}
                          </span>
                        </div>
                        <div className={cx("goalTrack")}>
                          <div
                            className={cx("goalBar")}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent activity */}
              <div className={cx("section")}>
                <h2 className={cx("sectionTitle")}>
                  <FontAwesomeIcon icon={faStar} className={cx("sectionTitleIcon")} />
                  Hoạt động gần đây
                </h2>
                <div className={cx("activityList")}>
                  {mockUserData.recentActivity.map((activity, index) => (
                    <div key={index} className={cx("activityItem")}>
                      <div
                        className={cx("activityDot", {
                          activityTest: activity.type === "test",
                          activityDict: activity.type === "dictionary",
                          activityChat: activity.type === "chat",
                          activityCommunity: activity.type === "community",
                        })}
                      >
                        {activity.type === "test" && (
                          <FontAwesomeIcon icon={faTrophy} />
                        )}
                        {activity.type === "dictionary" && (
                          <FontAwesomeIcon icon={faBookOpen} />
                        )}
                        {activity.type === "chat" && (
                          <FontAwesomeIcon icon={faStar} />
                        )}
                        {activity.type === "community" && (
                          <FontAwesomeIcon icon={faMedal} />
                        )}
                      </div>
                      <div className={cx("activityContent")}>
                        <p className={cx("activityTitle")}>{activity.title}</p>
                        <div className={cx("activityMeta")}>
                          <span>{activity.date}</span>
                          {activity.score && (
                            <>
                              <span>•</span>
                              <span className={cx("activityScore")}>
                                Điểm: {activity.score}%
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <aside className={cx("sidebar")}>
              {/* Learning stats */}
              <div className={cx("sideCard")}>
                <h3 className={cx("sideTitle")}>
                  <FontAwesomeIcon icon={faChartSimple} className={cx("sideTitleIcon")} />
                  Thống kê học tập
                </h3>
                <div className={cx("sideStats")}>
                  <div className={cx("sideRow")}>
                    <div className={cx("sideLabel")}>
                      <FontAwesomeIcon icon={faBookOpen} className={cx("sideIcon")} />
                      <span>Từ vựng</span>
                    </div>
                    <span className={cx("sideValue")}>
                      {userData.stats.wordsLearned}
                    </span>
                  </div>

                  <div className={cx("sideRow")}>
                    <div className={cx("sideLabel")}>
                      <FontAwesomeIcon icon={faBullseye} className={cx("sideIcon")} />
                      <span>Kanji</span>
                    </div>
                    <span className={cx("sideValue")}>
                      {userData.stats.kanjiLearned}
                    </span>
                  </div>

                  <div className={cx("sideRow")}>
                    <div className={cx("sideLabel")}>
                      <FontAwesomeIcon icon={faTrophy} className={cx("sideIcon")} />
                      <span>Đề thi</span>
                    </div>
                    <span className={cx("sideValue")}>
                      {userData.stats.testsCompleted}
                    </span>
                  </div>

                  <div className={cx("sideRow")}>
                    <div className={cx("sideLabel")}>
                      <FontAwesomeIcon icon={faFire} className={cx("sideIcon", "sideIconOrange")} />
                      <span>Chuỗi dài nhất</span>
                    </div>
                    <span className={cx("sideValue")}>
                      {userData.stats.longestStreak} ngày
                    </span>
                  </div>
                </div>
              </div>

              {/* Achievements */}
              <div className={cx("sideCard")}>
                <div className={cx("sideHeader")}>
                  <h3 className={cx("sideTitle")}>
                    <FontAwesomeIcon icon={faTrophy} className={cx("sideTitleIcon")} />
                    Thành tích
                  </h3>
                  <Button
                    outline
                    href="/dashboard/achievements"
                    className={cx("sectionAction")}
                  >
                    Xem tất cả
                  </Button>
                </div>
                <div className={cx("achievementsGrid")}>
                  {mockUserData.achievements.map((a) => (
                    <div
                      key={a.id}
                      className={cx("achievement", {
                        achievementUnlocked: a.unlocked,
                      })}
                      title={a.description}
                    >
                      {a.icon}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick actions */}
              <div className={cx("sideCard")}>
                <h3 className={cx("sideTitle")}>
                  <FontAwesomeIcon icon={faStar} className={cx("sideTitleIcon")} />
                  Hành động nhanh
                </h3>
                <div className={cx("quickActions")}>
                  <Button
                    primary
                    href="/practice"
                    className={cx("quickBtn")}
                    leftIcon={
                      <FontAwesomeIcon icon={faTrophy} className={cx("quickIcon")} />
                    }
                  >
                    Luyện thi JLPT
                  </Button>

                  <Button
                    outline
                    href="/dictionary"
                    className={cx("quickBtn")}
                    leftIcon={
                      <FontAwesomeIcon icon={faBookOpen} className={cx("quickIcon")} />
                    }
                  >
                    Tra từ điển
                  </Button>

                  <Button
                    outline
                    href="/chat-ai"
                    className={cx("quickBtn")}
                    leftIcon={
                      <FontAwesomeIcon icon={faStar} className={cx("quickIcon")} />
                    }
                  >
                    Chat với AI
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
