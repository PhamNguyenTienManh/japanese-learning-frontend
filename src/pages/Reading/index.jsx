import React, { useState, useEffect } from "react";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faHeart,
    faVolumeHigh,
    faPlus,
    faPlay,
    faPause,
} from "@fortawesome/free-solid-svg-icons";

import Button from "~/components/Button";
import Card from "~/components/Card";
import styles from "./Reading.module.scss";

const cx = classNames.bind(styles);

const readingArticles = [
    {
        id: "1",
        title: "日本の秋祭り",
        hiragana: "にほんのあきまつり",
        content:
            "日本の秋祭りは、色とりどりの紅葉とともに行われます。屋台や神輿など、にぎやかな雰囲気が楽しめます。",
        image:
            "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/attachments/gen-images/public/japanese-seafood-shells-nIV9KBSzmKHcyhXtcEfalFhFx4LzFb.jpg",
        difficulty: "easy",
        date: "2025-11-25 03:01:17Z",
        read: true,
        audioDuration: 95, // giây
    },
    {
        id: "2",
        title: "日本の朝ごはん",
        hiragana: "にほんのあさごはん",
        content:
            "日本の朝ごはんには、ごはん、みそしる、さかな、たまごやさいなど、バランスのよい料理がならびます。",
        image:
            "https://images.pexels.com/photos/1580466/pexels-photo-1580466.jpeg?auto=compress&cs=tinysrgb&w=1200",
        difficulty: "easy",
        date: "2025-11-25 03:01:12Z",
        read: false,
        audioDuration: 120,
    },
    {
        id: "3",
        title: "世界のニュースを読む",
        hiragana: "せかいのにゅーすをよむ",
        content:
            "インターネットを使えば、世界中のニュースを日本語で読むことができます。語彙力アップにも役立ちます。",
        image:
            "https://images.pexels.com/photos/261949/pexels-photo-261949.jpeg?auto=compress&cs=tinysrgb&w=1200",
        difficulty: "hard",
        date: "2025-11-25 03:00:00Z",
        read: false,
        audioDuration: 150,
    },
];

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
    const [selectedArticle, setSelectedArticle] = useState(readingArticles[0]);
    const [difficulty, setDifficulty] = useState("all");
    const [showFurigana, setShowFurigana] = useState(true);
    const [likedIds, setLikedIds] = useState([]);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);

    const filteredArticles = readingArticles.filter(
        (article) =>
            difficulty === "all" || article.difficulty === difficulty
    );

    const currentDuration = selectedArticle.audioDuration || 0;
    const progressPercent = currentDuration
        ? (currentTime / currentDuration) * 100
        : 0;

    // fake nghe chạy
    useEffect(() => {
        if (!isPlaying) return;

        const interval = setInterval(() => {
            setCurrentTime((prev) => {
                if (prev >= currentDuration) {
                    setIsPlaying(false);
                    return currentDuration;
                }
                return prev + 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isPlaying, currentDuration]);

    // reset khi đổi bài
    useEffect(() => {
        setCurrentTime(0);
        setIsPlaying(false);
    }, [selectedArticle.id]);

    const handleToggleLike = (id) => {
        setLikedIds((prev) =>
            prev.includes(id)
                ? prev.filter((x) => x !== id)
                : [...prev, id]
        );
    };

    const handleSeek = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const ratio = x / rect.width;
        const newTime = Math.max(
            0,
            Math.min(currentDuration * ratio, currentDuration)
        );
        setCurrentTime(newTime);
    };

    const isLiked = likedIds.includes(selectedArticle.id);

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

                    <label className={cx("furiganaToggle")}>
                        <input
                            type="checkbox"
                            checked={showFurigana}
                            onChange={(e) =>
                                setShowFurigana(e.target.checked)
                            }
                            className={cx("checkbox")}
                        />
                        <span className={cx("furiganaLabel")}>
                            Hiển thị Furigana
                        </span>
                    </label>
                </div>

                {/* layout 2 cột */}
                <div className={cx("layout")}>
                    {/* sidebar list */}
                    <aside className={cx("sidebar")}>
                        {filteredArticles.map((article) => (
                            <Card
                                key={article.id}
                                className={{ active: selectedArticle.id === article.id, }}
                                onClick={() =>
                                    setSelectedArticle(article)
                                }
                            >
                                <div className={cx("articleItemInner")}>
                                    <div className={cx("thumb")}>
                                        <img
                                            src={
                                                article.image ||
                                                "/placeholder.svg"
                                            }
                                            alt={article.title}
                                            className={cx("thumbImage")}
                                        />
                                    </div>

                                    <div className={cx("articleInfo")}>
                                        <h3
                                            className={cx(
                                                "articleTitle"
                                            )}
                                        >
                                            {article.title}
                                        </h3>
                                        {showFurigana && (
                                            <p
                                                className={cx(
                                                    "articleHiragana"
                                                )}
                                            >
                                                {article.hiragana}
                                            </p>
                                        )}

                                        <div
                                            className={cx(
                                                "articleMeta"
                                            )}
                                        >
                                            <span
                                                className={cx(
                                                    "articleDate"
                                                )}
                                            >
                                                {article.date}
                                            </span>
                                            {article.read && (
                                                <span
                                                    className={cx(
                                                        "readDot"
                                                    )}
                                                />
                                            )}
                                        </div>

                                        <span
                                            className={cx(
                                                "moreLink"
                                            )}
                                        >
                                            Xem thêm →
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </aside>

                    {/* nội dung bài */}
                    <section className={cx("content")}>
                        <Card className={cx("articleCard")}>
                            {/* header bài */}
                            <div className={cx("articleHeader")}>
                                <div
                                    className={cx(
                                        "articleHeaderMain"
                                    )}
                                >
                                    <h2
                                        className={cx(
                                            "articleMainTitle"
                                        )}
                                    >
                                        {selectedArticle.title}
                                    </h2>
                                    {showFurigana && (
                                        <p
                                            className={cx(
                                                "articleMainHiragana"
                                            )}
                                        >
                                            {selectedArticle.hiragana}
                                        </p>
                                    )}
                                    <p
                                        className={cx(
                                            "articleMainDate"
                                        )}
                                    >
                                        {selectedArticle.date}
                                    </p>
                                </div>

                                <Button
                                    iconOnly
                                    className={cx(
                                        "likeButton",
                                        {
                                            liked: isLiked,
                                        }
                                    )}
                                    onClick={() =>
                                        handleToggleLike(
                                            selectedArticle.id
                                        )
                                    }
                                    leftIcon={
                                        <FontAwesomeIcon
                                            icon={faHeart}
                                        />
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

                            {/* thanh nghe */}
                            <div className={cx("audioPlayer")}>
                                <div
                                    className={cx(
                                        "audioControlsRow"
                                    )}
                                >
                                    <Button
                                        outline
                                        iconOnly
                                        className={cx(
                                            "audioPlayButton",
                                        )}
                                        onClick={() => {
                                            if (
                                                currentDuration === 0
                                            )
                                                return;
                                            setIsPlaying(
                                                (prev) => !prev
                                            );
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
                                    <div
                                        className={cx(
                                            "audioInfo"
                                        )}
                                    >
                                        <FontAwesomeIcon
                                            icon={faVolumeHigh}
                                            className={cx(
                                                "audioIcon"
                                            )}
                                        />
                                        <span
                                            className={cx(
                                                "audioTime"
                                            )}
                                        >
                                            {formatTime(
                                                currentTime
                                            )}
                                            /
                                            {formatTime(
                                                currentDuration
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <div
                                    className={cx(
                                        "audioProgressBar"
                                    )}
                                    onClick={handleSeek}
                                >
                                    <div
                                        className={cx(
                                            "audioProgress"
                                        )}
                                        style={{
                                            width: `${progressPercent}%`,
                                        }}
                                    />
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
                                    leftIcon={
                                        <FontAwesomeIcon
                                            icon={faVolumeHigh}
                                        />
                                    }
                                >
                                    Nghe lại từ đầu
                                </Button>
                                <Button
                                    outline
                                    className={cx(
                                        "toolButton",
                                        "no-margin"
                                    )}
                                    leftIcon={
                                        <FontAwesomeIcon
                                            icon={faPlus}
                                        />
                                    }
                                >
                                    Thêm vào sổ tay
                                </Button>
                            </div>
                        </Card>
                    </section>
                </div>
            </div>
        </div>
    );
}
