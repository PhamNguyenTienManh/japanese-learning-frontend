import { useEffect, useMemo, useState } from "react";
import classNames from "classnames/bind";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./Results.module.scss";

import Button from "~/components/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "~/context/AuthContext";
import { checkExamResult, startExam } from "~/services/examService";

const cx = classNames.bind(styles);

const easeOut = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: easeOut } },
};

function formatJapaneseDate(date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatEnglishDate(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function getSectionMeta(name = "", index) {
  const lowerName = name.toLowerCase();

  if (
    lowerName.includes("reading") ||
    lowerName.includes("đọc") ||
    lowerName.includes("doc")
  ) {
    return { jp: "文法・読解", en: "Reading" };
  }

  if (
    lowerName.includes("listening") ||
    lowerName.includes("nghe") ||
    lowerName.includes("聴")
  ) {
    return { jp: "聴解", en: "Listening" };
  }

  if (
    lowerName.includes("grammar") ||
    lowerName.includes("vocabulary") ||
    lowerName.includes("word") ||
    lowerName.includes("từ") ||
    lowerName.includes("ngữ") ||
    lowerName.includes("文字")
  ) {
    return { jp: "文字・語彙", en: "Language Knowledge" };
  }

  const fallback = [
    { jp: "文字・語彙", en: "Language Knowledge" },
    { jp: "文法・読解", en: "Reading" },
    { jp: "聴解", en: "Listening" },
  ];

  return fallback[index] || { jp: name || `Section ${index + 1}`, en: name || "-" };
}

function Results() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState("");
  const { testId } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const examId = testId;
  const testDate = useMemo(() => new Date(), []);

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

  const passed = results.passed;
  const levelLower = results.exam.level.toLowerCase();
  const scoreText = `${results.totalScore}/${results.totalMaxScore}`;
  const learnerName = (auth?.name || auth?.email || "JAVI LEARNER").toUpperCase();
  const resultJa = passed ? "合格" : "不合格";
  const resultLabel = passed ? "Passed" : "Not Passed";

  const handleRetryExam = async () => {
    try {
      setIsRetrying(true);
      const response = await startExam(results.exam.id);
      const examResultId = response?.data?._id;

      if (!examResultId) {
        throw new Error("Không nhận được phiên làm bài mới từ server");
      }

      localStorage.setItem("currentExamResultId", examResultId);
      navigate(`/practice/${levelLower}/test/${results.exam.id}`);
    } catch (err) {
      console.error("Không thể tạo phiên làm bài mới:", err);
      alert("Có lỗi xảy ra khi tạo phiên làm bài mới. Vui lòng thử lại!");
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className={cx("wrapper")}>
      <main className={cx("main")}>
        <motion.section
          className={cx("summary-card")}
          initial="hidden"
          animate="show"
          variants={fadeUp}
        >
          <div className={cx("result-scene")} aria-hidden="true">
            <span className={cx("torii", "left")} />
            <img
              className={cx("mascot")}
              src={`${process.env.PUBLIC_URL}/javi-icon-512.png`}
              alt=""
            />
            <span className={cx("torii", "right")} />
          </div>

          <h1>Hoàn thành bài thi!</h1>
          <p className={cx("score-line")}>
            Kết quả thi:{" "}
            <strong className={cx(passed ? "passed-text" : "failed-text")}>
              {scoreText} điểm
            </strong>
          </p>
          <p className={cx("encourage")}>
            {passed
              ? "Bạn đã hoàn thành rất tốt. Hãy xem lại đáp án để giữ chắc kiến thức nhé."
              : "Chưa được tốt lắm! Mỗi sai sót là một bước tiến mới! Đừng nản nhé, hãy luyện tập lại và bạn sẽ giỏi hơn mỗi ngày"}
          </p>

          <div className={cx("actions")}>
            <Button
              outline
              className={cx("back-action")}
              onClick={() => navigate(-1)}
              leftIcon={<FontAwesomeIcon icon={faArrowLeft} />}
            >
              Quay lại
            </Button>
            <Button
              outline
              className={cx("secondary-action")}
              to={`/practice/${levelLower}/results/detail/${testId}`}
            >
              Xem đáp án
            </Button>
            <Button
              primary
              className={cx("primary-action")}
              onClick={handleRetryExam}
              disabled={isRetrying}
              leftIcon={<FontAwesomeIcon icon={faRotateLeft} />}
            >
              {isRetrying ? "Đang tạo..." : "Thi lại"}
            </Button>
          </div>
        </motion.section>

        <motion.section
          className={cx("certificate-wrap")}
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ delay: 0.08 }}
        >
          <div className={cx("certificate")}>
            <header className={cx("certificate-head")}>
              <p>日本語 能力試験合否結果通知書</p>
              <h2>
                Japanese Language Proficiency Test
                <span>Test Result</span>
              </h2>
            </header>

            <dl className={cx("info-list")}>
              <div>
                <dt>受験日</dt>
                <dd>{formatJapaneseDate(testDate)}</dd>
              </div>
              <div>
                <dt>Test Date</dt>
                <dd>{formatEnglishDate(testDate)}</dd>
              </div>
              <div>
                <dt>受験レベル Level</dt>
                <dd>{results.exam.level}</dd>
              </div>
              <div>
                <dt>氏名 Name</dt>
                <dd>{learnerName}</dd>
              </div>
            </dl>

            <div className={cx("score-table")}>
              <div className={cx("table-title")}>
                <span>得点区分別得点</span>
                <strong>Scores by Scoring Section</strong>
              </div>

              <div
                className={cx("section-row")}
                style={{ "--section-count": results.parts.length || 1 }}
              >
                {results.parts.map((part, index) => {
                  const meta = getSectionMeta(part.name, index);
                  return (
                    <div className={cx("section-cell")} key={`${part.name}-${index}`}>
                      <strong>{meta.jp}</strong>
                      <span>{meta.en}</span>
                      <small>{part.name}</small>
                    </div>
                  );
                })}
                <div className={cx("total-cell")}>
                  <strong>総合得点</strong>
                  <span>Total Score</span>
                </div>
              </div>

              <div
                className={cx("score-row")}
                style={{ "--section-count": results.parts.length || 1 }}
              >
                {results.parts.map((part, index) => (
                  <div key={`${part.name}-score-${index}`}>
                    {part.score} / {part.max_score}
                  </div>
                ))}
                <div>
                  {results.totalScore}/{results.totalMaxScore}
                </div>
              </div>
            </div>

            <footer className={cx("certificate-foot")}>
              <span className={cx(passed ? "pass-stamp" : "fail-stamp")}>
                {resultJa}　{resultLabel}
              </span>
              <span className={cx("seal")}>JAVI</span>
            </footer>
          </div>
        </motion.section>
      </main>
    </div>
  );
}

export default Results;
