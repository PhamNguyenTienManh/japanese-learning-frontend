import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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

import { uploadVoice } from "~/services/textToSpeechService";

import styles from "./UpdateTest.module.scss";
import { createExamQuestion, deleteExamQuestion, getExamDetail, updateExam, updateExamQuestion } from "~/services/examService";
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
        score: 1
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
        _id: null,
    };
}

function EditTest() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [testTitle, setTestTitle] = useState("");
    const [testLevel, setTestLevel] = useState("N5");
    const [duration, setDuration] = useState(105);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [audioInputType, setAudioInputType] = useState("link");
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [examId, setExamId] = useState(null);
    const [parts, setParts] = useState([]);
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



    // Map kind to type
    const getQuestionType = (kind) => {
        if (kind === "vocabulary" || kind === "từ vựng" || kind === "kanji reading") return "vocab";
        if (kind === "grammar" || kind === "ngữ pháp" || kind === "reading short" || kind === "reading long") return "grammar";
        if (kind === "listening") return "listening";
        return "vocab";
    };

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

    // Auto hide toast after 3 seconds
    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => {
                setToast({ show: false, message: '', type: '' });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toast.show]);

    // Load data từ API
    useEffect(() => {
        const loadExamData = async () => {
            if (!id) return;

            setIsLoading(true);
            try {
                const result = await getExamDetail(id);

                if (result.success && result.data) {
                    const examData = result.data.parts;  // Dữ liệu về các câu hỏi trong đề thi
                    const examGeneralInfo = result.data.exam; // Dữ liệu tổng quan về đề thi

                    // Set exam info (lấy từ phần tử đầu tiên)
                    if (examData.length > 0) {
                        setTestTitle(examGeneralInfo.title || "");
                        setTestLevel(examGeneralInfo.level || "N5");
                        setExamId(examGeneralInfo.id || id);
                    }

                    // Process parts
                    const allParts = [];
                    const allQuestions = [];
                    let questionCounter = 1;

                    examData.forEach(partData => {
                        allParts.push({
                            id: partData.partId,
                            name: partData.partName
                        });

                        partData.questions.forEach(q => {
                            const questionType = getQuestionType(q.kind);

                            const parentQuestion = {
                                id: questionCounter,
                                _id: q._id,
                                partId: partData.partId,
                                type: questionType,
                                question: q.title || "",
                                listeningContent: q.general?.txt_read || "",
                                audioFile: q.general?.audio ? { type: "link", url: q.general.audio } : null,
                                audioPreview: q.general?.audio || "",
                                subQuestions: q.content.map((subQ, subIndex) => ({
                                    id: questionCounter * 10 + subIndex + 1,
                                    question: subQ.question || "",
                                    options: subQ.answers || ["", "", "", ""],
                                    correctAnswer: subQ.correctAnswer || 0,
                                    explanation: subQ.explain || "",
                                    score: subQ.score || 1,
                                }))
                            };

                            allQuestions.push(parentQuestion);
                            questionCounter++;
                        });
                    });

                    setParts(allParts);
                    setQuestions(allQuestions);

                    // Calculate total duration
                    const totalTime = examData.reduce((sum, part) => sum + (part.time || 0), 0);
                    setDuration(totalTime);
                }
            } catch (error) {
                console.error("Error loading exam:", error);
                //alert("Có lỗi xảy ra khi tải đề thi: " + error.message);
                setToast({
                    show: true,
                    message: 'Có lỗi xảy ra khi tải đề thi: ' + error.message,
                    type: 'error'
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadExamData();
    }, [id]);

    // ====== CÂU CHA ======

    const addQuestion = () => {
        const nextId = questions.length
            ? Math.max(...questions.map((q) => q.id)) + 1
            : 1;
        setQuestions((prev) => [...prev, createParentQuestion(nextId)]);
        setCurrentQuestionIndex(questions.length);
    };

    const removeQuestion = async (questionId) => {
        const question = questions.find(q => q.id === questionId);

        const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa câu hỏi này?");
        if (!confirmDelete) return;

        if (question._id) {
            try {
                await deleteExamQuestion(question._id);
                console.log("Delete exam question", question._id)
            } catch (error) {
                console.error("Error deleting question:", error);
                //alert("Có lỗi xảy ra khi xóa câu hỏi");
                setToast({
                    show: true,
                    message: 'Có lỗi xảy ra khi xóa câu hỏi',
                    type: 'error'
                });
                return;
            }
        }

        const index = questions.findIndex((q) => q.id === questionId);
        setQuestions((prev) => prev.filter((q) => q.id !== questionId));
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
            const examData = {
                title: testTitle,
                level: testLevel
            };

            await updateExam(examId, examData);
            console.log("Update exam", examId, examData)

            const groupedQuestions = groupQuestionsByType();

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
                            explain: sub.explanation || "",
                            score: sub.score || 1
                        })),
                        correct_answers: question.subQuestions.map(sub => sub.correctAnswer)
                    };

                    if (type === "listening" && question.audioPreview) {
                        questionData.general.audio = question.audioPreview;
                        questionData.general.txt_read = question.listeningContent;
                    }

                    if (question._id) {
                        await updateExamQuestion
                            (question._id, questionData);
                        console.log("Update exam question", question._id, questionData)
                    } else {
                        const result = await createExamQuestion(partId, questionData);
                        console.log("create exam question", partId, questionData);
                        if (result.success && result.data) {
                            question._id = result.data._id;
                        }
                    }
                }
            }

            //alert("Cập nhật đề thi thành công!");
            setToast({
                show: true,
                message: 'Cập nhật đề thi thành công!',
                type: 'success'
            });
            setTimeout(() => {
                navigate("/admin/tests");
            }, 1000);
        } catch (error) {
            console.error("Error updating exam:", error);
            //alert("Có lỗi xảy ra khi cập nhật đề thi: " + error.message);
            setToast({
                show: true,
                message: 'Có lỗi xảy ra khi cập nhật đề thi: ' + error.message,
                type: 'error'
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className={cx("wrapper")}>
                <main className={cx("main")}>
                    <div className={cx("container")}>
                        <div style={{ textAlign: "center", padding: "40px" }}>
                            <p>Đang tải dữ liệu...</p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];

    // PHẦN RETURN CỦA EditTest Component

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
                        <h1 className={cx("title")}>Chỉnh sửa đề thi</h1>
                        <p className={cx("subtitle")}>
                            Cập nhật thông tin đề thi và câu hỏi
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

                                            {audioInputType === "link" ? (
                                                <div className={cx("audioLinkInput")}>
                                                    <Input
                                                        // value={
                                                        //     currentQuestion.audioFile?.type === "link"
                                                        //         ? currentQuestion.audioFile.url
                                                        //         : ""
                                                        // }
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
                                    {isSaving ? "Đang lưu..." : "Cập nhật"}
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
                title="Xác nhận cập nhật đề thi"
                message="Bạn có chắc chắn muốn lưu các thay đổi?"
                confirmText="Xác nhận"
            />
        </div>
    );
}

export default EditTest;