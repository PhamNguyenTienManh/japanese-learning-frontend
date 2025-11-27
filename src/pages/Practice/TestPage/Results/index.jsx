import { useEffect, useState } from "react";
import classNames from "classnames/bind";
import styles from "./Results.module.scss";

import Card from "~/components/Card";
import Button from "~/components/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrophy, faClock, faRotateLeft, faHouse } from "@fortawesome/free-solid-svg-icons";
import { checkExamResult } from "~/services/examService"; // import API
import { useParams } from "react-router-dom";

const cx = classNames.bind(styles);

function formatTime(seconds) {
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
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

  if (loading) return <p>Đang tải kết quả...</p>;
  if (error) return <p>{error}</p>;
  if (!results) return <p>Chưa có kết quả</p>;

  const scorePercent = Math.round((results.totalScore / results.totalMaxScore) * 100);

  return (
    <div className={cx("wrapper")}>
      <main className={cx("main")}>
        <div className={cx("container")}>
          {/* Header */}
          <div className={cx("header")}>
            <span className={cx("badge", "badge-level")}>{results.exam.level}</span>
            <h1 className={cx("title")}>Kết quả bài thi</h1>
            <p className={cx("subtitle")}>
              Đề thi JLPT {results.exam.level} - {results.exam.title}
            </p>
          </div>

          {/* Score Card */}
          <Card
            className={cx("score-card", {
              passed: results.passed,
              failed: !results.passed,
            })}
          >
            <div className={cx("score-icon")}>
              <FontAwesomeIcon icon={faTrophy} />
            </div>
            <h2 className={cx("score-value")}>{scorePercent}%</h2>
            <p className={cx("score-status")}>
              {results.passed ? (
                <span className={cx("status-text", "status-passed")}>Đạt yêu cầu</span>
              ) : (
                <span className={cx("status-text", "status-failed")}>Chưa đạt</span>
              )}
            </p>
            <p className={cx("score-detail")}>
              {results.totalScore} / {results.totalMaxScore} điểm
            </p>
          </Card>

          {/* Stats Grid */}
          <div className={cx("stats-grid")}>
            <Card className={cx("stat-card")}>
              <div className={cx("stat-header")}>
                <div className={cx("stat-icon", "stat-icon-correct")}>🎯</div>
                <div>
                  <p className={cx("stat-value")}>{results.totalScore}</p>
                  <p className={cx("stat-label")}>Tổng điểm</p>
                </div>
              </div>
            </Card>

            <Card className={cx("stat-card")}>
              <div className={cx("stat-header")}>
                <div className={cx("stat-icon", "stat-icon-wrong")}>📘</div>
                <div>
                  <p className={cx("stat-value")}>{results.totalMaxScore}</p>
                  <p className={cx("stat-label")}>Điểm tối đa</p>
                </div>
              </div>
            </Card>

            <Card className={cx("stat-card")}>
              <div className={cx("stat-header")}>
                <div className={cx("stat-icon", "stat-icon-time")}>
                  <FontAwesomeIcon icon={faClock} />
                </div>
                <div>
                  <p className={cx("stat-value")}>{formatTime(results.durationSeconds)}</p>
                  <p className={cx("stat-label")}>Thời gian</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Section Breakdown */}
          <Card className={cx("sections-card")}>
            <h3 className={cx("sections-title")}>Phân tích theo phần thi</h3>
            <div className={cx("sections-list")}>
              {results.parts.map((p, index) => {
                const percent = Math.round((p.score / p.max_score) * 100);
                return (
                  <div key={index} className={cx("section-item")}>
                    <div className={cx("section-header")}>
                      <div>
                        <p className={cx("section-name")}>{p.name}</p>
                        <p className={cx("section-detail")}>
                          {p.score} / {p.max_score} điểm
                        </p>
                      </div>
                      <span className={cx("section-percentage")}>{percent}%</span>
                    </div>

                    <div className={cx("progress")}>
                      <div className={cx("progress-bar")} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Actions */}
          <div className={cx("actions")}>
            <Button
              primary
              href={`/practice/${results.exam.level.toLowerCase()}/test/${results.exam.id}`}
              leftIcon={<FontAwesomeIcon icon={faRotateLeft} />}
            >
              Làm lại bài thi
            </Button>

            <Button outline href={`/practice/${results.exam.level.toLowerCase()}/results/detail/${testId}`} className={"orange"}>
              Xem đáp án
            </Button>

            <Button outline href={`/practice/${results.exam.level.toLowerCase()}`} className={"orange"}>
              Chọn đề khác
            </Button>

            <Button outline href="/practice" className={"orange"} leftIcon={<FontAwesomeIcon icon={faHouse} />}>
              Về trang chủ
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Results;
