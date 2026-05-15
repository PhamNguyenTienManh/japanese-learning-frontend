import React, { useEffect, useState } from "react";
import classNames from "classnames/bind";
import { motion } from "framer-motion";
import styles from "./Practice.module.scss";

import LevelCard from "~/components/LevelCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrophy,
  faClock,
  faBookOpen,
  faBullseye,
} from "@fortawesome/free-solid-svg-icons";

import { getExamCountByLevel } from "~/services/examService";

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

export default function Practice() {
  const [levels, setLevels] = useState([]);

  useEffect(() => {
    async function fetchExamCounts() {
      try {
        const data = await getExamCountByLevel();
        const counts = data.data || {};

        const mappedLevels = [
          {
            level: "N5",
            name: "Sơ cấp",
            description: "Hiểu được tiếng Nhật cơ bản",
            totalTests: counts.N5 || 0,
            colorClass: "n5",
          },
          {
            level: "N4",
            name: "Sơ cấp nâng cao",
            description: "Hiểu được tiếng Nhật cơ bản ở mức độ cao hơn",
            totalTests: counts.N4 || 0,
            colorClass: "n4",
          },
          {
            level: "N3",
            name: "Trung cấp",
            description:
              "Hiểu được tiếng Nhật sử dụng trong cuộc sống hàng ngày",
            totalTests: counts.N3 || 0,
            colorClass: "n3",
          },
          {
            level: "N2",
            name: "Trung cấp nâng cao",
            description: "Hiểu được tiếng Nhật trong nhiều tình huống",
            totalTests: counts.N2 || 0,
            colorClass: "n2",
          },
          {
            level: "N1",
            name: "Cao cấp",
            description: "Hiểu được tiếng Nhật trong nhiều tình huống phức tạp",
            totalTests: counts.N1 || 0,
            colorClass: "n1",
          },
        ];

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

  const stats = [
    { icon: faTrophy, tone: "teal", value: totalExams, label: "Đề thi" },
    { icon: faBookOpen, tone: "orange", value: 420, label: "Câu hỏi" },
    { icon: faBullseye, tone: "mint", value: 12, label: "Đã hoàn thành" },
    { icon: faClock, tone: "yellow", value: "85%", label: "Điểm TB" },
  ];

  return (
    <div className={cx("root")}>
      <motion.div
        className={cx("blob1")}
        animate={{ y: [0, -22, 0], x: [0, 12, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className={cx("blob2")}
        animate={{ y: [0, 20, 0], x: [0, -14, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className={cx("blob3")}
        animate={{ y: [0, -18, 0], x: [0, 10, 0] }}
        transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className={cx("container")}>
        {/* Header */}
        <motion.div
          className={cx("header")}
          initial="hidden"
          animate="show"
          variants={stagger}
        >
          <motion.span className={cx("hero-badge")} variants={fadeUp}>
            JLPT • N5 → N1
          </motion.span>
          <motion.h1 className={cx("title")} variants={fadeUp}>
            Luyện thi{" "}
            <span className={cx("title-accent")}>JLPT</span>
          </motion.h1>
          <motion.p className={cx("subtitle")} variants={fadeUp}>
            Hệ thống đề thi JLPT đầy đủ từ N5 đến N1, chấm điểm tự động và phân
            tích kết quả chi tiết.
          </motion.p>
        </motion.div>

        {/* Stats */}
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

        {/* Section heading */}
        <motion.div
          className={cx("section-head")}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, ease: easeOut }}
        >
          <span className={cx("section-label")}>Chọn cấp độ</span>
          <h2 className={cx("section-title")}>Bắt đầu với cấp độ phù hợp</h2>
        </motion.div>

        {/* Level cards */}
        <motion.div
          className={cx("levels")}
          initial="hidden"
          animate={levels.length > 0 ? "show" : "hidden"}
          variants={stagger}
        >
          {levels.map((lvl) => (
            <motion.div
              key={lvl.level}
              className={cx("level-wrap", lvl.colorClass)}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
            >
              <LevelCard
                level={lvl}
                startTo={`/practice/${lvl.level.toLowerCase()}`}
                resultsTo={`/practice/${lvl.level.toLowerCase()}/results`}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
