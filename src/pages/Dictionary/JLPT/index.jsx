import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus,
    faVolumeHigh,
    faChevronLeft,
    faChevronRight,
    faXmark,
    faRotateRight,
} from "@fortawesome/free-solid-svg-icons";

import styles from "./JLPT.module.scss";
import {
    getJlptWords,
    getJlptKanji,
    getJlptGrammar,
    getJlptWordDetail,
    getJlptGrammarDetail,
    getJlptKanjiDetail,
} from "~/services/jlptService";
import notebookService from "~/services/notebookService";
import AuthRequiredModal from "~/components/AuthRequiredModal";
import { useNavigate } from "react-router-dom";
import { useAuth } from "~/context/AuthContext";
import { useToast } from "~/context/ToastContext";
import handlePlayAudio from "~/services/handlePlayAudio";
import PdfModal from "~/components/PdfModal/PdfModal";


const cx = classNames.bind(styles);

const vocabularyTypes = ["Từ vựng", "Ngữ pháp", "Hán tự"];
const jlptLevels = ["N5", "N4", "N3", "N2", "N1"];

const initialDisplayOptions = {
    "Từ vựng": [
        { label: "Từ vựng", checked: true },
        { label: "Phiên âm", checked: true },
        { label: "Nghĩa", checked: true },
    ],
    "Ngữ pháp": [
        { label: "Từ vựng", checked: true },
        { label: "Nghĩa", checked: true },
    ],
    "Hán tự": [
        { label: "Từ vựng", checked: true },
        { label: "Nghĩa", checked: true },
    ],
};

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

    if (typeof DOMParser !== "undefined") {
        try {
            const doc = new DOMParser().parseFromString(svgContent, "image/svg+xml");
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

            return { viewBox, paths };
        } catch (err) {
            console.warn("Cannot parse kanji stroke SVG:", err);
        }
    }

    const paths = Array.from(svgContent.matchAll(/<path\b[^>]*\bd="([^"]+)"[^>]*>/g))
        .map((match, index) => ({
            id: `stroke-${index + 1}`,
            d: match[1],
            start: getStrokeStartPoint(match[1]),
        }));

    return { viewBox, paths };
}


function JLPT() {
    const [selectedType, setSelectedType] = useState("Từ vựng");
    const [selectedLevel, setSelectedLevel] = useState("N5");
    const [displaySettings, setDisplaySettings] = useState(initialDisplayOptions);
    const [currentPage, setCurrentPage] = useState(1);
    const [data, setData] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [notebooks, setNotebooks] = useState([]);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [pdfUrl, setPdfUrl] = useState("");
    const [pdfLoading, setPdfLoading] = useState(false);

    const navigate = useNavigate();
    const { isLoggedIn } = useAuth();
    const { addToast } = useToast();
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailItem, setDetailItem] = useState(null);
    const [detailType, setDetailType] = useState("Từ vựng");
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState(null);
    const [showNotebookPicker, setShowNotebookPicker] = useState(false);
    const itemsPerPage = selectedType === "Hán tự" ? 18 : 10;

    useEffect(() => {
        fetchNotebooks();
    }, []);

    const getFlashcardLink = () => {
        const typeParam = selectedType === "Từ vựng" ? "word" :
            selectedType === "Ngữ pháp" ? "grammar" : "kanji";
        return `flashcards?type=${typeParam}&level=${selectedLevel}&source=jlpt&page=${currentPage}&limit=${itemsPerPage}`;
    };

    const handleFlashcardClick = () => {
        const href = getFlashcardLink();
        if (!isLoggedIn) {
            setShowAuthModal(true);
            return;
        }

        window.location.href = "/jlpt/" + href;
    };

    const fetchNotebooks = async () => {
        try {
            const data = await notebookService.getNotebooks();
            setNotebooks(data);
        } catch (err) {
            console.log('Không thể tải danh sách sổ tay');
        }
    };

    const formatPhonetic = (value) => {
        if (Array.isArray(value)) return value.filter(Boolean).join(" ");
        return value || "";
    };

    const formatMeanings = (value) => {
        if (Array.isArray(value)) {
            return value
                .map((item) => item?.meaning || item)
                .filter(Boolean)
                .join(", ");
        }
        return value || "";
    };

    const getKanjiReading = (item) => {
        return item?.reading || [item?.kun, item?.on].filter(Boolean).join(" ");
    };

    const getDetailLabel = (item, type = selectedType) => {
        if (!item) return "";
        if (type === "Từ vựng") return item.word;
        if (type === "Ngữ pháp") return item.title;
        return item.kanji;
    };

    const handleOpenDetail = async (item) => {
        const type = selectedType;
        setDetailType(type);
        setDetailItem(item);
        setDetailOpen(true);
        setDetailLoading(true);
        setDetailError(null);
        setShowNotebookPicker(false);

        try {
            let response;
            if (type === "Từ vựng") {
                response = await getJlptWordDetail(item.word);
            } else if (type === "Ngữ pháp") {
                response = await getJlptGrammarDetail(item.title);
            } else {
                response = await getJlptKanjiDetail(item.kanji);
            }

            setDetailItem(response?.data || response);
        } catch (err) {
            console.error("Failed to fetch JLPT detail:", err);
            setDetailError("Không thể tải chi tiết. Vui lòng thử lại.");
        } finally {
            setDetailLoading(false);
        }
    };

    const handleCloseDetail = () => {
        setDetailOpen(false);
        setDetailItem(null);
        setDetailError(null);
        setShowNotebookPicker(false);
    };

    const handleAddWord = async (newWord, type, selectedNotebook) => {
        try {
            setLoading(true);
            let wordData;
            if (type === "Từ vựng") {
                wordData = {
                    name: newWord.word,
                    phonetic: formatPhonetic(newWord.phonetic),
                    mean: formatMeanings(newWord.meanings),
                    notes: "",
                    type: "word",
                };
            }
            else if (type === "Ngữ pháp") {
                wordData = {
                    name: newWord.title,
                    mean: newWord.mean,
                    notes: "",
                    type: "grammar",
                }
            } else {
                wordData = {
                    name: newWord.kanji,
                    phonetic: getKanjiReading(newWord),
                    mean: newWord.mean,
                    notes: "",
                    type: "kanji",
                }
            }

            const response = await notebookService.addWord(
                selectedNotebook._id,
                wordData
            );
            if (response.success === true) {
                setShowNotebookPicker(false);
                addToast('Đã thêm vào sổ tay thành công!', 'success');
            } else {
                addToast(response.message, 'error');
            }
        } catch (err) {
            console.error('Failed to add word:', err);
            addToast(err.message || 'Không thể thêm từ. Vui lòng thử lại.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handlePreviewPdf = async () => {
        if (selectedType === "Ngữ pháp") {
            addToast('Bạn không thể download file Ngữ pháp', 'error');
            return;
        }

        try {
            setPdfLoading(true);
            setShowPdfModal(true);

            const typeParam =
                selectedType === "Từ vựng" ? "word" :
                    selectedType === "Hán tự" ? "kanji" :
                        "word";

            const url = `${process.env.REACT_APP_BASE_URL_API}/pdf/jlpt?page=${currentPage}&limit=${itemsPerPage}&level=${selectedLevel}&type=${typeParam}`;

            const response = await fetch(url);
            const blob = await response.blob();

            const pdfPreviewUrl = URL.createObjectURL(blob);
            setPdfUrl(pdfPreviewUrl);
        } catch (err) {
            console.error(err);
            setShowPdfModal(false);
            addToast('Không thể tải PDF. Vui lòng thử lại.', 'error');
        } finally {
            setPdfLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedType, selectedLevel, currentPage]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            let response;

            if (selectedType === "Từ vựng") {
                response = await getJlptWords(currentPage, itemsPerPage, selectedLevel);
            } else if (selectedType === "Ngữ pháp") {
                response = await getJlptGrammar(currentPage, itemsPerPage, selectedLevel);
            } else if (selectedType === "Hán tự") {
                response = await getJlptKanji(currentPage, itemsPerPage, selectedLevel);
            }

            if (response?.success) {
                setData(response.data.data || []);
                setTotalPages(response.data.totalPages || 0);
            }
        } catch (err) {
            setError(err.message);
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleDisplayOption = (label) => {
        setDisplaySettings((prev) => ({
            ...prev,
            [selectedType]: prev[selectedType].map((opt) =>
                opt.label === label ? { ...opt, checked: !opt.checked } : opt
            ),
        }));
    };

    const isShown = (label) => {
        const options = displaySettings[selectedType];
        return options?.find((o) => o.label === label)?.checked;
    };

    const currentDisplayOptions = displaySettings[selectedType] || [];

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleTypeChange = (type) => {
        setSelectedType(type);
        setCurrentPage(1);
    };

    const handleLevelChange = (level) => {
        setSelectedLevel(level);
        setCurrentPage(1);
    };

    const getPageNumbers = () => {
        const pages = [];

        if (totalPages <= 6) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);

            if (currentPage <= 3) {
                for (let i = 2; i <= 4; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    const renderCard = (item, index) => {
        if (selectedType === "Từ vựng") {
            return (
                <div
                    key={index}
                    className={cx("card", "clickableCard")}
                    onClick={() => handleOpenDetail(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") handleOpenDetail(item);
                    }}
                >
                    <div className={cx("cardTop")}>
                        <button
                            type="button"
                            className={cx("speakerBtn")}
                            onClick={(e) => {
                                e.stopPropagation();
                                handlePlayAudio(item.phonetic);
                            }}
                            aria-label="Nghe phát âm"
                        >
                            <FontAwesomeIcon icon={faVolumeHigh} />
                        </button>
                    </div>
                    {isShown("Từ vựng") && (
                        <div className={cx("kanji")}>{item.word}</div>
                    )}
                    {isShown("Phiên âm") && (
                        <div className={cx("hiragana")}>{item.phonetic}</div>
                    )}
                    {isShown("Nghĩa") && (
                        <div className={cx("meaning")}>{item.meanings}</div>
                    )}
                </div>
            );
        } else if (selectedType === "Ngữ pháp") {
            return (
                <div
                    key={item._id}
                    className={cx("card", "grammarCard", "clickableCard")}
                    onClick={() => handleOpenDetail(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") handleOpenDetail(item);
                    }}
                >
                    <div className={cx("grammarBody")}>
                        {isShown("Từ vựng") && (
                            <div className={cx("grammarPattern")}>{item.title}</div>
                        )}
                        {isShown("Nghĩa") && (
                            <div className={cx("grammarMeaning")}>{item.mean}</div>
                        )}
                    </div>
                </div>
            );
        } else if (selectedType === "Hán tự") {
            return (
                <div
                    key={item._id}
                    className={cx("card", "kanjiCard", "clickableCard")}
                    onClick={() => handleOpenDetail(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") handleOpenDetail(item);
                    }}
                >
                    {isShown("Từ vựng") && (
                        <div className={cx("kanji")}>{item.kanji}</div>
                    )}
                    {isShown("Nghĩa") && (
                        <div className={cx("meaning")}>{item.mean}</div>
                    )}
                </div>
            );
        }
    };

    const gridClass = cx("grid", {
        kanjiGrid: selectedType === "Hán tự",
        grammarGrid: selectedType === "Ngữ pháp",
    });

    return (
        <div className={cx("wrapper")}>
            <div className={cx("blob1")} />
            <div className={cx("blob2")} />

            <div className={cx("inner")}>
                {/* Hero */}
                <div className={cx("hero")}>
                    <div className={cx("heroLeft")}>
                        <div className={cx("heroBadge")}>{selectedLevel}</div>
                        <div>
                            <h1 className={cx("title")}>Học JLPT</h1>
                            <div className={cx("subtitle")}>
                                <span className={cx("chip")}>{selectedType}</span>
                                <span className={cx("dot")}>·</span>
                                <span>Cấp độ {selectedLevel}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={cx("layout")}>
                    <aside className={cx("sidebar")}>
                        <div className={cx("sideTitle")}>Loại từ</div>
                        <div className={cx("radioGroup")}>
                            {vocabularyTypes.map((type) => (
                                <label
                                    key={type}
                                    className={cx("radioRow", {
                                        radioActive: selectedType === type,
                                    })}
                                >
                                    <input
                                        type="radio"
                                        name="vocab-type"
                                        value={type}
                                        checked={selectedType === type}
                                        onChange={(e) => handleTypeChange(e.target.value)}
                                        className={cx("radioInput")}
                                    />
                                    <span className={cx("radioDot")} />
                                    <span>{type}</span>
                                </label>
                            ))}
                        </div>

                        <div className={cx("divider")} />

                        <div className={cx("sideTitle")}>Cấp độ</div>
                        <div className={cx("radioGroup")}>
                            {jlptLevels.map((level) => (
                                <label
                                    key={level}
                                    className={cx("radioRow", {
                                        radioActive: selectedLevel === level,
                                    })}
                                >
                                    <input
                                        type="radio"
                                        name="level"
                                        value={level}
                                        checked={selectedLevel === level}
                                        onChange={(e) => handleLevelChange(e.target.value)}
                                        className={cx("radioInput")}
                                    />
                                    <span className={cx("radioDot")} />
                                    <span>{level}</span>
                                </label>
                            ))}
                        </div>
                    </aside>

                    <div className={cx("content")}>
                        <div className={cx("toolbar")}>
                            <div className={cx("displayOptions")}>
                                {currentDisplayOptions.map((option) => (
                                    <label
                                        key={option.label}
                                        className={cx("displayOption", {
                                            displayOptionChecked: option.checked,
                                        })}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={option.checked}
                                            onChange={() =>
                                                handleToggleDisplayOption(option.label)
                                            }
                                            className={cx("checkbox")}
                                        />
                                        <span>{option.label}</span>
                                    </label>
                                ))}
                            </div>

                            <div className={cx("iconBtns")}>
                                <button
                                    type="button"
                                    className={cx("toolbarBtn", "flashcardBtn")}
                                    onClick={handleFlashcardClick}
                                >
                                    FlashCard
                                </button>
                                <button
                                    type="button"
                                    className={cx("toolbarBtn", "pdfBtn")}
                                    onClick={handlePreviewPdf}
                                    aria-label="Tải PDF"
                                >
                                    Tải file viết tay
                                </button>
                            </div>
                        </div>

                        {loading && (
                            <div className={cx("loading")}>Đang tải dữ liệu...</div>
                        )}

                        {error && (
                            <div className={cx("error")}>Lỗi: {error}</div>
                        )}

                        {!loading && !error && (
                            <>
                                {data.length > 0 ? (
                                    <div className={gridClass}>
                                        {data.map((item, index) => renderCard(item, index))}
                                    </div>
                                ) : (
                                    <div className={cx("noData")}>Không có dữ liệu</div>
                                )}
                            </>
                        )}

                        {!loading && !error && totalPages > 1 && (
                            <div className={cx("pagination")}>
                                <button
                                    className={cx("pagBtn", {
                                        pagDisabled: currentPage === 1,
                                    })}
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    aria-label="Trang trước"
                                >
                                    <FontAwesomeIcon icon={faChevronLeft} />
                                </button>

                                {getPageNumbers().map((page, index) =>
                                    page === "..." ? (
                                        <span
                                            key={`ellipsis-${index}`}
                                            className={cx("pagEllipsis")}
                                        >
                                            ...
                                        </span>
                                    ) : (
                                        <button
                                            key={page}
                                            className={cx("pagBtn", {
                                                pagActive: currentPage === page,
                                            })}
                                            onClick={() => handlePageChange(page)}
                                        >
                                            {page}
                                        </button>
                                    )
                                )}

                                <button
                                    className={cx("pagBtn", {
                                        pagDisabled: currentPage === totalPages,
                                    })}
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    aria-label="Trang sau"
                                >
                                    <FontAwesomeIcon icon={faChevronRight} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <JLPTDetailModal
                    show={detailOpen}
                    item={detailItem}
                    type={detailType}
                    loading={detailLoading}
                    error={detailError}
                    notebooks={notebooks}
                    showNotebookPicker={showNotebookPicker}
                    onToggleNotebookPicker={() => setShowNotebookPicker((value) => !value)}
                    onClose={handleCloseDetail}
                    onPlayAudio={handlePlayAudio}
                    onAddToNotebook={(note) => handleAddWord(detailItem, detailType, note)}
                    formatPhonetic={formatPhonetic}
                    formatMeanings={formatMeanings}
                    getDetailLabel={getDetailLabel}
                />

                {/* Modal hiển thị bản xem trước file Pdf */}
                <PdfModal
                    show={showPdfModal}
                    onClose={() => {
                        setShowPdfModal(false);
                        setPdfUrl("");
                    }}
                    pdfUrl={pdfUrl}
                    loading={pdfLoading}
                    title={`Xem trước PDF: ${selectedType} ${selectedLevel} — Trang ${currentPage}`}
                />

                {/* Auth required modal */}
                <AuthRequiredModal
                    isOpen={showAuthModal}
                    onClose={() => setShowAuthModal(false)}
                    onConfirm={() => {
                        setShowAuthModal(false);
                        navigate("/login");
                    }}
                />
            </div>
        </div>
    );
}

function KanjiStrokeOrder({ stroke }) {
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
            <section className={cx("detailSideCard", "strokeSideCard")}>
                <h3>Thứ tự nét</h3>
                <p className={cx("mutedText")}>Chưa có dữ liệu thứ tự nét.</p>
            </section>
        );
    }

    const safeStep = Math.min(Math.max(activeStep, 0), total);

    return (
        <section className={cx("detailSideCard", "strokeSideCard")}>
            <div className={cx("strokeHeader")}>
                <div>
                    <h3>Thứ tự nét</h3>
                    <p>{safeStep ? `Nét ${safeStep} / ${total}` : "Đang chuẩn bị..."}</p>
                </div>
                <button
                    type="button"
                    className={cx("strokeReplayBtn")}
                    onClick={() => setPlayKey((key) => key + 1)}
                    aria-label="Phát lại thứ tự nét"
                >
                    <FontAwesomeIcon icon={faRotateRight} />
                </button>
            </div>

            <div className={cx("strokeOrderPanel")}>
                <div className={cx("strokeCanvasWrap")}>
                    <svg className={cx("strokeCanvas")} viewBox={viewBox} aria-label="Thứ tự nét Hán tự">
                        <rect className={cx("strokeGridBackground")} x="0" y="0" width="109" height="109" />
                        <line className={cx("strokeGridLine")} x1="54.5" y1="0" x2="54.5" y2="109" />
                        <line className={cx("strokeGridLine")} x1="0" y1="54.5" x2="109" y2="54.5" />
                        <line className={cx("strokeGridDash")} x1="0" y1="0" x2="109" y2="109" />
                        <line className={cx("strokeGridDash")} x1="109" y1="0" x2="0" y2="109" />

                        {paths.map((path, index) => (
                            <path
                                key={`ghost-${path.id || index}`}
                                className={cx("strokePathGhost")}
                                d={path.d}
                            />
                        ))}

                        {paths.slice(0, safeStep).map((path, index) => (
                            <path
                                key={`active-${playKey}-${path.id || index}`}
                                className={cx("strokePathActive", {
                                    strokePathCurrent: index === safeStep - 1,
                                })}
                                d={path.d}
                                style={{
                                    stroke: strokeColors[index % strokeColors.length],
                                }}
                            />
                        ))}

                        {paths.slice(0, safeStep).map((path, index) => path.start && (
                            <text
                                key={`number-${playKey}-${path.id || index}`}
                                className={cx("strokeNumber")}
                                x={path.start.x}
                                y={path.start.y}
                                style={{
                                    fill: strokeColors[index % strokeColors.length],
                                }}
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

function JLPTDetailModal({
    show,
    item,
    type,
    loading,
    error,
    notebooks,
    showNotebookPicker,
    onToggleNotebookPicker,
    onClose,
    onPlayAudio,
    onAddToNotebook,
    formatPhonetic,
    formatMeanings,
    getDetailLabel,
}) {
    useEffect(() => {
        if (!show) return undefined;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [show]);

    if (!show) return null;

    const title = getDetailLabel(item, type) || "...";
    const meanings = Array.isArray(item?.meanings)
        ? item.meanings
        : formatMeanings(item?.meanings)
            .split(",")
            .map((meaning) => ({ meaning: meaning.trim(), examples: [] }))
            .filter((entry) => entry.meaning);
    const usages = Array.isArray(item?.usages) ? item.usages : [];
    const examples = Array.isArray(item?.examples) ? item.examples : [];
    const detailLines = String(item?.detail || "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    const normalizeReadingValue = (value) => {
        if (Array.isArray(value)) return value.filter(Boolean).join("、 ");
        return String(value || "").trim();
    };
    const kanjiKunReading = normalizeReadingValue(item?.kun);
    const kanjiOnReading = normalizeReadingValue(item?.on);

    const renderPrimaryContent = () => {
        if (loading) {
            return <div className={cx("detailState")}>Đang tải chi tiết...</div>;
        }

        if (error) {
            return <div className={cx("detailState", "detailError")}>{error}</div>;
        }

        if (!item) {
            return <div className={cx("detailState")}>Không có dữ liệu chi tiết</div>;
        }

        if (type === "Từ vựng") {
            return (
                <>
                    <section className={cx("detailSection")}>
                        <div className={cx("detailSectionTitle")}>Nghĩa và ví dụ</div>
                        {meanings.length ? meanings.map((meaning, index) => (
                            <div key={`${meaning.meaning}-${index}`} className={cx("meaningBlock")}>
                                <div className={cx("meaningLine")}>{meaning.meaning}</div>
                                {(meaning.examples || []).map((example, exampleIndex) => (
                                    <div key={`${example.jp}-${exampleIndex}`} className={cx("exampleBlock")}>
                                        {example.jp && <p className={cx("jpText")}>{example.jp}</p>}
                                        {example.vi && <p className={cx("viText")}>{example.vi}</p>}
                                    </div>
                                ))}
                            </div>
                        )) : <p className={cx("mutedText")}>Chưa có nghĩa chi tiết.</p>}
                    </section>
                </>
            );
        }

        if (type === "Ngữ pháp") {
            return (
                <section className={cx("detailSection")}>
                    <div className={cx("detailSectionTitle")}>Cách dùng</div>
                    <div className={cx("grammarSummary")}>{item.mean}</div>
                    {usages.length ? usages.map((usage, index) => (
                        <div key={`${usage.synopsis || usage.explain}-${index}`} className={cx("usageBlock")}>
                            {usage.synopsis && <div className={cx("usageFormula")}>{usage.synopsis}</div>}
                            {usage.explain && <p className={cx("usageExplain")}>{usage.explain}</p>}
                            {(usage.examples || []).map((example, exampleIndex) => (
                                <div key={`${example.content}-${exampleIndex}`} className={cx("exampleBlock")}>
                                    {example.content && <p className={cx("jpText")}>{example.content}</p>}
                                    {example.transcription && <p className={cx("readingText")}>{example.transcription}</p>}
                                    {example.meaning && <p className={cx("viText")}>{example.meaning}</p>}
                                </div>
                            ))}
                        </div>
                    )) : <p className={cx("mutedText")}>Chưa có ví dụ/cách dùng chi tiết.</p>}
                </section>
            );
        }

        return (
            <>
                <section className={cx("detailSection")}>
                    <div className={cx("detailSectionTitle")}>Thông tin Hán tự</div>
                    {detailLines.length ? detailLines.map((line, index) => (
                        <p key={`${line}-${index}`} className={cx("detailLine")}>{line}</p>
                    )) : <p className={cx("mutedText")}>Chưa có mô tả chi tiết.</p>}
                </section>

                <section className={cx("detailSection")}>
                    <div className={cx("detailSectionTitle")}>Ví dụ</div>
                    {examples.length ? examples.map((example, index) => (
                        <div key={`${example.w || example.p}-${index}`} className={cx("kanjiExampleItem")}>
                            <div className={cx("kanjiExampleTitle")}>
                                <span className={cx("kanjiExampleBullet")} />
                                <span>{example.h || example.m || example.w}</span>
                            </div>
                            <div className={cx("kanjiExampleBody")}>
                                {example.w && (
                                    <div className={cx("kanjiExampleJapanese")}>
                                        <span>{example.w}</span>
                                        <button
                                            type="button"
                                            className={cx("kanjiExampleAudio")}
                                            onClick={() => onPlayAudio(example.p || example.w)}
                                            aria-label="Nghe ví dụ"
                                        >
                                            <FontAwesomeIcon icon={faVolumeHigh} />
                                        </button>
                                    </div>
                                )}
                                {example.p && <p className={cx("readingText")}>{example.p}</p>}
                                {(example.m || example.h) && <p className={cx("viText")}>{example.m || example.h}</p>}
                            </div>
                        </div>
                    )) : <p className={cx("mutedText")}>Chưa có ví dụ.</p>}
                </section>
            </>
        );
    };

    const renderMeta = () => {
        if (type === "Từ vựng") {
            return (
                <>
                    <div className={cx("metaItem")}><span>Phiên âm</span><strong>{formatPhonetic(item?.phonetic) || "-"}</strong></div>
                    <div className={cx("metaItem")}><span>Loại từ</span><strong>{item?.type || "-"}</strong></div>
                    <div className={cx("metaItem")}><span>JLPT</span><strong>{item?.level || "-"}</strong></div>
                </>
            );
        }

        if (type === "Ngữ pháp") {
            return (
                <>
                    <div className={cx("metaItem")}><span>Mẫu câu</span><strong>{item?.title || "-"}</strong></div>
                    <div className={cx("metaItem")}><span>JLPT</span><strong>{item?.level || "-"}</strong></div>
                </>
            );
        }

        return (
            <>
                <div className={cx("metaItem")}><span>Âm Kun</span><strong>{kanjiKunReading || "-"}</strong></div>
                <div className={cx("metaItem")}><span>Âm On</span><strong>{kanjiOnReading || "-"}</strong></div>
                <div className={cx("metaItem")}><span>Số nét</span><strong>{item?.stroke_count || "-"}</strong></div>
                <div className={cx("metaItem")}><span>JLPT</span><strong>{item?.level || "-"}</strong></div>
            </>
        );
    };

    return createPortal(
        <div className={cx("detailOverlay")}>
            <div className={cx("detailModal")} onClick={(e) => e.stopPropagation()}>
                <header className={cx("detailHeader")}>
                    <div>
                        <h2>Chi tiết từ <span>{title}</span></h2>
                        <p>{type}</p>
                    </div>
                    <button type="button" className={cx("detailClose")} onClick={onClose} aria-label="Đóng">
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </header>

                <div className={cx("detailBody")}>
                    <main className={cx("detailMain")}>
                        <div className={cx("detailHero")}>
                            <div>
                                <div className={cx("detailWord")}>{title}</div>
                                {type === "Từ vựng" && <div className={cx("detailReading")}>{formatPhonetic(item?.phonetic)}</div>}
                                {type === "Hán tự" && <div className={cx("detailReading")}>{item?.mean}</div>}
                                {type === "Ngữ pháp" && <div className={cx("detailReading")}>{item?.mean}</div>}
                            </div>

                            <div className={cx("detailActions")}>
                                {(type === "Từ vựng" || type === "Hán tự") && (
                                    <button
                                        type="button"
                                        className={cx("detailIconBtn")}
                                        onClick={() => onPlayAudio(type === "Từ vựng" ? formatPhonetic(item?.phonetic) || title : title)}
                                        aria-label="Nghe phát âm"
                                    >
                                        <FontAwesomeIcon icon={faVolumeHigh} />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className={cx("detailIconBtn", "detailAddBtn")}
                                    onClick={onToggleNotebookPicker}
                                    aria-label="Thêm vào sổ tay"
                                    disabled={!item || loading}
                                >
                                    <FontAwesomeIcon icon={faPlus} />
                                </button>
                            </div>
                        </div>

                        {renderPrimaryContent()}
                    </main>

                    <aside className={cx("detailSide")}>
                        {type === "Hán tự" && (
                            <KanjiStrokeOrder stroke={item?.stroke} />
                        )}

                        <section className={cx("detailSideCard")}>
                            <h3>Thông tin</h3>
                            {renderMeta()}
                        </section>

                    </aside>
                </div>

                {showNotebookPicker && (
                    <div className={cx("notebookPickerOverlay")} onClick={onToggleNotebookPicker}>
                        <section className={cx("notebookPickerModal")} onClick={(e) => e.stopPropagation()}>
                            <header className={cx("notebookPickerHeader")}>
                                <div>
                                    <h3>Thêm vào sổ tay</h3>
                                    <p>Chọn một sổ tay để lưu {title}</p>
                                </div>
                                <button
                                    type="button"
                                    className={cx("detailClose")}
                                    onClick={onToggleNotebookPicker}
                                    aria-label="Đóng chọn sổ tay"
                                >
                                    <FontAwesomeIcon icon={faXmark} />
                                </button>
                            </header>

                            <div className={cx("detailNotebookList")}>
                                {notebooks.length ? notebooks.map((note) => (
                                    <button
                                        key={note._id}
                                        type="button"
                                        className={cx("detailNotebookItem")}
                                        onClick={() => onAddToNotebook(note)}
                                    >
                                        <strong>{note.name}</strong>
                                        <span>{new Date(note.createdAt).toLocaleDateString("vi-VN")}</span>
                                    </button>
                                )) : <p className={cx("mutedText")}>Bạn chưa có sổ tay nào.</p>}
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}

export default JLPT;
