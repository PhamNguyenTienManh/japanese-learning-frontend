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
  const upperLevel = level?.toUpperCase();
  const lowerLevel = level?.toLowerCase();
  const [tests, setTests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTests() {
      try {
        setIsLoading(true);
        const res = await getExamsByLevel(upperLevel);
        const apiTests = res.data || [];

        const levelDefaults = {
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
              { name: "Từ vựng", questions: 120 },
              { name: "Nghe hiểu", questions: 60 },
            ],
          },
          N1: {
            duration: 165,
            pass_score: 100,
            sections: [
              { name: "Từ vựng", questions: 120 },
              { name: "Nghe hiểu", questions: 60 },
            ],
          },
        };

        let mappedTests = apiTests
          .filter((t) => t.status === "published")
          .map((t) => {
            const defaults = levelDefaults[t.level] || {};
            return {
              id: t._id,
              name: t.title,
              duration: defaults.duration || 60,
              pass_score: defaults.pass_score || 80,
              completed: false,
              sections: defaults.sections || [
                { name: "Chữ và từ vựng", questions: 20 },
                { name: "Ngữ pháp", questions: 15 },
                { name: "Đọc hiểu", questions: 10 },
              ],
            };
          });

        const statusPromises = mappedTests.map(async (test) => {
          try {
            const statusRes = await checkExamStatus(test.id);
            const completed = statusRes?.data?.status === "completed";
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

  const stats = [
    {
      icon: faTrophy,
      tone: "teal",
      value: testList.length,
      label: "Đề thi",
    },
    {
      icon: faBookOpen,
      tone: "orange",
      value: testList.reduce((sum, t) => sum + (t.questions || 0), 0),
      label: "Câu hỏi",
    },
    {
      icon: faBullseye,
      tone: "mint",
      value: testList.filter((t) => t.completed).length,
      label: "Đã hoàn thành",
    },
    {
      icon: faClock,
      tone: "yellow",
      value: testList.length
        ? `${Math.round(
            testList.reduce((s, t) => s + (t.duration || 0), 0) /
              testList.length,
          )}'`
        : "0'",
      label: "Thời lượng TB",
    },
  ];

  return (
    <div className={cx("root", lowerLevel)}>
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
          {/* Header */}
          <motion.div
            className={cx("header")}
            initial="hidden"
            animate="show"
            variants={stagger}
          >
            <motion.div variants={fadeUp}>
              <Link to="/practice" className={cx("back-link")}>
                <FontAwesomeIcon icon={faArrowLeft} />
                <span className={cx("back-text")}>Quay lại danh sách cấp độ</span>
              </Link>
            </motion.div>

            <motion.div className={cx("title-row")} variants={fadeUp}>
              <div className={cx("glyph", lowerLevel)}>
                <span>{upperLevel}</span>
              </div>
              <div>
                <span className={cx("eyebrow")}>Cấp độ JLPT</span>
                <h1 className={cx("title")}>
                  Đề thi <span className={cx("title-accent")}>{upperLevel}</span>
                </h1>
              </div>
            </motion.div>

            <motion.p className={cx("subtitle")} variants={fadeUp}>
              Chọn một đề thi để bắt đầu — bài làm được lưu tự động, bạn có thể
              tiếp tục bất cứ lúc nào.
            </motion.p>
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
            <span className={cx("section-label")}>Đề thi {upperLevel}</span>
            <h2 className={cx("section-title")}>Danh sách đề thi</h2>
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
