import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeft,
    faPlus,
    faXmark,
    faEye,
    faLink,
    faMagic,
} from "@fortawesome/free-solid-svg-icons";

import Card from "~/components/Card";
import Button from "~/components/Button";
import Input from "~/components/Input";
import { createExam, createExamQuestion } from "~/services/examService";
import { uploadVoice } from "~/services/textToSpeechService";

import styles from "./CreateTest.module.scss";
import PopupModal from "~/components/Popup";

const cx = classNames.bind(styles);

// Tạo câu con
function createSubQuestion(id) {
    return {
        id,
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
        explanation: "",
        score: 1,
    };
}

// Tạo câu cha
function createParentQuestion(id) {
    return {
        id,
        type: "vocab",
        question: "",
        listeningContent: "",
        audioFile: null,
        audioPreview: "",
        subQuestions: [createSubQuestion(id * 10 + 1)],
    };
}

function CreateTest() {
    const navigate = useNavigate();
    const [testTitle, setTestTitle] = useState("");
    const [testLevel, setTestLevel] = useState("N5");
    const [duration, setDuration] = useState(105);
    const [questions, setQuestions] = useState([createParentQuestion(1)]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [audioInputType, setAudioInputType] = useState("link");
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [createdExamId, setCreatedExamId] = useState(null);
    const [createdParts, setCreatedParts] = useState([]);
    const [toast, setToast] = useState(false);
    const [errors, setErrors] = useState({});

    const titleRef = useRef(null);
    const questionContentRef = useRef(null);
    const subQuestionContentRef = useRef(null);
    // Hiển thị PopupModal
    const [showConfirm, setShowConfirm] = useState(false);

    const handleCancel = () => {
        setShowConfirm(false);
    };

    const handleConfirmSave = () => {
        setShowConfirm(true);
    };

    // Auto hide toast after 3 seconds
    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => {
                setToast({ show: false, message: '', type: '' });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toast.show]);

    // ====== CÂU CHA ======

    const addQuestion = () => {
        const nextId = questions.length
            ? Math.max(...questions.map((q) => q.id)) + 1
            : 1;
        setQuestions((prev) => [...prev, createParentQuestion(nextId)]);
        setCurrentQuestionIndex(questions.length);
    };

    const removeQuestion = (id) => {
        const index = questions.findIndex((q) => q.id === id);
        setQuestions((prev) => prev.filter((q) => q.id !== id));
        if (currentQuestionIndex >= questions.length - 1) {
            setCurrentQuestionIndex(Math.max(0, questions.length - 2));
        }
    };

    const updateQuestion = (id, field, value) => {
        setQuestions((prev) =>
            prev.map((q) => (q.id === id ? { ...q, [field]: value } : q))
        );
    };

    const handleAudioInputTypeChange = (type) => {
        setAudioInputType(type);
        const currentQuestion = questions[currentQuestionIndex];
        if (currentQuestion) {
            updateQuestion(currentQuestion.id, "audioPreview", "");
            updateQuestion(currentQuestion.id, "audioFile", null);
        }
    };

    // const handleAudioLinkChange = (link) => {
    //     const currentQuestion = questions[currentQuestionIndex];
    //     if (!currentQuestion) return;

    //     const isValidLink = link.startsWith("http://") || link.startsWith("https://");

    //     updateQuestion(currentQuestion.id, "audioPreview", isValidLink ? link : "");
    //     updateQuestion(currentQuestion.id, "audioFile", isValidLink ? { type: "link", url: link } : null);
    // };

    const handleAudioLinkChange = (link) => {
        const currentQuestion = questions[currentQuestionIndex];
        if (!currentQuestion) return;

        // luôn cập nhật raw input vào audioPreview
        updateQuestion(currentQuestion.id, "audioPreview", link);

        const isValidLink = link.startsWith("http://") || link.startsWith("https://");

        // chỉ set audioFile khi hợp lệ
        updateQuestion(
            currentQuestion.id,
            "audioFile",
            isValidLink ? { type: "link", url: link } : null
        );
    };


    const handleGenerateAudio = async () => {
        const currentQuestion = questions[currentQuestionIndex];
        if (!currentQuestion || !currentQuestion.question.trim()) {
            //alert("Vui lòng nhập nội dung câu hỏi trước khi tạo audio");
            setToast({
                show: true,
                message: 'Vui lòng nhập nội dung câu hỏi trước khi tạo audio',
                type: 'error'
            });
            return;
        }

        setIsGeneratingAudio(true);
        try {
            // Gọi API text-to-speech
            const result = await uploadVoice(currentQuestion.listeningContent, 6);

            if (result && result.success && result.data) {
                const audioUrl = result.data.audioUrl;

                updateQuestion(currentQuestion.id, "audioPreview", audioUrl);
                updateQuestion(currentQuestion.id, "audioFile", { type: "generated", url: audioUrl });

                //alert("Tạo audio thành công!");
                setToast({
                    show: true,
                    message: 'Tạo audio thành công!',
                    type: 'success'
                });
            } else {
                throw new Error("Không nhận được URL audio");
            }
        } catch (error) {
            console.error("Error generating audio:", error);
            //alert("Có lỗi xảy ra khi tạo audio. Vui lòng thử lại!");
            setToast({
                show: true,
                message: 'Có lỗi xảy ra khi tạo audio. Vui lòng thử lại!',
                type: 'error'
            });
        } finally {
            setIsGeneratingAudio(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    // ====== CÂU CON ======

    const addSubQuestion = (parentId) => {
        setQuestions((prev) =>
            prev.map((parent) => {
                if (parent.id !== parentId) return parent;

                const nextSubId =
                    parent.subQuestions.length > 0
                        ? Math.max(...parent.subQuestions.map((sq) => sq.id)) + 1
                        : parent.id * 10 + 1;

                return {
                    ...parent,
                    subQuestions: [...parent.subQuestions, createSubQuestion(nextSubId)],
                };
            })
        );
    };

    const removeSubQuestion = (parentId, subId) => {
        setQuestions((prev) =>
            prev.map((parent) => {
                if (parent.id !== parentId) return parent;
                const newSubs = parent.subQuestions.filter((sq) => sq.id !== subId);
                if (newSubs.length === 0) return parent;
                return { ...parent, subQuestions: newSubs };
            })
        );
    };

    const updateSubQuestion = (parentId, subId, field, value) => {
        setQuestions((prev) =>
            prev.map((parent) => {
                if (parent.id !== parentId) return parent;
                return {
                    ...parent,
                    subQuestions: parent.subQuestions.map((sq) =>
                        sq.id === subId ? { ...sq, [field]: value } : sq
                    ),
                };
            })
        );
    };

    const handleChangeOption = (parentId, subId, optionIndex, value) => {
        setQuestions((prev) =>
            prev.map((parent) => {
                if (parent.id !== parentId) return parent;
                return {
                    ...parent,
                    subQuestions: parent.subQuestions.map((sq) => {
                        if (sq.id !== subId) return sq;
                        const newOptions = [...sq.options];
                        newOptions[optionIndex] = value;
                        return { ...sq, options: newOptions };
                    }),
                };
            })
        );
    };

    // ====== ACTIONS ======

    // Map type to kind
    const getQuestionKind = (type) => {
        const kindMap = {
            vocab: "vocabulary",
            grammar: "grammar",
            listening: "listening"
        };
        return kindMap[type] || "vocabulary";
    };

    // Get level number from string (N5 -> 5)
    const getLevelNumber = (levelStr) => {
        return parseInt(levelStr.replace("N", ""), 10);
    };

    // Group questions by type to get partId
    const groupQuestionsByType = () => {
        const grouped = {
            vocab: [],
            grammar: [],
            listening: []
        };

        questions.forEach((q) => {
            if (grouped[q.type]) {
                grouped[q.type].push(q);
            }
        });

        return grouped;
    };

    const handleSave = async () => {
        let newErrors = {};
        if (!testTitle.trim()) {
            newErrors.title = "Tiêu đề không được để trống";
            titleRef.current?.focus();
        }

        questions.forEach((q, qIndex) => {
            // Kiểm tra câu hỏi cha rỗng
            if (!q.question.trim()) {
                setCurrentQuestionIndex(qIndex);
                newErrors.questContent = "Nội dung câu hỏi không được để trống";
                questionContentRef.current?.focus();
            }

            // Kiểm tra từng sub-question
            q.subQuestions.forEach((sub) => {
                if (!sub.question.trim()) {
                    setCurrentQuestionIndex(qIndex);
                    newErrors.subQuestionContent = "Câu hỏi con không được để trống";
                    subQuestionContentRef.current?.focus();
                }
            });
        });

        setErrors({})
        setIsSaving(true);
        setShowConfirm(false);

        // Nếu có lỗi → không save
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setIsSaving(false);
            return;
        }

        try {
            // Step 1: Create exam if not exists
            let examId = createdExamId;
            let parts = createdParts;

            if (!examId) {
                const examData = {
                    title: testTitle,
                    level: testLevel
                };

                const examResult = await createExam(examData);

                if (examResult.success && examResult.data) {
                    examId = examResult.data.exam._id;
                    parts = examResult.data.parts;
                    setCreatedExamId(examId);
                    setCreatedParts(parts);
                }
            }

            // Step 2: Create questions for each part
            const groupedQuestions = groupQuestionsByType();

            // Map type to part
            const typeToPartMap = {
                vocab: parts.find(p => p.name === "Từ vựng")?.id,
                grammar: parts.find(p => p.name === "Ngữ pháp - Đọc hiểu")?.id,
                listening: parts.find(p => p.name === "Thi nghe")?.id
            };

            for (const [type, questionsOfType] of Object.entries(groupedQuestions)) {
                const partId = typeToPartMap[type];

                if (!partId || questionsOfType.length === 0) continue;

                for (const question of questionsOfType) {
                    const questionData = {
                        title: question.question || "Câu hỏi không có tiêu đề",
                        kind: getQuestionKind(type),
                        level: getLevelNumber(testLevel),
                        count_question: question.subQuestions.length,
                        general: {},
                        content: question.subQuestions.map(sub => ({
                            question: sub.question || "",
                            answers: sub.options,
                            correctAnswer: sub.correctAnswer,
                            score: sub.score
                        })),
                        correct_answers: question.subQuestions.map(sub => sub.correctAnswer)
                    };

                    // Add audio if listening type
                    if (type === "listening" && question.audioPreview) {
                        questionData.general.audio = question.audioPreview;
                        questionData.general.txt_read = question.listeningContent;
                    }

                    await createExamQuestion(partId, questionData);
                }
            }

            //alert("Lưu đề thi thành công!");
            setToast({
                show: true,
                message: 'Lưu đề thi thành công!',
                type: 'success'
            });
            //navigate("/admin/tests");
            setTimeout(() => {
                navigate("/admin/tests");
            }, 1000);
        } catch (error) {
            console.error("Error saving exam:", error);
            //alert("Có lỗi xảy ra khi lưu đề thi: " + error.message);
            setToast({
                show: true,
                message: 'Có lỗi xảy ra khi lưu đề thi: ' + error.message,
                type: 'error'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className={cx("wrapper")}>
            <main className={cx("main")}>
                <div className={cx("container")}>
                    {/* Header */}
                    <div className={cx("header")}>
                        <Link to="/admin/tests" className={cx("backLink")}>
                            <FontAwesomeIcon icon={faArrowLeft} className={cx("backIcon")} />
                            <span>Quay lại quản lý đề thi</span>
                        </Link>
                        <h1 className={cx("title")}>Tạo đề thi mới</h1>
                        <p className={cx("subtitle")}>
                            Thiết lập thông tin đề thi và thêm câu hỏi
                        </p>
                    </div>

                    {/* Test Info */}
                    <Card className={cx("infoCard")}>
                        <h2 className={cx("sectionTitle")}>Thông tin đề thi</h2>
                        <div className={cx("infoGrid")}>
                            <div className={cx("field")}>
                                <div className={cx("labelWrapper")}>
                                    <label className={cx("label")}>Tiêu đề đề thi</label>
                                    <span className={cx("requiredStar")}>*</span>
                                </div>
                                <Input
                                    ref={titleRef}
                                    placeholder="VD: JLPT N5 - Đề số 1"
                                    value={testTitle}
                                    onChange={(e) => setTestTitle(e.target.value)}
                                    className={cx("input")}
                                />
                                {errors.title && <p className={cx("errorText")}>{errors.title}</p>}
                            </div>
                            <div className={cx("field")}>
                                <label className={cx("label")}>Cấp độ</label>
                                <select
                                    value={testLevel}
                                    onChange={(e) => setTestLevel(e.target.value)}
                                    className={cx("select")}
                                >
                                    <option value="N5">N5</option>
                                    <option value="N4">N4</option>
                                    <option value="N3">N3</option>
                                    <option value="N2">N2</option>
                                    <option value="N1">N1</option>
                                </select>
                            </div>
                            <div className={cx("field", "fieldFull")}>
                                <label className={cx("label")}>Thời gian làm bài (phút)</label>
                                <Input
                                    type="number"
                                    value={duration}
                                    onChange={(e) =>
                                        setDuration(Number.parseInt(e.target.value || "0", 10))
                                    }
                                    className={cx("input")}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Layout 2 cột: Preview bên trái + Editor bên phải */}
                    <div className={cx("layout")}>
                        {/* Left: Preview */}
                        <div className={cx("left")}>
                            <Card className={cx("previewCard")}>
                                <div className={cx("previewHeader")}>
                                    <FontAwesomeIcon icon={faEye} className={cx("previewIcon")} />
                                    <span>Xem trước câu hỏi</span>
                                </div>

                                {currentQuestion && (
                                    <>
                                        <div className={cx("questionHeader")}>
                                            <div className={cx("badgeRow")}>
                                                <span className={cx("badge", "badgeMain")}>
                                                    Câu {currentQuestionIndex + 1}
                                                </span>
                                                <span className={cx("badge", "badgeType")}>
                                                    {currentQuestion.type === "vocab"
                                                        ? "Từ vựng"
                                                        : currentQuestion.type === "grammar"
                                                            ? "Ngữ pháp"
                                                            : "Thi nghe"}
                                                </span>
                                            </div>
                                            <h2 className={cx("questionText")}>
                                                {currentQuestion.question || "Chưa có nội dung câu hỏi"}
                                            </h2>
                                        </div>

                                        {currentQuestion.type === "listening" &&
                                            currentQuestion.audioPreview && (
                                                <audio
                                                    controls
                                                    src={currentQuestion.audioPreview}
                                                    className={cx("audioPreview")}
                                                />
                                            )}

                                        {currentQuestion.subQuestions.map((sub, subIndex) => (
                                            <div key={sub.id} className={cx("contentSection")}>
                                                <p className={cx("contentQuestion")}>
                                                    {currentQuestionIndex + 1}.{subIndex + 1}{" "}
                                                    {sub.question || "Chưa có nội dung câu hỏi con"}
                                                </p>

                                                <div className={cx("options")}>
                                                    {sub.options.map((option, optionIndex) => (
                                                        <div
                                                            key={optionIndex}
                                                            className={cx("option", {
                                                                correct: sub.correctAnswer === optionIndex,
                                                            })}
                                                        >
                                                            <div className={cx("optionInner")}>
                                                                <div
                                                                    className={cx("optionRadio", {
                                                                        selected:
                                                                            sub.correctAnswer === optionIndex,
                                                                    })}
                                                                >
                                                                    {sub.correctAnswer === optionIndex && (
                                                                        <div
                                                                            className={cx("optionRadioDot")}
                                                                        />
                                                                    )}
                                                                </div>
                                                                <span className={cx("optionLabel")}>
                                                                    {option ||
                                                                        `Đáp án ${String.fromCharCode(
                                                                            65 + optionIndex
                                                                        )}`}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {sub.explanation && (
                                                    <div className={cx("explanation")}>
                                                        <strong>Giải thích:</strong> {sub.explanation}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </>
                                )}
                            </Card>
                        </div>

                        {/* Right: Editor */}
                        <aside className={cx("right")}>
                            {/* Question List */}
                            <Card className={cx("listCard")}>
                                <div className={cx("listHeader")}>
                                    <p className={cx("listTitle")}>
                                        Danh sách câu hỏi ({questions.length})
                                    </p>
                                    <Button
                                        outline
                                        small
                                        leftIcon={<FontAwesomeIcon icon={faPlus} />}
                                        onClick={addQuestion}
                                    >
                                        Thêm
                                    </Button>
                                </div>

                                <div className={cx("listSections")}>
                                    {/* Từ vựng */}
                                    {questions.filter((q) => q.type === "vocab").length > 0 && (
                                        <div className={cx("listSection")}>
                                            <h4 className={cx("listSectionTitle")}>Từ vựng</h4>
                                            <div className={cx("listGrid")}>
                                                {questions.map((question, index) =>
                                                    question.type === "vocab" ? (
                                                        <button
                                                            key={question.id}
                                                            type="button"
                                                            className={cx("listItem", {
                                                                current: currentQuestionIndex === index,
                                                            })}
                                                            onClick={() => setCurrentQuestionIndex(index)}
                                                        >
                                                            {index + 1}
                                                        </button>
                                                    ) : null
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Ngữ pháp - Đọc hiểu */}
                                    {questions.filter((q) => q.type === "grammar").length > 0 && (
                                        <div className={cx("listSection")}>
                                            <h4 className={cx("listSectionTitle")}>
                                                Ngữ pháp, Đọc hiểu
                                            </h4>
                                            <div className={cx("listGrid")}>
                                                {questions.map((question, index) =>
                                                    question.type === "grammar" ? (
                                                        <button
                                                            key={question.id}
                                                            type="button"
                                                            className={cx("listItem", {
                                                                current: currentQuestionIndex === index,
                                                            })}
                                                            onClick={() => setCurrentQuestionIndex(index)}
                                                        >
                                                            {index + 1}
                                                        </button>
                                                    ) : null
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Thi nghe */}
                                    {questions.filter((q) => q.type === "listening").length > 0 && (
                                        <div className={cx("listSection")}>
                                            <h4 className={cx("listSectionTitle")}>Thi nghe</h4>
                                            <div className={cx("listGrid")}>
                                                {questions.map((question, index) =>
                                                    question.type === "listening" ? (
                                                        <button
                                                            key={question.id}
                                                            type="button"
                                                            className={cx("listItem", {
                                                                current: currentQuestionIndex === index,
                                                            })}
                                                            onClick={() => setCurrentQuestionIndex(index)}
                                                        >
                                                            {index + 1}
                                                        </button>
                                                    ) : null
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Empty state */}
                                    {questions.length === 0 && (
                                        <div className={cx("emptyState")}>
                                            <p>Chưa có câu hỏi nào</p>
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {/* Editor Form */}
                            {currentQuestion && (
                                <Card className={cx("editorCard")}>
                                    <div className={cx("editorHeader")}>
                                        <h3 className={cx("editorTitle")}>
                                            Chỉnh sửa Câu {currentQuestionIndex + 1}
                                        </h3>
                                        {questions.length > 1 && (
                                            <Button
                                                outline
                                                small
                                                className={cx("removeBtn")}
                                                leftIcon={<FontAwesomeIcon icon={faXmark} />}
                                                onClick={() => removeQuestion(currentQuestion.id)}
                                            >
                                                Xóa
                                            </Button>
                                        )}
                                    </div>

                                    <div className={cx("field")}>
                                        <label className={cx("label")}>Loại câu hỏi</label>
                                        <select
                                            value={currentQuestion.type}
                                            onChange={(e) =>
                                                updateQuestion(
                                                    currentQuestion.id,
                                                    "type",
                                                    e.target.value
                                                )
                                            }
                                            className={cx("select")}
                                        >
                                            <option value="vocab">Từ vựng</option>
                                            <option value="grammar">Ngữ pháp, Đọc hiểu</option>
                                            <option value="listening">Thi nghe</option>
                                        </select>
                                    </div>

                                    <div className={cx("field")}>
                                        <div className={cx("labelWrapper")}>
                                            <label className={cx("label")}>
                                                "Nội dung chung (đoạn văn / phần mô tả)"
                                            </label>
                                            <span className={cx("requiredStar")}>*</span>
                                        </div>

                                        {/* Ô nhập nội dung chung */}
                                        <textarea
                                            ref={questionContentRef}
                                            placeholder="Nhập nội dung câu hỏi..."
                                            value={currentQuestion.question}
                                            onChange={(e) =>
                                                updateQuestion(
                                                    currentQuestion.id,
                                                    "question",
                                                    e.target.value
                                                )
                                            }
                                            className={cx("textarea")}
                                            rows={3}
                                        />
                                        {errors.questContent && <p className={cx("errorText")}>{errors.questContent}</p>}

                                        {/* Nếu là phần nghe thì hiện thêm textarea cho nd thi nghe */}
                                        {currentQuestion.type === "listening" && (
                                            <div>
                                                <label className={cx("label")}>
                                                    "Nội dung phần nghe"
                                                </label>
                                                <textarea
                                                    placeholder="Nhập nội dung phần nghe..."
                                                    value={currentQuestion.listeningContent || ""}
                                                    onChange={(e) =>
                                                        updateQuestion(
                                                            currentQuestion.id,
                                                            "listeningContent",
                                                            e.target.value
                                                        )
                                                    }
                                                    className={cx("textarea")}
                                                    rows={3}
                                                    style={{ marginTop: "10px" }}
                                                />
                                            </div>
                                        )}
                                    </div>


                                    {currentQuestion.type === "listening" && (
                                        <div className={cx("field")}>
                                            <label className={cx("label")}>Audio</label>

                                            {/* Radio buttons cho loại input */}
                                            <div className={cx("audioTypeSelector")}>
                                                <label className={cx("radioLabel")}>
                                                    <input
                                                        type="radio"
                                                        name="audioType"
                                                        value="link"
                                                        checked={audioInputType === "link"}
                                                        onChange={() => handleAudioInputTypeChange("link")}
                                                        className={cx("radioInput")}
                                                    />
                                                    <FontAwesomeIcon icon={faLink} className={cx("radioIcon")} />
                                                    <span>Gắn link audio</span>
                                                </label>
                                                <label className={cx("radioLabel")}>
                                                    <input
                                                        type="radio"
                                                        name="audioType"
                                                        value="generate"
                                                        checked={audioInputType === "generate"}
                                                        onChange={() => handleAudioInputTypeChange("generate")}
                                                        className={cx("radioInput")}
                                                    />
                                                    <FontAwesomeIcon icon={faMagic} className={cx("radioIcon")} />
                                                    <span>Tạo audio tự động</span>
                                                </label>
                                            </div>

                                            {/* Input theo loại được chọn */}
                                            {audioInputType === "link" ? (
                                                <div className={cx("audioLinkInput")}>
                                                    <Input
                                                        value={currentQuestion.audioPreview || ""}
                                                        onChange={(e) => handleAudioLinkChange(e.target.value)}
                                                        className={cx("input")}
                                                        placeholder="Nhập URL của file audio (ví dụ: https://example.com/audio.mp3)"
                                                    />
                                                </div>
                                            ) : (
                                                <div className={cx("generateAudioSection")}>
                                                    <p className={cx("generateHint")}>
                                                        Audio sẽ được tạo từ nội dung bài nghe bằng công nghệ text-to-speech
                                                    </p>
                                                    <Button
                                                        primary
                                                        leftIcon={<FontAwesomeIcon icon={faMagic} />}
                                                        onClick={handleGenerateAudio}
                                                        disabled={isGeneratingAudio || !currentQuestion.listeningContent.trim()}
                                                    >
                                                        {isGeneratingAudio ? "Đang tạo audio..." : "Tạo audio"}
                                                    </Button>
                                                </div>
                                            )}

                                            {/* Audio Preview */}
                                            {currentQuestion.audioPreview && (
                                                <div className={cx("audioPreviewWrap")}>
                                                    <audio
                                                        controls
                                                        src={currentQuestion.audioPreview}
                                                        className={cx("audioPreview")}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Sub Questions */}
                                    <div className={cx("subSection")}>
                                        <div className={cx("subHeaderRow")}>
                                            <h4 className={cx("subTitle")}>Câu hỏi con</h4>
                                            <Button
                                                outline
                                                small
                                                leftIcon={<FontAwesomeIcon icon={faPlus} />}
                                                onClick={() => addSubQuestion(currentQuestion.id)}
                                            >
                                                Thêm
                                            </Button>
                                        </div>

                                        <div className={cx("subList")}>
                                            {currentQuestion.subQuestions.map((sub, subIndex) => (
                                                <div key={sub.id} className={cx("subCard")}>
                                                    <div className={cx("subHeader")}>
                                                        <span className={cx("subIndex")}>
                                                            {currentQuestionIndex + 1}.{subIndex + 1}
                                                        </span>
                                                        {currentQuestion.subQuestions.length > 1 && (
                                                            <button
                                                                type="button"
                                                                className={cx("subRemove")}
                                                                onClick={() =>
                                                                    removeSubQuestion(
                                                                        currentQuestion.id,
                                                                        sub.id
                                                                    )
                                                                }
                                                            >
                                                                <FontAwesomeIcon icon={faXmark} />
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className={cx("field")}>
                                                        <div className={cx("labelWrapper")}>
                                                            <label className={cx("label")}>Câu hỏi</label>
                                                            <span className={cx("requiredStar")}>*</span>
                                                        </div>
                                                        <textarea
                                                            ref={subQuestionContentRef}
                                                            placeholder="Nhập nội dung câu hỏi con..."
                                                            value={sub.question}
                                                            onChange={(e) =>
                                                                updateSubQuestion(
                                                                    currentQuestion.id,
                                                                    sub.id,
                                                                    "question",
                                                                    e.target.value
                                                                )
                                                            }
                                                            className={cx("textarea")}
                                                            rows={2}
                                                        />
                                                        {errors.subQuestionContent && <p className={cx("errorText")}>{errors.subQuestionContent}</p>}
                                                    </div>

                                                    <div className={cx("optionsEdit")}>
                                                        {sub.options.map((option, optionIndex) => (
                                                            <div
                                                                key={optionIndex}
                                                                className={cx("optionEdit")}
                                                            >
                                                                <label className={cx("optionEditLabel")}>
                                                                    <input
                                                                        type="radio"
                                                                        name={`answer-${currentQuestion.id}-${sub.id}`}
                                                                        checked={
                                                                            sub.correctAnswer ===
                                                                            optionIndex
                                                                        }
                                                                        onChange={() =>
                                                                            updateSubQuestion(
                                                                                currentQuestion.id,
                                                                                sub.id,
                                                                                "correctAnswer",
                                                                                optionIndex
                                                                            )
                                                                        }
                                                                        className={cx("radio")}
                                                                    />
                                                                    <span>
                                                                        {String.fromCharCode(
                                                                            65 + optionIndex
                                                                        )}
                                                                    </span>
                                                                </label>
                                                                <Input
                                                                    placeholder={`Đáp án ${String.fromCharCode(
                                                                        65 + optionIndex
                                                                    )}`}
                                                                    value={option}
                                                                    onChange={(e) =>
                                                                        handleChangeOption(
                                                                            currentQuestion.id,
                                                                            sub.id,
                                                                            optionIndex,
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    className={cx("input")}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className={cx("field")}>
                                                        <label className={cx("label")}>
                                                            Giải thích
                                                        </label>
                                                        <textarea
                                                            placeholder="Nhập giải thích..."
                                                            value={sub.explanation}
                                                            onChange={(e) =>
                                                                updateSubQuestion(
                                                                    currentQuestion.id,
                                                                    sub.id,
                                                                    "explanation",
                                                                    e.target.value
                                                                )
                                                            }
                                                            className={cx("textarea")}
                                                            rows={2}
                                                        />
                                                    </div>

                                                    <div className={cx("field")} style={{ marginTop: "12px" }}  >
                                                        <label className={cx("label")}>
                                                            Điểm cho câu hỏi
                                                        </label>

                                                        <input
                                                            type="number"
                                                            placeholder="Nhập điểm..."
                                                            value={sub.score}
                                                            onChange={(e) =>
                                                                updateSubQuestion(
                                                                    currentQuestion.id,
                                                                    sub.id,
                                                                    "score",
                                                                    Number(e.target.value)
                                                                )
                                                            }
                                                            className={cx("input")}
                                                        />
                                                    </div>

                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {/* Actions */}
                            <div className={cx("actions")}>
                                <Link to="/admin/tests">
                                    <Button outline>Hủy</Button>
                                </Link>
                                <Button
                                    primary
                                    onClick={handleConfirmSave}
                                    disabled={isSaving}
                                >
                                    {isSaving ? "Đang lưu..." : "Lưu"}
                                </Button>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>

            {/* Toast Notification */}
            {toast.show && (
                <div className={cx("toast", toast.type)}>
                    <div className={cx("toast-content")}>
                        <span className={cx("toast-icon")}>
                            {toast.type === 'success' ? '✓' : '⚠'}
                        </span>
                        <span className={cx("toast-message")}>{toast.message}</span>
                    </div>
                    <button
                        className={cx("toast-close")}
                        onClick={() => setToast({ show: false, message: '', type: '' })}
                    >
                        ×
                    </button>
                </div>
            )}

            <PopupModal
                visible={showConfirm}
                onConfirm={handleSave}
                onCancel={handleCancel}
                title="Xác nhận lưu đề thi"
                message="Bạn có chắc chắn muốn lưu đề thi này ?"
                confirmText="Xác nhận"
            />
        </div>
    );
}

export default CreateTest;