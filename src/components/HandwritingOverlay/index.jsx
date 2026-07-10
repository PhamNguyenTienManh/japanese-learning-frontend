import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faTrash,
    faRotateLeft,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";

import { useToast } from "~/context/ToastContext";
import { recognizeJapaneseHandwriting } from "~/services/traslate";

const HF_RECOGNIZE_URL = "https://minhnguyenminj-kanjidetector.hf.space/recognize";

const CANVAS_SIZE = 360;

const modalButtonClass =
    "inline-flex min-h-[38px] cursor-pointer items-center justify-center gap-2 rounded-[10px] border-[1.5px] border-[#e3eaf0] bg-white px-3 text-sm font-bold text-[#5b7575] transition-all duration-150 hover:not-disabled:border-primary-low hover:not-disabled:bg-[#f6fafc] hover:not-disabled:text-primary disabled:cursor-not-allowed disabled:opacity-60 max-md:min-w-[130px] max-md:flex-1";

function HandwritingOverlay({
    open,
    onClose,
    onApply,
    title = "Nhận dạng nét vẽ",
    primaryLabel = "Chọn",
    primaryLoading = false,
    loadingLabel = "Đang xử lý...",
}) {
    const [isRecognizing, setIsRecognizing] = useState(false);
    const [recognizedCandidates, setRecognizedCandidates] = useState([]);
    const [selectedText, setSelectedText] = useState("");
    const [engine, setEngine] = useState("google"); // "google" | "model"
    const canvasRef = useRef(null);
    const drawingRef = useRef(false);
    const lastPointRef = useRef(null);
    const strokesRef = useRef([]);
    const activeStrokeRef = useRef(null);
    const strokeStartTimeRef = useRef(0);
    const recognitionTimerRef = useRef(null);
    const { addToast } = useToast();
    const [searchParams] = useSearchParams();
    const isDebug = searchParams.get("debug") === "1";

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
        setSelectedText("");
        if (recognitionTimerRef.current) {
            clearTimeout(recognitionTimerRef.current);
            recognitionTimerRef.current = null;
        }
    }, [drawCanvasGuide]);

    useEffect(() => {
        if (open) {
            requestAnimationFrame(resetCanvas);
        }
    }, [open, resetCanvas]);

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
        ctx.lineWidth = 5;
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

    // --- Nhận diện bằng model training (HuggingFace) ---
    const recognizeWithModel = useCallback(async ({ notifyEmpty = false } = {}) => {
        const canvas = canvasRef.current;
        if (!canvas) return "";

        try {
            setIsRecognizing(true);
            const dataUrl = canvas.toDataURL("image/png");
            const response = await fetch(HF_RECOGNIZE_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: dataUrl }),
            });

            if (!response.ok) throw new Error(`HF API error: ${response.status}`);
            const results = await response.json();
            // results = [{ kanji, confidence }, ...]
            const candidates = Array.isArray(results)
                ? results.map((r) => r.kanji).filter(Boolean)
                : [];
            const text = candidates[0] || "";

            setRecognizedCandidates(candidates);
            setSelectedText((current) =>
                current && candidates.includes(current) ? current : ""
            );

            if (!text && notifyEmpty) {
                addToast("Model không nhận diện được chữ viết tay", "warning");
            }
            return text;
        } catch (error) {
            console.error("Model recognition failed:", error);
            if (notifyEmpty) addToast("Lỗi nhận diện từ Model", "error");
            return "";
        } finally {
            setIsRecognizing(false);
        }
    }, [addToast]);

    // --- Nhận diện bằng Google API (mặc định) ---
    const recognizeWithGoogle = useCallback(async ({ notifyEmpty = false } = {}) => {
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
            setSelectedText((current) =>
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

    const recognizeHandwritingFromCanvas = useCallback(async (opts) => {
        if (engine === "model") return recognizeWithModel(opts);
        return recognizeWithGoogle(opts);
    }, [engine, recognizeWithModel, recognizeWithGoogle]);

    const scheduleHandwritingRecognition = useCallback(() => {
        if (recognitionTimerRef.current) {
            clearTimeout(recognitionTimerRef.current);
        }

        recognitionTimerRef.current = setTimeout(() => {
            recognizeHandwritingFromCanvas();
        }, 650);
    }, [recognizeHandwritingFromCanvas]);

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
        setSelectedText("");

        if (strokesRef.current.length) {
            scheduleHandwritingRecognition();
        }
    };

    const handleApply = () => {
        const value = selectedText.trim();
        if (!value) {
            addToast("Vui lòng chọn một gợi ý trước", "info");
            return;
        }

        onApply?.(value);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[1000001] flex items-center justify-center bg-[rgba(15,23,42,0.52)] p-5 backdrop-blur-[3px] max-md:items-start max-md:p-3">
            <section className="flex max-h-[calc(100vh-40px)] w-[min(750px,calc(100vw-40px))] flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.32)] max-md:max-h-[calc(100vh-24px)] max-md:w-[calc(100vw-24px)] max-md:rounded-[18px]">
                <header className="flex min-h-[58px] items-center justify-between gap-4 border-b-[1.5px] border-[#e3eaf0] px-4 pb-2.5 pt-3 pl-5">
                    <h2 className="m-0 text-xl font-extrabold text-[#0f2a2a]">{title}</h2>
                    <div className="flex items-center gap-3">
                        {isDebug && (
                            <select
                                value={engine}
                                onChange={(e) => setEngine(e.target.value)}
                                className="h-9 cursor-pointer rounded-lg border-[1.5px] border-[#e3eaf0] bg-white px-2.5 text-sm font-semibold text-[#0f2a2a] outline-none transition-all duration-150 hover:border-[#00879a] focus:border-[#00879a] focus:ring-2 focus:ring-[#00879a]/20"
                            >
                                <option value="google">Google API</option>
                                <option value="model">Model Training</option>
                            </select>
                        )}
                        <button
                            type="button"
                            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-[#e3eaf0] bg-slate-50 text-[#5b7575] transition-all duration-150 hover:bg-[#f6fafc] hover:text-[#0f2a2a]"
                            onClick={onClose}
                            aria-label="Đóng"
                        >
                            <FontAwesomeIcon icon={faXmark} />
                        </button>
                    </div>
                </header>

                <div className="grid min-h-0 grid-cols-[minmax(360px,1fr)_minmax(250px,0.8fr)] overflow-hidden max-md:grid-cols-1 max-md:overflow-auto">
                    <div className="flex min-w-0 flex-col gap-3 border-r-[1.5px] border-[#e3eaf0] p-4 max-md:border-r-0 max-md:border-b-[1.5px] max-md:p-[18px]">
                        <canvas
                            ref={canvasRef}
                            width={CANVAS_SIZE}
                            height={CANVAS_SIZE}
                            className="aspect-square w-full max-w-[360px] cursor-crosshair self-center rounded-xl border-[1.5px] border-[#d8e3e8] bg-white touch-none"
                            onPointerDown={handleCanvasPointerDown}
                            onPointerMove={handleCanvasPointerMove}
                            onPointerUp={handleCanvasPointerUp}
                            onPointerLeave={handleCanvasPointerUp}
                            onPointerCancel={handleCanvasPointerUp}
                        />

                        <div className="flex flex-wrap justify-center gap-2">
                            <button
                                type="button"
                                className={`${modalButtonClass} text-red-600 hover:not-disabled:border-red-200 hover:not-disabled:bg-red-50 hover:not-disabled:text-red-700`}
                                onClick={resetCanvas}
                            >
                                <FontAwesomeIcon icon={faTrash} />
                                <span>Xóa tất cả</span>
                            </button>
                            <button
                                type="button"
                                className={modalButtonClass}
                                onClick={handleUndoCanvas}
                            >
                                <FontAwesomeIcon icon={faRotateLeft} />
                                <span>Hoàn tác</span>
                            </button>
                            <button
                                type="button"
                                className="inline-flex min-h-[38px] min-w-[132px] cursor-pointer items-center justify-center gap-2 rounded-[10px] border-[1.5px] border-transparent bg-primary px-3 text-sm font-bold text-white shadow-[0_3px_0_var(--primary-hover)] transition-all duration-150 hover:not-disabled:-translate-y-px hover:not-disabled:bg-primary-hover hover:not-disabled:text-white hover:not-disabled:shadow-[0_4px_0_#006170] active:not-disabled:translate-y-0.5 active:not-disabled:shadow-[0_1px_0_#006170] disabled:cursor-not-allowed disabled:bg-[#b8d8e0] disabled:text-white/90 disabled:opacity-75 disabled:shadow-none max-md:min-w-[130px] max-md:flex-1"
                                onClick={handleApply}
                                disabled={!selectedText.trim() || isRecognizing || primaryLoading}
                            >
                                <span>{primaryLoading ? loadingLabel : primaryLabel}</span>
                            </button>
                        </div>
                    </div>

                    <aside className="min-w-0 px-4 py-[18px] max-md:p-[18px]">
                        <div className="mb-4 grid grid-cols-[auto_1fr] items-center gap-3.5 text-[15px] font-extrabold text-[#0f2a2a]">
                            <span>Kết quả gợi ý</span>
                            <span className="h-[1.5px] bg-[#e3eaf0]" />
                        </div>

                        {recognizedCandidates.length > 0 ? (
                            <div className="flex flex-wrap gap-3">
                                {recognizedCandidates.map((candidate) => {
                                    const isActive = selectedText === candidate;

                                    return (
                                        <button
                                            key={candidate}
                                            type="button"
                                            className={`min-h-11 min-w-[46px] cursor-pointer rounded-[9px] border-2 bg-white px-3.5 py-2 font-['Noto_Sans_JP','Yu_Gothic',sans-serif] text-2xl leading-tight text-gray-900 shadow-[inset_0_0_0_1px_rgba(15,42,42,0.04)] transition-all duration-150 hover:border-primary-low hover:bg-[#f6fafc] hover:text-primary ${isActive
                                                ? "border-primary bg-[#f6fafc] text-primary shadow-[0_0_0_3px_rgba(0,135,154,0.1)]"
                                                : "border-[#cfdde3]"
                                                }`}
                                            onClick={() => setSelectedText(candidate)}
                                        >
                                            {candidate}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="m-0 text-sm leading-relaxed text-[#5b7575]">
                                {isRecognizing
                                    ? "Đang nhận diện nét vẽ..."
                                    : "Vẽ chữ Nhật để xem gợi ý."}
                            </p>
                        )}
                    </aside>
                </div>
            </section>
        </div>
    );
}

export default HandwritingOverlay;
