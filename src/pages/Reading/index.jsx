import React, { useState, useEffect, useRef } from "react";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faVolumeHigh,
    faPlus,
    faPlay,
    faPause,
} from "@fortawesome/free-solid-svg-icons";

import Button from "~/components/Button";
import Card from "~/components/Card";
import { getNews } from "~/services/newsService";
import styles from "./Reading.module.scss";

const cx = classNames.bind(styles);

const difficultyOptions = [
    { value: "all", label: "Tất cả" },
    { value: "easy", label: "Dễ" },
    { value: "hard", label: "Khó" },
];

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function Reading() {
    const [readingArticles, setReadingArticles] = useState([]);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [difficulty, setDifficulty] = useState("all");
    const [likedIds, setLikedIds] = useState([]);
    const [loading, setLoading] = useState(true);

    const [audioElement, setAudioElement] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    const progressBarRef = useRef(null);

    // Fetch data từ API
    useEffect(() => {
        const fetchArticles = async () => {
            try {
                setLoading(true);
                const response = await getNews();

                if (response.success && response.data) {
                    // Transform API data to component format
                    const transformedArticles = response.data.map(item => ({
                        id: item._id,
                        title: item.title,
                        content: item.content.textbody,
                        image: item.content.image,
                        audioUrl: item.content.audio,
                        difficulty: item.type,
                        date: new Date(item.dateField).toLocaleDateString('vi-VN'),
                        read: false,
                    }));

                    setReadingArticles(transformedArticles);
                    if (transformedArticles.length > 0) {
                        setSelectedArticle(transformedArticles[0]);
                    }
                }
            } catch (error) {
                console.error("Error fetching articles:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchArticles();
    }, []);

    const filteredArticles = readingArticles.filter(
        (article) =>
            difficulty === "all" || article.difficulty === difficulty
    );

    const progressPercent = duration ? (currentTime / duration) * 100 : 0;

    // Tạo audio element khi component mount hoặc khi đổi bài
    useEffect(() => {
        if (!selectedArticle) return;

        // Dọn dẹp audio cũ
        if (audioElement) {
            audioElement.pause();
            audioElement.src = "";
        }

        // Tạo audio mới
        const audio = new Audio(selectedArticle.audioUrl);

        // Event listeners
        audio.addEventListener("loadedmetadata", () => {
            setDuration(audio.duration);
        });

        audio.addEventListener("timeupdate", () => {
            if (!isDragging) {
                setCurrentTime(audio.currentTime);
            }
        });

        audio.addEventListener("ended", () => {
            setIsPlaying(false);
            setCurrentTime(0);
        });

        audio.addEventListener("error", (e) => {
            console.error("Audio error:", e);
        });

        setAudioElement(audio);
        setIsPlaying(false);
        setCurrentTime(0);

        // Cleanup
        return () => {
            audio.pause();
            audio.src = "";
        };
    }, [selectedArticle?.id]);

    // Xử lý play/pause
    useEffect(() => {
        if (!audioElement) return;

        if (isPlaying) {
            audioElement.play().catch((e) => {
                console.error("Play error:", e);
                setIsPlaying(false);
            });
        } else {
            audioElement.pause();
        }
    }, [isPlaying, audioElement]);

    const handleToggleLike = (id) => {
        setLikedIds((prev) =>
            prev.includes(id)
                ? prev.filter((x) => x !== id)
                : [...prev, id]
        );
    };

    const calculateTimeFromPosition = (clientX) => {
        if (!progressBarRef.current || !duration) return 0;

        const rect = progressBarRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const ratio = x / rect.width;
        return Math.max(0, Math.min(duration * ratio, duration));
    };

    const handleProgressMouseDown = (e) => {
        if (!audioElement || !duration) return;

        setIsDragging(true);
        const newTime = calculateTimeFromPosition(e.clientX);
        setCurrentTime(newTime);
    };

    const handleProgressMouseMove = (e) => {
        if (!isDragging) return;

        const newTime = calculateTimeFromPosition(e.clientX);
        setCurrentTime(newTime);
    };

    const handleProgressMouseUp = (e) => {
        if (!isDragging || !audioElement) return;

        const newTime = calculateTimeFromPosition(e.clientX);
        audioElement.currentTime = newTime;
        setCurrentTime(newTime);
        setIsDragging(false);
    };

    // Global mouse events for dragging
    useEffect(() => {
        const handleGlobalMouseMove = (e) => {
            if (isDragging) {
                handleProgressMouseMove(e);
            }
        };

        const handleGlobalMouseUp = (e) => {
            if (isDragging) {
                handleProgressMouseUp(e);
            }
        };

        if (isDragging) {
            document.addEventListener("mousemove", handleGlobalMouseMove);
            document.addEventListener("mouseup", handleGlobalMouseUp);
        }

        return () => {
            document.removeEventListener("mousemove", handleGlobalMouseMove);
            document.removeEventListener("mouseup", handleGlobalMouseUp);
        };
    }, [isDragging, duration, audioElement]);

    const handleRestart = () => {
        if (!audioElement) return;

        audioElement.currentTime = 0;
        setCurrentTime(0);
        setIsPlaying(true);
    };

    const isLiked = selectedArticle ? likedIds.includes(selectedArticle.id) : false;

    if (loading) {
        return (
            <div className={cx("wrapper")}>
                <div className={cx("inner")}>
                    <div className={cx("header")}>
                        <h1 className={cx("title")}>Luyện đọc</h1>
                    </div>
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <p>Đang tải bài viết...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!selectedArticle) {
        return (
            <div className={cx("wrapper")}>
                <div className={cx("inner")}>
                    <div className={cx("header")}>
                        <h1 className={cx("title")}>Luyện đọc</h1>
                    </div>
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <p>Không có bài viết nào</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={cx("wrapper")}>
            <div className={cx("inner")}>
                {/* header */}
                <div className={cx("header")}>
                    <h1 className={cx("title")}>Luyện đọc</h1>
                </div>

                {/* hàng filter */}
                <div className={cx("controlsRow")}>
                    <div className={cx("difficultyGroup")}>
                        {difficultyOptions.map((opt) => (
                            <Button
                                key={opt.value}
                                primary={difficulty === opt.value}
                                outline={difficulty !== opt.value}
                                className={cx("difficultyButton", {
                                    active: difficulty === opt.value,
                                    easy: opt.value === "easy",
                                    hard: opt.value === "hard",
                                })}
                                onClick={() => setDifficulty(opt.value)}
                            >
                                {opt.label}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className={cx("layout")}>
                    {/* sidebar list*/}
                    <aside className={cx("sidebar")}>
                        <div className={cx("sidebarScroll")}>
                            {filteredArticles.map((article) => (
                                <Card
                                    key={article.id}
                                    className={{ active: selectedArticle.id === article.id }}
                                    onClick={() => setSelectedArticle(article)}
                                >
                                    <div className={cx("articleItemInner")}>
                                        <div className={cx("thumb")}>
                                            <img
                                                src={article.image || "/placeholder.svg"}
                                                alt={article.title}
                                                className={cx("thumbImage")}
                                            />
                                        </div>

                                        <div className={cx("articleInfo")}>
                                            <h3 className={cx("articleTitle")}>
                                                {article.title}
                                            </h3>

                                            <div className={cx("articleMeta")}>
                                                <span className={cx("articleDate")}>
                                                    {article.date}
                                                </span>
                                                {article.read && (
                                                    <span className={cx("readDot")} />
                                                )}
                                            </div>

                                            <span className={cx("moreLink")}>
                                                Xem thêm →
                                            </span>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </aside>

                    {/* nội dung bài */}
                    <section className={cx("content")}>
                        <Card className={cx("articleCard")}>
                            {/* header bài */}
                            <div className={cx("articleHeader")}>
                                <div className={cx("articleHeaderMain")}>
                                    <h2 className={cx("articleMainTitle")}>
                                        {selectedArticle.title}
                                    </h2>
                                    <p className={cx("articleMainDate")}>
                                        {selectedArticle.date}
                                    </p>
                                </div>

                                <Button
                                    iconOnly
                                    className={cx("likeButton", {
                                        liked: isLiked,
                                    })}
                                    onClick={() =>
                                        handleToggleLike(selectedArticle.id)
                                    }
                                />
                            </div>

                            {/* ảnh */}
                            <div className={cx("imageWrap")}>
                                <img
                                    src={
                                        selectedArticle.image ||
                                        "/placeholder.svg"
                                    }
                                    alt={selectedArticle.title}
                                    className={cx("mainImage")}
                                />
                            </div>

                            {/* thanh nghe - CÓ DRAG */}
                            <div className={cx("audioPlayer")}>
                                <div className={cx("audioControlsRow")}>
                                    <Button
                                        outline
                                        iconOnly
                                        className={cx("audioPlayButton")}
                                        onClick={() => {
                                            if (!audioElement || duration === 0)
                                                return;
                                            setIsPlaying((prev) => !prev);
                                        }}
                                        leftIcon={
                                            <FontAwesomeIcon
                                                icon={
                                                    isPlaying
                                                        ? faPause
                                                        : faPlay
                                                }
                                            />
                                        }
                                    />
                                    <div className={cx("audioInfo")}>
                                        <FontAwesomeIcon
                                            icon={faVolumeHigh}
                                            className={cx("audioIcon")}
                                        />
                                        <span className={cx("audioTime")}>
                                            {formatTime(currentTime)} /{" "}
                                            {formatTime(duration)}
                                        </span>
                                    </div>
                                </div>

                                <div
                                    ref={progressBarRef}
                                    className={cx("audioProgressBar", {
                                        dragging: isDragging,
                                    })}
                                    onMouseDown={handleProgressMouseDown}
                                >
                                    <div
                                        className={cx("audioProgress")}
                                        style={{
                                            width: `${progressPercent}%`,
                                        }}
                                    >
                                        <div className={cx("audioProgressThumb")} />
                                    </div>
                                </div>
                            </div>

                            <div className={cx("articleText")}>
                                <p>{selectedArticle.content}</p>
                            </div>

                            <div className={cx("tools")}>
                                <Button
                                    outline
                                    className={cx(
                                        "toolButton",
                                        "no-margin"
                                    )}
                                    onClick={handleRestart}
                                    leftIcon={
                                        <FontAwesomeIcon
                                            icon={faVolumeHigh}
                                        />
                                    }
                                >
                                    Nghe lại từ đầu
                                </Button>
                            </div>
                        </Card>
                    </section>
                </div>
            </div>
        </div>
    );
}