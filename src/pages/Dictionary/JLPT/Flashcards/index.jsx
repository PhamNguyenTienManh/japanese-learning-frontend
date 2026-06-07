import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import classNames from "classnames/bind";
import styles from "./Flashcards.module.scss";
import { getJlptWords, getJlptKanji, getJlptGrammar } from "~/services/jlptService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeft,
    faRotate,
    faChevronLeft,
    faChevronRight,
    faVolumeUp,
    faLayerGroup,
    faCheck,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";
import {
    getJlptCardStatuses,
    updateJlptCardStatus,
} from "~/services/learningPathService";
import { useToast } from "~/context/ToastContext";

const cx = classNames.bind(styles);


export default function JLPTFlashcard() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { addToast } = useToast();

    const sourceType = searchParams.get("type");
    const sourceLevel = searchParams.get("level");
    const learningPathSkill = searchParams.get("lpSkill");
    const learningPathOrder = searchParams.get("lpOrder");
    const isJLPTMode = searchParams.get("source") === "jlpt";
    const defaultLimit =
        sourceType === "word" ? 15 :
            sourceType === "kanji" ? 18 : 10;
    const sourcePage = Math.max(parseInt(searchParams.get("page"), 10) || 1, 1);
    const sourceLimit = Math.max(parseInt(searchParams.get("limit"), 10) || defaultLimit, 1);

    const [allCards, setAllCards] = useState([]);
    const [filteredCards, setFilteredCards] = useState([]);

    const selectedCategory = "Tất cả";

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [cardStatuses, setCardStatuses] = useState({});
    const [savingStatus, setSavingStatus] = useState(false);

    const fetchCardStatuses = useCallback(async (cards) => {
        if (!isJLPTMode || !sourceType || !sourceLevel || !cards.length) {
            setCardStatuses({});
            return;
        }

        try {
            const skill = sourceType === "word" ? "vocab" : sourceType;
            const result = await getJlptCardStatuses({
                skill,
                level: sourceLevel,
                refIds: cards.map((card) => card.id).filter(Boolean),
            });
            setCardStatuses(result?.statuses || {});
        } catch (err) {
            console.error("Failed to load JLPT card statuses:", err);
        }
    }, [isJLPTMode, sourceType, sourceLevel]);


    const fetchJLPTData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            let response;

            if (sourceType === "word") {
                response = await getJlptWords(sourcePage, sourceLimit, sourceLevel);
            } else if (sourceType === "grammar") {
                response = await getJlptGrammar(sourcePage, sourceLimit, sourceLevel);
            } else if (sourceType === "kanji") {
                response = await getJlptKanji(sourcePage, sourceLimit, sourceLevel);
            }

            if (response?.success) {
                const data = response.data.data || [];

                const transformedCards = data.map(item => {
                    if (sourceType === "word") {
                        return {
                            id: item._id,
                            name: item.word,
                            phonetic: item.phonetic,
                            mean: item.meanings,
                            type: "word",
                            notes: item.example || ""
                        };
                    } else if (sourceType === "grammar") {
                        return {
                            id: item._id,
                            name: item.title,
                            phonetic: item.structure || "",
                            mean: item.mean,
                            type: "grammar",
                            notes: item.example || ""
                        };
                    } else if (sourceType === "kanji") {
                        return {
                            id: item._id,
                            name: item.kanji,
                            phonetic: item.kun_reading || item.on_reading || "",
                            mean: item.mean,
                            type: "kanji",
                            notes: item.example || ""
                        };
                    }
                    return item;
                });

                setAllCards(transformedCards);
                fetchCardStatuses(transformedCards);
                setCurrentIndex(0);
                setIsFlipped(false);
            }
        } catch (err) {
            console.error("Failed:", err);
            setError("Không thể tải dữ liệu JLPT");
        } finally {
            setLoading(false);
        }
    }, [sourceType, sourceLevel, sourcePage, sourceLimit, fetchCardStatuses]);


    useEffect(() => {
        if (isJLPTMode && sourceType && sourceLevel) {
            fetchJLPTData();
        }
    }, [isJLPTMode, sourceType, sourceLevel, fetchJLPTData]);


    // FILTER CATEGORY (áp dụng cho Flashcard Notebook)
    useEffect(() => {
        if (!allCards.length) {
            setFilteredCards([]);
            setCurrentIndex(0);
            setIsFlipped(false);
            return;
        }

        if (isJLPTMode) {
            setFilteredCards(allCards);
            setCurrentIndex(0);
            setIsFlipped(false);
            return;
        }

        if (selectedCategory === "Tất cả") {
            setFilteredCards(allCards);
        } else {
            setFilteredCards(allCards.filter(c => c.type === selectedCategory));
        }

        setCurrentIndex(0);
        setIsFlipped(false);

    }, [selectedCategory, allCards, isJLPTMode]);


    const total = filteredCards.length;
    const currentCard = filteredCards[currentIndex] ?? null;
    const currentStatus = currentCard?.id ? cardStatuses[currentCard.id] : null;
    const knownInCurrentSet = filteredCards.filter((card) => cardStatuses[card.id] === "known").length;
    const unknownInCurrentSet = filteredCards.filter((card) => cardStatuses[card.id] === "unknown").length;
    const progress = total > 0 ? Math.round(((currentIndex + 1) / total) * 100) : 0;
    const typeLabel =
        sourceType === "word" ? "Từ vựng" :
            sourceType === "grammar" ? "Ngữ pháp" : "Hán tự";
    const levelLabel = sourceLevel || "JLPT";


    const handleNext = () => {
        if (currentIndex < total - 1) {
            setCurrentIndex(i => i + 1);
            setIsFlipped(false);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(i => i - 1);
            setIsFlipped(false);
        }
    };

    const handleReset = () => {
        setCurrentIndex(0);
        setIsFlipped(false);
    };

    const playAudio = (text) => {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "ja-JP";
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
    };

    const handleBack = () => {
        if (isJLPTMode) {
            const params = new URLSearchParams();
            if (sourceType) params.set("type", sourceType);
            if (sourceLevel) params.set("level", sourceLevel);
            if (learningPathSkill) params.set("lpSkill", learningPathSkill);
            if (learningPathOrder) params.set("lpOrder", learningPathOrder);

            navigate(`/jlpt${params.toString() ? `?${params.toString()}` : ""}`);
        }
        else navigate("/dictionary/notebook");
    };

    const handleMarkStatus = async (status) => {
        if (!currentCard?.id) {
            addToast("Không tìm thấy mã thẻ để lưu trạng thái. Vui lòng tải lại trang.", "error");
            return;
        }

        if (savingStatus) return;

        try {
            setSavingStatus(true);
            const skill = sourceType === "word" ? "vocab" : sourceType;
            const result = await updateJlptCardStatus({
                refId: currentCard.id,
                skill,
                level: sourceLevel,
                status,
            });

            setCardStatuses((prev) => ({
                ...prev,
                [currentCard.id]: status,
            }));

            if (result?.completedTask) {
                addToast("Đã hoàn thành mục trong lộ trình hôm nay!", "success");
            } else {
                addToast(
                    status === "known" ? "Đã lưu: Đã thuộc" : "Đã lưu: Chưa thuộc",
                    "success",
                    1800
                );
            }
        } catch (err) {
            console.error("Failed to update JLPT card status:", err);
            addToast(err.message || "Không lưu được trạng thái thẻ.", "error");
        } finally {
            setSavingStatus(false);
        }
    };

    const ErrorMessage = () =>
        error ? (
            <div className={cx("error-message")}>
                <p>{error}</p>
                <button type="button" onClick={() => setError(null)} aria-label="Đóng thông báo lỗi">✕</button>
            </div>
        ) : null;


    const getDisplayTitle = () => {
        return `JLPT ${sourceLevel} - ${typeLabel}`;
    };

    const normalizeDisplay = (value) => {
        if (Array.isArray(value)) return value.filter(Boolean).join("; ");
        if (value && typeof value === "object") return Object.values(value).filter(Boolean).join("; ");
        return String(value || "").trim();
    };



    return (
        <div className={cx("root")}>
            <div className={cx("inner")}>
                <ErrorMessage />

                <header className={cx("header")}>
                    <button type="button" className={cx("backBtn")} onClick={handleBack}>
                        <FontAwesomeIcon icon={faArrowLeft} />
                        <span>Quay lại JLPT</span>
                    </button>

                    <div className={cx("hero")}>
                        <div className={cx("heroText")}>
                            <div className={cx("eyebrow")}>
                                <FontAwesomeIcon icon={faLayerGroup} />
                                <span>{levelLabel}</span>
                                <span>{typeLabel}</span>
                            </div>
                            <h1 className={cx("title")}>{getDisplayTitle()}</h1>
                            <p className={cx("subtitle")}>
                                Lật thẻ để ghi nhớ nghĩa, nghe phát âm và đi qua từng mục trong bộ hiện tại.
                            </p>
                        </div>

                        <div className={cx("stats")}>
                            <div className={cx("stat")}>
                                <span>Thẻ hiện tại</span>
                                <strong>{total > 0 ? currentIndex + 1 : 0}</strong>
                            </div>
                            <div className={cx("stat")}>
                                <span>Tổng thẻ</span>
                                <strong>{total}</strong>
                            </div>
                            <div className={cx("stat")}>
                                <span>Đã thuộc</span>
                                <strong>{knownInCurrentSet}</strong>
                            </div>
                            <div className={cx("stat")}>
                                <span>Chưa thuộc</span>
                                <strong>{unknownInCurrentSet}</strong>
                            </div>
                        </div>
                    </div>
                </header>

                {loading && (
                    <div className={cx("loading")}>
                        <div className={cx("loader")} />
                        <p>Đang tải flashcard...</p>
                    </div>
                )}

                {!loading && (
                    <>
                        {total > 0 && (
                            <div className={cx("progress-wrap")}>
                                <div className={cx("progressMeta")}>
                                    <span>Tiến độ bộ thẻ</span>
                                    <strong>{progress}%</strong>
                                </div>
                                <div className={cx("progressTrack")} aria-label={`Tiến độ ${progress}%`}>
                                    <span style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        )}

                        <div className={cx("flashcard-container")}>
                            <div className={cx("flashcard-area")}>
                                {currentCard ? (
                                    <>
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            className={cx("card", { flipped: isFlipped })}
                                            onClick={() => setIsFlipped(f => !f)}
                                            onKeyDown={(event) => {
                                                if (event.key === "Enter" || event.key === " ") {
                                                    event.preventDefault();
                                                    setIsFlipped(f => !f);
                                                }
                                            }}
                                        >
                                            <div className={cx("cardTop")}>
                                                <span>{typeLabel}</span>
                                                <div className={cx("cardTopRight")}>
                                                    {currentStatus && (
                                                        <span className={cx("statusBadge", {
                                                            statusKnown: currentStatus === "known",
                                                            statusUnknown: currentStatus === "unknown",
                                                        })}>
                                                            {currentStatus === "known" ? "Đã thuộc" : "Chưa thuộc"}
                                                        </span>
                                                    )}
                                                    <span>{currentIndex + 1} / {total}</span>
                                                    <button
                                                        type="button"
                                                        className={cx("resetIconBtn")}
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            handleReset();
                                                        }}
                                                        aria-label="Bắt đầu lại"
                                                        title="Bắt đầu lại"
                                                    >
                                                        <FontAwesomeIcon icon={faRotate} />
                                                    </button>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                className={cx("cardNavBtn", "cardNavPrev")}
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    handlePrevious();
                                                }}
                                                disabled={currentIndex <= 0}
                                                aria-label="Thẻ trước"
                                            >
                                                <FontAwesomeIcon icon={faChevronLeft} />
                                            </button>

                                            <button
                                                type="button"
                                                className={cx("cardNavBtn", "cardNavNext")}
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    handleNext();
                                                }}
                                                disabled={currentIndex >= total - 1}
                                                aria-label="Thẻ sau"
                                            >
                                                <FontAwesomeIcon icon={faChevronRight} />
                                            </button>

                                            {!isFlipped ? (
                                                <div className={cx("front")}>
                                                    <h2 className={cx("kanji")}>{currentCard.name}</h2>
                                                    {currentCard.phonetic && (
                                                        <p className={cx("meta-hira")}>{currentCard.phonetic}</p>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            playAudio(currentCard.name || currentCard.phonetic);
                                                        }}
                                                        className={cx("audio-btn")}
                                                        aria-label="Phát âm"
                                                    >
                                                        <FontAwesomeIcon icon={faVolumeUp} />
                                                    </button>
                                                    <p className={cx("hint")}>Nhấn để xem nghĩa</p>
                                                </div>
                                            ) : (
                                                <div className={cx("back")}>
                                                    <p className={cx("meaning")}>{normalizeDisplay(currentCard.mean)}</p>
                                                    {currentCard.notes && (
                                                        <p className={cx("note")}><strong>Ví dụ</strong>{normalizeDisplay(currentCard.notes)}</p>
                                                    )}
                                                    <p className={cx("hint")}>Nhấn để quay lại</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className={cx("memoryActions")}>
                                            <button
                                                type="button"
                                                className={cx("memoryBtn", {
                                                    memoryKnown: currentStatus === "known",
                                                })}
                                                onClick={() => handleMarkStatus("known")}
                                                disabled={savingStatus}
                                            >
                                                <FontAwesomeIcon icon={faCheck} />
                                                Đã thuộc
                                            </button>
                                            <button
                                                type="button"
                                                className={cx("memoryBtn", {
                                                    memoryUnknown: currentStatus === "unknown",
                                                })}
                                                onClick={() => handleMarkStatus("unknown")}
                                                disabled={savingStatus}
                                            >
                                                <FontAwesomeIcon icon={faXmark} />
                                                Chưa thuộc
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className={cx("empty")}>
                                        <h2>{total === 0 ? "Chưa có thẻ nào" : "Hoàn thành!"}</h2>
                                        <p>Không tìm thấy dữ liệu cho bộ flashcard này.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

