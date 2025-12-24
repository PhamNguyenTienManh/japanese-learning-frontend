// ExamReview.jsx
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import classNames from "classnames/bind";
import styles from "./ExamReview.module.scss";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faChevronLeft,
    faChevronRight,
    faCheckCircle,
    faTimesCircle,
    faHome,
    faTrophy,
    faClock,
    faFileAlt,
} from "@fortawesome/free-solid-svg-icons";
import { comparisonUserAnswerWithResult } from "~/services/examService";

const cx = classNames.bind(styles);

function ExamReview() {
    const { testId, level } = useParams();
    const navigate = useNavigate();
    const audioRef = useRef(null);

    const [reviewData, setReviewData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPartIndex, setCurrentPartIndex] = useState(0);
    const [currentQuestionIndexInPart, setCurrentQuestionIndexInPart] = useState(0);

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

    // Loading state
    if (loading) {
        return (
            <div className={cx("wrapper")}>
                <main className={cx("main")}>
                    <div className={cx("container")}>
                        <div className={cx("loading")}>
                            <p className={cx("loadingText")}>Đang tải kết quả...</p>
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
                            <p className={cx("errorText")}>{error}</p>
                            <button className={cx("retryButton")} onClick={() => window.location.reload()}>
                                Thử lại
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // No data
    if (!reviewData || !reviewData.parts || reviewData.parts.length === 0) {
        return (
            <div className={cx("wrapper")}>
                <main className={cx("main")}>
                    <div className={cx("container")}>
                        <div className={cx("error")}>
                            <p className={cx("errorText")}>Không có dữ liệu kết quả</p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    const currentPart = reviewData.parts[currentPartIndex];
    const currentQuestion = currentPart.questions[currentQuestionIndexInPart];
    const isFirstQuestion = currentPartIndex === 0 && currentQuestionIndexInPart === 0;
    const isLastQuestion =
        currentPartIndex === reviewData.parts.length - 1 &&
        currentQuestionIndexInPart === currentPart.questions.length - 1;

    return (
        <div className={cx("wrapper")}>
            <main className={cx("main")}>
                <div className={cx("container")}>
                    {/* Breadcrumb */}
                    <div className={cx("breadcrumb")}>
                        <Link to="/practice">Thi thử</Link>
                        {" / "}
                        <Link to={`/practice/${level}`}>JLPT - {level}</Link>
                        {" / "}
                        <span>Xem đáp án</span>
                    </div>

                    {/* Section Tabs */}
                    <div className={cx("sectionTabs")}>
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
                    </div>

                    {/* Layout */}
                    <div className={cx("layout")}>
                        {/* Left: Question Review */}
                        <div className={cx("left")}>
                            <div className={cx("questionCard")}>
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
                                                icon={currentQuestion.isCorrect ? faCheckCircle : faTimesCircle}
                                            />
                                            {currentQuestion.isCorrect ? " Đúng" : " Sai"}
                                        </span>
                                    </div>

                                    {/* Question Title */}
                                    {currentQuestion.questionTitle && (
                                        <h1 className={cx("questionTitle")}>{currentQuestion.questionTitle}</h1>
                                    )}

                                    {/* General Info: Audio & Text */}
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
                                                    <div className={cx("txtReadContent")}>
                                                        <FontAwesomeIcon
                                                            icon={faFileAlt}
                                                            className={cx("txtReadIcon")}
                                                        />
                                                        <p className={cx("txtReadText")}>
                                                            {currentQuestion.generalInfo.txt_read}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Image */}
                                    {currentQuestion.generalInfo?.image && (
                                        <div className={cx("questionImage")}>
                                            <img
                                                src={currentQuestion.generalInfo.image}
                                                alt="Question illustration"
                                            />
                                        </div>
                                    )}

                                    {/* Question Text */}
                                    <h2 className={cx("questionText")}>{currentQuestion.questionText}</h2>
                                </div>

                                {/* Answer Options */}
                                <div className={cx("answerOptions")}>
                                    {currentQuestion.answers &&
                                        currentQuestion.answers.map((answer, idx) => {
                                            const isUserAnswer = idx === currentQuestion.userAnswer;
                                            const isCorrectAnswer = idx === currentQuestion.correctAnswer;
                                            const isCorrectChoice = isUserAnswer && currentQuestion.isCorrect;
                                            const isWrongChoice = isUserAnswer && !currentQuestion.isCorrect;

                                            return (
                                                <div
                                                    key={idx}
                                                    className={cx("answerOption", {
                                                        correct:
                                                            isCorrectChoice ||
                                                            (isCorrectAnswer && !isUserAnswer),
                                                        wrong: isWrongChoice,
                                                    })}
                                                >
                                                    <div className={cx("answerInner")}>
                                                        {(isCorrectChoice ||
                                                            (isCorrectAnswer && !isUserAnswer)) && (
                                                                <FontAwesomeIcon
                                                                    icon={faCheckCircle}
                                                                    className={cx("answerIcon", "iconCorrect")}
                                                                />
                                                            )}
                                                        {isWrongChoice && (
                                                            <FontAwesomeIcon
                                                                icon={faTimesCircle}
                                                                className={cx("answerIcon", "iconWrong")}
                                                            />
                                                        )}

                                                        <div className={cx("answerContent")}>
                                                            <div className={cx("answerText")}>
                                                                <span className={cx("answerNumber")}>
                                                                    {idx + 1}.
                                                                </span>
                                                                <span className={cx("answerValue")}>{answer}</span>
                                                            </div>

                                                            {isWrongChoice && (
                                                                <span
                                                                    className={cx("answerLabel", "labelWrong")}
                                                                >
                                                                    ← Bạn đã chọn
                                                                </span>
                                                            )}
                                                            {isCorrectAnswer && !isUserAnswer && (
                                                                <span
                                                                    className={cx("answerLabel", "labelCorrect")}
                                                                >
                                                                    ← Đáp án đúng
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                    {/* Not answered */}
                                    {currentQuestion.userAnswer === -1 && (
                                        <div className={cx("answerOption", "wrong")}>
                                            <div className={cx("answerInner")}>
                                                <FontAwesomeIcon
                                                    icon={faTimesCircle}
                                                    className={cx("answerIcon", "iconWrong")}
                                                />
                                                <span className={cx("answerValue")}>
                                                    Bạn chưa chọn đáp án
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Explanation */}
                                {currentQuestion.explain && (
                                    <div className={cx("explainBox")}>
                                        <p className={cx("explainTitle")}>📖 Giải thích:</p>
                                        <p className={cx("explainText")}>{currentQuestion.explain}</p>
                                    </div>
                                )}

                                {currentQuestion.explainAll && (
                                    <div className={cx("explainBox", "explainDetail")}>
                                        <p className={cx("explainTitle")}>📚 Giải thích chi tiết:</p>
                                        <p className={cx("explainText")}>{currentQuestion.explainAll}</p>
                                    </div>
                                )}

                                {/* Navigation buttons */}
                                <div className={cx("navRow")}>
                                    <button
                                        onClick={handlePrevious}
                                        disabled={isFirstQuestion}
                                        className={cx("navButton")}
                                    >
                                        <FontAwesomeIcon icon={faChevronLeft} />
                                        Câu trước
                                    </button>

                                    <button
                                        onClick={handleNext}
                                        disabled={isLastQuestion}
                                        className={cx("navButton", "navNext")}
                                    >
                                        Câu tiếp
                                        <FontAwesomeIcon icon={faChevronRight} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right: Sidebar */}
                        <aside className={cx("right")}>
                            {/* Summary Card */}
                            <div className={cx("summaryCard")}>
                                <p className={cx("summaryTitle")}>
                                    <FontAwesomeIcon icon={faTrophy} />
                                    Kết quả
                                </p>

                                <div className={cx("summaryContent")}>
                                    <div className={cx("summaryRow")}>
                                        <span className={cx("summaryLabel")}>Điểm số:</span>
                                        <span className={cx("summaryValue")}>
                                            {reviewData.totalScore}/{reviewData.maxScore}
                                        </span>
                                    </div>

                                    <div className={cx("summaryRow")}>
                                        <span className={cx("summaryLabel")}>Thời gian:</span>
                                        <span className={cx("summaryValue")}>
                                            <FontAwesomeIcon icon={faClock} />
                                            {formatDuration(reviewData.duration)}
                                        </span>
                                    </div>

                                    <div className={cx("summaryRow")}>
                                        <span className={cx("summaryLabel")}>Trạng thái:</span>
                                        <span
                                            className={cx("summaryValue", {
                                                passed: reviewData.passed,
                                                failed: !reviewData.passed,
                                            })}
                                        >
                                            {reviewData.passed ? "Đạt" : "Chưa đạt"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className={cx("actionButtons")}>
                                <button onClick={handleBackToHome} className={cx("actionButton")}>
                                    <FontAwesomeIcon icon={faHome} />
                                    Về trang chủ
                                </button>
                            </div>

                            {/* Question List */}
                            <div className={cx("listCard")}>
                                <p className={cx("listTitle")}>Danh sách câu hỏi</p>

                                <div className={cx("listSections")}>
                                    {reviewData.parts.map((part, pIdx) => (
                                        <div key={part.partId} className={cx("listSection")}>
                                            <h4 className={cx("listSectionTitle")}>{part.partTitle}</h4>
                                            <div className={cx("listGrid")}>
                                                {part.questions.map((question, qIdx) => {
                                                    const isCurrent =
                                                        pIdx === currentPartIndex &&
                                                        qIdx === currentQuestionIndexInPart;

                                                    return (
                                                        <button
                                                            key={`${question.questionId}-${qIdx}`}
                                                            type="button"
                                                            onClick={() => handleQuestionClick(pIdx, qIdx)}
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
                            </div>
                        </aside>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default ExamReview;