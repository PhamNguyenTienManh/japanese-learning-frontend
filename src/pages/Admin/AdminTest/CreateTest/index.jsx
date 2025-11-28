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



function CreateTest() {
    const [testTitle, setTestTitle] = useState("");
    const [testLevel, setTestLevel] = useState("N5");
    const [duration, setDuration] = useState(105);
    const [questions, setQuestions] = useState([
        {
            id: 1,
            type: "vocab",
            question: "",
            options: ["", "", "", ""],
            correctAnswer: 0,
            explanation: "",
        },
    ]);

    const addQuestion = () => {
        const nextId = Math.max(...questions.map((q) => q.id), 0) + 1;
        const newQuestion = {
            id: nextId,
            type: "vocab",
            question: "",
            options: ["", "", "", ""],
            correctAnswer: 0,
            explanation: "",
        };
        setQuestions([...questions, newQuestion]);
    };

    const removeQuestion = (id) => {
        setQuestions(questions.filter((q) => q.id !== id));
    };

    const updateQuestion = (id, field, value) => {
        setQuestions(
            questions.map((q) => (q.id === id ? { ...q, [field]: value } : q))
        );
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
                            Thiết lập thông tin đề thi và thêm câu hỏi
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
                            Câu hỏi ({questions.length})
                        </h2>
                        <Button
                            primary
                            leftIcon={<FontAwesomeIcon icon={faPlus} />}
                            onClick={addQuestion}
                        >
                            Thêm câu hỏi
                        </Button>
                    </div>

                    <div className={cx("questionsList")}>
                        {questions.map((question, index) => (
                            <Card key={question.id} className={cx("questionCard")}>
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
                                            <option value="grammar">Ngữ pháp</option>
                                            <option value="reading">Đọc hiểu</option>
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
                                    <div className={cx("field")}>
                                        <label className={cx("label")}>Nội dung câu hỏi</label>
                                        <textarea
                                            placeholder="Nhập câu hỏi..."
                                            value={question.question}
                                            onChange={(e) =>
                                                updateQuestion(
                                                    question.id,
                                                    "question",
                                                    e.target.value
                                                )
                                            }
                                            className={cx("textarea")}
                                            rows={3}
                                        />
                                    </div>

                                    <div className={cx("optionsGrid")}>
                                        {question.options.map((option, optionIndex) => (
                                            <div key={optionIndex} className={cx("field")}>
                                                <label className={cx("optionLabel")}>
                                                    <input
                                                        type="radio"
                                                        name={`answer-${question.id}`}
                                                        checked={question.correctAnswer === optionIndex}
                                                        onChange={() =>
                                                            updateQuestion(
                                                                question.id,
                                                                "correctAnswer",
                                                                optionIndex
                                                            )
                                                        }
                                                        className={cx("radio")}
                                                    />
                                                    <span>
                                                        Tùy chọn {optionIndex + 1}{" "}
                                                        {question.correctAnswer === optionIndex && (
                                                            <span
                                                                className={cx("badge", "badgeAnswer")}
                                                            >
                                                                Đáp án
                                                            </span>
                                                        )}
                                                    </span>
                                                </label>
                                                <Input
                                                    placeholder={`Nhập tùy chọn ${optionIndex + 1}`}
                                                    value={option}
                                                    onChange={(e) => {
                                                        const newOptions = [...question.options];
                                                        newOptions[optionIndex] = e.target.value;
                                                        updateQuestion(question.id, "options", newOptions);
                                                    }}
                                                    className={cx("input")}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className={cx("field")}>
                                        <label className={cx("label")}>Giải thích đáp án</label>
                                        <textarea
                                            placeholder="Nhập giải thích..."
                                            value={question.explanation}
                                            onChange={(e) =>
                                                updateQuestion(
                                                    question.id,
                                                    "explanation",
                                                    e.target.value
                                                )
                                            }
                                            className={cx("textarea")}
                                            rows={2}
                                        />
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
                        <Button primary>Лưu bản nháp</Button>
                        <Button className={cx("publishBtn")}>Xuất bản đề thi</Button>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default CreateTest;
