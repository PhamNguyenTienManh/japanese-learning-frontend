// TestRunner.jsx
import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import classNames from "classnames/bind";
import styles from "./TestRunner.module.scss";
import Card from "~/components/Card";
import Button from "~/components/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faChevronLeft,
  faChevronRight,
  faPlay,
  faPause,
} from "@fortawesome/free-solid-svg-icons";
import { getExamDetail } from "~/services/examService";
import { saveAnswers, submitExam } from "~/services/examService"; // Import API functions

const cx = classNames.bind(styles);

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
        <button onClick={togglePlay} className={cx("audio-play-btn")}>
          <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
        </button>
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

  // Lấy examResultId từ localStorage khi component mount
  useEffect(() => {
    const savedExamResultId = localStorage.getItem("currentExamResultId");
    if (savedExamResultId) {
      setExamResultId(savedExamResultId);
    } else {
      setError("Không tìm thấy phiên làm bài. Vui lòng bắt đầu lại.");
    }
  }, []);

  // Fetch exam data
  useEffect(() => {
    const fetchExamData = async () => {
      try {
        setLoading(true);
        const response = await getExamDetail(testId);

        if (response.success && response.data) {
          setExamData(response.data);

          // Calculate total time from all parts
          const totalTime = response.data.reduce(
            (sum, part) => sum + part.time * 60,
            0
          );
          setTimeRemaining(totalTime);
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

  // Timer
  useEffect(() => {
    if (loading || examData.length === 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmit(); // Auto submit when time's up
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, examData]);

  // Hàm chuyển đổi answers sang format API
  const convertAnswersToAPIFormat = () => {
    const answersByPart = {};

    // Group answers by part
    Object.keys(answers).forEach((key) => {
      const [questionId, contentIndex] = key.split("-");

      // Find which part this question belongs to
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

    // Convert to API format
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

    // Auto-save answer to API
    try {
      const currentPart = examData[currentPartIndex];

      // Gom TẤT CẢ các câu hỏi đã trả lời trong part hiện tại
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

        // Chỉ thêm vào nếu câu hỏi này có ít nhất 1 subAnswer
        if (subAnswers.length > 0) {
          answersInPart.push({
            questionId: question._id,
            subAnswers: subAnswers,
          });
        }
      });

      // Chỉ gọi API nếu có ít nhất 1 câu trả lời trong part
      if (answersInPart.length > 0) {
        const apiData = {
          examResultId,
          partId: currentPart.partId,
          answers: answersInPart,
        };

        console.log("Đang lưu đáp án (toàn bộ part):", apiData);
        await saveAnswers(apiData);
        console.log("Đã lưu đáp án tự động");
      }
    } catch (error) {
      console.error("Lỗi khi lưu đáp án:", error);
      // Không hiển thị lỗi cho user để không làm gián đoạn trải nghiệm
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

  // Hàm lưu bài (manual save)
  const handleSave = async () => {
    if (!examResultId) {
      alert("Không tìm thấy phiên làm bài!");
      return;
    }

    try {
      setIsSaving(true);
      const apiDataArray = convertAnswersToAPIFormat();

      // Save all parts
      for (const apiData of apiDataArray) {
        await saveAnswers(apiData);
      }

      alert("Đã lưu bài thành công!");
    } catch (error) {
      console.error("Lỗi khi lưu bài:", error);
      alert("Có lỗi xảy ra khi lưu bài. Vui lòng thử lại!");
    } finally {
      setIsSaving(false);
    }
  };

  // Hàm nộp bài
  const handleSubmit = async () => {
    if (!examResultId) {
      alert("Không tìm thấy phiên làm bài!");
      return;
    }

    const confirmSubmit = window.confirm(
      "Bạn có chắc chắn muốn nộp bài? Sau khi nộp bạn không thể thay đổi câu trả lời."
    );

    if (!confirmSubmit) return;

    try {
      setIsSubmitting(true);

      // Submit exam
      const response = await submitExam(examResultId);

      if (response.success) {
        alert("Nộp bài thành công!");

        // Clear localStorage
        localStorage.removeItem("currentExamResultId");
        localStorage.removeItem("currentExamId");
        localStorage.removeItem("examStartTime");

        // Navigate to results page
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

  // Loading state
  if (loading) {
    return (
      <div className={cx("wrapper")}>
        <main className={cx("main")}>
          <div className={cx("container")}>
            <div className={cx("loading")}>
              <p>Đang tải bài thi...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cx("wrapper")}>
        <main className={cx("main")}>
          <div className={cx("container")}>
            <div className={cx("error")}>
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

  // No data or empty questions
  if (!examData || examData.length === 0) {
    return (
      <div className={cx("wrapper")}>
        <main className={cx("main")}>
          <div className={cx("container")}>
            <div className={cx("error")}>
              <p>Không có dữ liệu bài thi</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const currentPart = examData[currentPartIndex];

  // Check if current part has questions
  if (
    !currentPart ||
    !currentPart.questions ||
    currentPart.questions.length === 0
  ) {
    return (
      <div className={cx("wrapper")}>
        <main className={cx("main")}>
          <div className={cx("container")}>
            <div className={cx("breadcrumb")}>Thi thử / JLPT - N5 / Test 1</div>

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

            <div className={cx("error")}>
              <p>Phần này chưa có câu hỏi</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const currentQuestion = currentPart.questions[currentQuestionIndex];

  const isFirstQuestion = currentPartIndex === 0 && currentQuestionIndex === 0;
  const isLastQuestion =
    currentPartIndex === examData.length - 1 &&
    currentQuestionIndex === currentPart.questions.length - 1;

  return (
    <div className={cx("wrapper")}>
      <main className={cx("main")}>
        <div className={cx("container")}>
          {/* Breadcrumb */}
          <div className={cx("breadcrumb")}>Thi thử / JLPT - N5 / Test 1</div>

          {/* Section Tabs */}
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

          <div className={cx("layout")}>
            {/* Left: Question */}
            <div className={cx("left")}>
              <Card className={cx("question-card")}>
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

                {/* General Audio */}
                {currentQuestion.general?.audio && (
                  <AudioPlayer src={currentQuestion.general.audio} />
                )}

                {/* General Text Read */}
                {currentQuestion.general?.txt_read && (
                  <div className={cx("text-read-box")}>
                    <p>{currentQuestion.general.txt_read}</p>
                  </div>
                )}

                {/* General Image */}
                {currentQuestion.general?.image && (
                  <div className={cx("general-image")}>
                    <img
                      src={currentQuestion.general.image}
                      alt="Question illustration"
                    />
                  </div>
                )}

                {/* All Content Items */}
                {currentQuestion.content.map((content, contentIndex) => {
                  const answerKey = `${currentQuestion._id}-${contentIndex}`;

                  return (
                    <div key={contentIndex} className={cx("content-section")}>
                      <p className={cx("content-question")}>
                        {currentQuestionIndex + 1}.{contentIndex + 1}{" "}
                        {content.question}
                      </p>

                      {/* Content Image */}
                      {content.image && (
                        <div className={cx("content-image")}>
                          <img src={content.image} alt="Content illustration" />
                        </div>
                      )}

                      {/* Options */}
                      <div className={cx("options")}>
                        {content.answers.map((answer, optionIndex) => {
                          const selected = answers[answerKey] === optionIndex;
                          return (
                            <button
                              key={optionIndex}
                              type="button"
                              onClick={() =>
                                handleAnswer(contentIndex, optionIndex)
                              }
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
                                <span className={cx("option-label")}>
                                  {answer}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Navigation buttons */}
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
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Đang nộp..." : "Nộp bài"}
                </Button>
                <Button
                  outline
                  className={cx("save-btn")}
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? "Đang lưu..." : "Lưu bài"}
                </Button>
              </div>

              {/* Question list */}
              <Card className={cx("list-card")}>
                <p className={cx("list-title")}>Danh sách câu hỏi</p>
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

                          // Check if all content in this question are answered
                          const allAnswered = question.content.every(
                            (_, cIdx) => {
                              const key = `${question._id}-${cIdx}`;
                              return answers[key] !== undefined;
                            }
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
              </Card>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

export default TestRunner;