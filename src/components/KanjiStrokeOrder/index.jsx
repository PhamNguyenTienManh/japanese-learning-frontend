import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateRight } from "@fortawesome/free-solid-svg-icons";

const strokeColors = [
    "#2563eb",
    "#ef4444",
    "#111827",
    "#22c55e",
    "#f59e0b",
    "#a855f7",
    "#ec4899",
    "#0ea5e9",
    "#f97316",
    "#334155",
];

function getStrokeStartPoint(pathD) {
    const match = String(pathD || "").match(/[Mm]\s*(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/);
    if (!match) return null;
    return {
        x: Number(match[1]),
        y: Number(match[2]),
    };
}

function parseKanjiStrokeSvg(svgContent) {
    if (!svgContent) return { viewBox: "0 0 109 109", paths: [] };

    const viewBox = svgContent.match(/viewBox="([^"]+)"/)?.[1] || "0 0 109 109";
    const byStrokeId = (path) => /-s\d+\b/.test(path.id || "");
    const parseWithRegex = () => Array.from(svgContent.matchAll(/<path\b[^>]*\bd=(["'])(.*?)\1[^>]*>/g))
        .map((match, index) => ({
            id: `stroke-${index + 1}`,
            d: match[2],
            start: getStrokeStartPoint(match[2]),
        }));

    if (typeof DOMParser !== "undefined") {
        try {
            const doc = new DOMParser().parseFromString(svgContent, "image/svg+xml");
            const hasParseError = doc.querySelector("parsererror");

            if (hasParseError) {
                return { viewBox, paths: parseWithRegex() };
            }

            const parsedPaths = Array.from(doc.querySelectorAll("path"));
            const strokePaths = parsedPaths.filter(byStrokeId);
            const paths = (strokePaths.length ? strokePaths : parsedPaths)
                .map((path) => {
                    const d = path.getAttribute("d");
                    return d
                        ? {
                            id: path.getAttribute("id") || "",
                            d,
                            start: getStrokeStartPoint(d),
                        }
                        : null;
                })
                .filter(Boolean);

            if (paths.length) {
                return { viewBox, paths };
            }
        } catch (err) {
            console.warn("Cannot parse kanji stroke SVG:", err);
        }
    }

    const paths = parseWithRegex();

    return { viewBox, paths };
}

function KanjiStrokeOrder({ stroke, title = "Thứ tự nét", className = "" }) {
    const { viewBox, paths } = useMemo(
        () => parseKanjiStrokeSvg(stroke?.svgContent),
        [stroke?.svgContent]
    );
    const [activeStep, setActiveStep] = useState(0);
    const [playKey, setPlayKey] = useState(0);
    const total = paths.length;

    useEffect(() => {
        if (!total) {
            setActiveStep(0);
            return undefined;
        }

        setActiveStep(1);
        if (total === 1) return undefined;

        let step = 1;
        const timer = setInterval(() => {
            step += 1;
            setActiveStep(step);

            if (step >= total) {
                clearInterval(timer);
            }
        }, 650);

        return () => clearInterval(timer);
    }, [total, stroke?.svgContent, playKey]);

    if (!stroke?.svgContent || !total) {
        return (
            <section className={`rounded-2xl border border-border bg-white p-3.5 shadow-[0_4px_16px_rgba(15,23,42,0.04)] ${className}`}>
                <h3 className="m-0 text-base font-bold text-text-high">{title}</h3>
                <p className="mt-2 mb-0 text-[13px] text-grey">Chưa có dữ liệu thứ tự nét.</p>
            </section>
        );
    }

    const safeStep = Math.min(Math.max(activeStep, 0), total);

    return (
        <section className={`rounded-2xl border border-border bg-white p-3.5 shadow-[0_4px_16px_rgba(15,23,42,0.04)] ${className}`}>
            <style>{`
                @keyframes kanjiStrokeDraw {
                    from { stroke-dashoffset: 180; }
                    to { stroke-dashoffset: 0; }
                }
            `}</style>
            <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                    <h3 className="m-0 text-base font-bold text-text-high">{title}</h3>
                    <p className="mt-1 mb-0 text-[13px] font-bold text-grey">
                        {safeStep ? `Nét ${safeStep} / ${total}` : "Đang chuẩn bị..."}
                    </p>
                </div>
                <button
                    type="button"
                    className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-[#dce4ea] bg-white text-[#5b7575] transition-colors duration-150 hover:border-primary-low hover:bg-[#f7fffc] hover:text-primary"
                    onClick={() => setPlayKey((key) => key + 1)}
                    aria-label="Phát lại thứ tự nét"
                >
                    <FontAwesomeIcon icon={faRotateRight} />
                </button>
            </div>

            <div className="flex justify-center rounded-2xl border border-[#e1e8ee] bg-[#f8fbfc] p-3">
                <div className="aspect-square w-[min(260px,100%)] overflow-hidden rounded-xl border border-[#dce4ea] bg-white shadow-[0_8px_18px_rgba(15,23,42,0.07)] max-[720px]:max-w-[220px]">
                    <svg className="block h-full w-full" viewBox={viewBox} aria-label="Thứ tự nét Hán tự">
                        <rect fill="#fff" x="0" y="0" width="109" height="109" />
                        <line stroke="#d5e1ef" strokeWidth="0.8" x1="54.5" y1="0" x2="54.5" y2="109" />
                        <line stroke="#d5e1ef" strokeWidth="0.8" x1="0" y1="54.5" x2="109" y2="54.5" />
                        <line stroke="#d5e1ef" strokeWidth="0.8" strokeDasharray="3 2" x1="0" y1="0" x2="109" y2="109" />
                        <line stroke="#d5e1ef" strokeWidth="0.8" strokeDasharray="3 2" x1="109" y1="0" x2="0" y2="109" />

                        {paths.map((path, index) => (
                            <path
                                key={`ghost-${path.id || index}`}
                                d={path.d}
                                fill="none"
                                stroke="#cbd5e1"
                                strokeWidth="3.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                opacity="0.28"
                            />
                        ))}

                        {paths.slice(0, safeStep).map((path, index) => (
                            <path
                                key={`active-${playKey}-${path.id || index}`}
                                d={path.d}
                                fill="none"
                                stroke={strokeColors[index % strokeColors.length]}
                                strokeWidth="4.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={index === safeStep - 1
                                    ? {
                                        strokeDasharray: 180,
                                        strokeDashoffset: 180,
                                        animation: "kanjiStrokeDraw 0.55s ease-out forwards",
                                    }
                                    : undefined}
                            />
                        ))}

                        {paths.slice(0, safeStep).map((path, index) => path.start && (
                            <text
                                key={`number-${playKey}-${path.id || index}`}
                                x={path.start.x}
                                y={path.start.y}
                                fill={strokeColors[index % strokeColors.length]}
                                stroke="#fff"
                                strokeWidth="2.4"
                                paintOrder="stroke"
                                dominantBaseline="central"
                                fontFamily="Arial, sans-serif"
                                fontSize="8"
                                fontWeight="800"
                            >
                                {index + 1}
                            </text>
                        ))}
                    </svg>
                </div>
            </div>
        </section>
    );
}

export default KanjiStrokeOrder;
