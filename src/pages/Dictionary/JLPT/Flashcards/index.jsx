import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import classNames from "classnames/bind";
import styles from "./Flashcards.module.scss";
import { getJlptWords, getJlptKanji, getJlptGrammar } from "~/services/jlptService";
import Button from "~/components/Button";
import Card from "~/components/Card";
import Progress from "~/components/Progress";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeft,
    faRotate,
    faChevronRight,
    faVolumeUp,
} from "@fortawesome/free-solid-svg-icons";

const cx = classNames.bind(styles);


export default function JLPTFlashcard() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const sourceType = searchParams.get("type");
    const sourceLevel = searchParams.get("level");
    const isJLPTMode = searchParams.get("source") === "jlpt";

    const [allCards, setAllCards] = useState([]);
    const [filteredCards, setFilteredCards] = useState([]);

    const [selectedCategory, setSelectedCategory] = useState("Tất cả");
    const [showFilter, setShowFilter] = useState(false);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [completed, setCompleted] = useState(0);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);


    const fetchJLPTData = async () => {
        try {
            setLoading(true);
            setError(null);

            let response;
            const itemsPerPage = 1000;

            if (sourceType === "word") {
                response = await getJlptWords(1, itemsPerPage, sourceLevel);
            } else if (sourceType === "grammar") {
                response = await getJlptGrammar(1, itemsPerPage, sourceLevel);
            } else if (sourceType === "kanji") {
                response = await getJlptKanji(1, itemsPerPage, sourceLevel);
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
            }
        } catch (err) {
            console.error("Failed:", err);
            setError("Không thể tải dữ liệu JLPT");
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        if (isJLPTMode && sourceType && sourceLevel) {
            fetchJLPTData();
        }
    }, [sourceType, sourceLevel]);


    // ⭐ FILTER CATEGORY (áp dụng cho Flashcard Notebook)
    useEffect(() => {
        if (!allCards.length) return;

        if (isJLPTMode) {
            setFilteredCards(allCards);
            return;
        }

        if (selectedCategory === "Tất cả") {
            setFilteredCards(allCards);
        } else {
            setFilteredCards(allCards.filter(c => c.type === selectedCategory));
        }

        setCurrentIndex(0);
        setIsFlipped(false);

    }, [selectedCategory, allCards]);


    const total = filteredCards.length;
    const currentCard = filteredCards[currentIndex] ?? null;
    const progress = total > 0 ? Math.round(((currentIndex + 1) / total) * 100) : 0;


    const handleNext = () => {
        if (currentIndex < total - 1) {
            setCurrentIndex(i => i + 1);
            setIsFlipped(false);
            setCompleted(c => c + 1);
        }
    };

    const handleReset = () => {
        setCurrentIndex(0);
        setIsFlipped(false);
        setCompleted(0);
    };

    const playAudio = (text) => {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "ja-JP";
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
    };

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        setShowFilter(false);
    };

    const handleBack = () => {
        if (isJLPTMode) navigate("/jlpt");
        else navigate("/dictionary/notebook");
    };

    const ErrorMessage = () =>
        error ? (
            <div className={cx("error-message")}>
                <p>{error}</p>
                <button onClick={() => setError(null)}>✕</button>
            </div>
        ) : null;


    const getDisplayTitle = () => {
        const typeLabel =
            sourceType === "word" ? "Từ vựng" :
                sourceType === "grammar" ? "Ngữ pháp" : "Hán tự";
        return `JLPT ${sourceLevel} - ${typeLabel}`;
    };



    return (
        <div className={cx("root")}>
            <div className={cx("container")}>
                <ErrorMessage />

                <div className={cx("header")}>
                    <Button
                        onClick={handleBack}
                        back
                        leftIcon={<FontAwesomeIcon icon={faArrowLeft} />}
                    >
                        Quay lại
                    </Button>

                    <h1 className={cx("title")}>{getDisplayTitle()}</h1>
                    <p className={cx("subtitle")}>
                        {total > 0 ? `Thẻ ${currentIndex + 1} / ${total}` : "Không có thẻ nào"}
                    </p>
                </div>
            </div>

            {loading && (
                <div className={cx("loading")}>
                    <p>Đang tải...</p>
                </div>
            )}

            {!loading && (
                <>
                    {total > 0 && (
                        <div className={cx("progress-wrap")}>
                            <Progress value={progress} className={cx("progress")} />
                        </div>
                    )}

                    <div className={cx("flashcard-area")}>
                        {currentCard ? (
                            <>
                                <Card
                                    className={cx("card", { flipped: isFlipped })}
                                    onClick={() => setIsFlipped(f => !f)}
                                >
                                    {!isFlipped ? (
                                        <div className={cx("front")}>
                                            <h2 className={cx("kanji")}>{currentCard.name}</h2>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    playAudio(currentCard.phonetic || currentCard.mean);
                                                }}
                                                className={cx("audio-btn")}
                                            >
                                                <FontAwesomeIcon icon={faVolumeUp} />
                                            </Button>
                                            <p className={cx("hint")}>Nhấn để xem nghĩa</p>
                                        </div>
                                    ) : (
                                        <div className={cx("back")}>
                                            <p className={cx("meaning")}>{currentCard.mean}</p>
                                            <p className={cx("meta-hira")}>{currentCard.phonetic}</p>
                                            {currentCard.notes && (
                                                <p className={cx("note")}><strong>Ví dụ:</strong> {currentCard.notes}</p>
                                            )}
                                            <p className={cx("hint")}>Nhấn để quay lại</p>
                                        </div>
                                    )}
                                </Card>

                                <div className={cx("actions")}>
                                    <Button outline onClick={handleReset} className={"orange"}>
                                        <FontAwesomeIcon icon={faRotate} />
                                        Bắt đầu lại
                                    </Button>

                                    <Button
                                        onClick={handleNext}
                                        disabled={currentIndex >= total - 1}
                                        className={"green"}
                                    >
                                        Tiếp theo
                                        <FontAwesomeIcon icon={faChevronRight} />
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <Card className={cx("empty")}>
                                <h2>{total === 0 ? "Chưa có thẻ nào" : "Hoàn thành!"}</h2>
                            </Card>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

