import { useState } from "react";
import { Link } from "react-router-dom";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeft,
    faPlus,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";

import Card from "~/components/Card";
import Button from "~/components/Button";
import Input from "~/components/Input";

import styles from "./CreateTest.module.scss";

const cx = classNames.bind(styles);

// Tạo câu con
function createSubQuestion(id) {
    return {
        id,
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
        explanation: "",
    };
}

// Tạo câu cha
function createParentQuestion(id) {
    return {
        id,
        type: "vocab", // vocab / grammar / reading / listening
        question: "",
        audioFile: null, // chỉ dùng cho listening
        audioPreview: "",
        subQuestions: [createSubQuestion(id * 10 + 1)],
    };
}

function CreateTest() {
    const [testTitle, setTestTitle] = useState("");
    const [testLevel, setTestLevel] = useState("N5");
    const [duration, setDuration] = useState(105);
    const [questions, setQuestions] = useState([createParentQuestion(1)]);

    // ====== CÂU CHA ======

    const addQuestion = () => {
        const nextId = questions.length
            ? Math.max(...questions.map((q) => q.id)) + 1
            : 1;
        setQuestions((prev) => [...prev, createParentQuestion(nextId)]);
    };

    const removeQuestion = (id) => {
        setQuestions((prev) => prev.filter((q) => q.id !== id));
    };

    const updateQuestion = (id, field, value) => {
        setQuestions((prev) =>
            prev.map((q) => (q.id === id ? { ...q, [field]: value } : q))
        );
    };

    const handleAudioChange = (questionId, event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const previewUrl = URL.createObjectURL(file);

        setQuestions((prev) =>
            prev.map((q) =>
                q.id === questionId
                    ? { ...q, audioFile: file, audioPreview: previewUrl }
                    : q
            )
        );
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
                // giữ lại ít nhất 1 câu con
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

    // ====== RENDER ======

    const handleSaveDraft = () => {
        console.log("Lưu bản nháp:", {
            testTitle,
            testLevel,
            duration,
            questions,
        });
    };

    const handlePublish = () => {
        console.log("Xuất bản đề thi:", {
            testTitle,
            testLevel,
            duration,
            questions,
        });
    };

    return (
        <div className={cx("wrapper")}>
            <main className={cx("main")}>
                <div className={cx("inner")}>
                    {/* Header */}
                    <div className={cx("header")}>
                        <Link to="/admin/tests" className={cx("backLink")}>
                            <FontAwesomeIcon icon={faArrowLeft} className={cx("backIcon")} />
                            <span>Quay lại quản lý đề thi</span>
                        </Link>
                        <h1 className={cx("title")}>Tạo đề thi mới</h1>
                        <p className={cx("subtitle")}>
                            Thiết lập thông tin đề thi và thêm câu hỏi (hỗ trợ câu 1.1, 1.2…
                            & thi nghe)
                        </p>
                    </div>

                    {/* Test Info */}
                    <Card className={cx("infoCard")}>
                        <h2 className={cx("sectionTitle")}>Thông tin đề thi</h2>
                        <div className={cx("infoGrid")}>
                            <div className={cx("field")}>
                                <label className={cx("label")}>Tiêu đề đề thi</label>
                                <Input
                                    placeholder="VD: JLPT N5 - Đề số 1"
                                    value={testTitle}
                                    onChange={(e) => setTestTitle(e.target.value)}
                                    className={cx("input")}
                                />
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

                    {/* Questions */}
                    <div className={cx("questionsHeader")}>
                        <h2 className={cx("sectionTitle")}>
                            Câu hỏi ({questions.length} phần)
                        </h2>
                        <Button
                            primary
                            leftIcon={<FontAwesomeIcon icon={faPlus} />}
                            onClick={addQuestion}
                        >
                            Thêm câu (Câu 2, Câu 3…)
                        </Button>
                    </div>

                    <div className={cx("questionsList")}>
                        {questions.map((question, index) => (
                            <Card key={question.id} className={cx("questionCard")}>
                                {/* Header câu cha */}
                                <div className={cx("questionHeader")}>
                                    <div className={cx("questionHeaderLeft")}>
                                        <span className={cx("questionIndex")}>
                                            Câu {index + 1}
                                        </span>
                                        <select
                                            value={question.type}
                                            onChange={(e) =>
                                                updateQuestion(question.id, "type", e.target.value)
                                            }
                                            className={cx("select", "selectType")}
                                        >
                                            <option value="vocab">Từ vựng</option>
                                            <option value="grammar">Ngữ pháp, Đọc hiểu</option>
                                            <option value="listening">Thi nghe</option>
                                        </select>
                                    </div>
                                    <Button
                                        outline
                                        rounded
                                        className={cx("removeBtn")}
                                        leftIcon={<FontAwesomeIcon icon={faXmark} />}
                                        onClick={() => removeQuestion(question.id)}
                                    />
                                </div>

                                <div className={cx("questionBody")}>
                                    {/* Nội dung chung / hướng dẫn */}
                                    <div className={cx("field")}>
                                        <label className={cx("label")}>
                                            {question.type === "listening"
                                                ? "Hướng dẫn / nội dung phần nghe"
                                                : "Nội dung chung (đoạn văn / phần mô tả)"}
                                        </label>
                                        <textarea
                                            placeholder={
                                                question.type === "listening"
                                                    ? "Ví dụ: もんだい１では、はじめに しつもんを きいてください..."
                                                    : "Nhập đoạn văn / nội dung chung cho nhóm câu hỏi này..."
                                            }
                                            value={question.question}
                                            onChange={(e) =>
                                                updateQuestion(question.id, "question", e.target.value)
                                            }
                                            className={cx("textarea")}
                                            rows={3}
                                        />
                                    </div>

                                    {/* Audio cho Thi nghe */}
                                    {question.type === "listening" && (
                                        <div className={cx("field")}>
                                            <label className={cx("label")}>File audio</label>
                                            <input
                                                type="file"
                                                accept="audio/*"
                                                onChange={(e) => handleAudioChange(question.id, e)}
                                                className={cx("fileInput")}
                                            />
                                            {question.audioPreview && (
                                                <audio
                                                    controls
                                                    src={question.audioPreview}
                                                    className={cx("audio")}
                                                />
                                            )}
                                        </div>
                                    )}

                                    {/* Câu con */}
                                    <div className={cx("subQuestionsWrapper")}>
                                        <div className={cx("subHeaderRow")}>
                                            <h3 className={cx("subTitle")}>
                                                Câu hỏi con (Câu {index + 1}.1, {index + 1}.2…)
                                            </h3>
                                            <Button
                                                outline
                                                leftIcon={<FontAwesomeIcon icon={faPlus} />}
                                                onClick={() => addSubQuestion(question.id)}
                                            >
                                                Thêm câu con
                                            </Button>
                                        </div>

                                        <div className={cx("subList")}>
                                            {question.subQuestions.map((sub, subIndex) => (
                                                <div key={sub.id} className={cx("subCard")}>
                                                    <div className={cx("subHeader")}>
                                                        <span className={cx("subIndex")}>
                                                            Câu {index + 1}.{subIndex + 1}
                                                        </span>
                                                        {question.subQuestions.length > 1 && (
                                                            <button
                                                                type="button"
                                                                className={cx("subRemove")}
                                                                onClick={() =>
                                                                    removeSubQuestion(question.id, sub.id)
                                                                }
                                                            >
                                                                <FontAwesomeIcon icon={faXmark} />
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className={cx("field")}>
                                                        <label className={cx("label")}>
                                                            Nội dung câu hỏi con
                                                        </label>
                                                        <textarea
                                                            placeholder="Nhập nội dung câu hỏi con..."
                                                            value={sub.question}
                                                            onChange={(e) =>
                                                                updateSubQuestion(
                                                                    question.id,
                                                                    sub.id,
                                                                    "question",
                                                                    e.target.value
                                                                )
                                                            }
                                                            className={cx("textarea")}
                                                            rows={2}
                                                        />
                                                    </div>

                                                    {/* Lựa chọn */}
                                                    <div className={cx("optionsGrid")}>
                                                        {sub.options.map((option, optionIndex) => (
                                                            <div key={optionIndex} className={cx("field")}>
                                                                <label className={cx("optionLabel")}>
                                                                    <input
                                                                        type="radio"
                                                                        name={`answer-${question.id}-${sub.id}`}
                                                                        checked={
                                                                            sub.correctAnswer === optionIndex
                                                                        }
                                                                        onChange={() =>
                                                                            updateSubQuestion(
                                                                                question.id,
                                                                                sub.id,
                                                                                "correctAnswer",
                                                                                optionIndex
                                                                            )
                                                                        }
                                                                        className={cx("radio")}
                                                                    />
                                                                    <span>
                                                                        Đáp án{" "}
                                                                        {String.fromCharCode(65 + optionIndex)}
                                                                        {sub.correctAnswer === optionIndex && (
                                                                            <span
                                                                                className={cx(
                                                                                    "badge",
                                                                                    "badgeAnswer"
                                                                                )}
                                                                            >
                                                                                Đáp án
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                </label>
                                                                <Input
                                                                    placeholder={`Nhập đáp án ${String.fromCharCode(
                                                                        65 + optionIndex
                                                                    )}`}
                                                                    value={option}
                                                                    onChange={(e) =>
                                                                        handleChangeOption(
                                                                            question.id,
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
                                                            Giải thích đáp án
                                                        </label>
                                                        <textarea
                                                            placeholder="Nhập giải thích..."
                                                            value={sub.explanation}
                                                            onChange={(e) =>
                                                                updateSubQuestion(
                                                                    question.id,
                                                                    sub.id,
                                                                    "explanation",
                                                                    e.target.value
                                                                )
                                                            }
                                                            className={cx("textarea")}
                                                            rows={2}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className={cx("actions")}>
                        <Link to="/admin/tests">
                            <Button outline>Hủy</Button>
                        </Link>
                        <Button primary onClick={handleSaveDraft}>
                            Lưu bản nháp
                        </Button>
                        <Button className={cx("publishBtn")} onClick={handlePublish}>
                            Xuất bản đề thi
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default CreateTest;
