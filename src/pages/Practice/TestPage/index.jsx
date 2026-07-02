import React, { useEffect, useMemo, useRef, useState } from "react";
import classNames from "classnames/bind";
import { motion } from "framer-motion";
import styles from "./TestPage.module.scss";

import { Link, useLocation, useParams } from "react-router-dom";

import TestCard from "~/components/TestCard";
import GuidedCoachmark from "~/components/GuidedCoachmark";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faTrophy,
  faBookOpen,
  faBullseye,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import Button from "~/components/Button";

import { checkExamResult, checkExamStatus, getExamsByLevel } from "~/services/examService";
import { getLearningPathDashboard } from "~/services/learningPathService";
import { useAuth } from "~/context/AuthContext";
import PremiumGate from "~/components/PremiumGate";

const cx = classNames.bind(styles);

const easeOut = [0.22, 1, 0.36, 1];
const LEVELS = ["N5", "N4", "N3", "N2", "N1"];

const LEVEL_DEFAULTS = {
  N5: {
    duration: 90,
    pass_score: 80,
    sections: [
      { name: "Từ vựng", questions: 40 },
      { name: "Ngữ pháp - Đọc hiểu", questions: 80 },
      { name: "Nghe hiểu", questions: 60 },
    ],
  },
  N4: {
    duration: 115,
    pass_score: 90,
    sections: [
      { name: "Từ vựng", questions: 40 },
      { name: "Ngữ pháp - Đọc hiểu", questions: 80 },
      { name: "Nghe hiểu", questions: 60 },
    ],
  },
  N3: {
    duration: 140,
    pass_score: 95,
    sections: [
      { name: "Từ vựng", questions: 40 },
      { name: "Ngữ pháp - Đọc hiểu", questions: 80 },
      { name: "Nghe hiểu", questions: 60 },
    ],
  },
  N2: {
    duration: 155,
    pass_score: 90,
    sections: [
      { name: "Từ vựng - Ngữ pháp - Đọc hiểu", questions: 120 },
      { name: "Nghe hiểu", questions: 60 },
    ],
  },
  N1: {
    duration: 165,
    pass_score: 100,
    sections: [
      { name: "Từ vựng - Ngữ pháp - Đọc hiểu", questions: 120 },
      { name: "Nghe hiểu", questions: 60 },
    ],
  },
};

const LEVEL_SUMMARY = {
  N5: "Khởi động nền tảng với từ vựng, ngữ pháp cơ bản và nghe hiểu tốc độ dễ theo dõi.",
  N4: "Củng cố cấu trúc câu thường gặp, đọc hiểu đoạn ngắn và phản xạ nghe đời sống.",
  N3: "Chuyển sang nhịp thi trung cấp với bài đọc dài hơn và ngữ pháp nhiều sắc thái.",
  N2: "Tăng độ chính xác trong đọc hiểu, từ vựng học thuật và nghe tình huống phức tạp.",
  N1: "Luyện sức bền cho đề nâng cao, đọc hiểu chuyên sâu và nghe tốc độ tự nhiên.",
};

function getNumericScore(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildExamTourMessage(test, weeklyHighestScore = null) {
  const score = getNumericScore(weeklyHighestScore) ?? getNumericScore(test?.latestScore);
  const passScore = getNumericScore(test?.pass_score);

  if (test?.completed && score !== null && passScore !== null) {
    const missing = Math.max(passScore - score, 0);
    if (missing > 0) {
      return `Điểm cao nhất tuần này của bạn là ${score}, còn ${missing} điểm nữa mới hoàn thành. Bạn có muốn làm lại đề này không?`;
    }

    return `Điểm cao nhất tuần này của bạn là ${score}. Làm lại đề này để ôn tập và giữ nhịp luyện thi nhé.`;
  }

  if (test?.completed) {
    return "Bạn đã hoàn thành đề này. Bấm Làm lại nếu muốn ôn tập và cải thiện điểm số.";
  }

  return "Chọn đề thi này để bắt đầu luyện theo lộ trình hôm nay.";
}

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const statItem = {
  hidden: { opacity: 0, y: 18, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: easeOut },
  },
};

export default function TestPage({ levelInfo = {}, basePath = "/practice" }) {
  const { level } = useParams();
  const location = useLocation();
  const upperLevel = (levelInfo.level || level || "n5").toUpperCase();
  const lowerLevel = upperLevel.toLowerCase();
  const { isPremium } = useAuth();
  const [tests, setTests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [weeklyHighestExamScore, setWeeklyHighestExamScore] = useState(null);
  const examTourRef = useRef(null);
  const examTourCardRef = useRef(null);
  const tourParam = useMemo(
    () => new URLSearchParams(location.search).get("tour"),
    [location.search],
  );

  useEffect(() => {
    async function fetchTests() {
      if (!isPremium && ["N3", "N2", "N1"].includes(upperLevel)) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const res = await getExamsByLevel(upperLevel);
        const apiTests = res.data || [];

        let mappedTests = apiTests
          .filter((t) => t.status === "published")
          .map((t) => {
            const defaults = LEVEL_DEFAULTS[t.level] || LEVEL_DEFAULTS[upperLevel] || {};
            const fallbackSections = [
              { name: "Chữ và từ vựng", questions: 20 },
              { name: "Ngữ pháp", questions: 15 },
              { name: "Đọc hiểu", questions: 10 },
            ];
            const sections = defaults.sections || fallbackSections;
            const totalPoints = sections.reduce(
              (sum, section) => sum + Number(section.questions || 0),
              0,
            );
            return {
              id: t._id,
              name: t.title,
              duration: defaults.duration || 60,
              pass_score: defaults.pass_score || 80,
              questions: totalPoints,
              totalPoints,
              completed: false,
              sections,
            };
          });

        const statusPromises = mappedTests.map(async (test) => {
          try {
            const statusRes = await checkExamStatus(test.id);
            const completed =
              statusRes?.data?.status === "completed" ||
              statusRes?.data?.hasCompletedResult === true;
            if (!completed) return { ...test, completed };

            try {
              const resultRes = await checkExamResult(test.id);
              const result = resultRes?.data || resultRes || {};
              const latestScore =
                result.totalScore ??
                result.score ??
                result.total_score ??
                result.result?.totalScore ??
                null;

              return {
                ...test,
                completed,
                latestScore,
                passed: result.passed,
              };
            } catch (resultError) {
              console.error("Fetch exam result score error:", resultError);
              return { ...test, completed };
            }
          } catch (e) {
            console.error(e);
            return test;
          }
        });

        mappedTests = await Promise.all(statusPromises);
        setTests(mappedTests);
      } catch (err) {
        console.error("Lỗi khi tải đề thi:", err);
        setTests([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTests();
  }, [upperLevel]);

  useEffect(() => {
    if (tourParam !== "exam") return;

    let active = true;

    async function loadWeeklyExamScore() {
      try {
        const dashboard = await getLearningPathDashboard();
        const examTask = dashboard?.weekTasks?.find(
          (task) => task.skill === "jlpt_exam" && task.progress,
        );
        const score = examTask?.progress?.latestScore;
        if (active) setWeeklyHighestExamScore(score ?? null);
      } catch (error) {
        console.error("Fetch weekly exam score error:", error);
        if (active) setWeeklyHighestExamScore(null);
      }
    }

    loadWeeklyExamScore();

    return () => {
      active = false;
    };
  }, [tourParam]);

  const testList = useMemo(() => (Array.isArray(tests) ? tests : []), [tests]);
  const totalTests = testList.length;
  const completedCount = testList.filter((t) => t.completed).length;
  const examTourTarget = useMemo(
    () => testList.find((test) => !test.completed) || testList[0] || null,
    [testList],
  );
  const averageDuration = totalTests
    ? Math.round(
        testList.reduce((sum, test) => sum + Number(test.duration || 0), 0) /
          totalTests,
      )
    : 0;
  const averagePoints = totalTests
    ? Math.round(
        testList.reduce(
          (sum, test) => sum + Number(test.totalPoints || test.questions || 0),
          0,
        ) / totalTests,
      )
    : 0;
  const completionRate = totalTests
    ? Math.round((completedCount / totalTests) * 100)
    : 0;

  const stats = [
    {
      icon: faTrophy,
      tone: "teal",
      value: totalTests,
      label: "Đề thi",
    },
    {
      icon: faBookOpen,
      tone: "orange",
      value: averagePoints,
      label: "Điểm tối đa",
    },
    {
      icon: faBullseye,
      tone: "mint",
      value: `${completedCount}/${totalTests || 0}`,
      label: "Hoàn thành",
    },
    {
      icon: faClock,
      tone: "yellow",
      value: `${averageDuration}'`,
      label: "Thời lượng TB",
    },
  ];

  return (
    <div className={cx("root", lowerLevel)}>
      <main className={cx("main")}>
        <div className={cx("container")}>
          <motion.div
            className={cx("header")}
            initial="hidden"
            animate="show"
            variants={stagger}
          >
            <motion.div variants={fadeUp}>
              <Link to="/practice" className={cx("back-link")}>
                <FontAwesomeIcon icon={faArrowLeft} />
                <span className={cx("back-text")}>Tất cả cấp độ</span>
              </Link>
            </motion.div>

            <motion.section className={cx("hero")} variants={fadeUp}>
              <div className={cx("hero-copy")}>
                <span className={cx("eyebrow")}>JLPT practice suite</span>
                <div className={cx("title-row")}>
                  <div className={cx("glyph", lowerLevel)}>
                    <span>{upperLevel}</span>
                  </div>
                  <div>
                    <h1 className={cx("title")}>
                      Đề thi <span className={cx("title-accent")}>{upperLevel}</span>
                    </h1>
                    <p className={cx("level-note")}>
                      {LEVEL_SUMMARY[upperLevel] || LEVEL_SUMMARY.N5}
                    </p>
                  </div>
                </div>
                <p className={cx("subtitle")}>
                  Chọn một đề để bắt đầu. Bài làm được lưu tự động, có thể tiếp
                  tục sau và xem lại kết quả khi hoàn thành.
                </p>
                <div className={cx("level-switcher")} aria-label="Chọn cấp độ JLPT">
                  {LEVELS.map((item) => (
                    <Link
                      key={item}
                      to={`${basePath}/${item.toLowerCase()}`}
                      className={cx("level-chip", {
                        active: item === upperLevel,
                      })}
                    >
                      {item}
                    </Link>
                  ))}
                </div>
              </div>

              <div className={cx("progress-panel")}>
                <span className={cx("panel-label")}>Tiến độ cấp độ</span>
                <strong className={cx("panel-value")}>{completionRate}%</strong>
                <div className={cx("progress-track")}>
                  <span
                    className={cx("progress-fill")}
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
                <p className={cx("panel-meta")}>
                  {completedCount}/{totalTests || 0} đề đã hoàn thành
                </p>
              </div>
            </motion.section>
          </motion.div>

          {/* Stats */}
          <motion.div
            className={cx("stats-grid")}
            initial="hidden"
            animate={!isLoading ? "show" : "hidden"}
            variants={stagger}
          >
            {stats.map((s) => (
              <motion.div
                key={s.label}
                className={cx("stat-card")}
                variants={statItem}
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 320, damping: 20 }}
              >
                <div className={cx("stat-inner")}>
                  <div className={cx("stat-icon", `tone-${s.tone}`)}>
                    <FontAwesomeIcon icon={s.icon} />
                  </div>
                  <div>
                    <p className={cx("stat-value")}>{s.value}</p>
                    <p className={cx("stat-label")}>{s.label}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Section heading */}
          <motion.div
            className={cx("section-head")}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOut, delay: 0.2 }}
          >
            <div>
              <span className={cx("section-label")}>Đề thi {upperLevel}</span>
              <h2 className={cx("section-title")}>Danh sách đề thi</h2>
            </div>
          </motion.div>

          {/* Tests list */}
          <motion.div
            className={cx("list")}
            initial="hidden"
            animate={!isLoading ? "show" : "hidden"}
            variants={stagger}
          >
            {isLoading ? (
              <div className={cx("skeleton-list")}>
                {[0, 1, 2].map((i) => (
                  <div key={i} className={cx("skeleton")} />
                ))}
              </div>
            ) : testList.length === 0 ? (
              <motion.div className={cx("empty")} variants={fadeUp}>
                <div className={cx("empty-icon")}>
                  <FontAwesomeIcon icon={faBookOpen} />
                </div>
                <p className={cx("empty-title")}>
                  Chưa có đề thi cho cấp {upperLevel}
                </p>
                <p className={cx("empty-text")}>
                  Quay lại để chọn cấp độ khác hoặc thử lại sau.
                </p>
                <Link to="/practice">
                  <Button primary>Quay lại danh sách</Button>
                </Link>
              </motion.div>
            ) : (
              testList.map((test) => (
                <motion.div
                  ref={examTourTarget?.id === test.id ? examTourCardRef : undefined}
                  key={test.id}
                  className={cx("test-wrap")}
                  variants={fadeUp}
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                >
                  <TestCard
                    test={test}
                    basePath={`${basePath}/${upperLevel.toLowerCase()}`}
                    actionRef={examTourTarget?.id === test.id ? examTourRef : undefined}
                  />
                </motion.div>
              ))
            )}
          </motion.div>
          {tourParam === "exam" && examTourTarget && !isLoading && (
            <GuidedCoachmark
              targetRef={examTourRef}
              scrollTargetRef={examTourCardRef}
              tourKey={`practice-exam-${lowerLevel}`}
              message={buildExamTourMessage(examTourTarget, weeklyHighestExamScore)}
              placement="left"
              pointerAnchor="left-edge"
              pointerOffsetX={-2}
              fingerDirection="pointRight"
              tooltipOffset={118}
            />
          )}
        </div>
      </main>
    </div>
  );
}
