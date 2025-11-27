// ExamReview.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import classNames from "classnames/bind";
import styles from "./ExamReview.module.scss";
import Card from "~/components/Card";
import Button from "~/components/Button";
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
} from "@fortawesome/free-solid-svg-icons";
import { comparisonUserAnswerWithResult } from "~/services/examService";

const cx = classNames.bind(styles);

function ExamReview() {
    const { testId, level } = useParams();
    const navigate = useNavigate();

    const [reviewData, setReviewData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPartIndex, setCurrentPartIndex] = useState(0);
    const [currentQuestionIndexInPart, setCurrentQuestionIndexInPart] = useState(0);

    // Fetch review data
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
                            <p>Đang tải kết quả...</p>
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
                            <p className={cx("error-text")}>{error}</p>
                            <Button primary onClick={() => window.location.reload()}>
                                Thử lại
                            </Button>
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
                            <p className={cx("error-text")}>Không có dữ liệu kết quả</p>
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
                    <div className={cx("breadcrumb")}>
                        <Link to="/practice">Thi thử</Link>
                        {" / "}
                        <Link to={`/practice/${level}`}>JLPT - {level}</Link>
                        {" / "}
                        <span>Xem đáp án</span>
                    </div>


                    {/* Section Tabs */}
                    <div className={cx("section-tabs")}>
                        {reviewData.parts.map((part, index) => (
                            <button
                                key={part.partId}
                                type="button"
                                onClick={() => handleSectionChange(index)}
                                className={cx("section-tab", {
                                    active: currentPartIndex === index,
                                })}
                            >
                                {part.partTitle}
                            </button>
                        ))}
                    </div>

                    <div className={cx("layout")}>
                        {/* Left: Question Review */}
                        <div className={cx("left")}>
                            <Card className={cx("question-card")}>
                                {/* Question header */}
                                <div className={cx("question-header")}>
                                    <div className={cx("badge-row")}>
                                        <span className={cx("badge", "badge-main")}>
                                            Câu {currentQuestion.questionNumber}
                                        </span>
                                        <span
                                            className={cx("badge", {
                                                "badge-correct": currentQuestion.isCorrect,
                                                "badge-wrong": !currentQuestion.isCorrect,
                                            })}
                                        >
                                            <FontAwesomeIcon
                                                icon={currentQuestion.isCorrect ? faCheckCircle : faTimesCircle}
                                            />{" "}
                                            {currentQuestion.isCorrect ? "Đúng" : "Sai"}
                                        </span>
                                    </div>
                                    <h2 className={cx("question-text")}>
                                        {currentQuestion.questionText}
                                    </h2>
                                </div>

                                {/* Content Section */}
                                <div className={cx("content-section")}>
                                    {/* Options */}
                                    <div className={cx("options")}>
                                        {/* User's answer (if wrong) */}
                                        {!currentQuestion.isCorrect && currentQuestion.userAnswer !== -1 && (
                                            <div className={cx("option", "option-user-wrong")}>
                                                <div className={cx("option-inner")}>
                                                    <FontAwesomeIcon
                                                        icon={faTimesCircle}
                                                        className={cx("option-icon", "icon-wrong")}
                                                    />
                                                    <span className={cx("option-label")}>
                                                        <strong>Bạn đã chọn:</strong> {currentQuestion.userAnswerText}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Correct answer */}
                                        <div
                                            className={cx("option", {
                                                "option-user-correct": currentQuestion.isCorrect,
                                                "option-correct": !currentQuestion.isCorrect,
                                            })}
                                        >
                                            <div className={cx("option-inner")}>
                                                <FontAwesomeIcon
                                                    icon={faCheckCircle}
                                                    className={cx("option-icon", "icon-correct")}
                                                />
                                                <span className={cx("option-label")}>
                                                    <strong>Đáp án đúng:</strong> {currentQuestion.correctAnswerText}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Not answered */}
                                        {currentQuestion.userAnswer === -1 && (
                                            <div className={cx("option", "option-user-wrong")}>
                                                <div className={cx("option-inner")}>
                                                    <FontAwesomeIcon
                                                        icon={faTimesCircle}
                                                        className={cx("option-icon", "icon-wrong")}
                                                    />
                                                    <span className={cx("option-label")}>
                                                        <strong>Bạn chưa chọn đáp án</strong>
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Explanation */}
                                    {currentQuestion.explain && (
                                        <div className={cx("explain-box")}>
                                            <p className={cx("explain-title")}>📖 Giải thích:</p>
                                            <p className={cx("explain-text")}>{currentQuestion.explain}</p>
                                        </div>
                                    )}

                                    {currentQuestion.explainAll && (
                                        <div className={cx("explain-box", "explain-box-detail")}>
                                            <p className={cx("explain-title")}>📚 Giải thích chi tiết:</p>
                                            <p className={cx("explain-text")}>{currentQuestion.explainAll}</p>
                                        </div>
                                    )}
                                </div>

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
                            {/* Summary Card */}
                            <Card className={cx("summary-card")}>
                                <p className={cx("summary-title")}>
                                    <FontAwesomeIcon icon={faTrophy} /> Kết quả
                                </p>

                                <div className={cx("summary-row")}>
                                    <span className={cx("summary-label")}>Điểm số:</span>
                                    <span className={cx("summary-value")}>
                                        {reviewData.totalScore}/{reviewData.maxScore}
                                    </span>
                                </div>

                                <div className={cx("summary-row")}>
                                    <span className={cx("summary-label")}>Thời gian:</span>
                                    <span className={cx("summary-value")}>
                                        <FontAwesomeIcon icon={faClock} /> {formatDuration(reviewData.duration)}
                                    </span>
                                </div>

                                <div className={cx("summary-row")}>
                                    <span className={cx("summary-label")}>Trạng thái:</span>
                                    <span
                                        className={cx("summary-value", {
                                            "status-passed": reviewData.passed,
                                            "status-failed": !reviewData.passed,
                                        })}
                                    >
                                        {reviewData.passed ? "Đạt" : "Chưa đạt"}
                                    </span>
                                </div>
                            </Card>

                            {/* Action Buttons */}
                            <div className={cx("action-buttons")}>
                                <Button
                                    primary
                                    className={cx("action-btn")}
                                    onClick={handleBackToHome}
                                    leftIcon={<FontAwesomeIcon icon={faHome} />}
                                >
                                    Về trang chủ
                                </Button>
                            </div>

                            {/* Question List */}
                            <Card className={cx("list-card")}>
                                <p className={cx("list-title")}>Danh sách câu hỏi</p>
                                <div className={cx("list-sections")}>
                                    {reviewData.parts.map((part, pIdx) => (
                                        <div key={part.partId} className={cx("list-section")}>
                                            <h4 className={cx("list-section-title")}>{part.partTitle}</h4>
                                            <div className={cx("list-grid")}>
                                                {part.questions.map((question, qIdx) => {
                                                    const isCurrent =
                                                        pIdx === currentPartIndex && qIdx === currentQuestionIndexInPart;

                                                    return (
                                                        <button
                                                            key={`${question.questionId}-${qIdx}`}
                                                            type="button"
                                                            className={cx("list-item", {
                                                                "list-item-correct": !isCurrent && question.isCorrect,
                                                                "list-item-wrong": !isCurrent && !question.isCorrect,
                                                                "list-item-current": isCurrent,
                                                            })}
                                                            onClick={() => handleQuestionClick(pIdx, qIdx)}
                                                        >
                                                            {question.questionNumber}
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

export default ExamReview;