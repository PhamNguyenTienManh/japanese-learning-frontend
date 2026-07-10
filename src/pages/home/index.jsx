import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faBookOpen,
    faGraduationCap,
    faRobot,
    faNewspaper,
    faClockRotateLeft,
    faMagnifyingGlass,
    faPenNib,
    faBolt,
    faArrowRight,
} from "@fortawesome/free-solid-svg-icons";

import styles from "./Home.module.scss";
import SearchInput from "~/components/searchInput/searchInput";
import searchHistoryService from "~/services/searchHistoryService";
import trendingWordsService from "~/services/homeService";
import { useAuth } from "~/context/AuthContext";
import { getLearningPathStatus } from "~/services/learningPathService";

const cx = classNames.bind(styles);

const shortcuts = [
    {
        to: "/kanji",
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

const activityActions = [
    {
        to: "/jlpt?type=word",
        icon: faBolt,
        title: "Ôn nhanh JLPT",
        desc: "Vào danh sách từ vựng đang học",
    },
    {
        to: "/jlpt?writing=1",
        icon: faPenNib,
        title: "Luyện viết Kanji",
        desc: "Mở file viết tay theo cấp độ",
    },
    {
        to: "/chat-ai",
        icon: faRobot,
        title: "Hỏi AI tiếng Nhật",
        desc: "Giải thích từ hoặc mẫu câu khó",
    },
];

function Home() {
    const navigate = useNavigate();
    const [searchHistory, setSearchHistory] = useState([]);
    const [trendingWords, setTrendingWords] = useState([]);
    const [isLoadingTrending, setIsLoadingTrending] = useState(true);
    const [showLearningPathPrompt, setShowLearningPathPrompt] = useState(false);
    const { userId, isLoading: authLoading } = useAuth();

    useEffect(() => {
        if (userId) {
            fetchSearchHistory();
        } else {
            setSearchHistory([]);
        }
        fetchTrendingWords();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    useEffect(() => {
        if (authLoading || !userId) {
            setShowLearningPathPrompt(false);
            return;
        }

        let ignore = false;

        async function checkLearningPath() {
            try {
                const dismissedKey = `learning_path_prompt_dismissed_${userId}`;
                if (sessionStorage.getItem(dismissedKey) === "true") {
                    return;
                }

                const result = await getLearningPathStatus();
                if (!ignore && !result?.hasLearningPath) {
                    setShowLearningPathPrompt(true);
                }
            } catch (error) {
                console.error("Error checking learning path status:", error);
            }
        }

        checkLearningPath();

        return () => {
            ignore = true;
        };
    }, [authLoading, userId]);

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

    const closeLearningPathPrompt = () => {
        if (userId) {
            sessionStorage.setItem(`learning_path_prompt_dismissed_${userId}`, "true");
        }
        setShowLearningPathPrompt(false);
    };

    const hasHistory = Array.isArray(searchHistory) && searchHistory.length > 0;
    const hasTrending = Array.isArray(trendingWords) && trendingWords.length > 0;
    const recentActivities = hasHistory ? searchHistory.slice(0, 5) : [];

    return (
        <div className={cx("wrapper")}>
            {showLearningPathPrompt && (
                <div className={cx("modalBackdrop")} role="dialog" aria-modal="true">
                    <div className={cx("learningPathModal")}>
                        <div className={cx("modalEyebrow")}>Lộ trình cá nhân hóa</div>
                        <h2 className={cx("modalTitle")}>
                            Tạo lộ trình học phù hợp với bạn
                        </h2>
                        <p className={cx("modalText")}>
                            Tài khoản của bạn chưa có lộ trình học. Hãy trả lời vài câu
                            hỏi ngắn để hệ thống gợi ý trình độ, mục tiêu và kế hoạch học
                            mỗi tuần.
                        </p>
                        <div className={cx("modalActions")}>
                            <button
                                type="button"
                                className={cx("modalSecondary")}
                                onClick={closeLearningPathPrompt}
                            >
                                Để sau
                            </button>
                            <button
                                type="button"
                                className={cx("modalPrimary")}
                                onClick={() => navigate("/onboarding")}
                            >
                                Tạo lộ trình ngay
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className={cx("blob1")} />
            <div className={cx("blob2")} />

            <div className={cx("container")}>
                {/* Hero */}
                <section className={cx("hero")}>
                    <div className={cx("greeting")}>Chào ngày mới!</div>
                    <h1 className={cx("title")}>
                        Hôm nay bạn muốn học{" "}
                        <span className={cx("titleAccent")}>
                            <span className={cx("accentWord")}>gì</span>
                            <span className={cx("questionMark")}>?</span>
                        </span>
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

                {/* Recent activity */}
                <section className={cx("section")}>
                    <div className={cx("sectionHead")}>
                        <h2 className={cx("sectionTitle")}>Hoạt động gần đây</h2>
                    </div>

                    <div className={cx("activityPanel")}>
                        <div className={cx("activityMain")}>
                            <div className={cx("activityMainHead")}>
                                <span className={cx("activityMainIcon")}>
                                    <FontAwesomeIcon icon={faClockRotateLeft} />
                                </span>
                                <div>
                                    <h3 className={cx("activityTitle")}>Tra cứu vừa rồi</h3>
                                    <p className={cx("activityDesc")}>
                                        Quay lại nhanh các từ bạn đã tìm gần đây.
                                    </p>
                                </div>
                            </div>

                            {recentActivities.length ? (
                                <div className={cx("activityList")}>
                                    {recentActivities.map((query, index) => (
                                        <button
                                            key={`${query}-${index}`}
                                            type="button"
                                            className={cx("activityItem")}
                                            onClick={() => handleSearch(query)}
                                        >
                                            <span className={cx("activityItemIcon")}>
                                                <FontAwesomeIcon icon={faMagnifyingGlass} />
                                            </span>
                                            <span className={cx("activityItemText")}>{query}</span>
                                            <span className={cx("activityItemMeta")}>
                                                Tra lại
                                                <FontAwesomeIcon icon={faArrowRight} />
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className={cx("activityEmpty")}>
                                    <strong>Chưa có lịch sử tra cứu</strong>
                                </div>
                            )}
                        </div>

                        <div className={cx("activitySide")}>
                            {activityActions.map((action) => (
                                <Link key={action.to} to={action.to} className={cx("activityAction")}>
                                    <span className={cx("activityActionIcon")}>
                                        <FontAwesomeIcon icon={action.icon} />
                                    </span>
                                    <span className={cx("activityActionBody")}>
                                        <strong>{action.title}</strong>
                                        <span>{action.desc}</span>
                                    </span>
                                    <FontAwesomeIcon icon={faArrowRight} className={cx("activityActionArrow")} />
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default Home;
