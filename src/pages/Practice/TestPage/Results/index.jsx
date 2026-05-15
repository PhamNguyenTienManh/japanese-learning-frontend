import { useEffect, useState } from "react";
import classNames from "classnames/bind";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Link, useParams } from "react-router-dom";
import styles from "./Results.module.scss";

import Button from "~/components/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrophy,
  faClock,
  faRotateLeft,
  faHouse,
  faCheck,
  faXmark,
  faBookOpen,
  faChartSimple,
  faAngleRight,
} from "@fortawesome/free-solid-svg-icons";
import { checkExamResult } from "~/services/examService";

const cx = classNames.bind(styles);

const easeOut = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: easeOut } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

function formatTime(seconds) {
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function ScoreRing({ percent, passed }) {
  const size = 200;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = useMotionValue(0);
  const dashOffset = useTransform(
    progress,
    (v) => circumference - (v / 100) * circumference,
  );
  const displayPct = useTransform(progress, (v) => Math.round(v));
  const [shownPct, setShownPct] = useState(0);

  useEffect(() => {
    const controls = animate(progress, percent, {
      duration: 1.4,
      ease: easeOut,
    });
    const unsub = displayPct.on("change", (v) => setShownPct(v));
    return () => {
      controls.stop();
      unsub();
    };
  }, [percent, progress, displayPct]);

  const gradientId = passed ? "ring-pass" : "ring-fail";

  return (
    <div className={cx("score-ring-wrap")}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={cx("score-ring")}
      >
        <defs>
          <linearGradient id="ring-pass" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1f9bac" />
            <stop offset="100%" stopColor="#00879a" />
          </linearGradient>
          <linearGradient id="ring-fail" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff8a4c" />
            <stop offset="100%" stopColor="#fc5f00" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e6f7f2"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: dashOffset }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className={cx("score-center")}>
        <span className={cx("score-pct")}>{shownPct}%</span>
        <span className={cx("score-pct-label")}>điểm</span>
      </div>
    </div>
  );
}

function Results() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { testId } = useParams();
  const examId = testId;

  useEffect(() => {
    async function fetchResult() {
      try {
        setLoading(true);
        const data = await checkExamResult(examId);
        if (data.success) {
          setResults(data.data);
        } else {
          setError("Không lấy được kết quả");
        }
      } catch (err) {
        setError(err.message || "Có lỗi xảy ra");
      } finally {
        setLoading(false);
      }
    }

    fetchResult();
  }, [examId]);

  if (loading) {
    return (
      <div className={cx("wrapper")}>
        <main className={cx("main")}>
          <div className={cx("container")}>
            <div className={cx("loading")}>
              <div className={cx("loading-ring")} />
              <p>Đang tải kết quả...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cx("wrapper")}>
        <main className={cx("main")}>
          <div className={cx("container")}>
            <div className={cx("error-state")}>
              <p>{error}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!results) {
    return (
      <div className={cx("wrapper")}>
        <main className={cx("main")}>
          <div className={cx("container")}>
            <div className={cx("error-state")}>
              <p>Chưa có kết quả</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const scorePercent = Math.round(
    (results.totalScore / results.totalMaxScore) * 100,
  );
  const passed = results.passed;
  const levelLower = results.exam.level.toLowerCase();

  const stats = [
    {
      icon: faChartSimple,
      tone: "teal",
      value: results.totalScore,
      label: "Tổng điểm",
    },
    {
      icon: faBookOpen,
      tone: "yellow",
      value: results.totalMaxScore,
      label: "Điểm tối đa",
    },
    {
      icon: faClock,
      tone: "mint",
      value: formatTime(results.durationSeconds),
      label: "Thời gian",
    },
  ];

  return (
    <div className={cx("wrapper")}>
      <motion.div
        className={cx("blob1")}
        animate={{ y: [0, -22, 0], x: [0, 12, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className={cx("blob2")}
        animate={{ y: [0, 18, 0], x: [0, -14, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />

      <main className={cx("main")}>
        <div className={cx("container")}>
          {/* Breadcrumb */}
          <motion.div
            className={cx("breadcrumb")}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: easeOut }}
          >
            <Link to="/practice">Thi thử</Link>
            <FontAwesomeIcon icon={faAngleRight} />
            <Link to={`/practice/${levelLower}`}>
              JLPT - {results.exam.level}
            </Link>
            <FontAwesomeIcon icon={faAngleRight} />
            <span className={cx("breadcrumb-current")}>Kết quả</span>
          </motion.div>

          {/* Header */}
          <motion.div
            className={cx("header")}
            initial="hidden"
            animate="show"
            variants={stagger}
          >
            <motion.span
              className={cx("hero-badge", passed ? "pass" : "fail")}
              variants={fadeUp}
            >
              <FontAwesomeIcon icon={passed ? faCheck : faXmark} />
              <span>
                {passed ? "Đạt yêu cầu" : "Chưa đạt"} · JLPT{" "}
                {results.exam.level}
              </span>
            </motion.span>
            <motion.h1 className={cx("title")} variants={fadeUp}>
              Kết quả{" "}
              <span className={cx("title-accent")}>bài thi</span>
            </motion.h1>
            <motion.p className={cx("subtitle")} variants={fadeUp}>
              {results.exam.title}
            </motion.p>
          </motion.div>

          {/* Score Card */}
          <motion.div
            className={cx("score-card", passed ? "passed" : "failed")}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: easeOut, delay: 0.15 }}
          >
            <div className={cx("score-card-inner")}>
              <div className={cx("score-trophy")}>
                <motion.div
                  className={cx("trophy-bubble")}
                  animate={{ y: [0, -6, 0] }}
                  transition={{
                    duration: 2.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <FontAwesomeIcon icon={faTrophy} />
                </motion.div>
                <motion.h2
                  className={cx("score-status")}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.45 }}
                >
                  {passed ? "Chúc mừng bạn!" : "Cố gắng lần sau nhé!"}
                </motion.h2>
                <motion.p
                  className={cx("score-detail")}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.75, duration: 0.45 }}
                >
                  <strong>{results.totalScore}</strong> /{" "}
                  {results.totalMaxScore} điểm
                </motion.p>
              </div>
              <ScoreRing percent={scorePercent} passed={passed} />
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            className={cx("stats-grid")}
            initial="hidden"
            animate="show"
            variants={stagger}
          >
            {stats.map((s) => (
              <motion.div
                key={s.label}
                className={cx("stat-card")}
                variants={fadeUp}
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 320, damping: 20 }}
              >
                <div className={cx("stat-header")}>
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

          {/* Section Breakdown */}
          <motion.div
            className={cx("sections-card")}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, ease: easeOut }}
          >
            <div className={cx("sections-head")}>
              <h3 className={cx("sections-title")}>Phân tích theo phần thi</h3>
              <span className={cx("sections-meta")}>
                {results.parts.length} phần
              </span>
            </div>
            <div className={cx("sections-list")}>
              {results.parts.map((p, index) => {
                const percent = Math.round((p.score / p.max_score) * 100);
                const tone =
                  percent >= 80 ? "high" : percent >= 50 ? "mid" : "low";
                return (
                  <motion.div
                    key={index}
                    className={cx("section-item")}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{
                      duration: 0.45,
                      ease: easeOut,
                      delay: index * 0.08,
                    }}
                  >
                    <div className={cx("section-header")}>
                      <div>
                        <p className={cx("section-name")}>{p.name}</p>
                        <p className={cx("section-detail")}>
                          {p.score} / {p.max_score} điểm
                        </p>
                      </div>
                      <span className={cx("section-percentage", tone)}>
                        {percent}%
                      </span>
                    </div>

                    <div className={cx("progress")}>
                      <motion.div
                        className={cx("progress-bar", tone)}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${percent}%` }}
                        viewport={{ once: true, amount: 0.4 }}
                        transition={{
                          duration: 1,
                          ease: easeOut,
                          delay: index * 0.08 + 0.15,
                        }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            className={cx("actions")}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOut, delay: 0.4 }}
          >
            <Button
              primary
              to={`/practice/${levelLower}/test/${results.exam.id}`}
              leftIcon={<FontAwesomeIcon icon={faRotateLeft} />}
            >
              Làm lại bài thi
            </Button>

            <Button
              outline
              to={`/practice/${levelLower}/results/detail/${testId}`}
            >
              Xem đáp án
            </Button>

            <Button outline to={`/practice/${levelLower}`}>
              Chọn đề khác
            </Button>

            <Button
              outline
              to="/practice"
              leftIcon={<FontAwesomeIcon icon={faHouse} />}
            >
              Về trang luyện thi
            </Button>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

export default Results;
