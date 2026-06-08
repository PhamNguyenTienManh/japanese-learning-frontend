import classNames from "classnames";
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
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getWeeklyStudyLeaderboard, getUserStatistics } from "~/services/statistic";
import { getTodayStudyTime, getWeekStudyMinutes } from "~/services/userStudy";
import { studyTimeTracker } from "~/utils/studyTimeTracker";
import { getRecentUserActivities } from "~/services/userActivityService";
import { getAvatarUrl, handleAvatarError } from "~/utils/avatar";
import { getLearningPathDashboard } from "~/services/learningPathService";

const LEADERBOARD_STEP = 10;
const tw = {
  wrapper:
    "min-h-screen bg-[linear-gradient(180deg,rgba(240,251,247,0.96),#f0fbf7),linear-gradient(120deg,rgba(0,135,154,0.08),rgba(252,95,0,0.06))]",
  main: "flex justify-center px-6 pb-16 pt-8 max-[560px]:px-4",
  container: "w-full max-w-[1120px] animate-fade-up",
  hero:
    "relative mb-6 flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-2xl bg-[linear-gradient(135deg,var(--primary)_0%,#006d7d_100%)] px-8 py-7 before:absolute before:inset-0 before:pointer-events-none before:content-[''] before:bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.1)_0%,transparent_50%),radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.06)_0%,transparent_50%)]",
  heroContent: "relative z-[1] flex items-center gap-[18px]",
  heroAvatar:
    "h-[72px] w-[72px] flex-shrink-0 rounded-full border-[3px] border-white/50 object-cover shadow-[0_4px_12px_rgba(0,0,0,0.15)]",
  heroName: "mb-1 text-[26px] font-bold leading-[1.2] text-white",
  heroMeta: "flex flex-wrap items-center gap-2.5",
  heroBadge:
    "inline-flex items-center rounded-full border border-white/25 bg-white/20 px-2.5 py-[3px] text-[11px] font-bold tracking-[0.5px] text-white",
  heroJoined: "text-xs text-white/75",
  heroActions: "relative z-[1]",
  heroBtn:
    "!rounded-lg !border !border-white/20 !bg-white/15 !px-[18px] !py-2.5 !text-[13px] !font-semibold !text-white hover:!bg-white/25",
  statsGrid: "mb-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4",
  statCard:
    "rounded-[14px] border border-[#eef2f4] bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-primary-low hover:shadow-primary-soft",
  statInner: "flex items-center gap-3.5",
  statIconWrap:
    "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--primary-low),rgba(0,135,154,0.12))]",
  statIconOrange:
    "!bg-[linear-gradient(135deg,rgba(252,95,0,0.15),rgba(252,95,0,0.05))] [&_svg]:!text-orange",
  statIcon: "text-lg text-primary",
  statContent: "min-w-0",
  statValue: "mb-0.5 text-2xl font-extrabold leading-[1.2] text-text-high",
  statLabel: "text-[13px] font-medium text-grey",
  layout: "grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]",
  mainCol: "flex flex-col gap-[18px]",
  sidebar: "flex flex-col gap-[18px]",
  section:
    "rounded-[14px] border border-[#eef2f4] bg-white px-6 py-[22px] shadow-card transition hover:shadow-card-hover",
  sectionHeader: "mb-4 flex items-center justify-between",
  sectionTitle: "flex items-center gap-2 text-[17px] font-bold text-text-high",
  sectionTitleIcon: "text-[15px] text-primary",
  sectionSubtitle: "mt-0.5 text-xs text-grey",
  sectionAction:
    "!rounded-lg !border-border !px-3 !py-1.5 !text-xs !font-semibold !text-grey hover:!border-primary hover:!bg-primary hover:!text-white",
  badgeTrend:
    "inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-500",
  badgeIcon: "text-[11px]",
  leaderboardHeader: "items-start gap-3 max-[560px]:flex-col max-[560px]:items-stretch",
  leaderboardCount:
    "inline-flex min-h-7 items-center whitespace-nowrap rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-xs font-bold text-primary max-[560px]:self-start",
  emptyState: "rounded-lg border border-dashed border-border bg-[#f8fafb] p-[18px] text-[13px] leading-6 text-grey",
  leaderboardList: "flex flex-col gap-2.5",
  leaderboardRow:
    "grid min-h-[68px] grid-cols-[38px_44px_minmax(0,1fr)_minmax(74px,auto)] items-center gap-3 rounded-lg border border-[#eef2f4] bg-[#f8fafb] px-3 py-2.5 max-[560px]:grid-cols-[36px_42px_minmax(0,1fr)] max-[560px]:gap-2.5",
  currentUserRow: "border-primary/35 bg-primary/5",
  rankBadge:
    "inline-flex h-[34px] w-[34px] items-center justify-center rounded-lg bg-[#e8edf0] text-[13px] font-extrabold text-grey-low max-[560px]:h-8 max-[560px]:w-8",
  rankGold: "!bg-amber-100 !text-amber-700",
  rankSilver: "!bg-gray-200 !text-gray-600",
  rankBronze: "!bg-orange-100 !text-orange-700",
  leaderAvatar: "h-[42px] w-[42px] rounded-full border-2 border-white bg-[#eef2f4] object-cover",
  leaderInfo: "min-w-0",
  leaderName: "mb-0.5 flex min-w-0 items-center gap-2 break-words text-sm font-bold leading-[1.35] text-text-high",
  youBadge: "flex-shrink-0 rounded-full bg-primary px-[7px] py-0.5 text-[10px] font-bold text-white",
  leaderMeta: "break-words text-xs leading-[1.4] text-grey",
  leaderScore:
    "flex min-w-[74px] flex-col items-end justify-center text-right leading-[1.2] text-text-high max-[560px]:col-start-3 max-[560px]:items-start max-[560px]:text-left [&_span]:mt-0.5 [&_span]:text-[11px] [&_span]:font-semibold [&_span]:text-grey [&_strong]:text-xl [&_strong]:font-extrabold [&_strong]:text-primary",
  leaderboardFooter:
    "mt-3 flex items-center justify-between gap-3 text-xs font-semibold text-grey max-[560px]:flex-col max-[560px]:items-stretch",
  leaderboardMoreBtn: "!min-w-[104px] !rounded-lg !px-3 !py-2 !text-xs !font-bold max-[560px]:!w-full",
  currentRankSummary:
    "mt-3 flex items-center justify-between gap-2.5 rounded-lg bg-orange/10 px-3 py-2.5 text-[13px] font-semibold text-grey-low max-[560px]:flex-col max-[560px]:items-start [&_strong]:text-base [&_strong]:text-orange",
  weeklyChart: "flex h-[200px] items-end gap-2 pt-2",
  weeklyItem: "flex h-full flex-1 flex-col items-center gap-1.5",
  barWrapper: "flex w-full flex-1 items-end justify-center",
  bar: "min-h-1 w-[70%] max-w-10 rounded-t-md bg-[#e8edf0] transition sm:w-[80%] sm:max-w-12",
  barActive: "bg-[linear-gradient(180deg,var(--primary)_0%,var(--primary-hover)_100%)] shadow-[0_2px_8px_rgba(0,135,154,0.25)]",
  barLabels: "text-center",
  barDay: "mb-px text-[11px] font-bold text-grey",
  barMinutes: "text-[10px] font-semibold text-primary/80",
  goalsList: "flex flex-col gap-3.5",
  goalItem: "w-full",
  goalHeader: "mb-1.5 flex items-center justify-between gap-3",
  goalTitle: "text-sm font-semibold text-text-high",
  goalValue: "text-xs font-semibold text-grey",
  goalTrack: "h-2 w-full overflow-hidden rounded-full bg-[#eef2f4]",
  goalBar: "h-full rounded-full bg-[linear-gradient(90deg,var(--primary),var(--primary-hover))] shadow-[0_1px_4px_rgba(0,135,154,0.2)] transition",
  activityList: "flex flex-col",
  activityItem:
    "group relative flex w-full gap-3.5 rounded-lg px-1.5 pb-4 pt-1 text-left transition hover:bg-[#f8fafb] focus:outline-none focus:ring-2 focus:ring-primary/20 last:pb-1 [&:not(:last-child)::after]:absolute [&:not(:last-child)::after]:bottom-0 [&:not(:last-child)::after]:left-[21px] [&:not(:last-child)::after]:top-9 [&:not(:last-child)::after]:w-0.5 [&:not(:last-child)::after]:bg-[#e8edf0] [&:not(:last-child)::after]:content-['']",
  activityDot: "relative z-[1] flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[13px]",
  activityStudy: "border border-primary/20 bg-[linear-gradient(135deg,rgba(0,135,154,0.15),rgba(0,135,154,0.05))] text-primary",
  activityTest: "border border-emerald-500/20 bg-[linear-gradient(135deg,rgba(16,185,129,0.15),rgba(16,185,129,0.05))] text-emerald-500",
  activityDict: "border border-blue-500/20 bg-[linear-gradient(135deg,rgba(59,130,246,0.15),rgba(59,130,246,0.05))] text-blue-500",
  activityChat: "border border-violet-500/20 bg-[linear-gradient(135deg,rgba(139,92,246,0.15),rgba(139,92,246,0.05))] text-violet-500",
  activityCommunity: "border border-orange/20 bg-[linear-gradient(135deg,rgba(252,95,0,0.15),rgba(252,95,0,0.05))] text-orange",
  activityContent: "min-w-0 flex-1",
  activityTitle: "mb-0.5 text-sm font-semibold leading-[1.4] text-text-high",
  activityDescription: "mb-1 text-xs leading-5 text-grey",
  activityMeta: "flex flex-wrap items-center gap-1.5 text-xs text-grey",
  activityScore: "text-xs font-bold text-emerald-500",
  activityHint: "text-[11px] font-semibold text-primary opacity-0 transition group-hover:opacity-100",
  sideCard: "rounded-[14px] border border-[#eef2f4] bg-white p-5 shadow-card",
  sideTitle: "mb-3.5 flex items-center gap-2 text-[15px] font-bold text-text-high",
  sideTitleIcon: "text-sm text-primary",
  sideStats: "flex flex-col gap-3",
  sideRow: "flex items-center justify-between gap-3",
  sideLabel: "flex items-center gap-2 text-[13px] font-medium text-grey",
  sideIcon: "w-4 text-center text-[13px] text-primary",
  sideIconOrange: "!text-orange",
  sideValue: "text-[15px] font-bold text-text-high",
  sideHeader: "mb-3 flex items-center justify-between gap-3 [&_h3]:mb-0",
  achievementsGrid: "grid grid-cols-3 gap-2",
  achievement:
    "flex aspect-square cursor-default items-center justify-center rounded-xl border-2 border-[#eef2f4] bg-[#f8fafb] text-2xl opacity-45 transition hover:border-border",
  achievementUnlocked:
    "!border-primary-low !bg-[linear-gradient(135deg,rgba(0,135,154,0.06),rgba(0,135,154,0.02))] !opacity-100 hover:!border-primary hover:scale-105 hover:shadow-[0_4px_12px_rgba(0,135,154,0.15)]",
  quickActions: "flex flex-col gap-2.5",
  quickBtn: "!w-full !justify-center !rounded-[10px] !px-4 !py-[13px] !text-sm !font-semibold",
  quickIcon: "mr-1.5 text-sm",
};

const cx = (...args) =>
  classNames(
    ...args.flatMap((arg) => {
      if (!arg) return [];
      if (typeof arg === "string") return [tw[arg] || arg];
      if (Array.isArray(arg)) return [cx(...arg)];
      if (typeof arg === "object") {
        return Object.entries(arg)
          .filter(([, enabled]) => enabled)
          .map(([key]) => tw[key] || key);
      }
      return [arg];
    })
  );

const mockUserData = {
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
};

const formatStudyDuration = (value) => {
  const totalMinutes = Math.max(Math.round(Number(value) || 0), 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
};

const formatActivityDate = (value) => {
  if (!value) return "Vừa xong";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Vừa xong";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getActivityTone = (type) => {
  if (type === "exam_completed") return "activityTest";
  if (type === "post_created" || type === "comment_created") return "activityCommunity";
  if (type === "notebook_created" || type === "notebook_item_added") return "activityDict";
  if (type === "study_time_added") return "activityStudy";
  return "activityChat";
};

const getActivityIcon = (type) => {
  if (type === "exam_completed") return faTrophy;
  if (type === "post_created" || type === "comment_created") return faMedal;
  if (type === "notebook_created" || type === "notebook_item_added") return faBookOpen;
  if (type === "study_time_added") return faClock;
  return faStar;
};

const getActivityScore = (activity) => {
  const score = Number(activity?.metadata?.score);
  return Number.isFinite(score) ? score : null;
};

function Dashboard() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [learningPath, setLearningPath] = useState(null);
  const [learningPathLoading, setLearningPathLoading] = useState(false);
  const [learningPathError, setLearningPathError] = useState("");
  const [studyTimeToday, setStudyTimeToday] = useState(0);
  const [currentSessionMinutes, setCurrentSessionMinutes] = useState(0);
  const [weeklyProgress, setWeeklyProgress] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [recentActivitiesLoading, setRecentActivitiesLoading] = useState(false);
  const [recentActivitiesError, setRecentActivitiesError] = useState("");
  const [leaderboard, setLeaderboard] = useState({
    entries: [],
    currentUserRank: null,
    totalRankedUsers: 0,
    visibleCount: 0,
    hasMore: false,
    period: null,
  });
  const [leaderboardLimit, setLeaderboardLimit] = useState(LEADERBOARD_STEP);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState("");

  const loadStudyTime = useCallback(async () => {
    try {
      const data = await getTodayStudyTime();
      setStudyTimeToday(data?.data?.duration_minutes || 0);
    } catch (error) {
      console.error('Failed to load study time:', error);
      setStudyTimeToday(0);
    }
  }, []);

  const loadLeaderboard = useCallback(async (limit = LEADERBOARD_STEP) => {
    try {
      setLeaderboardLoading(true);
      const leaderboardResponse = await getWeeklyStudyLeaderboard(limit);
      if (leaderboardResponse.success) {
        setLeaderboard({
          entries: leaderboardResponse.data?.entries || [],
          currentUserRank: leaderboardResponse.data?.currentUserRank || null,
          totalRankedUsers: leaderboardResponse.data?.totalRankedUsers || 0,
          visibleCount: leaderboardResponse.data?.visibleCount || 0,
          hasMore: Boolean(leaderboardResponse.data?.hasMore),
          period: leaderboardResponse.data?.period || null,
        });
        setLeaderboardError("");
        return true;
      }
    } catch (error) {
      console.error("Failed to load weekly study leaderboard:", error);
      setLeaderboardError("Không tải được bảng xếp hạng.");
    } finally {
      setLeaderboardLoading(false);
    }

    return false;
  }, []);

  const loadRecentActivities = useCallback(async () => {
    try {
      setRecentActivitiesLoading(true);
      const activitiesResponse = await getRecentUserActivities(8);
      if (activitiesResponse.success) {
        setRecentActivities(activitiesResponse.data || []);
        setRecentActivitiesError("");
      }
    } catch (error) {
      console.error("Failed to load recent activities:", error);
      setRecentActivitiesError("Không tải được hoạt động gần đây.");
    } finally {
      setRecentActivitiesLoading(false);
    }
  }, []);

  const loadLearningPath = useCallback(async () => {
    try {
      setLearningPathLoading(true);
      const data = await getLearningPathDashboard();
      setLearningPath(data);
      setLearningPathError("");
    } catch (error) {
      console.error("Failed to load learning path dashboard:", error);
      setLearningPathError("Không tải được lộ trình học.");
    } finally {
      setLearningPathLoading(false);
    }
  }, []);

  useEffect(() => {
    async function fetchUserData() {
      try {
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

        await loadLeaderboard(LEADERBOARD_STEP);
        await loadRecentActivities();
        await loadLearningPath();

        await loadStudyTime();
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      }
    }

    fetchUserData();

    const interval = setInterval(() => {
      const sessionMinutes = studyTimeTracker.getCurrentMinutes();
      setCurrentSessionMinutes(sessionMinutes);
    }, 1000);

    return () => clearInterval(interval);
  }, [loadLeaderboard, loadRecentActivities, loadLearningPath, loadStudyTime]);

  if (!userData) return <div>Loading...</div>;

  const totalMinutesToday = studyTimeToday + currentSessionMinutes;
  const hours = Math.floor(totalMinutesToday / 60);
  const minutes = totalMinutesToday % 60;

  const maxMinutes = Math.max(
    ...weeklyProgress.map((d) => d.minutes),
    1
  );
  const currentUserInTop = leaderboard.entries.some((entry) => entry.isCurrentUser);
  const canLoadMore = leaderboard.hasMore && !leaderboardLoading;

  const handleLoadMoreLeaderboard = async () => {
    const nextLimit = leaderboardLimit + LEADERBOARD_STEP;
    const loaded = await loadLeaderboard(nextLimit);
    if (loaded) {
      setLeaderboardLimit(nextLimit);
    }
  };

  const handleActivityClick = (activity) => {
    if (activity?.href) {
      navigate(activity.href);
    }
  };

  return (
    <div className={cx("wrapper")}>
      <main className={cx("main")}>
        <div className={cx("container")}>
          {/* Hero */}
          <div className={cx("hero")}>
            <div className={cx("heroContent")}>
              <img
                src={getAvatarUrl(userData.avatar)}
                alt={userData.name}
                className={cx("heroAvatar")}
                onError={handleAvatarError}
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
                href="/profile"
                className={cx("heroBtn")}
                leftIcon={<FontAwesomeIcon icon={faGear} />}
              >
                Hồ sơ
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

              {/* Leaderboard */}
              <div className={cx("section")}>
                <div className={cx("sectionHeader", "leaderboardHeader")}>
                  <div>
                    <h2 className={cx("sectionTitle")}>
                      <FontAwesomeIcon icon={faMedal} className={cx("sectionTitleIcon")} />
                      Bảng xếp hạng học tập
                    </h2>
                    <p className={cx("sectionSubtitle")}>
                      Tuần này · xếp theo tổng thời gian học
                    </p>
                  </div>
                  <span className={cx("leaderboardCount")}>
                    {leaderboard.totalRankedUsers} người học tuần này
                  </span>
                </div>

                {leaderboardError ? (
                  <div className={cx("emptyState")}>{leaderboardError}</div>
                ) : leaderboard.entries.length === 0 ? (
                  <div className={cx("emptyState")}>
                    Chưa có dữ liệu xếp hạng tuần này. Hoàn thành một đề JLPT để bắt đầu.
                  </div>
                ) : (
                  <>
                    <div className={cx("leaderboardList")}>
                      {leaderboard.entries.map((entry) => (
                        <div
                          key={entry.userId}
                          className={cx("leaderboardRow", {
                            currentUserRow: entry.isCurrentUser,
                          })}
                        >
                          <div
                            className={cx("rankBadge", {
                              rankGold: entry.rank === 1,
                              rankSilver: entry.rank === 2,
                              rankBronze: entry.rank === 3,
                            })}
                          >
                            {entry.rank}
                          </div>

                          <img
                            src={getAvatarUrl(entry.avatar)}
                            alt={entry.name}
                            className={cx("leaderAvatar")}
                            onError={handleAvatarError}
                          />

                          <div className={cx("leaderInfo")}>
                            <p className={cx("leaderName")}>
                              {entry.name}
                              {entry.isCurrentUser && (
                                <span className={cx("youBadge")}>Bạn</span>
                              )}
                            </p>
                            <p className={cx("leaderMeta")}>
                              {entry.studyDays} ngày học · TB {formatStudyDuration(entry.averageDailyMinutes)}/ngày
                            </p>
                          </div>

                          <div className={cx("leaderScore")}>
                            <strong>{formatStudyDuration(entry.totalMinutes)}</strong>
                            <span>tuần này</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className={cx("leaderboardFooter")}>
                      <span>
                        Đang hiển thị {leaderboard.visibleCount}/{leaderboard.totalRankedUsers}
                      </span>
                      {leaderboard.hasMore && (
                        <Button
                          outline
                          onClick={handleLoadMoreLeaderboard}
                          disabled={!canLoadMore}
                          className={cx("leaderboardMoreBtn")}
                        >
                          {leaderboardLoading ? "Đang tải..." : "Xem thêm"}
                        </Button>
                      )}
                    </div>

                    {leaderboard.currentUserRank && !currentUserInTop && (
                      <div className={cx("currentRankSummary")}>
                        <span>Hạng của bạn</span>
                        <strong>#{leaderboard.currentUserRank.rank}</strong>
                        <span>
                          {formatStudyDuration(leaderboard.currentUserRank.totalMinutes)} tuần này
                        </span>
                      </div>
                    )}
                  </>
                )}
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
                    onClick={() => navigate("/dashboard/learning-path")}
                    className={cx("sectionAction")}
                  >
                    Xem lộ trình
                  </Button>
                </div>
                {learningPathLoading ? (
                  <div className={cx("emptyState")}>Đang tải mục tiêu lộ trình...</div>
                ) : learningPathError ? (
                  <div className={cx("emptyState")}>{learningPathError}</div>
                ) : !learningPath?.hasLearningPath ? (
                  <div className={cx("emptyState")}>
                    Bạn chưa có lộ trình học. Vào trang onboarding để tạo kế hoạch cá nhân hóa.
                    <div className="mt-3">
                      <Button
                        primary
                        onClick={() => navigate("/onboarding")}
                        className={cx("leaderboardMoreBtn")}
                      >
                        Tạo lộ trình
                      </Button>
                    </div>
                  </div>
                ) : !learningPath.weekTasks?.length ? (
                  <div className={cx("emptyState")}>
                    Tuần này chưa có mục tiêu nào trong lộ trình.
                  </div>
                ) : (
                  <div className={cx("goalsList")}>
                    {learningPath.weekTasks.map((task) => {
                      const progress = task.progress || {
                        percent: task.completedAt ? 100 : 0,
                        label: `${task.completedAt ? task.targetCount || 1 : 0}/${task.targetCount || 1} mục`,
                      };
                      const progressPercent = Math.min(Math.max(Number(progress.percent) || 0, 0), 100);

                      return (
                        <div key={`${task.skill}-${task.order}`} className={cx("goalItem")}>
                          <div className={cx("goalHeader")}>
                            <p className={cx("goalTitle")}>{task.title || "Mục tiêu lộ trình"}</p>
                            <span className={cx("goalValue")}>
                              {progress.label}
                            </span>
                          </div>
                          <div className={cx("goalTrack")}>
                            <div
                              className={cx("goalBar")}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recent activity */}
              <div className={cx("section")}>
                <h2 className={cx("sectionTitle")}>
                  <FontAwesomeIcon icon={faStar} className={cx("sectionTitleIcon")} />
                  Hoạt động gần đây
                </h2>
                {recentActivitiesLoading ? (
                  <div className={cx("emptyState")}>Đang tải hoạt động gần đây...</div>
                ) : recentActivitiesError ? (
                  <div className={cx("emptyState")}>{recentActivitiesError}</div>
                ) : recentActivities.length === 0 ? (
                  <div className={cx("emptyState")}>
                    Chưa có hoạt động nào. Khi bạn học, làm bài thi hoặc tham gia cộng đồng, lịch sử sẽ hiển thị tại đây.
                  </div>
                ) : (
                  <div className={cx("activityList")}>
                    {recentActivities.map((activity) => {
                      const score = getActivityScore(activity);

                      return (
                        <button
                          key={activity.id}
                          type="button"
                          className={cx("activityItem")}
                          onClick={() => handleActivityClick(activity)}
                          aria-label={`Mở hoạt động: ${activity.title}`}
                        >
                          <div className={cx("activityDot", getActivityTone(activity.type))}>
                            <FontAwesomeIcon icon={getActivityIcon(activity.type)} />
                          </div>
                          <div className={cx("activityContent")}>
                            <p className={cx("activityTitle")}>{activity.title}</p>
                            {activity.description && (
                              <p className={cx("activityDescription")}>
                                {activity.description}
                              </p>
                            )}
                            <div className={cx("activityMeta")}>
                              <span>{formatActivityDate(activity.createdAt)}</span>
                              {score !== null && (
                                <>
                                  <span>-</span>
                                  <span className={cx("activityScore")}>
                                    Điểm: {score}
                                  </span>
                                </>
                              )}
                              <span>-</span>
                              <span className={cx("activityHint")}>Mở</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
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
