import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeft,
    faPlus,
    faMinus,
    faXmark,
    faLink,
    faMagic,
} from "@fortawesome/free-solid-svg-icons";

import Card from "~/components/Card";
import Button from "~/components/Button";
import Input from "~/components/Input";
import { createExam, createExamQuestion } from "~/services/examService";
import {
    FALLBACK_VOICEVOX_SPEAKERS,
    getVoicevoxSpeakers,
    mapVoicevoxSpeakersToOptions,
    uploadDialogueVoice,
    uploadVoice,
} from "~/services/textToSpeechService";
import StyledSelect from "../components/StyledSelect";
import RichTextEditor from "../components/RichTextEditor";
import ImageUploadField from "../components/ImageUploadField";
import DialogueScriptEditor from "../components/DialogueScriptEditor";

import styles from "./CreateTest.module.scss";
import PopupModal from "~/components/Popup";

const cx = classNames.bind(styles);

const SAFE_HTML_TAGS = new Set([
    "B", "BR", "CAPTION", "DIV", "EM", "I", "LI", "OL", "P", "RB", "RP",
    "RT", "RUBY", "SPAN", "STRONG", "TABLE", "TBODY", "TD", "TFOOT", "TH",
    "THEAD", "TR", "U", "UL",
]);
const BLOCKED_HTML_TAGS = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "LINK", "META"]);
const SAFE_HTML_ATTRIBUTES = {
    TD: new Set(["colspan", "rowspan"]),
    TH: new Set(["colspan", "rowspan", "scope"]),
};
const LEVEL_OPTIONS = ["N5", "N4", "N3", "N2", "N1"].map((level) => ({
    value: level,
    label: level,
}));
const QUESTION_TYPE_OPTIONS = [
    { value: "vocab", label: "Từ vựng" },
    { value: "grammar", label: "Ngữ pháp, Đọc hiểu" },
    { value: "listening", label: "Thi nghe" },
];

function createDefaultAudioScript() {
    return {
        mode: "dialogue",
        pauseMs: 500,
        lines: [
            { speakerLabel: "A", speakerId: 2, text: "" },
            { speakerLabel: "B", speakerId: 13, text: "" },
        ],
    };
}

function normalizeAudioScriptForSubmit(audioScript) {
    if (!audioScript || !Array.isArray(audioScript.lines)) return null;

    const lines = audioScript.lines
        .map((line) => {
            const text = String(line?.text || "").trim();
            const speakerId = Number(line?.speakerId);

            return {
                speakerLabel: String(line?.speakerLabel || "").trim(),
                speakerId: Number.isFinite(speakerId) ? speakerId : 1,
                text,
            };
        })
        .filter((line) => line.text);

    if (lines.length === 0) return null;

    const pauseMs = Number(audioScript.pauseMs);

    return {
        mode: audioScript.mode || (lines.length > 1 ? "dialogue" : "single"),
        pauseMs: Number.isFinite(pauseMs) && pauseMs >= 0 ? pauseMs : 500,
        lines,
    };
}

function sanitizeExamHtml(value) {
    const raw = value === null || value === undefined ? "" : String(value);
    if (!raw.trim()) return "";

    if (typeof DOMParser === "undefined") {
        return raw
            .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
            .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "");
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(raw, "text/html");

    const cleanNode = (node) => {
        Array.from(node.childNodes).forEach((child) => {
            if (child.nodeType !== Node.ELEMENT_NODE) return;

            const element = child;
            const tagName = element.tagName;

            if (BLOCKED_HTML_TAGS.has(tagName)) {
                element.remove();
                return;
            }

            cleanNode(element);

            if (!SAFE_HTML_TAGS.has(tagName)) {
                element.replaceWith(...Array.from(element.childNodes));
                return;
            }

            const allowedAttributes = SAFE_HTML_ATTRIBUTES[tagName] || new Set();
            Array.from(element.attributes).forEach((attr) => {
                if (!allowedAttributes.has(attr.name.toLowerCase())) {
                    element.removeAttribute(attr.name);
                }
            });
        });
    };

    cleanNode(doc.body);
    return doc.body.innerHTML;
}

function SafeHtml({ as: Component = "div", className, value }) {
    return (
        <Component
            className={className}
            dangerouslySetInnerHTML={{ __html: sanitizeExamHtml(value) }}
        />
    );
}

function hasEditorContent(value) {
    const raw = value === null || value === undefined ? "" : String(value);
    if (!raw.trim()) return false;

    if (typeof document === "undefined") {
        return raw.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").trim().length > 0;
    }

    const temp = document.createElement("div");
    temp.innerHTML = raw;
    return (temp.textContent || "").replace(/\u00a0/g, " ").trim().length > 0;
}

function getEditorPlainText(value) {
    const raw = value === null || value === undefined ? "" : String(value);
    if (!raw.trim()) return "";

    if (typeof document === "undefined") {
        return raw.replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").trim();
    }

    const temp = document.createElement("div");
    temp.innerHTML = raw;
    return (temp.textContent || "").replace(/\u00a0/g, " ").trim();
}

// Tạo câu con
function createSubQuestion(id) {
    return {
        id,
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
        explanation: "",
        explainAll: "",
        image: "",
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
        generalImage: "",
        audioScript: createDefaultAudioScript(),
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
    const [speakerOptions, setSpeakerOptions] = useState(FALLBACK_VOICEVOX_SPEAKERS);
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [createdExamId, setCreatedExamId] = useState(null);
    const [createdParts, setCreatedParts] = useState([]);
    const [toast, setToast] = useState(false);
    const [errors, setErrors] = useState({});

    const titleRef = useRef(null);
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

    useEffect(() => {
        const loadSpeakers = async () => {
            try {
                const result = await getVoicevoxSpeakers();
                setSpeakerOptions(mapVoicevoxSpeakersToOptions(result));
            } catch (error) {
                console.warn("Failed to load Voicevox speakers:", error);
                setSpeakerOptions(FALLBACK_VOICEVOX_SPEAKERS);
            }
        };

        loadSpeakers();
    }, []);

    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type });
    };

    // ====== CÂU CHA ======

    const addQuestion = () => {
        const nextId = questions.length
            ? Math.max(...questions.map((q) => q.id)) + 1
            : 1;
        setQuestions((prev) => [...prev, createParentQuestion(nextId)]);
        setCurrentQuestionIndex(questions.length);
    };

    const removeQuestion = (id) => {
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
            if (type === "dialogue" && !currentQuestion.audioScript) {
                updateQuestion(currentQuestion.id, "audioScript", createDefaultAudioScript());
            }
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
        if (!currentQuestion || !hasEditorContent(currentQuestion.listeningContent)) {
            //alert("Vui lòng nhập nội dung câu hỏi trước khi tạo audio");
            setToast({
                show: true,
                message: 'Vui lòng nhập nội dung bài nghe trước khi tạo audio',
                type: 'error'
            });
            return;
        }

        setIsGeneratingAudio(true);
        try {
            // Gọi API text-to-speech
            const result = await uploadVoice(
                getEditorPlainText(currentQuestion.listeningContent),
                6
            );

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

    const handleGenerateDialogueAudio = async () => {
        const currentQuestion = questions[currentQuestionIndex];
        const audioScript = currentQuestion?.audioScript || createDefaultAudioScript();
        const lines = (audioScript.lines || []).map((line) => ({
            speakerLabel: line.speakerLabel || "",
            speakerId: Number(line.speakerId) || 6,
            text: (line.text || "").trim(),
        }));

        if (!lines.some((line) => line.text)) {
            setToast({
                show: true,
                message: "Vui lòng nhập ít nhất 1 lời thoại trước khi tạo audio",
                type: "error",
            });
            return;
        }

        setIsGeneratingAudio(true);
        try {
            const result = await uploadDialogueVoice(
                lines.filter((line) => line.text),
                audioScript.pauseMs || 500
            );

            const audioUrl = result?.data?.audioUrl || result?.audioUrl;

            if (!audioUrl) {
                throw new Error("Không nhận được URL audio");
            }

            updateQuestion(currentQuestion.id, "audioPreview", audioUrl);
            updateQuestion(currentQuestion.id, "audioFile", { type: "generated", url: audioUrl });
            updateQuestion(currentQuestion.id, "audioScript", {
                mode: "dialogue",
                pauseMs: audioScript.pauseMs || 500,
                lines,
            });

            setToast({
                show: true,
                message: "Tạo audio hội thoại thành công!",
                type: "success",
            });
        } catch (error) {
            console.error("Error generating dialogue audio:", error);
            setToast({
                show: true,
                message: "Có lỗi xảy ra khi tạo audio hội thoại. Vui lòng thử lại!",
                type: "error",
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
            if (!hasEditorContent(q.question)) {
                setCurrentQuestionIndex(qIndex);
                newErrors.questContent = "Nội dung câu hỏi không được để trống";
            }

            if (q.subQuestions.length === 0) {
                setCurrentQuestionIndex(qIndex);
                newErrors.subQuestionContent = "Câu hỏi phải có ít nhất 1 câu hỏi con";
            }

            // Kiểm tra từng sub-question
            q.subQuestions.forEach((sub) => {
                if (!hasEditorContent(sub.question)) {
                    setCurrentQuestionIndex(qIndex);
                    newErrors.subQuestionContent = "Câu hỏi con không được để trống";
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
                        general: {
                            audio: question.audioPreview || "",
                            image: question.generalImage || "",
                            txt_read: question.listeningContent || "",
                            audioScript: normalizeAudioScriptForSubmit(question.audioScript),
                        },
                        content: question.subQuestions.map(sub => ({
                            question: sub.question || "",
                            answers: sub.options,
                            correctAnswer: sub.correctAnswer,
                            explain: sub.explanation || "",
                            image: sub.image || "",
                            explainAll: sub.explainAll || "",
                            score: sub.score
                        })),
                        correct_answers: question.subQuestions.map(sub => sub.correctAnswer),
                        scores: question.subQuestions.map(sub => Number(sub.score) || 1)
                    };

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
    const currentQuestionTypeLabel =
        currentQuestion?.type === "vocab"
            ? "Từ vựng"
            : currentQuestion?.type === "grammar"
                ? "Ngữ pháp, Đọc hiểu"
                : "Thi nghe";

    return (
        <div className={cx("wrapper")}>
            <main className={cx("main")}>
                <div className={cx("container")}>
                    <div className={cx("header")}>
                        <Link to="/admin/tests" className={cx("backLink")}>
                            <FontAwesomeIcon icon={faArrowLeft} className={cx("backIcon")} />
                            <span>Quay lại quản lý đề thi</span>
                        </Link>
                        <div className={cx("headerMain")}>
                            <div className={cx("titleBlock")}>
                                <h1 className={cx("title")}>Tạo đề thi mới</h1>
                                <p className={cx("subtitle")}>
                                    Thiết lập thông tin đề thi, soạn câu hỏi và xem trước nội dung trước khi lưu.
                                </p>
                            </div>
                        </div>
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
                                <StyledSelect
                                    value={testLevel}
                                    onChange={setTestLevel}
                                    options={LEVEL_OPTIONS}
                                    ariaLabel="Cấp độ đề thi"
                                    className={cx("select")}
                                />
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
                                            <SafeHtml
                                                as="h2"
                                                className={cx("questionText")}
                                                value={currentQuestion.question || "Chưa có nội dung câu hỏi"}
                                            />
                                        </div>

                                        {currentQuestion.audioPreview && (
                                            <audio
                                                controls
                                                src={currentQuestion.audioPreview}
                                                className={cx("audioPreview")}
                                            />
                                        )}

                                        {currentQuestion.generalImage && (
                                            <div className={cx("previewImage")}>
                                                <img src={currentQuestion.generalImage} alt="Question" />
                                            </div>
                                        )}

                                        {currentQuestion.listeningContent && (
                                            <SafeHtml
                                                className={cx("generalTextPreview")}
                                                value={currentQuestion.listeningContent}
                                            />
                                        )}

                                        {currentQuestion.subQuestions.map((sub, subIndex) => (
                                            <div key={sub.id} className={cx("contentSection")}>
                                                <div className={cx("contentQuestion")}>
                                                    <span>{currentQuestionIndex + 1}.{subIndex + 1}</span>
                                                    <SafeHtml
                                                        value={sub.question || "Chưa có nội dung câu hỏi con"}
                                                    />
                                                </div>

                                                {sub.image && (
                                                    <div className={cx("previewImage")}>
                                                        <img src={sub.image} alt="Sub question" />
                                                    </div>
                                                )}

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
                                                                <SafeHtml
                                                                    as="span"
                                                                    className={cx("optionLabel")}
                                                                    value={option ||
                                                                        `Đáp án ${String.fromCharCode(
                                                                            65 + optionIndex
                                                                        )}`}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {sub.explanation && (
                                                    <div className={cx("explanation")}>
                                                        <div className={cx("explanationTitle")}>Giải thích:</div>
                                                        <SafeHtml value={sub.explanation} />
                                                    </div>
                                                )}

                                                {sub.explainAll && (
                                                    <div className={cx("explanation")}>
                                                        <div className={cx("explanationTitle")}>Giải thích chi tiết:</div>
                                                        <SafeHtml value={sub.explainAll} />
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
                                            <span>{currentQuestionTypeLabel}</span>
                                        </h3>
                                        <Button
                                            outline
                                            small
                                            className={cx("removeBtn")}
                                            leftIcon={<FontAwesomeIcon icon={faXmark} />}
                                            onClick={() => removeQuestion(currentQuestion.id)}
                                        >
                                            Xóa
                                        </Button>
                                    </div>

                                    <div className={cx("field")}>
                                        <label className={cx("label")}>Loại câu hỏi</label>
                                        <StyledSelect
                                            value={currentQuestion.type}
                                            onChange={(nextType) =>
                                                updateQuestion(
                                                    currentQuestion.id,
                                                    "type",
                                                    nextType
                                                )
                                            }
                                            options={QUESTION_TYPE_OPTIONS}
                                            ariaLabel="Loại câu hỏi"
                                            className={cx("select")}
                                        />
                                    </div>

                                    <div className={cx("field")}>
                                        <div className={cx("labelWrapper")}>
                                            <label className={cx("label")}>
                                                Nội dung chung
                                            </label>
                                            <span className={cx("requiredStar")}>*</span>
                                        </div>

                                        {/* Ô nhập nội dung chung */}
                                        <RichTextEditor
                                            key={`question-${currentQuestion.id}-question`}
                                            placeholder="Nhập nội dung câu hỏi..."
                                            value={currentQuestion.question}
                                            onChange={(nextValue) =>
                                                updateQuestion(
                                                    currentQuestion.id,
                                                    "question",
                                                    nextValue
                                                )
                                            }
                                            size="md"
                                        />
                                        {errors.questContent && <p className={cx("errorText")}>{errors.questContent}</p>}

                                        <div>
                                            <label className={cx("label")}>
                                                Bài đọc/nghe
                                            </label>
                                            <RichTextEditor
                                                key={`question-${currentQuestion.id}-listeningContent`}
                                                placeholder="Nhập bài đọc hoặc nội dung phần nghe..."
                                                value={currentQuestion.listeningContent || ""}
                                                onChange={(nextValue) =>
                                                    updateQuestion(
                                                        currentQuestion.id,
                                                        "listeningContent",
                                                        nextValue
                                                    )
                                                }
                                                size="lg"
                                            />
                                        </div>

                                        <div className={cx("field")} style={{ marginTop: "12px" }}>
                                            <ImageUploadField
                                                label="Ảnh chung"
                                                value={currentQuestion.generalImage || ""}
                                                onChange={(nextUrl) =>
                                                    updateQuestion(
                                                        currentQuestion.id,
                                                        "generalImage",
                                                        nextUrl
                                                    )
                                                }
                                                placeholder="Nhập URL ảnh chung nếu có"
                                                onSuccess={showToast}
                                                onError={(message) => showToast(message, "error")}
                                            />
                                        </div>
                                    </div>


                                    {currentQuestion && (
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
                                                    <span>Đơn thoại</span>
                                                </label>
                                                <label className={cx("radioLabel")}>
                                                    <input
                                                        type="radio"
                                                        name="audioType"
                                                        value="dialogue"
                                                        checked={audioInputType === "dialogue"}
                                                        onChange={() => handleAudioInputTypeChange("dialogue")}
                                                        className={cx("radioInput")}
                                                    />
                                                    <FontAwesomeIcon icon={faMagic} className={cx("radioIcon")} />
                                                    <span>Hội thoại</span>
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
                                            ) : audioInputType === "generate" ? (
                                                <div className={cx("generateAudioSection")}>
                                                    <p className={cx("generateHint")}>
                                                        Audio sẽ được tạo từ nội dung bài nghe bằng công nghệ text-to-speech
                                                    </p>
                                                    <Button
                                                        primary
                                                        leftIcon={<FontAwesomeIcon icon={faMagic} />}
                                                        onClick={handleGenerateAudio}
                                                        disabled={isGeneratingAudio || !hasEditorContent(currentQuestion.listeningContent)}
                                                    >
                                                        {isGeneratingAudio ? "Đang tạo audio..." : "Tạo audio"}
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className={cx("generateAudioSection", "dialogueAudioSection")}>
                                                    <p className={cx("generateHint")}>
                                                        Kịch bản hội thoại nhiều vai
                                                    </p>
                                                    <DialogueScriptEditor
                                                        lines={(currentQuestion.audioScript || createDefaultAudioScript()).lines}
                                                        pauseMs={(currentQuestion.audioScript || createDefaultAudioScript()).pauseMs}
                                                        speakerOptions={speakerOptions}
                                                        disabled={isGeneratingAudio}
                                                        onLinesChange={(nextLines) =>
                                                            updateQuestion(currentQuestion.id, "audioScript", {
                                                                ...(currentQuestion.audioScript || createDefaultAudioScript()),
                                                                mode: "dialogue",
                                                                lines: nextLines,
                                                            })
                                                        }
                                                        onPauseMsChange={(nextPauseMs) =>
                                                            updateQuestion(currentQuestion.id, "audioScript", {
                                                                ...(currentQuestion.audioScript || createDefaultAudioScript()),
                                                                mode: "dialogue",
                                                                pauseMs: nextPauseMs,
                                                            })
                                                        }
                                                    />
                                                    <Button
                                                        className={cx("dialogueGenerateButton")}
                                                        primary
                                                        leftIcon={<FontAwesomeIcon icon={faMagic} />}
                                                        onClick={handleGenerateDialogueAudio}
                                                        disabled={isGeneratingAudio}
                                                    >
                                                        {isGeneratingAudio ? "Đang tạo audio..." : "Tạo audio hội thoại"}
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
                                                    </div>

                                                    <div className={cx("field")}>
                                                        <div className={cx("labelWrapper")}>
                                                            <label className={cx("label")}>Câu hỏi</label>
                                                            <span className={cx("requiredStar")}>*</span>
                                                        </div>
                                                        <RichTextEditor
                                                            key={`question-${currentQuestion.id}-sub-${sub.id}-question`}
                                                            placeholder="Nhập nội dung câu hỏi con..."
                                                            value={sub.question}
                                                            onChange={(nextValue) =>
                                                                updateSubQuestion(
                                                                    currentQuestion.id,
                                                                    sub.id,
                                                                    "question",
                                                                    nextValue
                                                                )
                                                            }
                                                            size="sm"
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
                                                        <ImageUploadField
                                                            label="Ảnh câu hỏi con"
                                                            placeholder="Nhập URL ảnh nếu có..."
                                                            value={sub.image || ""}
                                                            onChange={(nextUrl) =>
                                                                updateSubQuestion(
                                                                    currentQuestion.id,
                                                                    sub.id,
                                                                    "image",
                                                                    nextUrl
                                                                )
                                                            }
                                                            onSuccess={showToast}
                                                            onError={(message) => showToast(message, "error")}
                                                        />
                                                    </div>

                                                    <div className={cx("field")}>
                                                        <label className={cx("label")}>
                                                            Giải thích
                                                        </label>
                                                        <RichTextEditor
                                                            key={`question-${currentQuestion.id}-sub-${sub.id}-explanation`}
                                                            placeholder="Nhập giải thích..."
                                                            value={sub.explanation}
                                                            onChange={(nextValue) =>
                                                                updateSubQuestion(
                                                                    currentQuestion.id,
                                                                    sub.id,
                                                                    "explanation",
                                                                    nextValue
                                                                )
                                                            }
                                                            size="lg"
                                                        />
                                                    </div>

                                                    <div className={cx("field")}>
                                                        <label className={cx("label")}>
                                                            Giải thích chi tiết
                                                        </label>
                                                        <RichTextEditor
                                                            key={`question-${currentQuestion.id}-sub-${sub.id}-explainAll`}
                                                            placeholder="Nhập giải thích chi tiết..."
                                                            value={sub.explainAll || ""}
                                                            onChange={(nextValue) =>
                                                                updateSubQuestion(
                                                                    currentQuestion.id,
                                                                    sub.id,
                                                                    "explainAll",
                                                                    nextValue
                                                                )
                                                            }
                                                            size="xl"
                                                        />
                                                    </div>

                                                    <div className={cx("field", "scoreField")}>
                                                        <label className={cx("label")}>
                                                            Điểm cho câu hỏi
                                                        </label>

                                                        <div className={cx("scoreStepper")}>
                                                            <button
                                                                type="button"
                                                                className={cx("scoreButton")}
                                                                onClick={() =>
                                                                    updateSubQuestion(
                                                                        currentQuestion.id,
                                                                        sub.id,
                                                                        "score",
                                                                        Math.max(0, Number(sub.score || 0) - 1)
                                                                    )
                                                                }
                                                                aria-label="Giảm điểm"
                                                            >
                                                                <FontAwesomeIcon icon={faMinus} />
                                                            </button>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="1"
                                                                value={sub.score}
                                                                onChange={(e) =>
                                                                    updateSubQuestion(
                                                                        currentQuestion.id,
                                                                        sub.id,
                                                                        "score",
                                                                        Math.max(0, Number(e.target.value) || 0)
                                                                    )
                                                                }
                                                                className={cx("scoreInput")}
                                                            />
                                                            <button
                                                                type="button"
                                                                className={cx("scoreButton")}
                                                                onClick={() =>
                                                                    updateSubQuestion(
                                                                        currentQuestion.id,
                                                                        sub.id,
                                                                        "score",
                                                                        Number(sub.score || 0) + 1
                                                                    )
                                                                }
                                                                aria-label="Tăng điểm"
                                                            >
                                                                <FontAwesomeIcon icon={faPlus} />
                                                            </button>
                                                        </div>
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
