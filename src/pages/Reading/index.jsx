import React, { useState, useEffect, useMemo, useRef } from "react";
import classNames from "classnames/bind";
import { useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeft,
    faVolumeHigh,
    faMicrophone,
    faStop,
    faXmark,
    faSpinner,
    faRotateRight,
    faHeart,
    faEye,
} from "@fortawesome/free-solid-svg-icons";

import { useAuth } from "~/context/AuthContext";
import {
    getNews,
    getNewsEngagement,
    markNewsViewed,
    toggleNewsFavorite,
} from "~/services/newsService";
import { recordLearningResourceProgress } from "~/services/learningPathService";
import { assessPronunciation } from "~/services/voiceAssessService";
import { getFurigana } from "~/services/furiganaService";
import { showToast } from "~/components/ToastManager";
import GuidedCoachmark from "~/components/GuidedCoachmark";
import KanaReference from "~/components/KanaReference";
import styles from "./Reading.module.scss";

const cx = classNames.bind(styles);

const filterOptions = [
    { value: "all", label: "Tất cả" },
    { value: "easy", label: "Dễ" },
    { value: "hard", label: "Khó" },
    { value: "viewed", label: "Đã xem" },
    { value: "liked", label: "Yêu thích" },
];

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const KANJI_RE = /[㐀-鿿豈-﫿]/;

function renderFuriganaSegments(segments) {
    if (!segments) return null;
    return segments.map((seg, i) => {
        const orig = seg.orig || "";
        const hira = seg.hira || "";
        const needsRuby = hira && hira !== orig && KANJI_RE.test(orig);
        if (!needsRuby) {
            return <span key={i}>{orig}</span>;
        }
        return (
            <ruby key={i}>
                {orig}
                <rt>{hira}</rt>
            </ruby>
        );
    });
}

export default function Reading() {
    const location = useLocation();
    const [topTab, setTopTab] = useState("articles");
    const [readingArticles, setReadingArticles] = useState([]);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [articleFilter, setArticleFilter] = useState("all");
    const [likedIds, setLikedIds] = useState([]);
    const [viewedIds, setViewedIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [readyForPracticeTour, setReadyForPracticeTour] = useState(false);
    const [pendingPracticeTour, setPendingPracticeTour] = useState(false);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);

    const audioRef = useRef(null);
    const readingTourRef = useRef(null);
    const readingTourCardRef = useRef(null);
    const readingPracticeTourRef = useRef(null);
    const tourParam = useMemo(
        () => new URLSearchParams(location.search).get("tour"),
        [location.search]
    );
    const readingTourActive = tourParam === "reading";

    const [showPractice, setShowPractice] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState(null);
    const [recordedUrl, setRecordedUrl] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isAssessing, setIsAssessing] = useState(false);
    const [assessResult, setAssessResult] = useState(null);

    const mediaRecorderRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const recordingTimerRef = useRef(null);

    const [furiganaOn, setFuriganaOn] = useState(false);
    const [furiganaCache, setFuriganaCache] = useState({});
    const [furiganaLoading, setFuriganaLoading] = useState(false);

    const { isLoggedIn, isPremium, isLoading: authLoading } = useAuth();

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                setLoading(true);
                const response = await getNews();

                if (response.success && response.data) {
                    const transformedArticles = response.data
                        .filter(item => item.published === true)
                        .sort((a, b) => new Date(b.dateField) - new Date(a.dateField))
                        .map(item => ({
                            id: item._id,
                            title: item.title,
                            content: item.content.textbody,
                            image: item.content.image,
                            audioUrl: item.content.audio,
                            syncData: item.content.syncData || [],
                            difficulty: item.type,
                            date: new Date(item.dateField).toLocaleDateString('vi-VN'),
                            likeCount: item.likeCount ?? 0,
                            viewCount: item.viewCount ?? 0,
                            level: item.level,
                            read: Boolean(item.isViewed),
                        }));

                    setReadingArticles(transformedArticles);
                }
            } catch (error) {
                console.error("Error fetching articles:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchArticles();
    }, []);

    useEffect(() => {
        const fetchEngagement = async () => {
            if (authLoading) return;

            if (!isLoggedIn) {
                setLikedIds([]);
                setViewedIds([]);
                setReadingArticles((prev) =>
                    prev.map((article) => ({ ...article, read: false }))
                );
                return;
            }

            try {
                const response = await getNewsEngagement();
                const engagement = response.data || response;
                const liked = engagement.likedIds || [];
                const viewed = engagement.viewedIds || [];

                setLikedIds(liked);
                setViewedIds(viewed);
                setReadingArticles((prev) =>
                    prev.map((article) => ({
                        ...article,
                        read: viewed.includes(article.id),
                    }))
                );
                setSelectedArticle((prev) =>
                    prev
                        ? {
                            ...prev,
                            read: viewed.includes(prev.id),
                        }
                        : prev
                );
            } catch (error) {
                console.error("Error fetching reading engagement:", error);
            }
        };

        fetchEngagement();
    }, [authLoading, isLoggedIn]);

    const filteredArticles = readingArticles.filter((article) => {
        const isArticleViewed = article.read || viewedIds.includes(article.id);
        const isArticleLiked = likedIds.includes(article.id);

        if (articleFilter === "all") return true;
        if (articleFilter === "easy" || articleFilter === "hard") {
            return article.difficulty === articleFilter;
        }
        if (articleFilter === "viewed") return isArticleViewed;
        if (articleFilter === "liked") return isArticleLiked;
        return true;
    });

    const readingTourArticle = useMemo(() => {
        if (!readingTourActive || readingArticles.length === 0) return null;

        return (
            readingArticles.find(
                (article) => !article.read && !viewedIds.includes(article.id)
            ) || readingArticles[0]
        );
    }, [readingArticles, readingTourActive, viewedIds]);

    useEffect(() => {
        if (!readingTourActive || loading) return;

        setArticleFilter("all");
        setSelectedArticle(null);
    }, [loading, readingTourActive]);

    const selectedArticleId = selectedArticle?.id;

    useEffect(() => {
        if (!selectedArticleId) return;

        const audio = audioRef.current;
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
            audio.load();
        }
        setIsPlaying(false);
        setCurrentTime(0);
    }, [selectedArticleId]);

    useEffect(() => {
        if (!readingTourActive || !selectedArticle || !pendingPracticeTour) return undefined;

        setReadyForPracticeTour(false);
        window.scrollTo({ top: 0, behavior: "auto" });

        const scrollTimer = window.setTimeout(() => {
            const target = readingPracticeTourRef.current;
            if (!target) return;

            target.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "nearest",
            });
        }, 220);

        const showTimer = window.setTimeout(() => {
            setReadyForPracticeTour(true);
            setPendingPracticeTour(false);
        }, 620);

        return () => {
            window.clearTimeout(scrollTimer);
            window.clearTimeout(showTimer);
        };
    }, [pendingPracticeTour, readingTourActive, selectedArticle]);

    const updateArticleState = (id, updater) => {
        setReadingArticles((prev) =>
            prev.map((article) => (article.id === id ? updater(article) : article))
        );
        setSelectedArticle((prev) =>
            prev?.id === id ? updater(prev) : prev
        );
    };

    const handleToggleLike = async (id) => {
        if (!isLoggedIn) {
            showToast({
                type: "error",
                message: "Vui lòng đăng nhập để yêu thích bài đọc.",
            });
            return;
        }

        const wasLiked = likedIds.includes(id);
        const delta = wasLiked ? -1 : 1;

        setLikedIds((prev) =>
            wasLiked ? prev.filter((x) => x !== id) : [...prev, id]
        );
        updateArticleState(id, (article) => ({
            ...article,
            likeCount: Math.max(0, (article.likeCount || 0) + delta),
        }));

        try {
            const response = await toggleNewsFavorite(id);
            const data = response.data || response;

            setLikedIds((prev) =>
                data.liked
                    ? Array.from(new Set([...prev, id]))
                    : prev.filter((x) => x !== id)
            );
            updateArticleState(id, (article) => ({
                ...article,
                likeCount: data.likeCount ?? article.likeCount ?? 0,
            }));
        } catch (error) {
            console.error("Toggle reading favorite error:", error);
            setLikedIds((prev) =>
                wasLiked ? Array.from(new Set([...prev, id])) : prev.filter((x) => x !== id)
            );
            updateArticleState(id, (article) => ({
                ...article,
                likeCount: Math.max(0, (article.likeCount || 0) - delta),
            }));
            showToast({
                type: "error",
                message: "Không cập nhật được yêu thích. Vui lòng thử lại.",
            });
        }
    };

    const handleSelectArticle = (article) => {
        if (readingTourActive) {
            setPendingPracticeTour(true);
            setReadyForPracticeTour(false);
        }
        setSelectedArticle(article);
        window.scrollTo({ top: 0, behavior: "smooth" });

        if (viewedIds.includes(article.id) || article.read) return;

        markNewsViewed(article.id)
            .then((response) => {
                const data = response.data || response;
                if (isLoggedIn) {
                    setViewedIds((prev) =>
                        prev.includes(article.id) ? prev : [...prev, article.id]
                    );
                }
                updateArticleState(article.id, (currentArticle) => ({
                    ...currentArticle,
                    read: true,
                    viewCount: data.viewCount ?? currentArticle.viewCount ?? 0,
                }));
                if (isLoggedIn) {
                    recordLearningResourceProgress({
                        skill: "reading",
                        refKey: article.id,
                        metadata: {
                            title: article.title,
                            difficulty: article.difficulty,
                        },
                    }).catch((error) => {
                        console.error("Record reading progress error:", error);
                    });
                }
            })
            .catch((error) => {
                console.error("Mark reading viewed error:", error);
            });
    };

    const handleBackToList = () => {
        if (audioRef.current) {
            audioRef.current.pause();
        }
        setIsPlaying(false);
        setPendingPracticeTour(false);
        setReadyForPracticeTour(false);
        setSelectedArticle(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleRestart = () => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.currentTime = 0;
        setCurrentTime(0);
        audio.play().then(() => {
            setIsPlaying(true);
        }).catch((e) => {
            console.error("Play error:", e);
            setIsPlaying(false);
        });
    };

    const ensureFuriganaForArticle = async (article) => {
        if (!article || furiganaCache[article.id]) return;

        const usingSync = Array.isArray(article.syncData) && article.syncData.length > 0;
        const payload = usingSync
            ? article.syncData.map((s) => s.t || "")
            : [(article.content || "").replace(/\/n\/n/g, "\n\n")];

        try {
            setFuriganaLoading(true);
            const data = await getFurigana(payload);
            const segments = Array.isArray(data) ? data : [data];
            setFuriganaCache((prev) => ({
                ...prev,
                [article.id]: { mode: usingSync ? "sync" : "plain", segments },
            }));
        } catch (err) {
            console.error("Furigana fetch error:", err);
            showToast({
                type: "error",
                message: "Không tải được furigana. Vui lòng thử lại.",
            });
            setFuriganaOn(false);
        } finally {
            setFuriganaLoading(false);
        }
    };

    const handleToggleFurigana = async () => {
        if (!selectedArticle) return;
        const next = !furiganaOn;
        setFuriganaOn(next);
        if (next) {
            await ensureFuriganaForArticle(selectedArticle);
        }
    };

    useEffect(() => {
        if (furiganaOn && selectedArticle && !furiganaCache[selectedArticle.id]) {
            ensureFuriganaForArticle(selectedArticle);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedArticle?.id, furiganaOn]);

    const stopMediaTracks = () => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((t) => t.stop());
            mediaStreamRef.current = null;
        }
    };

    const clearRecordingTimer = () => {
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }
    };

    const resetPracticeState = () => {
        clearRecordingTimer();
        stopMediaTracks();
        if (recordedUrl) {
            URL.revokeObjectURL(recordedUrl);
        }
        recordedChunksRef.current = [];
        mediaRecorderRef.current = null;
        setIsRecording(false);
        setRecordedBlob(null);
        setRecordedUrl(null);
        setRecordingTime(0);
        setIsAssessing(false);
        setAssessResult(null);
    };

    const handleOpenPractice = () => {
        if (audioRef.current && isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
        if (isLoggedIn && !isPremium) {
            window.location.href = `/payment?plan=Pro`;
            return;
        }

        resetPracticeState();
        setShowPractice(true);
    };

    const handleClosePractice = () => {
        resetPracticeState();
        setShowPractice(false);
    };

    const handleStartRecording = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showToast({
                type: "error",
                message: "Trình duyệt không hỗ trợ ghi âm.",
            });
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    channelCount: 1,
                    sampleRate: 16000,
                    sampleSize: 16,
                },
            });
            mediaStreamRef.current = stream;

            const mimeCandidates = [
                "audio/webm;codecs=opus",
                "audio/webm",
                "audio/ogg;codecs=opus",
                "audio/mp4",
            ];
            const mimeType = mimeCandidates.find(
                (m) => window.MediaRecorder && MediaRecorder.isTypeSupported(m),
            ) || "";

            const recorderOptions = { audioBitsPerSecond: 128000 };
            if (mimeType) recorderOptions.mimeType = mimeType;
            const recorder = new MediaRecorder(stream, recorderOptions);
            mediaRecorderRef.current = recorder;
            recordedChunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    recordedChunksRef.current.push(e.data);
                }
            };

            recorder.onstop = () => {
                const type = recorder.mimeType || "audio/webm";
                const blob = new Blob(recordedChunksRef.current, { type });
                const url = URL.createObjectURL(blob);
                setRecordedBlob(blob);
                setRecordedUrl(url);
                stopMediaTracks();
                clearRecordingTimer();
                setIsRecording(false);
            };

            recorder.start();
            setIsRecording(true);
            setRecordedBlob(null);
            setRecordedUrl(null);
            setAssessResult(null);
            setRecordingTime(0);

            recordingTimerRef.current = setInterval(() => {
                setRecordingTime((t) => t + 1);
            }, 1000);
        } catch (err) {
            console.error("getUserMedia error:", err);
            showToast({
                type: "error",
                message: "Không thể truy cập micro. Vui lòng cấp quyền ghi âm.",
            });
            stopMediaTracks();
        }
    };

    const handleStopRecording = () => {
        const recorder = mediaRecorderRef.current;
        if (recorder && recorder.state !== "inactive") {
            recorder.stop();
        }
    };

    const handleRetake = () => {
        if (recordedUrl) URL.revokeObjectURL(recordedUrl);
        setRecordedBlob(null);
        setRecordedUrl(null);
        setAssessResult(null);
        setRecordingTime(0);
    };

    const handleSubmitAssessment = async () => {
        if (!recordedBlob || !selectedArticle) return;

        const targetText = (selectedArticle.content || "").replace(/\/n\/n/g, "\n\n");
        try {
            setIsAssessing(true);
            setAssessResult(null);
            const result = await assessPronunciation(recordedBlob, targetText);
            setAssessResult(result);
        } catch (err) {
            console.error("Assess error:", err);
            showToast({
                type: "error",
                message: "Chấm điểm thất bại. Vui lòng thử lại.",
            });
        } finally {
            setIsAssessing(false);
        }
    };

    useEffect(() => {
        return () => {
            clearRecordingTimer();
            stopMediaTracks();
            if (recordedUrl) URL.revokeObjectURL(recordedUrl);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const isLiked = selectedArticle ? likedIds.includes(selectedArticle.id) : false;
    const content = selectedArticle?.content?.replace(/\/n\/n/g, "\n\n") ?? "";

    const renderTopTabs = () => (
        <div className={cx("topTabs")}>
            <button
                type="button"
                className={cx("topTab", { active: topTab === "articles" })}
                onClick={() => setTopTab("articles")}
            >
                Bài đọc
            </button>
            <button
                type="button"
                className={cx("topTab", { active: topTab === "kana" })}
                onClick={() => {
                    setSelectedArticle(null);
                    setTopTab("kana");
                }}
            >
                Bảng chữ cái
            </button>
        </div>
    );

    const renderFrame = (body) => (
        <div className={cx("wrapper")}>
            <div className={cx("inner")}>
                <section className={cx("hero")}>
                    <div className={cx("heroCopy")}>
                        <span className={cx("eyebrow")}>Japanese reading studio</span>
                        <h1 className={cx("title")}>Luyện đọc tiếng Nhật</h1>
                        <p className={cx("subtitle")}>
                            Đọc tin tức tiếng Nhật, nghe audio đồng bộ, bật furigana
                            và luyện phát âm trong cùng một trải nghiệm.
                        </p>
                    </div>

                    <div className={cx("heroPanel")}>
                        <span className={cx("panelLabel")}>Thư viện</span>
                        <strong className={cx("panelValue")}>
                            {readingArticles.length || 0}
                        </strong>
                        <span className={cx("panelText")}>bài đọc đã xuất bản</span>
                    </div>
                </section>

                {renderTopTabs()}

                {body}
            </div>
        </div>
    );

    const renderFilters = () => (
        <div className={cx("controlsRow")}>
            <div className={cx("difficultyGroup")} aria-label="Lọc bài đọc">
                {filterOptions.map((opt) => (
                    <button
                        key={opt.value}
                        type="button"
                        className={cx("difficultyButton", {
                            active: articleFilter === opt.value,
                        })}
                        onClick={() => setArticleFilter(opt.value)}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    );

    const renderArticleCard = (article, compact = false) => {
        const isLiked = likedIds.includes(article.id);
        const isViewed = article.read || viewedIds.includes(article.id);

        return (
            <button
                ref={
                    readingTourActive && !compact && readingTourArticle?.id === article.id
                        ? readingTourCardRef
                        : undefined
                }
                key={article.id}
                type="button"
                className={cx("articleItem", {
                    active: selectedArticle?.id === article.id,
                    compact,
                })}
                onClick={() => handleSelectArticle(article)}
            >
                <div
                    ref={
                        readingTourActive && !compact && readingTourArticle?.id === article.id
                            ? readingTourRef
                            : undefined
                    }
                    className={cx("thumb")}
                >
                    <img
                        src={article.image || "/placeholder.svg"}
                        alt={article.title}
                        className={cx("thumbImage")}
                    />
                </div>

                <div className={cx("articleInfo")}>
                    <div>
                        <span className={cx("difficultyPill")}>
                            {article.difficulty === "hard" ? "Khó" : "Dễ"}
                        </span>
                        <h3 className={cx("articleTitle")}>{article.title}</h3>
                    </div>
                    <div className={cx("articleMeta")}>
                        <span className={cx("articleDate")}>{article.date}</span>
                        <div className={cx("cardBadges")}>
                            {isLiked ? (
                                <span className={cx("cardBadge", "favorite")}>
                                    <FontAwesomeIcon icon={faHeart} />
                                    Yêu thích
                                </span>
                            ) : isViewed ? (
                                <span className={cx("cardBadge", "viewed")}>
                                    <FontAwesomeIcon icon={faEye} />
                                    Đã xem
                                </span>
                            ) : null}
                        </div>
                    </div>
                </div>
            </button>
        );
    };

    if (topTab === "kana") {
        return renderFrame(<KanaReference />);
    }

    if (loading) {
        return renderFrame(
            <div className={cx("stateCard")}>Đang tải bài viết...</div>
        );
    }

    if (readingArticles.length === 0) {
        return renderFrame(
            <div className={cx("stateCard")}>Không có bài viết nào</div>
        );
    }

    if (!selectedArticle) {
        return renderFrame(
            <>
                {renderFilters()}
                {filteredArticles.length > 0 ? (
                    <div className={cx("libraryGrid")}>
                        {filteredArticles.map((article) => renderArticleCard(article))}
                    </div>
                ) : (
                    <div className={cx("stateCard")}>
                        Không có bài đọc phù hợp với bộ lọc hiện tại.
                    </div>
                )}
                {readingTourActive && readingTourArticle && (
                    <GuidedCoachmark
                        targetRef={readingTourRef}
                        scrollTargetRef={readingTourCardRef}
                        tourKey="reading"
                        message="Chọn bài đọc này để hoàn thành mục luyện đọc trong lộ trình."
                        placement="right"
                    />
                )}
            </>
        );
    }

    const relatedArticles = readingArticles.filter(
        (article) =>
            article.id !== selectedArticle.id &&
            !article.read &&
            !viewedIds.includes(article.id)
    );

    return (
        <div className={cx("wrapper")}>
            <div className={cx("inner")}>
                <section className={cx("detailHeader")}>
                    <button
                        type="button"
                        className={cx("backButton")}
                        onClick={handleBackToList}
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                        Danh sách bài đọc
                    </button>
                </section>

                <div className={cx("detailLayout")}>
                    <section className={cx("content")}>
                        <div className={cx("articleCard")}>
                            <div className={cx("articleHeader")}>
                                <div className={cx("articleHeaderMain")}>
                                    <div className={cx("articleKicker")}>
                                        <span className={cx("difficultyPill")}>
                                            {selectedArticle.difficulty === "hard" ? "Khó" : "Dễ"}
                                        </span>
                                        <span>{selectedArticle.date}</span>
                                        <span className={cx("statPill")}>
                                            <FontAwesomeIcon icon={faEye} />
                                            {selectedArticle.viewCount || 0}
                                        </span>
                                    </div>
                                    <h2 className={cx("articleMainTitle")}>
                                        {selectedArticle.title}
                                    </h2>
                                </div>

                                <button
                                    type="button"
                                    className={cx("likeButton", { liked: isLiked })}
                                    onClick={() => handleToggleLike(selectedArticle.id)}
                                    aria-label={isLiked ? "Bỏ thích" : "Thích"}
                                >
                                    <FontAwesomeIcon icon={faHeart} />
                                </button>
                            </div>

                            <div className={cx("imageWrap")}>
                                <img
                                    src={selectedArticle.image || "/placeholder.svg"}
                                    alt={selectedArticle.title}
                                    className={cx("mainImage")}
                                />
                            </div>

                            <div className={cx("audioPlayer")}>
                                <audio
                                    ref={audioRef}
                                    className={cx("nativeAudio")}
                                    src={selectedArticle.audioUrl}
                                    controls
                                    preload="metadata"
                                    onTimeUpdate={(e) => {
                                        setCurrentTime(e.currentTarget.currentTime || 0);
                                    }}
                                    onPlay={() => setIsPlaying(true)}
                                    onPause={() => setIsPlaying(false)}
                                    onEnded={() => {
                                        setIsPlaying(false);
                                        setCurrentTime(0);
                                    }}
                                />
                            </div>

                            <div className={cx("articleText", { withFurigana: furiganaOn })}>
                                {selectedArticle.syncData && selectedArticle.syncData.length ? (
                                    <p>
                                        {selectedArticle.syncData.map((segment, index) => {
                                            const isActive =
                                                currentTime >= segment.s &&
                                                currentTime <= segment.e;
                                            const cached = furiganaCache[selectedArticle.id];
                                            const segs =
                                                furiganaOn && cached?.mode === "sync"
                                                    ? cached.segments[index]
                                                    : null;
                                            return (
                                                <span
                                                    key={index}
                                                    className={cx("sentence", { active: isActive })}
                                                >
                                                    {segs ? renderFuriganaSegments(segs) : segment.t}
                                                    {" "}
                                                </span>
                                            );
                                        })}
                                    </p>
                                ) : (
                                    <p>
                                        {furiganaOn &&
                                            furiganaCache[selectedArticle.id]?.mode === "plain"
                                            ? renderFuriganaSegments(
                                                furiganaCache[selectedArticle.id].segments[0]
                                            )
                                            : content}
                                    </p>
                                )}
                            </div>

                            <div className={cx("tools")}>
                                <button
                                    type="button"
                                    className={cx("toolButton")}
                                    onClick={handleRestart}
                                >
                                    <FontAwesomeIcon icon={faVolumeHigh} />
                                    Nghe lại từ đầu
                                </button>
                                <button
                                    type="button"
                                    disabled={furiganaLoading}
                                    className={cx("toolButton", { toolActive: furiganaOn })}
                                    onClick={handleToggleFurigana}
                                >
                                    {furiganaLoading && (
                                        <FontAwesomeIcon icon={faSpinner} spin />
                                    )}
                                    {furiganaLoading
                                        ? "Đang tải furigana..."
                                        : furiganaOn
                                            ? "Tắt furigana"
                                            : "Hiện furigana"}
                                </button>
                                <button
                                    ref={readingPracticeTourRef}
                                    type="button"
                                    className={cx("toolButton", "toolPrimary")}
                                    onClick={handleOpenPractice}
                                >
                                    Luyện đọc
                                </button>
                            </div>
                            {readingTourActive && readyForPracticeTour && !showPractice && (
                                <GuidedCoachmark
                                    targetRef={readingPracticeTourRef}
                                    tourKey="reading-practice"
                                    message="Sau khi nghe xong, hãy nhấn vào đây để luyện đọc rồi AI chấm phát âm nhé."
                                    placement="right"
                                    pointerAnchor="right-edge"
                                    tooltipOffset={96}
                                />
                            )}
                        </div>
                    </section>

                    <aside className={cx("relatedPanel")}>
                        <div className={cx("relatedHead")}>
                            <span className={cx("sectionLabel")}>Gợi ý tiếp theo</span>
                        </div>
                        <div className={cx("relatedScroll")}>
                            {relatedArticles.length > 0 ? (
                                relatedArticles.map((article) =>
                                    renderArticleCard(article, true)
                                )
                            ) : (
                                <div className={cx("emptyRelated")}>
                                    Bạn đã xem hết các bài đọc đang có.
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </div>

            {showPractice && (
                <PracticeModal
                    article={selectedArticle}
                    isRecording={isRecording}
                    recordingTime={recordingTime}
                    recordedUrl={recordedUrl}
                    recordedBlob={recordedBlob}
                    isAssessing={isAssessing}
                    assessResult={assessResult}
                    onClose={handleClosePractice}
                    onStart={handleStartRecording}
                    onStop={handleStopRecording}
                    onRetake={handleRetake}
                    onSubmit={handleSubmitAssessment}
                    formatTime={formatTime}
                    cx={cx}
                    furiganaOn={furiganaOn}
                    furiganaLoading={furiganaLoading}
                    onToggleFurigana={handleToggleFurigana}
                    furiganaSegments={(() => {
                        const cached = furiganaCache[selectedArticle?.id];
                        if (!cached) return null;
                        return cached.mode === "plain"
                            ? cached.segments[0]
                            : cached.segments.flat();
                    })()}
                />
            )}
        </div>
    );
}
function PracticeModal({
    article,
    isRecording,
    recordingTime,
    recordedUrl,
    recordedBlob,
    isAssessing,
    assessResult,
    onClose,
    onStart,
    onStop,
    onRetake,
    onSubmit,
    formatTime,
    cx,
    furiganaOn,
    furiganaLoading,
    onToggleFurigana,
    furiganaSegments,
}) {
    const text = (article?.content || "").replace(/\/n\/n/g, "\n\n");
    const showRuby = furiganaOn && furiganaSegments && furiganaSegments.length > 0;

    const scoreColor = (() => {
        if (!assessResult) return "";
        const s = assessResult.score ?? 0;
        if (s >= 80) return "scoreGood";
        if (s >= 50) return "scoreMid";
        return "scoreLow";
    })();

    return (
        <div
            className={cx("practiceOverlay")}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className={cx("practiceModal")}>
                <div className={cx("practiceHeader")}>
                    <div>
                        <h2 className={cx("practiceTitle")}>Luyện đọc</h2>
                        <p className={cx("practiceSubtitle")}>{article?.title}</p>
                    </div>
                    <button
                        type="button"
                        className={cx("practiceClose")}
                        onClick={onClose}
                        aria-label="Đóng"
                    >
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>

                <div className={cx("practiceBody")}>
                    <div className={cx("practiceContent")}>
                        <div className={cx("practiceContentHead")}>
                            <h3 className={cx("practiceSectionTitle")}>Nội dung bài đọc</h3>
                            <button
                                type="button"
                                disabled={furiganaLoading}
                                className={cx("toolButton", { toolActive: furiganaOn })}
                                onClick={onToggleFurigana}
                            >
                                {furiganaLoading && (
                                    <FontAwesomeIcon icon={faSpinner} spin />
                                )}
                                {furiganaLoading
                                    ? "Đang tải..."
                                    : furiganaOn
                                        ? "Tắt furigana"
                                        : "Hiện furigana"}
                            </button>
                        </div>
                        <div className={cx("practiceText", { withFurigana: showRuby })}>
                            {showRuby ? renderFuriganaSegments(furiganaSegments) : text}
                        </div>
                    </div>

                    <div className={cx("practiceRecorder")}>
                        <div className={cx("micWrapper", { recording: isRecording })}>
                            <button
                                type="button"
                                className={cx("micButton", { recording: isRecording })}
                                onClick={isRecording ? onStop : onStart}
                                disabled={isAssessing}
                                aria-label={isRecording ? "Dừng ghi âm" : "Bắt đầu ghi âm"}
                            >
                                <FontAwesomeIcon
                                    icon={isRecording ? faStop : faMicrophone}
                                />
                            </button>
                        </div>

                        <p className={cx("recorderStatus")}>
                            {isRecording
                                ? `Đang ghi âm... ${formatTime(recordingTime)}`
                                : recordedBlob
                                    ? "Đã ghi âm xong"
                                    : "Nhấn micro để bắt đầu đọc"}
                        </p>

                        {recordedUrl && !isRecording && (
                            <audio
                                className={cx("recordedAudio")}
                                src={recordedUrl}
                                controls
                            />
                        )}

                        {recordedBlob && !isRecording && (
                            <div className={cx("recorderActions")}>
                                <button
                                    type="button"
                                    className={cx("toolButton")}
                                    onClick={onRetake}
                                    disabled={isAssessing}
                                >
                                    <FontAwesomeIcon icon={faRotateRight} />
                                    Ghi lại
                                </button>
                                <button
                                    type="button"
                                    className={cx("toolButton", "toolPrimary")}
                                    onClick={onSubmit}
                                    disabled={isAssessing}
                                >
                                    {isAssessing && (
                                        <FontAwesomeIcon icon={faSpinner} spin />
                                    )}
                                    {isAssessing ? "Đang chấm điểm..." : "Gửi chấm điểm"}
                                </button>
                            </div>
                        )}

                        {assessResult && !isAssessing && (
                            <div className={cx("assessResult")}>
                                <div className={cx("assessScore", scoreColor)}>
                                    {Math.round(assessResult.score ?? 0)}
                                    <span className={cx("scoreUnit")}>điểm</span>
                                </div>

                                <div
                                    className={cx("assessTokens", {
                                        withFurigana: furiganaOn,
                                    })}
                                >
                                    {Array.isArray(assessResult.tokens) &&
                                        assessResult.tokens.length > 0
                                        ? assessResult.tokens.map((tok, i) => {
                                            const orig = tok.orig || "";
                                            const hira = tok.hira || "";
                                            const isKanji = KANJI_RE.test(orig);
                                            const showRuby =
                                                furiganaOn && hira && hira !== orig && isKanji;
                                            const tokenClass = cx("assessToken", {
                                                missing: !tok.matched,
                                            });
                                            if (showRuby) {
                                                return (
                                                    <ruby key={i} className={tokenClass}>
                                                        {orig}
                                                        <rt>{hira}</rt>
                                                    </ruby>
                                                );
                                            }
                                            return (
                                                <span key={i} className={tokenClass}>
                                                    {orig}
                                                </span>
                                            );
                                        })
                                        : assessResult.target}
                                </div>

                                <p className={cx("assessHint")}>
                                    Phần làm mờ là chỗ chưa được nhận dạng — có thể bạn đọc thiếu hoặc phát âm chưa rõ.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
