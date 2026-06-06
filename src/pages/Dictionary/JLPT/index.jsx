import React, { useState, useEffect } from "react";
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
import AuthRequiredModal from "~/components/AuthRequiredModal";
import { useNavigate } from "react-router-dom";
import { useAuth } from "~/context/AuthContext";
import { useToast } from "~/context/ToastContext";
import handlePlayAudio from "~/services/handlePlayAudio";
import PdfModal from "~/components/PdfModal/PdfModal";
import KanjiStrokeOrder from "~/components/KanjiStrokeOrder";

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
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailItem, setDetailItem] = useState(null);
    const [detailType, setDetailType] = useState("Từ vựng");
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState(null);
    const [showNotebookPicker, setShowNotebookPicker] = useState(false);

    const navigate = useNavigate();
    const { isLoggedIn } = useAuth();
    const { addToast } = useToast();
    const itemsPerPage = selectedType === "Hán tự" ? 18 : 10;

    useEffect(() => {
        fetchNotebooks();
    }, []);

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

    const fetchNotebooks = async () => {
        try {
            const nextNotebooks = await notebookService.getNotebooks();
            setNotebooks(Array.isArray(nextNotebooks) ? nextNotebooks : []);
        } catch (err) {
            console.error("Error fetching notebooks:", err);
        }
    };

    const getFlashcardLink = () => {
        const typeParam = selectedType === "Từ vựng" ? "word" : selectedType === "Ngữ pháp" ? "grammar" : "kanji";
        return `flashcards?type=${typeParam}&level=${selectedLevel}&source=jlpt&page=${currentPage}&limit=${itemsPerPage}`;
    };

    const handleFlashcardClick = () => {
        if (!isLoggedIn) {
            setShowAuthModal(true);
            return;
        }

        window.location.href = `/jlpt/${getFlashcardLink()}`;
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

    const openNotebookPickerForCard = (event, item) => {
        event.stopPropagation();
        if (!isLoggedIn) {
            setShowAuthModal(true);
            return;
        }

        setDetailItem(item);
        setDetailType(selectedType);
        setShowNotebookPicker(true);
        setDetailOpen(true);
        setDetailLoading(false);
        setDetailError(null);
    };

    const handlePdfClick = () => {
        setPdfLoading(true);
        setPdfUrl(`/pdf/jlpt-${selectedLevel.toLowerCase()}.pdf`);
        setShowPdfModal(true);
        setPdfLoading(false);
    };

    const handleAuthConfirm = () => {
        setShowAuthModal(false);
        navigate("/login");
    };

    const renderCard = (item, index) => {
        const title = getDetailLabel(item);
        const meaning = getMeaning(item);
        const phonetic = formatPhonetic(item.phonetic || item.hiragana || item.kana);

        if (selectedType === "Ngữ pháp") {
            return (
                <article
                    key={item._id || item.id || `${title}-${index}`}
                    className={cx("card", "grammarCard", "clickableCard")}
                    onClick={() => fetchDetail(item)}
                >
                    <div className={cx("grammarBody")}>
                        {isDisplayEnabled("Từ vựng") && <div className={cx("grammarPattern")}>{title}</div>}
                        {isDisplayEnabled("Nghĩa") && <div className={cx("grammarMeaning")}>{meaning}</div>}
                    </div>
                    <button
                        type="button"
                        className={cx("addBtn")}
                        onClick={(event) => openNotebookPickerForCard(event, item)}
                        aria-label="Thêm vào sổ tay"
                    >
                        <FontAwesomeIcon icon={faPlus} />
                    </button>
                </article>
            );
        }

        return (
            <article
                key={item._id || item.id || item.mobileId || `${title}-${index}`}
                className={cx("card", "clickableCard", { kanjiCard: selectedType === "Hán tự" })}
                onClick={() => fetchDetail(item)}
            >
                <div className={cx("cardTop")}>
                    <button
                        type="button"
                        className={cx("speakerBtn")}
                        onClick={(event) => {
                            event.stopPropagation();
                            handlePlayAudio(selectedType === "Từ vựng" ? phonetic || title : title);
                        }}
                        aria-label="Nghe phát âm"
                    >
                        <FontAwesomeIcon icon={faVolumeHigh} />
                    </button>
                    <button
                        type="button"
                        className={cx("addBtn")}
                        onClick={(event) => openNotebookPickerForCard(event, item)}
                        aria-label="Thêm vào sổ tay"
                    >
                        <FontAwesomeIcon icon={faPlus} />
                    </button>
                </div>

                {isDisplayEnabled("Từ vựng") && <div className={cx("kanji")}>{title}</div>}
                {selectedType === "Từ vựng" && isDisplayEnabled("Phiên âm") && phonetic && (
                    <div className={cx("hiragana")}>{phonetic}</div>
                )}
                {isDisplayEnabled("Nghĩa") && meaning && <div className={cx("meaning")}>{meaning}</div>}
            </article>
        );
    };

    return (
        <div className={cx("wrapper")}>
            <span className={cx("blob1")} />
            <span className={cx("blob2")} />

            <div className={cx("inner")}>
                <header className={cx("hero")}>
                    <div className={cx("heroLeft")}>
                        <div className={cx("heroBadge")}>{selectedLevel}</div>
                        <div>
                            <h1 className={cx("title")}>JLPT Dictionary</h1>
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
                                <button type="button" className={cx("toolbarBtn", "pdfBtn")} onClick={handlePdfClick}>
                                    PDF
                                </button>
                                <button type="button" className={cx("toolbarBtn", "flashcardBtn")} onClick={handleFlashcardClick}>
                                    Flashcard
                                </button>
                            </div>
                        </section>

                        {loading && <div className={cx("emptyState")}>Đang tải dữ liệu...</div>}
                        {!loading && error && <div className={cx("emptyState")}>{error}</div>}
                        {!loading && !error && data.length === 0 && <div className={cx("emptyState")}>Chưa có dữ liệu.</div>}

                        {!loading && !error && data.length > 0 && (
                            <div className={cx("grid", {
                                kanjiGrid: selectedType === "Hán tự",
                                grammarGrid: selectedType === "Ngữ pháp",
                            })}>
                                {data.map(renderCard)}
                            </div>
                        )}

                        {totalPages > 1 && (
                            <nav className={cx("pagination")} aria-label="Phân trang JLPT">
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                    disabled={currentPage <= 1}
                                >
                                    <FontAwesomeIcon icon={faChevronLeft} />
                                </button>
                                <span>{currentPage} / {totalPages}</span>
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                    disabled={currentPage >= totalPages}
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
