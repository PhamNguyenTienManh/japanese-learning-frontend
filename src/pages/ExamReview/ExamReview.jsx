// ExamReview.jsx
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import classNames from "classnames/bind";
import { motion } from "framer-motion";
import styles from "./ExamReview.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faCheck,
  faXmark,
  faHome,
  faTrophy,
  faClock,
  faAngleRight,
  faLightbulb,
  faBook,
} from "@fortawesome/free-solid-svg-icons";
import { comparisonUserAnswerWithResult } from "~/services/examService";

const cx = classNames.bind(styles);

const easeOut = [0.22, 1, 0.36, 1];

function ExamReview() {
  const { testId, level } = useParams();
  const navigate = useNavigate();
  const audioRef = useRef(null);

  const [reviewData, setReviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const [currentQuestionIndexInPart, setCurrentQuestionIndexInPart] =
    useState(0);

  useEffect(() => {
    const fetchReviewData = async () => {
      try {
        setLoading(true);
        const response = await comparisonUserAnswerWithResult(testId);
        if (response.success && response.data) {
          setReviewData(response.data);
        } else {
          setError("Không thể tải kết quả bài thi");
        }
      } catch (err) {
        console.error("Error fetching review:", err);
        setError("Đã có lỗi xảy ra khi tải kết quả");
      } finally {
        setLoading(false);
      }
    };

    if (testId) {
      fetchReviewData();
    }
  }, [testId]);

  const handleNext = () => {
    const currentPart = reviewData.parts[currentPartIndex];
    if (currentQuestionIndexInPart < currentPart.questions.length - 1) {
      setCurrentQuestionIndexInPart(currentQuestionIndexInPart + 1);
    } else if (currentPartIndex < reviewData.parts.length - 1) {
      setCurrentPartIndex(currentPartIndex + 1);
      setCurrentQuestionIndexInPart(0);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndexInPart > 0) {
      setCurrentQuestionIndexInPart(currentQuestionIndexInPart - 1);
    } else if (currentPartIndex > 0) {
      const prevPartIndex = currentPartIndex - 1;
      const prevPart = reviewData.parts[prevPartIndex];
      setCurrentPartIndex(prevPartIndex);
      setCurrentQuestionIndexInPart(prevPart.questions.length - 1);
    }
  };

  const handleSectionChange = (index) => {
    setCurrentPartIndex(index);
    setCurrentQuestionIndexInPart(0);
  };

  const handleQuestionClick = (partIdx, questionIdx) => {
    setCurrentPartIndex(partIdx);
    setCurrentQuestionIndexInPart(questionIdx);
  };

  const handleBackToHome = () => {
    navigate(`/practice/${level}`);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className={cx("wrapper")}>
        <main className={cx("main")}>
          <div className={cx("container")}>
            <div className={cx("loading")}>
              <div className={cx("loadingRing")} />
              <p className={cx("loadingText")}>Đang tải đáp án...</p>
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
            <div className={cx("errorState")}>
              <p className={cx("errorText")}>{error}</p>
              <button
                className={cx("retryButton")}
                onClick={() => window.location.reload()}
              >
                Thử lại
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!reviewData || !reviewData.parts || reviewData.parts.length === 0) {
    return (
      <div className={cx("wrapper")}>
        <main className={cx("main")}>
          <div className={cx("container")}>
            <div className={cx("errorState")}>
              <p className={cx("errorText")}>Không có dữ liệu kết quả</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const currentPart = reviewData.parts[currentPartIndex];
  const currentQuestion = currentPart.questions[currentQuestionIndexInPart];
  const isFirstQuestion =
    currentPartIndex === 0 && currentQuestionIndexInPart === 0;
  const isLastQuestion =
    currentPartIndex === reviewData.parts.length - 1 &&
    currentQuestionIndexInPart === currentPart.questions.length - 1;

  const totalQuestions = reviewData.parts.reduce(
    (sum, p) => sum + p.questions.length,
    0,
  );
  const totalCorrect = reviewData.parts.reduce(
    (sum, p) => sum + p.questions.filter((q) => q.isCorrect).length,
    0,
  );
  const accuracyPct = totalQuestions
    ? Math.round((totalCorrect / totalQuestions) * 100)
    : 0;

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
            <Link to={`/practice/${level}`}>JLPT - {level?.toUpperCase()}</Link>
            <FontAwesomeIcon icon={faAngleRight} />
            <Link to={`/practice/${level}/results/${testId}`}>Kết quả</Link>
            <FontAwesomeIcon icon={faAngleRight} />
            <span className={cx("breadcrumbCurrent")}>Xem đáp án</span>
          </motion.div>

          {/* Accuracy strip */}
          <motion.div
            className={cx("accuracyStrip")}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOut, delay: 0.05 }}
          >
            <div className={cx("accuracyTrack")}>
              <motion.div
                className={cx("accuracyFill")}
                initial={{ width: 0 }}
                animate={{ width: `${accuracyPct}%` }}
                transition={{ duration: 1.1, ease: easeOut, delay: 0.2 }}
              />
            </div>
            <span className={cx("accuracyLabel")}>
              <strong>{totalCorrect}</strong>/{totalQuestions} đúng •{" "}
              {accuracyPct}%
            </span>
          </motion.div>

          {/* Section Tabs */}
          <motion.div
            className={cx("sectionTabs")}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: easeOut, delay: 0.1 }}
          >
            {reviewData.parts.map((part, index) => (
              <button
                key={part.partId}
                type="button"
                onClick={() => handleSectionChange(index)}
                className={cx("sectionTab", {
                  active: currentPartIndex === index,
                })}
              >
                {part.partTitle}
              </button>
            ))}
          </motion.div>

          {/* Layout */}
          <div className={cx("layout")}>
            {/* Left: Question Review */}
            <motion.div
              className={cx("left")}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easeOut, delay: 0.15 }}
            >
              <motion.div
                key={`${currentPartIndex}-${currentQuestionIndexInPart}`}
                className={cx("questionCard")}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: easeOut }}
              >
                {/* Question header */}
                <div className={cx("questionHeader")}>
                  <div className={cx("badgeRow")}>
                    <span className={cx("badge", "badgeMain")}>
                      Câu {currentQuestion.questionNumber}
                    </span>
                    <span
                      className={cx("badge", {
                        badgeCorrect: currentQuestion.isCorrect,
                        badgeWrong: !currentQuestion.isCorrect,
                      })}
                    >
                      <FontAwesomeIcon
                        icon={currentQuestion.isCorrect ? faCheck : faXmark}
                      />
                      {currentQuestion.isCorrect ? "Đúng" : "Sai"}
                    </span>
                  </div>

                  {currentQuestion.questionTitle && (
                    <h1 className={cx("questionTitle")}>
                      {currentQuestion.questionTitle}
                    </h1>
                  )}

                  {currentQuestion.generalInfo && (
                    <div className={cx("generalInfo")}>
                      {currentQuestion.generalInfo.audio && (
                        <audio
                          ref={audioRef}
                          controls
                          className={cx("audioPlayer")}
                          src={currentQuestion.generalInfo.audio}
                        >
                          Trình duyệt của bạn không hỗ trợ audio.
                        </audio>
                      )}

                      {currentQuestion.generalInfo.txt_read && (
                        <div className={cx("txtReadBox")}>
                          <p className={cx("txtReadText")}>
                            {currentQuestion.generalInfo.txt_read}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {currentQuestion.generalInfo?.image && (
                    <div className={cx("questionImage")}>
                      <img
                        src={currentQuestion.generalInfo.image}
                        alt="Question illustration"
                      />
                    </div>
                  )}

                  <h2 className={cx("questionText")}>
                    {currentQuestion.questionText}
                  </h2>
                </div>

                {/* Answer Options */}
                <div className={cx("answerOptions")}>
                  {currentQuestion.answers &&
                    currentQuestion.answers.map((answer, idx) => {
                      const isUserAnswer = idx === currentQuestion.userAnswer;
                      const isCorrectAnswer =
                        idx === currentQuestion.correctAnswer;
                      const isCorrectChoice =
                        isUserAnswer && currentQuestion.isCorrect;
                      const isWrongChoice =
                        isUserAnswer && !currentQuestion.isCorrect;

                      const showCorrect =
                        isCorrectChoice ||
                        (isCorrectAnswer && !isUserAnswer);
                      const showWrong = isWrongChoice;

                      return (
                        <motion.div
                          key={idx}
                          className={cx("answerOption", {
                            correct: showCorrect,
                            wrong: showWrong,
                          })}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            duration: 0.35,
                            ease: easeOut,
                            delay: idx * 0.05,
                          }}
                        >
                          <div className={cx("answerInner")}>
                            <span
                              className={cx("answerLetter", {
                                letterCorrect: showCorrect,
                                letterWrong: showWrong,
                              })}
                            >
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <div className={cx("answerContent")}>
                              <div className={cx("answerText")}>
                                <span className={cx("answerValue")}>
                                  {answer}
                                </span>
                              </div>

                              {isWrongChoice && (
                                <span
                                  className={cx("answerLabel", "labelWrong")}
                                >
                                  Bạn đã chọn
                                </span>
                              )}
                              {isCorrectAnswer && !isUserAnswer && (
                                <span
                                  className={cx("answerLabel", "labelCorrect")}
                                >
                                  Đáp án đúng
                                </span>
                              )}
                              {isCorrectChoice && (
                                <span
                                  className={cx("answerLabel", "labelCorrect")}
                                >
                                  Bạn đã chọn ✓
                                </span>
                              )}
                            </div>

                            {showCorrect && (
                              <span
                                className={cx("answerMark", "markCorrect")}
                              >
                                <FontAwesomeIcon icon={faCheck} />
                              </span>
                            )}
                            {showWrong && (
                              <span className={cx("answerMark", "markWrong")}>
                                <FontAwesomeIcon icon={faXmark} />
                              </span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}

                  {currentQuestion.userAnswer === -1 && (
                    <div className={cx("answerOption", "wrong")}>
                      <div className={cx("answerInner")}>
                        <span className={cx("answerLetter", "letterWrong")}>
                          —
                        </span>
                        <div className={cx("answerContent")}>
                          <span className={cx("answerValue")}>
                            Bạn chưa chọn đáp án
                          </span>
                        </div>
                        <span className={cx("answerMark", "markWrong")}>
                          <FontAwesomeIcon icon={faXmark} />
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Explanation */}
                {currentQuestion.explain && (
                  <motion.div
                    className={cx("explainBox")}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      ease: easeOut,
                      delay: 0.2,
                    }}
                  >
                    <p className={cx("explainTitle")}>
                      <FontAwesomeIcon icon={faLightbulb} />
                      Giải thích
                    </p>
                    <p className={cx("explainText")}>
                      {currentQuestion.explain}
                    </p>
                  </motion.div>
                )}

                {currentQuestion.explainAll && (
                  <motion.div
                    className={cx("explainBox", "explainDetail")}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      ease: easeOut,
                      delay: 0.3,
                    }}
                  >
                    <p className={cx("explainTitle")}>
                      <FontAwesomeIcon icon={faBook} />
                      Giải thích chi tiết
                    </p>
                    <p className={cx("explainText")}>
                      {currentQuestion.explainAll}
                    </p>
                  </motion.div>
                )}

                {/* Navigation buttons */}
                <div className={cx("navRow")}>
                  <button
                    onClick={handlePrevious}
                    disabled={isFirstQuestion}
                    className={cx("navButton")}
                  >
                    <FontAwesomeIcon icon={faChevronLeft} />
                    <span>Câu trước</span>
                  </button>

                  <button
                    onClick={handleNext}
                    disabled={isLastQuestion}
                    className={cx("navButton", "navNext")}
                  >
                    <span>Câu tiếp</span>
                    <FontAwesomeIcon icon={faChevronRight} />
                  </button>
                </div>
              </motion.div>
            </motion.div>

            {/* Right: Sidebar */}
            <motion.aside
              className={cx("right")}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easeOut, delay: 0.2 }}
            >
              {/* Summary Card */}
              <div
                className={cx("summaryCard", {
                  passedAccent: reviewData.passed,
                  failedAccent: !reviewData.passed,
                })}
              >
                <p className={cx("summaryTitle")}>
                  <FontAwesomeIcon icon={faTrophy} />
                  <span>Kết quả</span>
                </p>

                <div className={cx("summaryContent")}>
                  <div className={cx("summaryRow")}>
                    <span className={cx("summaryLabel")}>Điểm số</span>
                    <span className={cx("summaryValue")}>
                      {reviewData.totalScore}/{reviewData.maxScore}
                    </span>
                  </div>

                  <div className={cx("summaryRow")}>
                    <span className={cx("summaryLabel")}>Thời gian</span>
                    <span className={cx("summaryValue")}>
                      <FontAwesomeIcon icon={faClock} />
                      {formatDuration(reviewData.duration)}
                    </span>
                  </div>

                  <div className={cx("summaryRow")}>
                    <span className={cx("summaryLabel")}>Trạng thái</span>
                    <span
                      className={cx("summaryBadge", {
                        passed: reviewData.passed,
                        failed: !reviewData.passed,
                      })}
                    >
                      <FontAwesomeIcon
                        icon={reviewData.passed ? faCheck : faXmark}
                      />
                      {reviewData.passed ? "Đạt" : "Chưa đạt"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <motion.button
                onClick={handleBackToHome}
                className={cx("actionButton")}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <FontAwesomeIcon icon={faHome} />
                <span>Về trang luyện thi</span>
              </motion.button>

              {/* Question List */}
              <div className={cx("listCard")}>
                <div className={cx("listHeader")}>
                  <p className={cx("listTitle")}>Danh sách câu hỏi</p>
                  <span className={cx("listCounter")}>
                    {totalCorrect}/{totalQuestions}
                  </span>
                </div>

                <div className={cx("listSections")}>
                  {reviewData.parts.map((part, pIdx) => (
                    <div key={part.partId} className={cx("listSection")}>
                      <h4 className={cx("listSectionTitle")}>
                        {part.partTitle}
                      </h4>
                      <div className={cx("listGrid")}>
                        {part.questions.map((question, qIdx) => {
                          const isCurrent =
                            pIdx === currentPartIndex &&
                            qIdx === currentQuestionIndexInPart;

                          return (
                            <button
                              key={`${question.questionId}-${qIdx}`}
                              type="button"
                              onClick={() =>
                                handleQuestionClick(pIdx, qIdx)
                              }
                              className={cx("listItem", {
                                correct: !isCurrent && question.isCorrect,
                                wrong: !isCurrent && !question.isCorrect,
                                current: isCurrent,
                              })}
                            >
                              {question.questionNumber}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className={cx("listLegend")}>
                  <div className={cx("legendItem")}>
                    <span className={cx("legendDot", "correct")} />
                    Đúng
                  </div>
                  <div className={cx("legendItem")}>
                    <span className={cx("legendDot", "wrong")} />
                    Sai
                  </div>
                  <div className={cx("legendItem")}>
                    <span className={cx("legendDot", "current")} />
                    Hiện tại
                  </div>
                </div>
              </div>
            </motion.aside>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ExamReview;
