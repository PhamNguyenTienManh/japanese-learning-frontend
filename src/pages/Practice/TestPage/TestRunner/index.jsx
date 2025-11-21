import { useState } from "react";
import classNames from "classnames/bind";
import styles from "./TestRunner.module.scss";

import Button from "~/components/Button";
import Card from "~/components/Card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faChevronLeft,
  faChevronRight,
  faFlag,
} from "@fortawesome/free-solid-svg-icons";

const cx = classNames.bind(styles);

const mockQuestions = [
  {
    id: 1,
    section: "Chữ và từ vựng",
    question: "「学校」の読み方は？",
    options: ["がっこう", "がくこう", "がっこ", "がくこ"],
    correctAnswer: 0,
  },
  {
    id: 2,
    section: "Chữ và từ vựng",
    question: "「先生」の意味は？",
    options: ["học sinh", "giáo viên", "bạn bè", "gia đình"],
    correctAnswer: 1,
  },
  {
    id: 3,
    section: "Ngữ pháp",
    question: "私は毎日学校___行きます。",
    options: ["に", "を", "で", "が"],
    correctAnswer: 0,
  },
  {
    id: 4,
    section: "Ngữ pháp",
    question: "これは___の本ですか。",
    options: ["だれ", "なに", "どこ", "いつ"],
    correctAnswer: 0,
  },
  {
    id: 5,
    section: "Đọc hiểu",
    question:
      "田中さんは毎日何時に起きますか。\n\n田中さんは毎朝6時に起きます。朝ごはんを食べて、7時に家を出ます。",
    options: ["5時", "6時", "7時", "8時"],
    correctAnswer: 1,
  },
];

function TestRunner() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState(
    Array(mockQuestions.length).fill(null)
  );
  const [timeRemaining] = useState(3600);

  const progress = ((currentQuestion + 1) / mockQuestions.length) * 100;
  const answeredCount = answers.filter((a) => a !== null).length;

  const handleAnswer = (optionIndex) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < mockQuestions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    if (answeredCount < mockQuestions.length) {
      const confirmed = window.confirm(
        `Bạn chưa trả lời ${
          mockQuestions.length - answeredCount
        } câu. Bạn có chắc muốn nộp bài?`
      );
      if (!confirmed) return;
    }

    console.log("Submitting answers:", answers);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const question = mockQuestions[currentQuestion];

  return (
    <div className={cx("wrapper")}>
      <main className={cx("main")}>
        <div className={cx("container")}>
          {/* Header */}
          <div className={cx("header")}>
            <div className={cx("header-left")}>
              <span className={cx("badge", "badge-level")}>N5</span>
              <h1 className={cx("title")}>Đề thi JLPT N5 - Đề số 1</h1>
            </div>

            <div className={cx("header-right")}>
              <FontAwesomeIcon icon={faClock} className={cx("header-icon")} />
              <span className={cx("timer")}>{formatTime(timeRemaining)}</span>
            </div>
          </div>

          {/* Progress */}
          <div className={cx("progress")}>
            <div
              className={cx("progress-bar")}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className={cx("progress-text")}>
            Câu {currentQuestion + 1} / {mockQuestions.length} • Đã trả lời:{" "}
            {answeredCount}
          </p>

          {/* Question Card */}
          <Card className={cx("question-card")}>
            <div className={cx("question-header")}>
              <span className={cx("badge", "badge-section")}>
                {question.section}
              </span>
              <h2 className={cx("question-text")}>
                {question.question.split("\n").map((line, index) => (
                  <span key={index}>
                    {line}
                    {index < question.question.split("\n").length - 1 && <br />}
                  </span>
                ))}
              </h2>
            </div>

            {/* Options */}
            <div className={cx("options")}>
              {question.options.map((option, index) => {
                const isSelected = answers[currentQuestion] === index;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleAnswer(index)}
                    className={cx("option", { selected: isSelected })}
                  >
                    <div className={cx("option-inner")}>
                      <div
                        className={cx("option-radio", {
                          active: isSelected,
                        })}
                      >
                        {isSelected && (
                          <span className={cx("option-radio-dot")} />
                        )}
                      </div>
                      <span className={cx("option-text")}>{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Navigation buttons */}
          <div className={cx("nav-buttons")}>
            <Button
              outline
              text
              className={"orange"}
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              leftIcon={<FontAwesomeIcon icon={faChevronLeft} />}
            >
              Câu trước
            </Button>

            {currentQuestion === mockQuestions.length - 1 ? (
              <Button
                primary
                className={"green"}
                onClick={handleSubmit}
                leftIcon={<FontAwesomeIcon icon={faFlag} />}
              >
                Nộp bài
              </Button>
            ) : (
              <Button
                primary
                className={"green"}
                onClick={handleNext}
                rightIcon={<FontAwesomeIcon icon={faChevronRight} />}
              >
                Câu tiếp
              </Button>
            )}
          </div>

          {/* Question Navigator */}
          <Card className={cx("navigator-card")}>
            <h3 className={cx("navigator-title")}>Danh sách câu hỏi</h3>
            <div className={cx("navigator-grid")}>
              {mockQuestions.map((_, index) => {
                const isCurrent = currentQuestion === index;
                const isAnswered = answers[index] !== null;

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setCurrentQuestion(index)}
                    className={cx("navigator-item", {
                      current: isCurrent,
                      answered: isAnswered,
                    })}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default TestRunner;
