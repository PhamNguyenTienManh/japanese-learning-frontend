import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus,
    faVolumeHigh,
    faChevronLeft,
    faChevronRight,
    faXmark,
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
import { recordLearningResourceProgress } from "~/services/learningPathService";
import AuthRequiredModal from "~/components/AuthRequiredModal";
import GuidedCoachmark from "~/components/GuidedCoachmark";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "~/context/AuthContext";
import { useToast } from "~/context/ToastContext";
import handlePlayAudio from "~/services/handlePlayAudio";
import PdfModal from "~/components/PdfModal/PdfModal";
import KanjiStrokeOrder from "~/components/KanjiStrokeOrder";

const cx = classNames.bind(styles);

const vocabularyTypes = ["Từ vựng", "Ngữ pháp", "Hán tự"];
const jlptLevels = ["N5", "N4", "N3", "N2", "N1"];

function parseFiltersFromSearch(search) {
    const params = new URLSearchParams(search || "");
    const typeParam = params.get("type");
    const writingMode = params.get("writing") === "1";
    const levelParam = String(params.get("level") || "").toUpperCase();

    const type =
        writingMode || typeParam === "kanji"
            ? "Hán tự"
            : typeParam === "grammar"
                ? "Ngữ pháp"
                : typeParam === "word"
                    ? "Từ vựng"
                    : null;
    const level = jlptLevels.includes(levelParam) ? levelParam : null;

    return { type, level };
}

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

function JLPT() {
    const location = useLocation();
    const navigate = useNavigate();
    const { isLoggedIn } = useAuth();
    const { addToast } = useToast();

    const initialFilters = parseFiltersFromSearch(location.search);
    const tourParam = useMemo(
        () => new URLSearchParams(location.search).get("tour"),
        [location.search]
    );

    const [selectedType, setSelectedType] = useState(initialFilters.type || "Từ vựng");
    const [selectedLevel, setSelectedLevel] = useState(initialFilters.level || "N5");
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
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailItem, setDetailItem] = useState(null);
    const [detailType, setDetailType] = useState("Từ vựng");
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState(null);
    const [showNotebookPicker, setShowNotebookPicker] = useState(false);

    // --- Tour/learning-path refs (from feat branch) ---
    const [flashcardTourStep, setFlashcardTourStep] = useState("card");
    const firstCardTourRef = useRef(null);
    const flashcardButtonRef = useRef(null);
    const flashcardTourTimerRef = useRef(null);
    const writingButtonRef = useRef(null);

    const itemsPerPage =
        selectedType === "Từ vựng" ? 15 :
            selectedType === "Hán tự" ? 18 : 10;
    const flashcardTourActive = tourParam === "flashcard";
    const flashcardTourLabel =
        selectedType === "Ngữ pháp"
            ? "Ngữ pháp"
            : selectedType === "Hán tự"
                ? "Hán tự"
                : "Từ vựng";
    const detailTourLabel =
        selectedType === "Hán tự" ? "kanji" : flashcardTourLabel.toLowerCase();

    const learningPathParams = useMemo(() => {
        const params = new URLSearchParams(location.search);
        return {
            lpSkill: params.get("lpSkill"),
            lpOrder: params.get("lpOrder"),
        };
    }, [location.search]);

    const learningPathTourScope =
        [learningPathParams.lpSkill, learningPathParams.lpOrder].filter(Boolean).join("-") || "default";
    const flashcardTourSessionKey = `${tourParam || "none"}-${learningPathTourScope}`;

    // --- Effects ---

    useEffect(() => {
        fetchNotebooks();
    }, []);

    // Reset tour step when session scope changes
    useEffect(() => {
        window.clearTimeout(flashcardTourTimerRef.current);
        setFlashcardTourStep("card");
    }, [flashcardTourSessionKey]);

    useEffect(() => {
        return () => window.clearTimeout(flashcardTourTimerRef.current);
    }, []);

    // Sync filters from URL changes
    useEffect(() => {
        const nextFilters = parseFiltersFromSearch(location.search);
        if (nextFilters.type) {
            setSelectedType(nextFilters.type);
            setCurrentPage(1);
        }
        if (nextFilters.level) {
            setSelectedLevel(nextFilters.level);
            setCurrentPage(1);
        }
    }, [location.search]);

    // Fetch JLPT data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = selectedType === "Từ vựng"
                    ? await getJlptWords(currentPage, itemsPerPage, selectedLevel)
                    : selectedType === "Ngữ pháp"
                        ? await getJlptGrammar(currentPage, itemsPerPage, selectedLevel)
                        : await getJlptKanji(currentPage, itemsPerPage, selectedLevel);

                const payload = response?.success ? response.data : response;
                const nextData = payload?.data || payload?.items || payload?.results || [];
                const nextTotalPages = payload?.totalPages || payload?.totalPage || payload?.pagination?.totalPages || 1;

                setData(Array.isArray(nextData) ? nextData : []);
                setTotalPages(nextTotalPages || 1);
            } catch (err) {
                console.error("Error fetching JLPT data:", err);
                setData([]);
                setTotalPages(1);
                setError("Không thể tải dữ liệu JLPT.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedType, selectedLevel, currentPage, itemsPerPage]);

    // --- Helpers ---

    const fetchNotebooks = async () => {
        try {
            const nextNotebooks = await notebookService.getNotebooks();
            setNotebooks(Array.isArray(nextNotebooks) ? nextNotebooks : []);
        } catch (err) {
            console.error("Error fetching notebooks:", err);
        }
    };

    const getFlashcardLink = () => {
        const typeParam =
            selectedType === "Từ vựng" ? "word" :
                selectedType === "Ngữ pháp" ? "grammar" : "kanji";

        const params = new URLSearchParams({
            type: typeParam,
            level: selectedLevel,
            source: "jlpt",
            page: String(currentPage),
            limit: String(itemsPerPage),
        });

        if (learningPathParams.lpSkill) params.set("lpSkill", learningPathParams.lpSkill);
        if (learningPathParams.lpOrder) params.set("lpOrder", learningPathParams.lpOrder);

        return `flashcards?${params.toString()}`;
    };

    const handleFlashcardClick = () => {
        if (!isLoggedIn) {
            setShowAuthModal(true);
            return;
        }
        window.location.href = `/jlpt/${getFlashcardLink()}`;
    };

    // Tour dismiss handlers
    const handleCardTourDismiss = () => {
        window.clearTimeout(flashcardTourTimerRef.current);
        flashcardTourTimerRef.current = window.setTimeout(() => {
            setFlashcardTourStep("flashcard");
        }, 180);
        return false;
    };

    const handleFlashcardTourDismiss = () => {
        window.clearTimeout(flashcardTourTimerRef.current);
        setFlashcardTourStep("done");
    };

    // PDF preview (fetches real PDF from API — feat branch behavior)
    const handlePreviewPdf = async () => {
        try {
            setPdfLoading(true);
            setShowPdfModal(true);

            const typeParam =
                selectedType === "Từ vựng" ? "word" :
                    selectedType === "Hán tự" ? "kanji" : "grammar";

            const url = `${process.env.REACT_APP_API_URL}/pdf/jlpt?page=${currentPage}&limit=${itemsPerPage}&level=${selectedLevel}&type=${typeParam}`;

            const response = await fetch(url, { credentials: "include" });
            if (!response.ok) throw new Error("PDF request failed");

            const blob = await response.blob();
            setPdfUrl(URL.createObjectURL(blob));

            // Ghi nhận tiến độ luyện viết cho lộ trình (chỉ khi tải PDF kanji).
            if (isLoggedIn && typeParam === "kanji") {
                recordLearningResourceProgress({
                    skill: "writing",
                    refKey: `jlpt-${selectedLevel}-${typeParam}-p${currentPage}`,
                    metadata: { level: selectedLevel, page: currentPage },
                }).catch((error) => {
                    console.error("Record writing progress error:", error);
                });
            }
        } catch (err) {
            console.error(err);
            setShowPdfModal(false);
            addToast("Không thể tải PDF. Vui lòng thử lại.", "error");
        } finally {
            setPdfLoading(false);
        }
    };

    const handleTypeChange = (type) => {
        setSelectedType(type);
        setCurrentPage(1);
    };

    const handleLevelChange = (level) => {
        setSelectedLevel(level);
        setCurrentPage(1);
    };

    const toggleDisplayOption = (label) => {
        setDisplaySettings((current) => ({
            ...current,
            [selectedType]: current[selectedType].map((option) =>
                option.label === label ? { ...option, checked: !option.checked } : option
            ),
        }));
    };

    const isDisplayEnabled = (label) => {
        return displaySettings[selectedType]?.find((option) => option.label === label)?.checked;
    };

    const getDetailLabel = (item, type = selectedType) => {
        if (!item) return "";
        if (type === "Từ vựng") return item.word || item.title || item.kanji || "";
        if (type === "Ngữ pháp") return item.title || item.pattern || item.word || "";
        return item.kanji || item.word || item.title || "";
    };

    const formatPhonetic = (value) => {
        if (Array.isArray(value)) return value.filter(Boolean).join("、 ");
        return String(value || "").trim();
    };

    const formatMeanings = (value) => {
        if (Array.isArray(value)) {
            return value
                .map((entry) => typeof entry === "string" ? entry : entry?.meaning)
                .filter(Boolean)
                .join(", ");
        }
        return String(value || "").trim();
    };

    const getMeaning = (item) => {
        return item?.mean || item?.meaning || formatMeanings(item?.meanings) || "";
    };

    const limitDisplayParts = (value, limit = 2) => {
        const raw = Array.isArray(value)
            ? value.map((entry) => typeof entry === "string" ? entry : entry?.meaning).filter(Boolean)
            : String(value || "")
                .split(/[、,;；]+/)
                .map((part) => part.trim())
                .filter(Boolean);

        return raw.slice(0, limit).join(", ");
    };

    const fetchDetail = async (item) => {
        const label = getDetailLabel(item);
        if (!label) return;

        setDetailOpen(true);
        setDetailType(selectedType);
        setDetailItem(item);
        setDetailError(null);
        setDetailLoading(true);
        setShowNotebookPicker(false);

        try {
            const detail = selectedType === "Từ vựng"
                ? await getJlptWordDetail(label)
                : selectedType === "Ngữ pháp"
                    ? await getJlptGrammarDetail(label)
                    : await getJlptKanjiDetail(label);

            setDetailItem(detail?.data || detail || item);
        } catch (err) {
            console.error("Error fetching JLPT detail:", err);
            setDetailError("Không thể tải chi tiết.");
        } finally {
            setDetailLoading(false);
        }
    };

    const closeDetail = () => {
        setDetailOpen(false);
        setShowNotebookPicker(false);
    };

    const buildNotebookPayload = (item = detailItem, type = detailType) => {
        if (!item) return null;
        const title = getDetailLabel(item, type);
        return {
            word: title,
            kanji: type === "Hán tự" ? title : item.kanji,
            phonetic: formatPhonetic(item.phonetic || item.kun || item.on),
            meaning: getMeaning(item),
            mean: getMeaning(item),
            type,
            level: item.level || selectedLevel,
            source: "jlpt",
            referenceId: item._id || item.id || item.mobileId,
        };
    };

    const handleAddToNotebook = async (notebook, item = detailItem, type = detailType) => {
        if (!isLoggedIn) {
            setShowAuthModal(true);
            return;
        }

        const payload = buildNotebookPayload(item, type);
        if (!payload) return;

        try {
            await notebookService.addWord(notebook._id, payload);
            addToast("Đã thêm vào sổ tay", "success");
            setShowNotebookPicker(false);
        } catch (err) {
            console.error("Error adding notebook item:", err);
            addToast(err.message || "Không thể thêm vào sổ tay", "error");
        }
    };

    const handleAuthConfirm = () => {
        setShowAuthModal(false);
        navigate("/login");
    };

    // --- Render card ---

    const renderCard = (item, index) => {
        const cardTourRef = flashcardTourActive && index === 0 ? firstCardTourRef : undefined;
        const title = getDetailLabel(item);
        const meaning = getMeaning(item);
        const phonetic = formatPhonetic(item.phonetic || item.hiragana || item.kana);
        const displayPhonetic = selectedType === "Từ vựng"
            ? limitDisplayParts(item.phonetic || item.hiragana || item.kana || phonetic)
            : phonetic;
        const displayMeaning = selectedType === "Từ vựng" ? limitDisplayParts(meaning) : meaning;

        if (selectedType === "Ngữ pháp") {
            return (
                <article
                    ref={cardTourRef}
                    className={cx("card", "grammarCard", "clickableCard")}
                    onClick={() => fetchDetail(item)}
                >
                    <div className={cx("grammarBody")}>
                        {isDisplayEnabled("Từ vựng") && <div className={cx("grammarPattern")}>{title}</div>}
                        {isDisplayEnabled("Nghĩa") && <div className={cx("grammarMeaning")}>{meaning}</div>}
                    </div>
                </article>
            );
        }

        return (
            <article
                ref={cardTourRef}
                className={cx("card", "clickableCard", {
                    vocabCard: selectedType === "Từ vựng",
                    kanjiCard: selectedType === "Hán tự",
                })}
                onClick={() => fetchDetail(item)}
            >
                {isDisplayEnabled("Từ vựng") && <div className={cx("kanji")}>{title}</div>}
                {selectedType === "Từ vựng" && isDisplayEnabled("Phiên âm") && displayPhonetic && (
                    <div className={cx("hiragana")}>{displayPhonetic}</div>
                )}
                {isDisplayEnabled("Nghĩa") && displayMeaning && <div className={cx("meaning")}>{displayMeaning}</div>}
            </article>
        );
    };

    // --- Tour computed values ---

    const tourKeyScope = `${selectedLevel}-${flashcardTourLabel}-${learningPathTourScope}`;
    const showFlashcardTour =
        flashcardTourActive &&
        !detailOpen &&
        (
            (flashcardTourStep === "card" && !loading && !error && data.length > 0) ||
            flashcardTourStep === "flashcard"
        );
    const activeFlashcardTourTargetRef =
        flashcardTourStep === "flashcard" ? flashcardButtonRef : firstCardTourRef;
    const activeFlashcardTourMessage =
        flashcardTourStep === "flashcard"
            ? `Sau khi học xong, nhớ bấm FlashCard để luyện ${flashcardTourLabel} và được tính tiến trình lộ trình.`
            : `Nhấn vào đây để xem chi tiết ${detailTourLabel}.`;
    const activeFlashcardTourKey =
        flashcardTourStep === "flashcard"
            ? `jlpt-flashcard-${tourKeyScope}`
            : `jlpt-card-detail-${tourKeyScope}`;
    const handleActiveFlashcardTourDismiss =
        flashcardTourStep === "flashcard" ? handleFlashcardTourDismiss : handleCardTourDismiss;
    const paginationItems = useMemo(() => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, index) => index + 1);
        }

        const visible = new Set([1, 2, totalPages - 1, totalPages]);
        for (let page = currentPage - 1; page <= currentPage + 1; page += 1) {
            if (page >= 1 && page <= totalPages) visible.add(page);
        }

        const pages = [...visible].sort((a, b) => a - b);
        return pages.flatMap((page, index) => {
            const previous = pages[index - 1];
            if (index > 0 && page - previous > 1) {
                return [`ellipsis-${previous}-${page}`, page];
            }
            return [page];
        });
    }, [currentPage, totalPages]);

    // --- Render ---

    return (
        <div className={cx("wrapper")}>
            <span className={cx("blob1")} />
            <span className={cx("blob2")} />

            <div className={cx("inner")}>
                <header className={cx("hero")}>
                    <div className={cx("heroLeft")}>
                        <div className={cx("heroBadge")}>{selectedLevel}</div>
                        <div>
                            <h1 className={cx("title")}>Từ điển JLPT</h1>
                            <div className={cx("subtitle")}>
                                <span>{selectedType}</span>
                                <span className={cx("dot")}>•</span>
                                <span className={cx("chip")}>{selectedLevel}</span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className={cx("layout")}>
                    <aside className={cx("sidebar")}>
                        <h2 className={cx("sideTitle")}>Loại nội dung</h2>
                        <div className={cx("radioGroup")}>
                            {vocabularyTypes.map((type) => (
                                <label key={type} className={cx("radioRow", { radioActive: selectedType === type })}>
                                    <input
                                        type="radio"
                                        className={cx("radioInput")}
                                        checked={selectedType === type}
                                        onChange={() => handleTypeChange(type)}
                                    />
                                    <span className={cx("radioDot")} />
                                    <span>{type}</span>
                                </label>
                            ))}
                        </div>

                        <div className={cx("divider")} />

                        <h2 className={cx("sideTitle")}>Cấp độ</h2>
                        <div className={cx("radioGroup")}>
                            {jlptLevels.map((level) => (
                                <label key={level} className={cx("radioRow", { radioActive: selectedLevel === level })}>
                                    <input
                                        type="radio"
                                        className={cx("radioInput")}
                                        checked={selectedLevel === level}
                                        onChange={() => handleLevelChange(level)}
                                    />
                                    <span className={cx("radioDot")} />
                                    <span>{level}</span>
                                </label>
                            ))}
                        </div>
                    </aside>

                    <main className={cx("content")}>
                        <section className={cx("toolbar")}>
                            <div className={cx("displayOptions")}>
                                {displaySettings[selectedType].map((option) => (
                                    <label key={option.label} className={cx("displayOption", { displayOptionChecked: option.checked })}>
                                        <input
                                            type="checkbox"
                                            className={cx("checkbox")}
                                            checked={option.checked}
                                            onChange={() => toggleDisplayOption(option.label)}
                                        />
                                        <span>{option.label}</span>
                                    </label>
                                ))}
                            </div>

                            <div className={cx("iconBtns")}>
                                <button
                                    ref={flashcardButtonRef}
                                    type="button"
                                    className={cx("toolbarBtn", "flashcardBtn")}
                                    onClick={handleFlashcardClick}
                                >
                                    FlashCard
                                </button>
                                <button
                                    ref={writingButtonRef}
                                    type="button"
                                    className={cx("toolbarBtn", "pdfBtn")}
                                    onClick={handlePreviewPdf}
                                    aria-label="Tải PDF"
                                >
                                    Tải file viết tay
                                </button>
                            </div>
                        </section>

                        {showFlashcardTour && (
                            <GuidedCoachmark
                                targetRef={activeFlashcardTourTargetRef}
                                tourKey={activeFlashcardTourKey}
                                message={activeFlashcardTourMessage}
                                placement="bottom"
                                pointerOffsetY={flashcardTourStep === "flashcard" ? -2 : 0}
                                onDismiss={handleActiveFlashcardTourDismiss}
                                spotlightPadding={
                                    flashcardTourStep === "flashcard"
                                        ? { x: 9, y: 7 }
                                        : undefined
                                }
                                showOnce={false}
                            />
                        )}

                        {tourParam === "writing" && (
                            <GuidedCoachmark
                                targetRef={writingButtonRef}
                                tourKey={`jlpt-writing-${selectedLevel}`}
                                message="Tải file viết tay để luyện viết kanji hôm nay."
                                placement="bottom"
                            />
                        )}

                        {loading && <div className={cx("emptyState")}>Đang tải dữ liệu...</div>}
                        {!loading && error && <div className={cx("emptyState")}>{error}</div>}
                        {!loading && !error && data.length === 0 && <div className={cx("emptyState")}>Chưa có dữ liệu.</div>}

                        {!loading && !error && data.length > 0 && (
                            <div className={cx("grid", {
                                kanjiGrid: selectedType === "Hán tự",
                                grammarGrid: selectedType === "Ngữ pháp",
                            })}>
                                {data.map((item, index) => {
                                    const title = getDetailLabel(item);
                                    const cardKey = item._id || item.id || item.mobileId || `${title}-${index}`;
                                    return (
                                        <React.Fragment key={cardKey}>
                                            {renderCard(item, index)}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        )}

                        {totalPages > 1 && (
                            <nav className={cx("pagination")} aria-label="Phân trang JLPT">
                                <button
                                    type="button"
                                    className={cx("pagBtn")}
                                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                    disabled={currentPage <= 1}
                                    aria-label="Trang trước"
                                >
                                    <FontAwesomeIcon icon={faChevronLeft} />
                                </button>
                                <div className={cx("pageList")}>
                                    {paginationItems.map((page) => (
                                        typeof page === "number" ? (
                                            <button
                                                key={page}
                                                type="button"
                                                className={cx("pageNumber", { pageNumberActive: page === currentPage })}
                                                onClick={() => setCurrentPage(page)}
                                                aria-current={page === currentPage ? "page" : undefined}
                                            >
                                                {page}
                                            </button>
                                        ) : (
                                            <span key={page} className={cx("pagEllipsis")}>...</span>
                                        )
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    className={cx("pagBtn")}
                                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                    disabled={currentPage >= totalPages}
                                    aria-label="Trang sau"
                                >
                                    <FontAwesomeIcon icon={faChevronRight} />
                                </button>
                            </nav>
                        )}
                    </main>
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
                onToggleNotebookPicker={() => setShowNotebookPicker((show) => !show)}
                onClose={closeDetail}
                onPlayAudio={handlePlayAudio}
                onAddToNotebook={(notebook) => handleAddToNotebook(notebook)}
                formatPhonetic={formatPhonetic}
                formatMeanings={formatMeanings}
                getDetailLabel={getDetailLabel}
            />

            <AuthRequiredModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onConfirm={handleAuthConfirm}
                message="Bạn cần đăng nhập để sử dụng chức năng này."
            />

            <PdfModal
                show={showPdfModal}
                onClose={() => setShowPdfModal(false)}
                pdfUrl={pdfUrl}
                loading={pdfLoading}
                title={`Tài liệu JLPT ${selectedLevel}`}
            />
        </div>
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
    const grammarStructures = usages
        .map((usage) => String(usage?.synopsis || "").trim())
        .filter(Boolean);
    const hasGrammarExamples = usages.some((usage) => (usage.examples || []).length);

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
                <div className={cx("grammarLesson")}>
                    <section className={cx("detailSection", "grammarStructureSection")}>
                        <div className={cx("detailSectionTitle")}>Cấu trúc</div>
                        {grammarStructures.length ? (
                            <div className={cx("grammarStructureList")}>
                                {grammarStructures.map((structure, index) => (
                                    <div key={`${structure}-${index}`} className={cx("grammarStructureItem")}>
                                        <span className={cx("grammarDot")} />
                                        <span>{structure}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={cx("grammarStructureItem")}>
                                <span className={cx("grammarDot")} />
                                <span>{item?.title || title}</span>
                            </div>
                        )}
                    </section>

                    <section className={cx("detailSection", "grammarMeaningSection")}>
                        <div className={cx("detailSectionTitle")}>Nghĩa và ví dụ</div>
                        {usages.length ? usages.map((usage, index) => (
                            <div key={`${usage.synopsis || usage.explain}-${index}`} className={cx("grammarUsageBlock")}>
                                {usage.explain && (
                                    <div className={cx("grammarExplainLine")}>
                                        <span className={cx("grammarDot")} />
                                        <p>{usage.explain}</p>
                                    </div>
                                )}
                                {(usage.examples || []).map((example, exampleIndex) => (
                                    <div key={`${example.content}-${exampleIndex}`} className={cx("grammarExampleBlock")}>
                                        {example.content && (
                                            <div className={cx("grammarExampleJapanese")}>
                                                <span className={cx("grammarDot")} />
                                                <p>{example.content}</p>
                                                <button
                                                    type="button"
                                                    className={cx("grammarAudioBtn")}
                                                    onClick={() => onPlayAudio(example.content)}
                                                    aria-label="Nghe ví dụ"
                                                >
                                                    <FontAwesomeIcon icon={faVolumeHigh} />
                                                </button>
                                            </div>
                                        )}
                                        {example.transcription && <p className={cx("readingText")}>{example.transcription}</p>}
                                        {example.meaning && <p className={cx("viText")}>{example.meaning}</p>}
                                    </div>
                                ))}
                            </div>
                        )) : <p className={cx("mutedText")}>Chưa có ví dụ/cách dùng chi tiết.</p>}
                        {usages.length && !hasGrammarExamples ? (
                            <p className={cx("mutedText")}>Chưa có ví dụ cho mẫu ngữ pháp này.</p>
                        ) : null}
                    </section>
                </div>
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
            <div className={cx("detailModal", { detailModalGrammar: type === "Ngữ pháp" })} onClick={(e) => e.stopPropagation()}>
                <header className={cx("detailHeader")}>
                    <div>
                        <h2>Chi tiết từ <span>{title}</span></h2>
                        <p>{type}</p>
                    </div>
                    <button type="button" className={cx("detailClose")} onClick={onClose} aria-label="Đóng">
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </header>

                <div className={cx("detailBody", { detailBodyGrammar: type === "Ngữ pháp" })}>
                    <main className={cx("detailMain", { detailMainGrammar: type === "Ngữ pháp" })}>
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
