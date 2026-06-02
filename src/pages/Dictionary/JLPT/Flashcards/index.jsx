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
} from "@fortawesome/free-solid-svg-icons";

const cx = classNames.bind(styles);


export default function JLPTFlashcard() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const sourceType = searchParams.get("type");
    const sourceLevel = searchParams.get("level");
    const isJLPTMode = searchParams.get("source") === "jlpt";
    const defaultLimit = sourceType === "kanji" ? 18 : 10;
    const sourcePage = Math.max(parseInt(searchParams.get("page"), 10) || 1, 1);
    const sourceLimit = Math.max(parseInt(searchParams.get("limit"), 10) || defaultLimit, 1);

    const [allCards, setAllCards] = useState([]);
    const [filteredCards, setFilteredCards] = useState([]);

    const selectedCategory = "Tất cả";

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);


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
                            name: item.word,
                            phonetic: item.phonetic,
                            mean: item.meanings,
                            type: "word",
                            notes: item.example || ""
                        };
                    } else if (sourceType === "grammar") {
                        return {
                            name: item.title,
                            phonetic: item.structure || "",
                            mean: item.mean,
                            type: "grammar",
                            notes: item.example || ""
                        };
                    } else if (sourceType === "kanji") {
                        return {
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
                setCurrentIndex(0);
                setIsFlipped(false);
            }
        } catch (err) {
            console.error("Failed:", err);
            setError("Không thể tải dữ liệu JLPT");
        } finally {
            setLoading(false);
        }
    }, [sourceType, sourceLevel, sourcePage, sourceLimit]);


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
        if (isJLPTMode) navigate("/jlpt");
        else navigate("/dictionary/notebook");
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
                                                <span>{currentIndex + 1} / {total}</span>
                                            </div>

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

                                        <div className={cx("actions")}>
                                            <button
                                                type="button"
                                                className={cx("controlBtn", "ghost")}
                                                onClick={handleReset}
                                            >
                                                <FontAwesomeIcon icon={faRotate} />
                                                Bắt đầu lại
                                            </button>

                                            <button
                                                type="button"
                                                className={cx("controlBtn")}
                                                onClick={handlePrevious}
                                                disabled={currentIndex <= 0}
                                            >
                                                <FontAwesomeIcon icon={faChevronLeft} />
                                                Trước
                                            </button>

                                            <button
                                                type="button"
                                                className={cx("controlBtn", "primary")}
                                                onClick={handleNext}
                                                disabled={currentIndex >= total - 1}
                                            >
                                                Tiếp theo
                                                <FontAwesomeIcon icon={faChevronRight} />
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

