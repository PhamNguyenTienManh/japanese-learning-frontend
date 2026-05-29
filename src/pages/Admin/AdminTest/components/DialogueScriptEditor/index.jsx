import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";

import StyledSelect from "../StyledSelect";

import styles from "./DialogueScriptEditor.module.scss";

const cx = classNames.bind(styles);

function DialogueScriptEditor({
    lines,
    pauseMs,
    speakerOptions,
    onLinesChange,
    onPauseMsChange,
    disabled = false,
}) {
    const updateLine = (index, field, value) => {
        onLinesChange(
            lines.map((line, lineIndex) =>
                lineIndex === index ? { ...line, [field]: value } : line
            )
        );
    };

    const addLine = () => {
        const nextIndex = lines.length;
        onLinesChange([
            ...lines,
            {
                speakerLabel: nextIndex % 2 === 0 ? "A" : "B",
                speakerId: speakerOptions[0]?.value ?? 6,
                text: "",
            },
        ]);
    };

    const removeLine = (index) => {
        if (lines.length <= 1) return;
        onLinesChange(lines.filter((_, lineIndex) => lineIndex !== index));
    };

    return (
        <div className={cx("dialogueEditor")}>
            <div className={cx("header")}>
                <div className={cx("pauseField")}>
                    <label>Khoảng nghỉ</label>
                    <input
                        type="number"
                        min="0"
                        max="3000"
                        step="100"
                        value={pauseMs}
                        onChange={(event) => onPauseMsChange(Number(event.target.value))}
                        disabled={disabled}
                    />
                    <span>ms</span>
                </div>

                <button
                    type="button"
                    className={cx("addButton")}
                    onClick={addLine}
                    disabled={disabled}
                >
                    <FontAwesomeIcon icon={faPlus} />
                    <span>Thêm lời thoại</span>
                </button>
            </div>

            <div className={cx("lineList")}>
                <div className={cx("columnLabels")}>
                    <span>Vai</span>
                    <span>Giọng đọc</span>
                    <span>Lời thoại</span>
                    <span />
                </div>

                {lines.map((line, index) => (
                    <div key={index} className={cx("lineRow")}>
                        <input
                            className={cx("speakerInput")}
                            value={line.speakerLabel || ""}
                            placeholder="Vai"
                            onChange={(event) =>
                                updateLine(index, "speakerLabel", event.target.value)
                            }
                            disabled={disabled}
                        />

                        <StyledSelect
                            value={line.speakerId}
                            options={speakerOptions}
                            onChange={(nextSpeakerId) =>
                                updateLine(index, "speakerId", Number(nextSpeakerId))
                            }
                            ariaLabel="Giọng đọc"
                            disabled={disabled}
                        />

                        <textarea
                            className={cx("lineText")}
                            value={line.text || ""}
                            placeholder="Ví dụ: すみません、駅はどこですか。"
                            rows={2}
                            onChange={(event) =>
                                updateLine(index, "text", event.target.value)
                            }
                            disabled={disabled}
                        />

                        <button
                            type="button"
                            className={cx("removeButton")}
                            onClick={() => removeLine(index)}
                            disabled={disabled || lines.length <= 1}
                            aria-label="Xóa lời thoại"
                        >
                            <FontAwesomeIcon icon={faTrash} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default DialogueScriptEditor;
