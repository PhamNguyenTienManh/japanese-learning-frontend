import classNames from "classnames/bind";
import styles from "./Results.module.scss";

import Card from "~/components/Card";
import Button from "~/components/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrophy,
  faClock,
  faRotateLeft,
  faHouse,
  faCircleCheck,
  faCircleXmark,
} from "@fortawesome/free-solid-svg-icons";

const cx = classNames.bind(styles);

const mockResults = {
  score: 85,
  totalQuestions: 50,
  correctAnswers: 42,
  wrongAnswers: 8,
  timeSpent: "45:23",
  sections: [
    { name: "Chữ và từ vựng", total: 20, correct: 18, percentage: 90 },
    { name: "Ngữ pháp", total: 15, correct: 13, percentage: 87 },
    { name: "Đọc hiểu", total: 10, correct: 8, percentage: 80 },
    { name: "Nghe hiểu", total: 5, correct: 3, percentage: 60 },
  ],
  detailedAnswers: [
    {
      id: 1,
      question: "「学校」の読み方は？",
      userAnswer: "がっこう",
      correctAnswer: "がっこう",
      isCorrect: true,
    },
    {
      id: 2,
      question: "「先生」の意味は？",
      userAnswer: "học sinh",
      correctAnswer: "giáo viên",
      isCorrect: false,
    },
    {
      id: 3,
      question: "私は毎日学校___行きます。",
      userAnswer: "に",
      correctAnswer: "に",
      isCorrect: true,
    },
  ],
};

function Results() {
  const passScore = 60;
  const isPassed = mockResults.score >= passScore;

  return (
    <div className={cx("wrapper")}>
      <main className={cx("main")}>
        <div className={cx("container")}>
          {/* Header */}
          <div className={cx("header")}>
            <span className={cx("badge", "badge-level")}>N5</span>
            <h1 className={cx("title")}>Kết quả bài thi</h1>
            <p className={cx("subtitle")}>Đề thi JLPT N5 - Đề số 1</p>
          </div>

          {/* Score Card */}
          <Card
            className={cx("score-card", {
              passed: isPassed,
              failed: !isPassed,
            })}
          >
            <div className={cx("score-icon")}>
              <FontAwesomeIcon icon={faTrophy} />
            </div>

            <h2 className={cx("score-value")}>{mockResults.score}%</h2>

            <p className={cx("score-status")}>
              {isPassed ? (
                <span className={cx("status-text", "status-passed")}>
                  Đạt yêu cầu
                </span>
              ) : (
                <span className={cx("status-text", "status-failed")}>
                  Chưa đạt
                </span>
              )}
            </p>

            <p className={cx("score-detail")}>
              {mockResults.correctAnswers} / {mockResults.totalQuestions} câu
              đúng
            </p>
          </Card>

          {/* Stats Grid */}
          <div className={cx("stats-grid")}>
            <Card className={cx("stat-card")}>
              <div className={cx("stat-header")}>
                <div className={cx("stat-icon", "stat-icon-correct")}>
                  <FontAwesomeIcon icon={faCircleCheck} />
                </div>
                <div>
                  <p className={cx("stat-value")}>
                    {mockResults.correctAnswers}
                  </p>
                  <p className={cx("stat-label")}>Câu đúng</p>
                </div>
              </div>
            </Card>

            <Card className={cx("stat-card")}>
              <div className={cx("stat-header")}>
                <div className={cx("stat-icon", "stat-icon-wrong")}>
                  <FontAwesomeIcon icon={faCircleXmark} />
                </div>
                <div>
                  <p className={cx("stat-value")}>{mockResults.wrongAnswers}</p>
                  <p className={cx("stat-label")}>Câu sai</p>
                </div>
              </div>
            </Card>

            <Card className={cx("stat-card")}>
              <div className={cx("stat-header")}>
                <div className={cx("stat-icon", "stat-icon-time")}>
                  <FontAwesomeIcon icon={faClock} />
                </div>
                <div>
                  <p className={cx("stat-value")}>{mockResults.timeSpent}</p>
                  <p className={cx("stat-label")}>Thời gian</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Section Breakdown */}
          <Card className={cx("sections-card")}>
            <h3 className={cx("sections-title")}>Phân tích theo phần thi</h3>
            <div className={cx("sections-list")}>
              {mockResults.sections.map((section, index) => (
                <div key={index} className={cx("section-item")}>
                  <div className={cx("section-header")}>
                    <div>
                      <p className={cx("section-name")}>{section.name}</p>
                      <p className={cx("section-detail")}>
                        {section.correct} / {section.total} câu đúng
                      </p>
                    </div>
                    <span className={cx("section-percentage")}>
                      {section.percentage}%
                    </span>
                  </div>

                  <div className={cx("progress")}>
                    <div
                      className={cx("progress-bar")}
                      style={{ width: `${section.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Detailed Answers */}
          <Card className={cx("answers-card")}>
            <h3 className={cx("answers-title")}>Chi tiết câu trả lời</h3>
            <div className={cx("answers-list")}>
              {mockResults.detailedAnswers.map((answer) => (
                <div
                  key={answer.id}
                  className={cx("answer-item", {
                    correct: answer.isCorrect,
                    wrong: !answer.isCorrect,
                  })}
                >
                  <div className={cx("answer-inner")}>
                    <div className={cx("answer-icon")}>
                      {answer.isCorrect ? (
                        <FontAwesomeIcon
                          icon={faCircleCheck}
                          className={cx("icon-correct")}
                        />
                      ) : (
                        <FontAwesomeIcon
                          icon={faCircleXmark}
                          className={cx("icon-wrong")}
                        />
                      )}
                    </div>

                    <div className={cx("answer-content")}>
                      <p className={cx("answer-question")}>
                        Câu {answer.id}: {answer.question}
                      </p>

                      <div className={cx("answer-detail")}>
                        <p>
                          <span className={cx("answer-label")}>
                            Câu trả lời của bạn:
                          </span>{" "}
                          <span
                            className={cx("answer-user", {
                              "answer-user-correct": answer.isCorrect,
                              "answer-user-wrong": !answer.isCorrect,
                            })}
                          >
                            {answer.userAnswer}
                          </span>
                        </p>

                        {!answer.isCorrect && (
                          <p>
                            <span className={cx("answer-label")}>
                              Đáp án đúng:
                            </span>{" "}
                            <span className={cx("answer-correct")}>
                              {answer.correctAnswer}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className={cx("actions")}>
            <Button
              primary
              href="/practice/n5/1/test"
              leftIcon={<FontAwesomeIcon icon={faRotateLeft} />}
            >
              Làm lại bài thi
            </Button>

            <Button outline href="/practice/n5" className={"orange"}>
              Chọn đề khác
            </Button>

            <Button
              outline
              href="/practice"
              className={"orange"}
              leftIcon={<FontAwesomeIcon icon={faHouse} />}
            >
              Về trang chủ
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Results;
