import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faBookOpen,
    faGraduationCap,
    faRobot,
    faNewspaper,
} from "@fortawesome/free-solid-svg-icons";

import WordCard from "~/components/WordCard";
import styles from "./Home.module.scss";
import SearchInput from "~/components/searchInput/searchInput";
import searchHistoryService from "~/services/searchHistoryService";
import decodeToken from "~/services/pairToken";
import trendingWordsService from "~/services/homeService";
import handlePlayAudio from "~/services/handlePlayAudio";

const cx = classNames.bind(styles);

const mockWords = [
    {
        id: 1,
        kanji: "勉強",
        hiragana: "べんきょう",
        romaji: "benkyou",
        meaning: "học tập, học hành",
        jlptLevel: "N5",
        examples: [
            {
                japanese: "毎日日本語を勉強します。",
                vietnamese: "Tôi học tiếng Nhật mỗi ngày.",
            },
        ],
    },
    {
        id: 2,
        kanji: "学校",
        hiragana: "がっこう",
        romaji: "gakkou",
        meaning: "trường học",
        jlptLevel: "N5",
        examples: [
            {
                japanese: "学校に行きます。",
                vietnamese: "Tôi đi đến trường.",
            },
        ],
    },
    {
        id: 3,
        kanji: "先生",
        hiragana: "せんせい",
        romaji: "sensei",
        meaning: "giáo viên, thầy/cô",
        jlptLevel: "N5",
        examples: [
            {
                japanese: "田中先生は優しいです。",
                vietnamese: "Thầy Tanaka rất tốt bụng.",
            },
        ],
    },
];

const shortcuts = [
    {
        to: "/dictionary",
        icon: faBookOpen,
        title: "Từ điển",
        desc: "Tra từ vựng, kanji, ngữ pháp",
        iconClass: "iconTeal",
    },
    {
        to: "/jlpt",
        icon: faGraduationCap,
        title: "JLPT",
        desc: "Luyện thi từ N5 đến N1",
        iconClass: "iconOrange",
    },
    {
        to: "/reading",
        icon: faNewspaper,
        title: "Luyện đọc",
        desc: "Tin tức song ngữ + audio",
        iconClass: "iconYellow",
    },
    {
        to: "/chat-ai",
        icon: faRobot,
        title: "AI Chat",
        desc: "Trò chuyện cùng AI bằng tiếng Nhật",
        iconClass: "iconMint",
    },
];

function Home() {
    const navigate = useNavigate();
    const [savedWords, setSavedWords] = useState([]);
    const [searchHistory, setSearchHistory] = useState([]);
    const [trendingWords, setTrendingWords] = useState([]);
    const [isLoadingTrending, setIsLoadingTrending] = useState(true);

    const payload = decodeToken(localStorage.getItem("token"));
    const userId = payload?.sub;

    useEffect(() => {
        fetchSearchHistory();
        fetchTrendingWords();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchSearchHistory = async () => {
        try {
            const result = await searchHistoryService.getSearchHistory(userId);
            if (result.success) {
                setSearchHistory(result.history);
            }
        } catch (error) {
            console.error("Error fetching search history:", error);
        }
    };

    const fetchTrendingWords = async () => {
        setIsLoadingTrending(true);
        try {
            const result = await trendingWordsService.getTrendingWords(5);

            if (result.success) {
                setTrendingWords(result.data.data);
            } else {
                setTrendingWords([]);
            }
        } catch (error) {
            console.error("Error fetching trending words:", error);
            setTrendingWords([]);
        } finally {
            setIsLoadingTrending(false);
        }
    };

    const addToSearchHistory = async (keyword) => {
        if (!userId) return;
        try {
            await searchHistoryService.addSearchHistory(userId, keyword.trim());
            fetchSearchHistory();
            fetchTrendingWords();
        } catch (error) {
            console.error("Error adding to search history:", error);
        }
    };

    const handleSearch = (keyword) => {
        const q = keyword.trim();
        if (!q) return;

        addToSearchHistory(q);

        navigate("/kanji", {
            state: {
                searchQuery: q,
                tab: "vocab",
            },
        });
    };

    const removeHistoryItem = async (query) => {
        try {
            await searchHistoryService.removeSearchHistory(userId, query);
            fetchSearchHistory();
        } catch (error) {
            console.error("Error removing history item:", error);
        }
    };

    const clearAllHistory = async () => {
        try {
            await searchHistoryService.clearAllHistory(userId);
            setSearchHistory([]);
        } catch (error) {
            console.error("Error clearing history:", error);
        }
    };

    const toggleSaveWord = (id) => {
        setSavedWords((prev) =>
            prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]
        );
    };

    const hasHistory = Array.isArray(searchHistory) && searchHistory.length > 0;
    const hasTrending = Array.isArray(trendingWords) && trendingWords.length > 0;

    return (
        <div className={cx("wrapper")}>
            <div className={cx("blob1")} />
            <div className={cx("blob2")} />

            <div className={cx("container")}>
                {/* Hero */}
                <section className={cx("hero")}>
                    <div className={cx("greeting")}>Chào ngày mới!</div>
                    <h1 className={cx("title")}>
                        Hôm nay bạn muốn học{" "}
                        <span className={cx("titleAccent")}>gì?</span>
                    </h1>
                    <p className={cx("subtitle")}>
                        Tra từ điển, luyện thi JLPT, đọc tin tức tiếng Nhật và trò chuyện
                        cùng AI — tất cả trong một nơi.
                    </p>
                    <div className={cx("searchWrap")}>
                        <SearchInput onSearch={handleSearch} />
                    </div>

                    {hasHistory && (
                        <div className={cx("historyInline")}>
                            <span className={cx("historyInlineLabel")}>Tìm gần đây</span>
                            <div className={cx("historyChips")}>
                                {searchHistory.slice(0, 8).map((query, index) => (
                                    <div
                                        key={`${query}-${index}`}
                                        className={cx("historyChip")}
                                        onClick={() => handleSearch(query)}
                                    >
                                        <span className={cx("historyChipText")}>{query}</span>
                                        <button
                                            type="button"
                                            className={cx("historyChipClose")}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeHistoryItem(query);
                                            }}
                                            title="Xoá"
                                            aria-label="Xoá"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                className={cx("historyInlineClear")}
                                onClick={clearAllHistory}
                            >
                                Xoá tất cả
                            </button>
                        </div>
                    )}
                </section>

                {/* Quick shortcuts */}
                <div className={cx("shortcuts")}>
                    {shortcuts.map((s) => (
                        <Link key={s.to} to={s.to} className={cx("shortcut")}>
                            <span
                                className={cx("shortcutIcon", s.iconClass)}
                            >
                                <FontAwesomeIcon icon={s.icon} />
                            </span>
                            <div>
                                <h3 className={cx("shortcutTitle")}>{s.title}</h3>
                                <p className={cx("shortcutDesc")}>{s.desc}</p>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Trending */}
                <section className={cx("section")}>
                    <div className={cx("sectionHead")}>
                        <h2 className={cx("sectionTitle")}>Từ nổi bật</h2>
                    </div>

                    {isLoadingTrending ? (
                        <div className={cx("stateCard")}>Đang tải...</div>
                    ) : !hasTrending ? (
                        <div className={cx("stateCard")}>Chưa có dữ liệu</div>
                    ) : (
                        <div className={cx("trendingGrid")}>
                            {trendingWords.map((item, index) => (
                                <button
                                    key={`${item.term}-${index}`}
                                    type="button"
                                    className={cx("trendingItem")}
                                    onClick={() => handleSearch(item.term)}
                                >
                                    <span className={cx("trendingRank")}>{index + 1}</span>
                                    <div className={cx("trendingBody")}>
                                        <p className={cx("trendingTerm")}>{item.term}</p>
                                        <span className={cx("trendingMeta")}>
                                            {item.count.toLocaleString()} lượt tìm
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </section>

                {/* Featured words */}
                <section className={cx("section")}>
                    <div className={cx("sectionHead")}>
                        <h2 className={cx("sectionTitle")}>Từ vựng gợi ý hôm nay</h2>
                    </div>

                    <div className={cx("results")}>
                        {mockWords.map((word) => (
                            <WordCard
                                key={word.id}
                                word={word}
                                saved={savedWords.includes(word.id)}
                                onToggleSave={toggleSaveWord}
                                onPlay={handlePlayAudio}
                            />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}

export default Home;
