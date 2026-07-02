import React, { useEffect, useState } from "react";
import classNames from "classnames/bind";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import styles from "./Practice.module.scss";

import LevelCard from "~/components/LevelCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrophy,
  faClock,
  faBookOpen,
  faBullseye,
  faLock,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "~/context/AuthContext";

import { getExamCountByLevel } from "~/services/examService";
const FREE_LEVELS = ["N5", "N4"];

const cx = classNames.bind(styles);

const easeOut = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: easeOut } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const statItem = {
  hidden: { opacity: 0, y: 22, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: easeOut },
  },
};

const LEVEL_META = [
  {
    level: "N5",
    name: "Nền tảng",
    description: "Khởi động với từ vựng, mẫu câu cơ bản và nghe hiểu tốc độ dễ theo dõi.",
    duration: 90,
    passScore: 80,
    focus: "Từ vựng, ngữ pháp cơ bản, nghe ngắn",
    colorClass: "n5",
  },
  {
    level: "N4",
    name: "Sơ cấp nâng cao",
    description: "Củng cố ngữ pháp thường gặp, đọc đoạn ngắn và phản xạ nghe đời sống.",
    duration: 115,
    passScore: 90,
    focus: "Câu thường dùng, đọc hiểu ngắn",
    colorClass: "n4",
  },
  {
    level: "N3",
    name: "Trung cấp",
    description: "Luyện nhịp đề trung cấp với bài đọc dài hơn và ngữ pháp nhiều sắc thái.",
    duration: 140,
    passScore: 95,
    focus: "Đọc hiểu, ngữ pháp trung cấp",
    colorClass: "n3",
  },
  {
    level: "N2",
    name: "Trung cấp nâng cao",
    description: "Tăng độ chính xác trong đọc hiểu, từ vựng học thuật và nghe tình huống phức tạp.",
    duration: 155,
    passScore: 90,
    focus: "Đọc dài, nghe hội thoại tự nhiên",
    colorClass: "n2",
  },
  {
    level: "N1",
    name: "Nâng cao",
    description: "Rèn sức bền với đề nâng cao, đọc hiểu chuyên sâu và nghe tốc độ tự nhiên.",
    duration: 165,
    passScore: 100,
    focus: "Đọc chuyên sâu, nghe tốc độ cao",
    colorClass: "n1",
  },
];

export default function Practice() {
  const { isPremium } = useAuth();
  const [levels, setLevels] = useState(() =>
    LEVEL_META.map((level) => ({ ...level, totalTests: 0 })),
  );

  useEffect(() => {
    async function fetchExamCounts() {
      try {
        const data = await getExamCountByLevel();
        const counts = data.data || {};

        const mappedLevels = LEVEL_META.map((level) => ({
          ...level,
          totalTests: counts[level.level] || 0,
        }));

        setLevels(mappedLevels);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu:", err);
      }
    }

    fetchExamCounts();
  }, []);

  const totalExams = levels.reduce(
    (sum, lvl) => sum + (lvl.totalTests || 0),
    0,
  );
  const activeLevels = levels.filter((lvl) => (lvl.totalTests || 0) > 0).length;
  const averageDuration = Math.round(
    levels.reduce((sum, lvl) => sum + (lvl.duration || 0), 0) / levels.length,
  );
  const lowestPassScore = Math.min(...levels.map((lvl) => lvl.passScore));

  const stats = [
    { icon: faTrophy, tone: "teal", value: totalExams, label: "Đề thi" },
    { icon: faBookOpen, tone: "orange", value: activeLevels, label: "Cấp có đề" },
    { icon: faBullseye, tone: "mint", value: `${lowestPassScore}+`, label: "Điểm đạt" },
    { icon: faClock, tone: "yellow", value: `${averageDuration}'`, label: "Thời lượng TB" },
  ];

  return (
    <div className={cx("root")}>
      <div className={cx("container")}>
        <motion.div
          className={cx("header")}
          initial="hidden"
          animate="show"
          variants={stagger}
        >
          <motion.section className={cx("hero")} variants={fadeUp}>
            <div className={cx("hero-copy")}>
              <span className={cx("eyebrow")}>JLPT practice suite</span>
              <h1 className={cx("title")}>Luyện thi JLPT</h1>
              <p className={cx("subtitle")}>
                Chọn cấp độ phù hợp từ N5 đến N1. Bài làm được lưu tự động,
                chấm điểm ngay sau khi nộp và có trang kết quả để xem lại.
              </p>
              <div className={cx("quick-levels")} aria-label="Chọn nhanh cấp độ JLPT">
                {levels.map((lvl) => {
                  const isLocked = !isPremium && !FREE_LEVELS.includes(lvl.level);
                  
                  return (
                    <Link
                      key={lvl.level}
                      className={cx("quick-chip", lvl.colorClass, { locked: isLocked })}
                      to={isLocked ? "/payment?plan=Pro" : `/practice/${lvl.level.toLowerCase()}`}
                    >
                      {lvl.level}
                      {isLocked && <FontAwesomeIcon icon={faLock} style={{ marginLeft: 6, fontSize: 12 }} />}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className={cx("hero-panel")}>
              <span className={cx("panel-label")}>Lộ trình</span>
              <strong className={cx("panel-value")}>N5 - N1</strong>
              <p className={cx("panel-text")}>
                Đi từ nền tảng đến nâng cao với cùng một trải nghiệm làm bài.
              </p>
            </div>
          </motion.section>
        </motion.div>

        <motion.div
          className={cx("stats-grid")}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
        >
          {stats.map((s) => (
            <motion.div
              key={s.label}
              className={cx("stat-card")}
              variants={statItem}
              whileHover={{ y: -4 }}
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

        <motion.div
          className={cx("section-head")}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, ease: easeOut }}
        >
          <div>
            <span className={cx("section-label")}>Chọn cấp độ</span>
            <h2 className={cx("section-title")}>Bắt đầu với cấp độ phù hợp</h2>
          </div>
        </motion.div>

        <motion.div
          className={cx("levels")}
          initial="hidden"
          animate={levels.length > 0 ? "show" : "hidden"}
          variants={stagger}
        >
          {levels.map((lvl) => {
            const isLocked = !isPremium && !FREE_LEVELS.includes(lvl.level);

            return (
              <motion.div
                key={lvl.level}
                className={cx("level-wrap", lvl.colorClass, { locked: isLocked })}
                variants={fadeUp}
                whileHover={!isLocked ? { y: -4 } : {}}
                transition={{ type: "spring", stiffness: 320, damping: 22 }}
              >
                {isLocked ? (
                  <Link to="/payment?plan=Pro" className={cx("locked-card")}>
                    <div className={cx("locked-glyph")}>{lvl.level}</div>
                    <FontAwesomeIcon icon={faLock} className={cx("locked-icon")} />
                    <span className={cx("locked-label")}>Dành cho gói Pro</span>
                    <span className={cx("locked-hint")}>Nâng cấp để mở khoá</span>
                  </Link>
                ) : (
                  <LevelCard
                    level={lvl}
                    startTo={`/practice/${lvl.level.toLowerCase()}`}
                  />
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
