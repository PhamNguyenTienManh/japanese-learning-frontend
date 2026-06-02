import { useCallback, useEffect, useRef, useState } from "react";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faVolumeHigh,
    faCopy,
    faRightLeft,
    faPen,
    faTrash,
    faRotateLeft,
    faXmark,
    faChevronDown,
    faCheck,
} from "@fortawesome/free-solid-svg-icons";

import styles from "./Translate.module.scss";
import { useToast } from "~/context/ToastContext";
import {
    recognizeJapaneseHandwriting,
    translateText,
} from "~/services/traslate";

const cx = classNames.bind(styles);

const languages = [
    { code: "ja", name: "Tiếng Nhật" },
    { code: "vi", name: "Tiếng Việt" },
];

const langOptions = languages.map((l) => ({ value: l.code, label: l.name }));
const CANVAS_SIZE = 360;
const MAX_TRANSLATE_LENGTH = 5000;
const getOppositeLang = (lang) => (lang === "ja" ? "vi" : "ja");
const getLangName = (lang) =>
    languages.find((item) => item.code === lang)?.name || "";

function TranslateLangSelect({ value, onChange, label }) {
    const [open, setOpen] = useState(false);
    const selectRef = useRef(null);
    const selected = langOptions.find((option) => option.value === value);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (selectRef.current && !selectRef.current.contains(event.target)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className={cx("translateSelect")} ref={selectRef}>
            <button
                type="button"
                className={cx("translateSelectBtn", { open })}
                onClick={() => setOpen((current) => !current)}
                aria-label={label}
                aria-expanded={open}
            >
                <span>{selected?.label || "Chọn"}</span>
                <FontAwesomeIcon className={cx("selectArrow")} icon={faChevronDown} />
            </button>

            {open && (
                <div className={cx("translateSelectMenu")}>
                    {langOptions.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            className={cx("translateSelectItem", {
                                active: option.value === value,
                            })}
                            onClick={() => {
                                onChange(option.value);
                                setOpen(false);
                            }}
                        >
                            <span>{option.label}</span>
                            {option.value === value && (
                                <FontAwesomeIcon className={cx("selectCheck")} icon={faCheck} />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function Translate() {
    const [sourceText, setSourceText] = useState("");
    const [translatedText, setTranslatedText] = useState("");
    const [sourceLang, setSourceLang] = useState("ja");
    const [targetLang, setTargetLang] = useState("vi");
    const [isTranslating, setIsTranslating] = useState(false);
    const [showHandwritingModal, setShowHandwritingModal] = useState(false);
    const [isRecognizing, setIsRecognizing] = useState(false);
    const [recognizedCandidates, setRecognizedCandidates] = useState([]);
    const [selectedHandwritingText, setSelectedHandwritingText] = useState("");
    const canvasRef = useRef(null);
    const drawingRef = useRef(false);
    const lastPointRef = useRef(null);
    const strokesRef = useRef([]);
    const activeStrokeRef = useRef(null);
    const strokeStartTimeRef = useRef(0);
    const recognitionTimerRef = useRef(null);
    const { addToast } = useToast();

    const drawCanvasGuide = useCallback((ctx) => {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(CANVAS_SIZE / 2, 0);
        ctx.lineTo(CANVAS_SIZE / 2, CANVAS_SIZE);
        ctx.moveTo(0, CANVAS_SIZE / 2);
        ctx.lineTo(CANVAS_SIZE, CANVAS_SIZE / 2);
        ctx.stroke();
    }, []);

    const resetCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        drawCanvasGuide(ctx);
        strokesRef.current = [];
        activeStrokeRef.current = null;
        setRecognizedCandidates([]);
        setSelectedHandwritingText("");
        if (recognitionTimerRef.current) {
            clearTimeout(recognitionTimerRef.current);
            recognitionTimerRef.current = null;
        }
    }, [drawCanvasGuide]);

    useEffect(() => {
        if (showHandwritingModal) {
            requestAnimationFrame(resetCanvas);
        }
    }, [showHandwritingModal, resetCanvas]);

    useEffect(() => {
        return () => {
            if (recognitionTimerRef.current) {
                clearTimeout(recognitionTimerRef.current);
            }
        };
    }, []);

    const getCanvasPoint = (event) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        return {
            x: ((event.clientX - rect.left) / rect.width) * CANVAS_SIZE,
            y: ((event.clientY - rect.top) / rect.height) * CANVAS_SIZE,
        };
    };

    const addPointToActiveStroke = (point) => {
        if (!activeStrokeRef.current) return;

        const [xs, ys, ts] = activeStrokeRef.current;
        xs.push(point.x);
        ys.push(point.y);
        ts.push(Date.now() - strokeStartTimeRef.current);
    };

    const drawStrokeSegment = (ctx, fromPoint, toPoint) => {
        ctx.strokeStyle = "#3567d6";
        ctx.lineWidth = 12;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(fromPoint.x, fromPoint.y);
        ctx.lineTo(toPoint.x, toPoint.y);
        ctx.stroke();
    };

    const redrawCanvasFromStrokes = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        drawCanvasGuide(ctx);

        strokesRef.current.forEach(([xs, ys]) => {
            if (!xs.length) return;
            if (xs.length === 1) {
                drawStrokeSegment(
                    ctx,
                    { x: xs[0], y: ys[0] },
                    { x: xs[0] + 0.1, y: ys[0] + 0.1 }
                );
                return;
            }

            for (let index = 1; index < xs.length; index += 1) {
                drawStrokeSegment(
                    ctx,
                    { x: xs[index - 1], y: ys[index - 1] },
                    { x: xs[index], y: ys[index] }
                );
            }
        });
    }, [drawCanvasGuide]);

    const finishActiveStroke = () => {
        const activeStroke = activeStrokeRef.current;
        activeStrokeRef.current = null;
        if (!activeStroke || activeStroke[0].length === 0) return false;

        strokesRef.current = [...strokesRef.current, activeStroke];
        return true;
    };

    const handleCanvasPointerDown = (event) => {
        event.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.setPointerCapture?.(event.pointerId);
        if (recognitionTimerRef.current) {
            clearTimeout(recognitionTimerRef.current);
            recognitionTimerRef.current = null;
        }

        drawingRef.current = true;
        strokeStartTimeRef.current = Date.now();
        activeStrokeRef.current = [[], [], []];
        const point = getCanvasPoint(event);
        addPointToActiveStroke(point);
        lastPointRef.current = point;
    };

    const handleCanvasPointerMove = (event) => {
        if (!drawingRef.current) return;
        event.preventDefault();

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const nextPoint = getCanvasPoint(event);
        const lastPoint = lastPointRef.current || nextPoint;

        drawStrokeSegment(ctx, lastPoint, nextPoint);
        addPointToActiveStroke(nextPoint);

        lastPointRef.current = nextPoint;
    };

    const recognizeHandwritingFromCanvas = useCallback(async ({ notifyEmpty = false } = {}) => {
        if (!strokesRef.current.length) {
            if (notifyEmpty) addToast("Vui lòng viết chữ Nhật trên khung trước", "info");
            return "";
        }

        try {
            setIsRecognizing(true);
            const result = await recognizeJapaneseHandwriting({
                ink: strokesRef.current,
                width: CANVAS_SIZE,
                height: CANVAS_SIZE,
            });
            const candidates = Array.isArray(result?.candidates)
                ? result.candidates.filter(Boolean)
                : [];
            const text = String(result?.text || candidates[0] || "").trim();
            const nextCandidates = text
                ? Array.from(new Set([text, ...candidates]))
                : candidates;

            setRecognizedCandidates(nextCandidates);
            setSelectedHandwritingText((current) =>
                current && nextCandidates.includes(current) ? current : ""
            );

            if (!text && notifyEmpty) {
                addToast("Chưa nhận diện được chữ viết tay", "warning");
            }

            return text || nextCandidates[0] || "";
        } catch (error) {
            console.error("Handwriting OCR failed:", error);
            if (notifyEmpty) {
                addToast("Lỗi nhận diện chữ viết tay", "error");
            }
            return "";
        } finally {
            setIsRecognizing(false);
        }
    }, [addToast]);

    const scheduleHandwritingRecognition = useCallback(() => {
        if (recognitionTimerRef.current) {
            clearTimeout(recognitionTimerRef.current);
        }

        recognitionTimerRef.current = setTimeout(() => {
            recognizeHandwritingFromCanvas();
        }, 650);
    }, [recognizeHandwritingFromCanvas]);

    const handleCanvasPointerUp = (event) => {
        event.preventDefault();
        if (!drawingRef.current) return;
        drawingRef.current = false;
        lastPointRef.current = null;
        if (finishActiveStroke()) {
            scheduleHandwritingRecognition();
        }
    };

    const handleUndoCanvas = () => {
        if (!strokesRef.current.length) {
            resetCanvas();
            return;
        }

        strokesRef.current = strokesRef.current.slice(0, -1);
        redrawCanvasFromStrokes();
        setRecognizedCandidates([]);
        setSelectedHandwritingText("");

        if (strokesRef.current.length) {
            scheduleHandwritingRecognition();
        }
    };

    const applyRecognizedText = (text) => {
        const value = String(text || "").trim();
        if (!value) return;
        setSelectedHandwritingText(value);
        setSourceText(value);
        setSourceLang("ja");
        setTargetLang("vi");
        setTranslatedText("");
    };

    const translateWithText = async (text, source = sourceLang, target = targetLang) => {
        const value = String(text || "").trim();
        if (!value) {
            addToast("Vui lòng nhập văn bản", "info");
            return false;
        }

        if (source === target) {
            addToast("Hai ngôn ngữ giống nhau", "warning");
            return false;
        }

        try {
            setIsTranslating(true);
            const res = await translateText(value, source, target);
            setTranslatedText(res.data.translatedText);
            return true;
        } catch (error) {
            addToast("Lỗi dịch văn bản", "error");
            return false;
        } finally {
            setIsTranslating(false);
        }
    };

    const handleTranslate = async () => {
        await translateWithText(sourceText, sourceLang, targetLang);
    };

    const handleTranslateHandwriting = async () => {
        const text = selectedHandwritingText.trim();
        if (!text) {
            addToast("Vui lòng chọn một gợi ý trước khi dịch", "info");
            return;
        }

        applyRecognizedText(text);

        const translated = await translateWithText(text, "ja", targetLang);
        if (translated) {
            setShowHandwritingModal(false);
        }
    };

    const handleSwapLanguages = () => {
        setSourceLang(targetLang);
        setTargetLang(sourceLang);
        setSourceText(translatedText);
        setTranslatedText(sourceText);
    };

    const handleSourceLangChange = (value) => {
        setSourceLang(value);
        setTargetLang(getOppositeLang(value));
        setTranslatedText("");
    };

    const handleTargetLangChange = (value) => {
        setTargetLang(value);
        setSourceLang(getOppositeLang(value));
        setTranslatedText("");
    };

    const handleCopy = (text) => {
        if (!text.trim()) return;
        navigator.clipboard.writeText(text);
        addToast("Đã sao chép!", "success");
    };

    const handleClear = () => {
        setSourceText("");
        setTranslatedText("");
    };

    const handleSpeak = (text, lang) => {
        if (!text.trim()) return;

        const utter = new SpeechSynthesisUtterance(text);

        const langMap = {
            ja: "ja-JP",
            vi: "vi-VN",
            en: "en-US",
            ko: "ko-KR",
            zh: "zh-CN",
        };

        utter.lang = langMap[lang] || "en-US";
        speechSynthesis.cancel();
        speechSynthesis.speak(utter);
    };

    return (
        <div className={cx("wrapper")}>
            <div className={cx("container")}>
                <div className={cx("hero")}>
                    <div>
                        <span className={cx("eyebrow")}>JAVI Translator</span>
                        <h1 className={cx("title")}>Dịch Nhật - Việt</h1>
                    </div>
                </div>

                <div className={cx("translatorCard")}>
                    <div className={cx("panes")}>
                        <section className={cx("pane", "sourcePane")}>
                            <div className={cx("paneHeader")}>
                                <div className={cx("langSelect")}>
                                    <TranslateLangSelect
                                        label="Ngôn ngữ nguồn"
                                        value={sourceLang}
                                        onChange={handleSourceLangChange}
                                    />
                                </div>
                            </div>

                            <textarea
                                value={sourceText}
                                onChange={(e) => {
                                    setSourceText(e.target.value.slice(0, MAX_TRANSLATE_LENGTH));
                                    setTranslatedText("");
                                }}
                                placeholder={`Nhập ${getLangName(sourceLang).toLowerCase()} để dịch...`}
                                className={cx("textarea")}
                                maxLength={MAX_TRANSLATE_LENGTH}
                            />

                            <div className={cx("paneFoot")}>
                                <div className={cx("tools")}>
                                    {sourceLang === "ja" && (
                                        <button
                                            type="button"
                                            className={cx("iconBtn")}
                                            onClick={() => setShowHandwritingModal(true)}
                                            aria-label="Viết tay tiếng Nhật"
                                        >
                                            <FontAwesomeIcon icon={faPen} />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className={cx("iconBtn")}
                                        onClick={() => handleSpeak(sourceText, sourceLang)}
                                        disabled={!sourceText.trim()}
                                        aria-label="Phát âm"
                                    >
                                        <FontAwesomeIcon icon={faVolumeHigh} />
                                    </button>
                                    <button
                                        type="button"
                                        className={cx("iconBtn")}
                                        onClick={() => handleCopy(sourceText)}
                                        disabled={!sourceText.trim()}
                                        aria-label="Sao chép"
                                    >
                                        <FontAwesomeIcon icon={faCopy} />
                                    </button>
                                    <button
                                        type="button"
                                        className={cx("iconBtn")}
                                        onClick={handleClear}
                                        disabled={!sourceText.trim() && !translatedText.trim()}
                                        aria-label="Xóa"
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </div>

                                <div className={cx("sourceMeta")}>
                                    <span className={cx("length")}>
                                        {sourceText.length}/{MAX_TRANSLATE_LENGTH}
                                    </span>
                                    <button
                                        type="button"
                                        className={cx("translateBtn")}
                                        onClick={handleTranslate}
                                        disabled={isTranslating || !sourceText.trim()}
                                    >
                                        {isTranslating ? "Đang dịch..." : "Dịch"}
                                    </button>
                                </div>
                            </div>
                        </section>

                        <button
                            type="button"
                            className={cx("swapBtn")}
                            onClick={handleSwapLanguages}
                            aria-label="Đảo ngôn ngữ"
                        >
                            <FontAwesomeIcon icon={faRightLeft} />
                        </button>

                        <section className={cx("pane", "resultPane")}>
                            <div className={cx("paneHeader")}>
                                <div className={cx("langSelect")}>
                                    <TranslateLangSelect
                                        label="Ngôn ngữ đích"
                                        value={targetLang}
                                        onChange={handleTargetLangChange}
                                    />
                                </div>
                            </div>

                            <textarea
                                value={translatedText}
                                readOnly
                                placeholder={`Bản dịch ${getLangName(targetLang).toLowerCase()}...`}
                                className={cx("textarea")}
                            />

                            <div className={cx("paneFoot")}>
                                <div className={cx("tools")}>
                                    <button
                                        type="button"
                                        className={cx("iconBtn")}
                                        onClick={() => handleSpeak(translatedText, targetLang)}
                                        disabled={!translatedText.trim()}
                                        aria-label="Phát âm"
                                    >
                                        <FontAwesomeIcon icon={faVolumeHigh} />
                                    </button>
                                    <button
                                        type="button"
                                        className={cx("iconBtn")}
                                        onClick={() => handleCopy(translatedText)}
                                        disabled={!translatedText.trim()}
                                        aria-label="Sao chép"
                                    >
                                        <FontAwesomeIcon icon={faCopy} />
                                    </button>
                                </div>
                                <span className={cx("length")}>
                                    {translatedText.length} ký tự
                                </span>
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            {showHandwritingModal && (
                <div className={cx("handwritingOverlay")}>
                    <section className={cx("handwritingModal")}>
                        <header className={cx("handwritingHeader")}>
                            <h2>Nhận dạng nét vẽ</h2>
                            <button
                                type="button"
                                className={cx("handwritingClose")}
                                onClick={() => setShowHandwritingModal(false)}
                                aria-label="Đóng"
                            >
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </header>

                        <div className={cx("handwritingBody")}>
                            <div className={cx("canvasPanel")}>
                                <canvas
                                    ref={canvasRef}
                                    width={CANVAS_SIZE}
                                    height={CANVAS_SIZE}
                                    className={cx("handwritingCanvas")}
                                    onPointerDown={handleCanvasPointerDown}
                                    onPointerMove={handleCanvasPointerMove}
                                    onPointerUp={handleCanvasPointerUp}
                                    onPointerLeave={handleCanvasPointerUp}
                                    onPointerCancel={handleCanvasPointerUp}
                                />

                                <div className={cx("handwritingActions")}>
                                    <button
                                        type="button"
                                        className={cx("modalBtn", "danger")}
                                        onClick={resetCanvas}
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                        <span>Xóa tất cả</span>
                                    </button>
                                    <button
                                        type="button"
                                        className={cx("modalBtn")}
                                        onClick={handleUndoCanvas}
                                    >
                                        <FontAwesomeIcon icon={faRotateLeft} />
                                        <span>Hoàn tác</span>
                                    </button>
                                    <button
                                        type="button"
                                        className={cx("modalBtn", "primary")}
                                        onClick={handleTranslateHandwriting}
                                        disabled={!selectedHandwritingText.trim() || isRecognizing || isTranslating}
                                    >
                                        <span>{isTranslating ? "Đang dịch..." : "Dịch"}</span>
                                    </button>
                                </div>
                            </div>

                            <aside className={cx("resultPanel")}>
                                <div className={cx("resultTitle")}>
                                    <span>Kết quả gợi ý</span>
                                    <span />
                                </div>

                                {recognizedCandidates.length > 0 ? (
                                    <div className={cx("candidateList")}>
                                        {recognizedCandidates.map((candidate) => (
                                            <button
                                                key={candidate}
                                                type="button"
                                                className={cx("candidate", {
                                                    candidateActive: selectedHandwritingText === candidate,
                                                })}
                                                onClick={() => applyRecognizedText(candidate)}
                                            >
                                                {candidate}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className={cx("emptyResult")}>
                                        {isRecognizing
                                            ? "Đang nhận diện nét vẽ..."
                                            : "Vẽ chữ Nhật để xem gợi ý."}
                                    </p>
                                )}
                            </aside>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}

export default Translate;
