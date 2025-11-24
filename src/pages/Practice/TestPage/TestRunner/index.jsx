import { useState } from "react";
import classNames from "classnames/bind";
import styles from "./TestRunner.module.scss";

import Card from "~/components/Card";
import Button from "~/components/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

const cx = classNames.bind(styles);

// Mock test questions organized by section
const mockSections = {
  vocabulary: {
    title: "Từ vựng",
    questions: [
      {
        id: 1,
        question: "「学校」の読み方は？",
        options: ["がっこう", "がくこう", "がっこ", "がくこ"],
        correctAnswer: 0,
      },
      {
        id: 2,
        question: "「先生」の意味は？",
        options: ["học sinh", "giáo viên", "bạn bè", "gia đình"],
        correctAnswer: 1,
      },
      {
        id: 3,
        question: "「新しい」の対義語は？",
        options: ["古い", "大きい", "小さい", "高い"],
        correctAnswer: 0,
      },
    ],
  },
  grammar: {
    title: "Ngữ pháp - Đọc hiểu",
    questions: [
      {
        id: 4,
        question: "私は毎日学校___行きます。",
        options: ["に", "を", "で", "が"],
        correctAnswer: 0,
      },
      {
        id: 5,
        question: "これは___の本ですか。",
        options: ["だれ", "なに", "どこ", "いつ"],
        correctAnswer: 0,
      },
      {
        id: 6,
        question:
          "田中さんは毎日何時に起きますか。\n\n田中さんは毎朝6時に起きます。朝ごはんを食べて、7時に家を出ます。",
        options: ["5時", "6時", "7時", "8時"],
        correctAnswer: 1,
      },
    ],
  },
  listening: {
    title: "Thi nghe",
    questions: [
      {
        id: 7,
        question: "Nghe đoạn hội thoại và chọn đáp án đúng (1)",
        options: ["Cơm trưa", "Cơm tối", "Cơm sáng", "Đồ uống"],
        correctAnswer: 0,
      },
      {
        id: 8,
        question: "Nghe đoạn hội thoại và chọn đáp án đúng (2)",
        options: ["Ở nhà", "Ở trường", "Ở công ty", "Ở quán cà phê"],
        correctAnswer: 2,
      },
    ],
  },
};

function TestRunner() {
  const [currentSection, setCurrentSection] = useState("vocabulary");
  const [currentQuestionInSection, setCurrentQuestionInSection] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining] = useState(3600); // mock, chưa chạy countdown

  const sections = Object.entries(mockSections);
  const currentSectionData = mockSections[currentSection];
  const currentQuestion =
    currentSectionData.questions[currentQuestionInSection];
  const questionIndex = currentQuestion.id;

  const handleAnswer = (optionIndex) => {
    setAnswers({ ...answers, [questionIndex]: optionIndex });
  };

  const handleNext = () => {
    if (currentQuestionInSection < currentSectionData.questions.length - 1) {
      setCurrentQuestionInSection(currentQuestionInSection + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionInSection > 0) {
      setCurrentQuestionInSection(currentQuestionInSection - 1);
    }
  };

  const handleSectionChange = (sectionKey) => {
    setCurrentSection(sectionKey);
    setCurrentQuestionInSection(0);
  };

  const handleSubmit = () => {
    // TODO: tính điểm + điều hướng sang trang kết quả
    console.log("[app] Submitting answers:", answers);
    alert("Đã nộp bài (mock). Sau này sẽ chuyển sang trang kết quả.");
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTotalAnswered = () => Object.keys(answers).length;

  const getTotalQuestions = () =>
    sections.reduce((sum, [, section]) => sum + section.questions.length, 0);

  return (
    <div className={cx("wrapper")}>
      <main className={cx("main")}>
        <div className={cx("container")}>
          {/* Breadcrumb */}
          <div className={cx("breadcrumb")}>Thi thử / JLPT - N5 / Test 1</div>

          {/* Section Tabs */}
          <div className={cx("section-tabs")}>
            {sections.map(([key, section]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleSectionChange(key)}
                className={cx("section-tab", {
                  active: currentSection === key,
                })}
              >
                {section.title}
              </button>
            ))}
          </div>

          <div className={cx("layout")}>
            {/* Left: Question */}
            <div className={cx("left")}>
              <Card className={cx("question-card")}>
                {/* Question header */}
                <div className={cx("question-header")}>
                  <div className={cx("badge-row")}>
                    <span className={cx("badge", "badge-main")}>
                      {currentQuestionInSection + 1}
                    </span>
                    {currentQuestionInSection > 0 && (
                      <span className={cx("badge", "badge-main")}>
                        {currentQuestionInSection}.1
                      </span>
                    )}
                  </div>
                  <h2 className={cx("question-text")}>
                    {currentQuestion.question}
                  </h2>
                </div>

                {/* Options */}
                <div className={cx("options")}>
                  {currentQuestion.options.map((option, index) => {
                    const selected = answers[questionIndex] === index;
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleAnswer(index)}
                        className={cx("option", { selected })}
                      >
                        <div className={cx("option-inner")}>
                          <div
                            className={cx("option-radio", {
                              selected,
                            })}
                          >
                            {selected && (
                              <div className={cx("option-radio-dot")} />
                            )}
                          </div>
                          <span className={cx("option-label")}>{option}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Navigation buttons */}
                <div className={cx("nav-row")}>
                  <Button
                    outline
                    onClick={handlePrevious}
                    disabled={currentQuestionInSection === 0}
                    leftIcon={
                      <FontAwesomeIcon
                        icon={faChevronLeft}
                        className={cx("nav-icon")}
                      />
                    }
                  >
                    Câu trước
                  </Button>

                  <Button
                    primary
                    className={cx("next-btn")}
                    onClick={handleNext}
                    disabled={
                      currentQuestionInSection ===
                      currentSectionData.questions.length - 1
                    }
                    rightIcon={
                      <FontAwesomeIcon
                        icon={faChevronRight}
                        className={cx("nav-icon")}
                      />
                    }
                  >
                    Câu tiếp
                  </Button>
                </div>
              </Card>
            </div>

            {/* Right: Sidebar */}
            <aside className={cx("right")}>
              {/* Time */}
              <Card className={cx("time-card")}>
                <p className={cx("time-label")}>Thời gian làm bài</p>
                <div className={cx("time-row")}>
                  <FontAwesomeIcon icon={faClock} className={cx("time-icon")} />
                  <span className={cx("time-value")}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
                <p className={cx("time-sub")}>
                  Đã trả lời {getTotalAnswered()}/{getTotalQuestions()} câu
                </p>
              </Card>

              {/* Actions */}
              <div className={cx("action-buttons")}>
                <Button
                  primary
                  className={cx("submit-btn")}
                  onClick={handleSubmit}
                >
                  Nộp bài
                </Button>
                <Button outline className={cx("save-btn")}>
                  Lưu bài
                </Button>
              </div>

              {/* Question list */}
              <Card className={cx("list-card")}>
                <p className={cx("list-title")}>Danh sách câu hỏi</p>
                <div className={cx("list-grid")}>
                  {sections.map(([sectionKey, section]) =>
                    section.questions.map((q, idx) => {
                      const answered = answers[q.id] !== undefined;
                      const isCurrent =
                        currentSection === sectionKey &&
                        currentQuestionInSection === idx;

                      return (
                        <button
                          key={q.id}
                          type="button"
                          className={cx("list-item", {
                            answered,
                            current: isCurrent,
                          })}
                          onClick={() => {
                            setCurrentSection(sectionKey);
                            setCurrentQuestionInSection(idx);
                          }}
                        >
                          {q.id}
                        </button>
                      );
                    })
                  )}
                </div>
              </Card>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

export default TestRunner;
