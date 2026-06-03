import React, { useEffect, useState } from "react";
import classNames from "classnames/bind";
import { motion } from "framer-motion";
import styles from "./TestPage.module.scss";

import { Link, useParams } from "react-router-dom";

import TestCard from "~/components/TestCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faTrophy,
  faBookOpen,
  faBullseye,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import Button from "~/components/Button";

import { checkExamStatus, getExamsByLevel } from "~/services/examService";

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
  const upperLevel = (levelInfo.level || level || "n5").toUpperCase();
  const lowerLevel = upperLevel.toLowerCase();
  const [tests, setTests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTests() {
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
            return { ...test, completed };
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

  const testList = Array.isArray(tests) ? tests : [];
  const totalTests = testList.length;
  const completedCount = testList.filter((t) => t.completed).length;
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
                  key={test.id}
                  className={cx("test-wrap")}
                  variants={fadeUp}
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                >
                  <TestCard
                    test={test}
                    basePath={`${basePath}/${upperLevel.toLowerCase()}`}
                  />
                </motion.div>
              ))
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
