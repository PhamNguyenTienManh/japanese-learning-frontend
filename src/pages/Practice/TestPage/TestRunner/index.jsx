// TestRunner.jsx
import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import classNames from "classnames/bind";
import { motion } from "framer-motion";
import styles from "./TestRunner.module.scss";
import Button from "~/components/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faChevronLeft,
  faChevronRight,
  faPlay,
  faPause,
  faPaperPlane,
  faSave,
  faAngleRight,
} from "@fortawesome/free-solid-svg-icons";
import {
  getExamDetail,
  saveAnswers,
  submitExam,
  resumeExam,
  saveProgress,
} from "~/services/examService";
import PopupModal from "~/components/Popup";

const cx = classNames.bind(styles);

const easeOut = [0.22, 1, 0.36, 1];

function AudioPlayer({ src }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    audioRef.current.currentTime = percentage * duration;
  };

  const formatTime = (time) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={cx("audio-player")}>
      <audio ref={audioRef} src={src} />
      <div className={cx("audio-controls")}>
        <motion.button
          onClick={togglePlay}
          className={cx("audio-play-btn")}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
        >
          <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
        </motion.button>
        <div className={cx("audio-progress-wrapper")}>
          <div className={cx("audio-progress-bar")} onClick={handleSeek}>
            <div
              className={cx("audio-progress-fill")}
              style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
            />
          </div>
          <div className={cx("audio-time")}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TestRunner() {
  const { testId, level } = useParams();
  const navigate = useNavigate();
  const upperLevel = level?.toUpperCase();
  const lowerLevel = level?.toLowerCase();

  const [examData, setExamData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(5400);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examResultId, setExamResultId] = useState(null);
  const [examTitle, setExamTitle] = useState("");
  const [progressRestored, setProgressRestored] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [showConfirmSave, setShowConfirmSave] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setShowConfirmExit(true);
      setShowConfirm(false);
      window.history.pushState(null, "", window.location.href);
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const confirmExit = async () => {
    setShowConfirmExit(false);
    if (examResultId && examData.length > 0) {
      try {
        const totalTime = examData.reduce(
          (sum, part) => sum + part.time * 60,
          0,
        );
        const elapsed = Math.max(0, totalTime - timeRemaining);
        await saveProgress(examResultId, elapsed);
      } catch (err) {
        console.error("Không thể lưu tiến trình khi thoát:", err);
      }
    }
    navigate(`/practice/${level}`);
  };

  const cancelExit = () => {
    setShowConfirmExit(false);
  };

  useEffect(() => {
    const savedExamResultId = localStorage.getItem("currentExamResultId");
    if (savedExamResultId) {
      setExamResultId(savedExamResultId);
    } else {
      setError("Không tìm thấy phiên làm bài. Vui lòng bắt đầu lại.");
    }
  }, []);

  useEffect(() => {
    const fetchExamData = async () => {
      try {
        setLoading(true);
        const response = await getExamDetail(testId);

        if (response.success && response.data) {
          setExamData(response.data.parts);
          setExamTitle(response.data.exam.title);
        } else {
          setError("Không thể tải dữ liệu bài thi");
        }
      } catch (err) {
        console.error("Error fetching exam:", err);
        setError("Đã có lỗi xảy ra khi tải bài thi");
      } finally {
        setLoading(false);
      }
    };

    if (testId) {
      fetchExamData();
    }
  }, [testId]);

  useEffect(() => {
    if (!examResultId || examData.length === 0 || progressRestored) return;

    const restoreProgress = async () => {
      const totalTime = examData.reduce(
        (sum, part) => sum + part.time * 60,
        0,
      );
      try {
        const response = await resumeExam(examResultId);
        if (response.success && response.data) {
          const { elapsed, answers: savedAnswers } = response.data;

          const restoredAnswers = {};
          if (savedAnswers && savedAnswers.length > 0) {
            savedAnswers.forEach((partAnswer) => {
              partAnswer.answers.forEach((ans) => {
                const qId = ans.questionId.toString();
                const subIdx = ans.subQuestionIndex;
                if (
                  subIdx !== undefined &&
                  subIdx !== null &&
                  ans.selectedAnswer >= 0
                ) {
                  restoredAnswers[`${qId}-${subIdx}`] = ans.selectedAnswer;
                }
              });
            });
          }

          if (Object.keys(restoredAnswers).length > 0) {
            setAnswers(restoredAnswers);
          }

          const elapsedNum = Number(elapsed) || 0;
          setTimeRemaining(Math.max(0, totalTime - elapsedNum));
        } else {
          setTimeRemaining(totalTime);
        }
      } catch (err) {
        console.error("Không thể khôi phục tiến trình:", err);
        setTimeRemaining(totalTime);
      } finally {
        setProgressRestored(true);
      }
    };

    restoreProgress();
  }, [examResultId, examData, progressRestored]);

  useEffect(() => {
    if (loading || examData.length === 0 || !progressRestored) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, examData, progressRestored]);

  const convertAnswersToAPIFormat = () => {
    const answersByPart = {};

    Object.keys(answers).forEach((key) => {
      const [questionId, contentIndex] = key.split("-");

      examData.forEach((part) => {
        const question = part.questions.find((q) => q._id === questionId);
        if (question) {
          if (!answersByPart[part.partId]) {
            answersByPart[part.partId] = {};
          }
          if (!answersByPart[part.partId][questionId]) {
            answersByPart[part.partId][questionId] = [];
          }
          answersByPart[part.partId][questionId].push({
            subQuestionIndex: parseInt(contentIndex),
            selectedAnswer: answers[key],
          });
        }
      });
    });

    return Object.keys(answersByPart).map((partId) => ({
      examResultId,
      partId,
      answers: Object.keys(answersByPart[partId]).map((questionId) => ({
        questionId,
        subAnswers: answersByPart[partId][questionId],
      })),
    }));
  };

  const handleAnswer = async (contentIndex, optionIndex) => {
    const currentQuestion =
      examData[currentPartIndex]?.questions[currentQuestionIndex];
    if (!currentQuestion) return;

    const answerKey = `${currentQuestion._id}-${contentIndex}`;
    const newAnswers = { ...answers, [answerKey]: optionIndex };
    setAnswers(newAnswers);

    try {
      const currentPart = examData[currentPartIndex];
      const answersInPart = [];

      currentPart.questions.forEach((question) => {
        const subAnswers = [];

        question.content.forEach((_, idx) => {
          const key = `${question._id}-${idx}`;
          const selectedAnswer = newAnswers[key];

          if (selectedAnswer !== undefined) {
            subAnswers.push({
              subQuestionIndex: idx,
              selectedAnswer: selectedAnswer,
            });
          }
        });

        if (subAnswers.length > 0) {
          answersInPart.push({
            questionId: question._id,
            subAnswers: subAnswers,
          });
        }
      });

      if (answersInPart.length > 0) {
        const apiData = {
          examResultId,
          partId: currentPart.partId,
          answers: answersInPart,
        };
        await saveAnswers(apiData);
      }
    } catch (error) {
      console.error("Lỗi khi lưu đáp án:", error);
    }
  };

  const handleNext = () => {
    const currentPart = examData[currentPartIndex];
    if (!currentPart) return;

    if (currentQuestionIndex < currentPart.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (currentPartIndex < examData.length - 1) {
      setCurrentPartIndex(currentPartIndex + 1);
      setCurrentQuestionIndex(0);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (currentPartIndex > 0) {
      const prevPartIndex = currentPartIndex - 1;
      const prevPart = examData[prevPartIndex];
      setCurrentPartIndex(prevPartIndex);
      setCurrentQuestionIndex(prevPart.questions.length - 1);
    }
  };

  const handleSectionChange = (index) => {
    setCurrentPartIndex(index);
    setCurrentQuestionIndex(0);
  };

  const handleConfirmSave = () => {
    if (!examResultId) {
      alert("Không tìm thấy phiên làm bài!");
      return;
    }
    setShowConfirmSave(true);
  };

  const cancelSave = () => {
    setShowConfirmSave(false);
  };

  const handleSaveAndExit = async () => {
    if (!examResultId) {
      alert("Không tìm thấy phiên làm bài!");
      setShowConfirmSave(false);
      return;
    }

    try {
      setIsSaving(true);
      setShowConfirmSave(false);

      const apiDataArray = convertAnswersToAPIFormat();
      for (const apiData of apiDataArray) {
        await saveAnswers(apiData);
      }

      const totalTime = examData.reduce(
        (sum, part) => sum + part.time * 60,
        0,
      );
      const elapsed = Math.max(0, totalTime - timeRemaining);
      await saveProgress(examResultId, elapsed);

      navigate(`/practice/${level}`);
    } catch (error) {
      console.error("Lỗi khi lưu bài:", error);
      alert("Có lỗi xảy ra khi lưu bài. Vui lòng thử lại!");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmSubmit = () => {
    setShowConfirm(true);
  };

  const handleSubmit = async () => {
    if (!examResultId) {
      alert("Không tìm thấy phiên làm bài!");
      return;
    }

    try {
      setIsSubmitting(true);
      setShowConfirm(false);

      const response = await submitExam(examResultId);

      if (response.success) {
        localStorage.removeItem("currentExamResultId");
        localStorage.removeItem("currentExamId");
        localStorage.removeItem("examStartTime");

        navigate(`/practice/${level}/results/${testId}`);
      } else {
        throw new Error("Không thể nộp bài");
      }
    } catch (error) {
      console.error("Lỗi khi nộp bài:", error);
      alert("Có lỗi xảy ra khi nộp bài. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTotalAnswered = () => Object.keys(answers).length;

  const getTotalQuestions = () => {
    return examData.reduce((sum, part) => {
      return (
        sum + part.questions.reduce((qSum, q) => qSum + q.content.length, 0)
      );
    }, 0);
  };

  if (loading || (examResultId && !progressRestored)) {
    return (
      <div className={cx("wrapper", lowerLevel)}>
        <main className={cx("main")}>
          <div className={cx("container")}>
            <div className={cx("loading")}>
              <div className={cx("loading-ring")} />
              <p>Đang tải bài thi...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cx("wrapper", lowerLevel)}>
        <main className={cx("main")}>
          <div className={cx("container")}>
            <div className={cx("error-state")}>
              <p>{error}</p>
              <Button primary onClick={() => window.location.reload()}>
                Thử lại
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!examData || examData.length === 0) {
    return (
      <div className={cx("wrapper", lowerLevel)}>
        <main className={cx("main")}>
          <div className={cx("container")}>
            <div className={cx("error-state")}>
              <p>Không có dữ liệu bài thi</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const currentPart = examData[currentPartIndex];

  if (
    !currentPart ||
    !currentPart.questions ||
    currentPart.questions.length === 0
  ) {
    return (
      <div className={cx("wrapper", lowerLevel)}>
        <main className={cx("main")}>
          <div className={cx("container")}>
            <div className={cx("breadcrumb")}>
              <Link to="/practice">Thi thử</Link>
              <FontAwesomeIcon icon={faAngleRight} />
              <Link to={`/practice/${lowerLevel}`}>JLPT - {upperLevel}</Link>
              <FontAwesomeIcon icon={faAngleRight} />
              <span>{examTitle}</span>
            </div>

            <div className={cx("section-tabs")}>
              {examData.map((part, index) => (
                <button
                  key={part.partId}
                  type="button"
                  onClick={() => handleSectionChange(index)}
                  className={cx("section-tab", {
                    active: currentPartIndex === index,
                  })}
                >
                  {part.partName}
                </button>
              ))}
            </div>

            <div className={cx("error-state")}>
              <p>Phần này chưa có câu hỏi</p>
            </div>
          </div>
        </main>

        <PopupModal
          visible={showConfirm}
          onConfirm={handleSubmit}
          onCancel={handleCancel}
          title="Xác nhận nộp bài"
          message="Bạn có chắc chắn muốn nộp bài? Sau khi nộp bạn không thể thay đổi câu trả lời."
          confirmText="Nộp bài"
        />

        <PopupModal
          visible={showConfirmExit}
          onConfirm={confirmExit}
          onCancel={cancelExit}
          title="Xác nhận thoát"
          message="Tiến trình sẽ được lưu lại. Bạn có thể quay lại tiếp tục sau."
          confirmText="Lưu và thoát"
        />
      </div>
    );
  }

  const currentQuestion = currentPart.questions[currentQuestionIndex];

  const isFirstQuestion = currentPartIndex === 0 && currentQuestionIndex === 0;
  const isLastQuestion =
    currentPartIndex === examData.length - 1 &&
    currentQuestionIndex === currentPart.questions.length - 1;

  const totalAnswered = getTotalAnswered();
  const totalQuestions = getTotalQuestions();
  const progressPct = totalQuestions
    ? (totalAnswered / totalQuestions) * 100
    : 0;

  const isLowTime = timeRemaining <= 300;
  const isCriticalTime = timeRemaining <= 60;

  return (
    <div className={cx("wrapper", lowerLevel)}>
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
            <Link to={`/practice/${lowerLevel}`}>JLPT - {upperLevel}</Link>
            <FontAwesomeIcon icon={faAngleRight} />
            <span className={cx("breadcrumb-current")}>{examTitle}</span>
          </motion.div>

          {/* Progress strip */}
          <motion.div
            className={cx("progress-strip")}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOut, delay: 0.05 }}
          >
            <div className={cx("progress-track")}>
              <motion.div
                className={cx("progress-fill")}
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.4, ease: easeOut }}
              />
            </div>
            <span className={cx("progress-label")}>
              {totalAnswered}/{totalQuestions} câu
            </span>
          </motion.div>

          {/* Section Tabs */}
          <motion.div
            className={cx("section-tabs")}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: easeOut, delay: 0.1 }}
          >
            {examData.map((part, index) => (
              <button
                key={part.partId}
                type="button"
                onClick={() => handleSectionChange(index)}
                className={cx("section-tab", {
                  active: currentPartIndex === index,
                })}
              >
                {part.partName}
              </button>
            ))}
          </motion.div>

          <div className={cx("layout")}>
            {/* Left: Question */}
            <motion.div
              className={cx("left")}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easeOut, delay: 0.15 }}
            >
              <motion.div
                key={`${currentPartIndex}-${currentQuestionIndex}`}
                className={cx("question-card")}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: easeOut }}
              >
                {/* Question header */}
                <div className={cx("question-header")}>
                  <div className={cx("badge-row")}>
                    <span className={cx("badge", "badge-main")}>
                      Câu {currentQuestionIndex + 1}
                    </span>
                    {currentQuestion.kind && (
                      <span className={cx("badge", "badge-kind")}>
                        {currentQuestion.kind}
                      </span>
                    )}
                    {currentQuestion.level && (
                      <span className={cx("badge", "badge-level")}>
                        N{currentQuestion.level}
                      </span>
                    )}
                  </div>
                  <h2 className={cx("question-text")}>
                    {currentQuestion.title}
                  </h2>
                </div>

                {currentQuestion.general?.audio && (
                  <AudioPlayer src={currentQuestion.general.audio} />
                )}

                {currentPartIndex === 1 && currentQuestion.general?.txt_read && (
                  <div className={cx("text-read-box")}>
                    <p>{currentQuestion.general.txt_read}</p>
                  </div>
                )}

                {currentQuestion.general?.image && (
                  <div className={cx("general-image")}>
                    <img
                      src={currentQuestion.general.image}
                      alt="Question illustration"
                    />
                  </div>
                )}

                {currentQuestion.content.map((content, contentIndex) => {
                  const answerKey = `${currentQuestion._id}-${contentIndex}`;

                  return (
                    <div key={contentIndex} className={cx("content-section")}>
                      <p className={cx("content-question")}>
                        <span className={cx("content-num")}>
                          {currentQuestionIndex + 1}.{contentIndex + 1}
                        </span>{" "}
                        {content.question}
                      </p>

                      {content.image && (
                        <div className={cx("content-image")}>
                          <img
                            src={content.image}
                            alt="Content illustration"
                          />
                        </div>
                      )}

                      <div className={cx("options")}>
                        {content.answers.map((answer, optionIndex) => {
                          const selected = answers[answerKey] === optionIndex;
                          return (
                            <motion.button
                              key={optionIndex}
                              type="button"
                              onClick={() =>
                                handleAnswer(contentIndex, optionIndex)
                              }
                              className={cx("option", { selected })}
                              whileHover={{ x: 3 }}
                              whileTap={{ scale: 0.99 }}
                              transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 26,
                              }}
                            >
                              <div className={cx("option-inner")}>
                                <div
                                  className={cx("option-radio", {
                                    selected,
                                  })}
                                >
                                  {selected && (
                                    <motion.div
                                      className={cx("option-radio-dot")}
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{
                                        type: "spring",
                                        stiffness: 500,
                                        damping: 22,
                                      }}
                                    />
                                  )}
                                </div>
                                <span className={cx("option-letter")}>
                                  {String.fromCharCode(65 + optionIndex)}
                                </span>
                                <span className={cx("option-label")}>
                                  {answer}
                                </span>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                <div className={cx("nav-row")}>
                  <Button
                    outline
                    onClick={handlePrevious}
                    disabled={isFirstQuestion}
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
                    disabled={isLastQuestion}
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
              </motion.div>
            </motion.div>

            {/* Right: Sidebar */}
            <motion.aside
              className={cx("right")}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easeOut, delay: 0.2 }}
            >
              {/* Time */}
              <div
                className={cx("time-card", {
                  low: isLowTime,
                  critical: isCriticalTime,
                })}
              >
                <p className={cx("time-label")}>Thời gian còn lại</p>
                <div className={cx("time-row")}>
                  <FontAwesomeIcon icon={faClock} className={cx("time-icon")} />
                  <span className={cx("time-value")}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
                <div className={cx("time-progress")}>
                  <div
                    className={cx("time-progress-fill")}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className={cx("time-sub")}>
                  Đã trả lời <strong>{totalAnswered}</strong>/{totalQuestions}{" "}
                  câu
                </p>
              </div>

              {/* Actions */}
              <div className={cx("action-buttons")}>
                <motion.button
                  type="button"
                  className={cx("submit-btn")}
                  onClick={handleConfirmSubmit}
                  disabled={isSubmitting}
                  whileHover={!isSubmitting ? { y: -1 } : {}}
                  whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                >
                  <FontAwesomeIcon icon={faPaperPlane} />
                  <span>{isSubmitting ? "Đang nộp..." : "Nộp bài"}</span>
                </motion.button>
                <motion.button
                  type="button"
                  className={cx("save-btn")}
                  onClick={handleConfirmSave}
                  disabled={isSaving}
                  whileHover={!isSaving ? { y: -1 } : {}}
                  whileTap={!isSaving ? { scale: 0.98 } : {}}
                >
                  <FontAwesomeIcon icon={faSave} />
                  <span>{isSaving ? "Đang lưu..." : "Lưu bài"}</span>
                </motion.button>
              </div>

              {/* Question list */}
              <div className={cx("list-card")}>
                <div className={cx("list-header")}>
                  <p className={cx("list-title")}>Danh sách câu hỏi</p>
                  <span className={cx("list-counter")}>
                    {totalAnswered}/{totalQuestions}
                  </span>
                </div>
                <div className={cx("list-sections")}>
                  {examData.map((part, pIdx) => (
                    <div key={part.partId} className={cx("list-section")}>
                      <h4 className={cx("list-section-title")}>
                        {part.partName}
                      </h4>
                      <div className={cx("list-grid")}>
                        {part.questions.map((question, qIdx) => {
                          const isCurrent =
                            pIdx === currentPartIndex &&
                            qIdx === currentQuestionIndex;

                          const allAnswered = question.content.every(
                            (_, cIdx) => {
                              const key = `${question._id}-${cIdx}`;
                              return answers[key] !== undefined;
                            },
                          );

                          return (
                            <button
                              key={question._id}
                              type="button"
                              className={cx("list-item", {
                                answered: allAnswered,
                                current: isCurrent,
                              })}
                              onClick={() => {
                                setCurrentPartIndex(pIdx);
                                setCurrentQuestionIndex(qIdx);
                              }}
                            >
                              {qIdx + 1}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div className={cx("list-legend")}>
                  <div className={cx("legend-item")}>
                    <span className={cx("legend-dot", "answered")} />
                    Đã làm
                  </div>
                  <div className={cx("legend-item")}>
                    <span className={cx("legend-dot", "current")} />
                    Hiện tại
                  </div>
                  <div className={cx("legend-item")}>
                    <span className={cx("legend-dot")} />
                    Chưa làm
                  </div>
                </div>
              </div>
            </motion.aside>
          </div>
        </div>
      </main>

      <PopupModal
        visible={showConfirm}
        onConfirm={handleSubmit}
        onCancel={handleCancel}
        title="Xác nhận nộp bài"
        message="Bạn có chắc chắn muốn nộp bài? Sau khi nộp bạn không thể thay đổi câu trả lời."
        confirmText="Nộp bài"
      />

      <PopupModal
        visible={showConfirmExit}
        onConfirm={confirmExit}
        onCancel={cancelExit}
        title="Xác nhận thoát"
        message="Tiến trình sẽ được lưu lại. Bạn có thể quay lại tiếp tục sau."
        confirmText="Lưu và thoát"
      />

      <PopupModal
        visible={showConfirmSave}
        onConfirm={handleSaveAndExit}
        onCancel={cancelSave}
        title="Xác nhận lưu bài"
        message="Bài làm dở của bạn sẽ được lưu lại. Bạn có thể quay lại tiếp tục sau. Tiếp tục lưu và thoát?"
        confirmText="Lưu và thoát"
      />
    </div>
  );
}

export default TestRunner;
