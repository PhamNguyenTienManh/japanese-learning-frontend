import React, { useState, useEffect, useRef } from "react";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faVolumeHigh,
    faPlus,
    faPlay,
    faPause,
    faMicrophone,
    faStop,
    faXmark,
    faSpinner,
    faRotateRight,
} from "@fortawesome/free-solid-svg-icons";

import Button from "~/components/Button";
import { useAuth } from "~/context/AuthContext";
import Card from "~/components/Card";
import { getNews } from "~/services/newsService";
import { assessPronunciation } from "~/services/voiceAssessService";
import { getFurigana } from "~/services/furiganaService";
import { showToast } from "~/components/ToastManager";
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

const KANJI_RE = /[㐀-鿿豈-﫿]/;

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

    // ===== Practice (luyện đọc) state =====
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

    // ===== Furigana state =====
    const [furiganaOn, setFuriganaOn] = useState(false);
    const [furiganaCache, setFuriganaCache] = useState({});
    const [furiganaLoading, setFuriganaLoading] = useState(false);

    const { isLoggedIn, isPremium } = useAuth();

    // Fetch data từ API
    useEffect(() => {
        const fetchArticles = async () => {
            try {
                setLoading(true);
                const response = await getNews();

                if (response.success && response.data) {
                    // Transform API data to component format
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

    // ===== Furigana handlers =====
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

    // Tự fetch furigana khi đổi bài mà toggle đang bật
    useEffect(() => {
        if (furiganaOn && selectedArticle && !furiganaCache[selectedArticle.id]) {
            ensureFuriganaForArticle(selectedArticle);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedArticle?.id, furiganaOn]);

    // ===== Practice (luyện đọc) handlers =====
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
        if (audioElement && isPlaying) {
            audioElement.pause();
            setIsPlaying(false);
        }
        // Nếu user đã đăng nhập nhưng chưa là premium -> điều hướng tới payment
        if (isLoggedIn && !isPremium) {
            // bật một state tạm để hiển thị CTA nâng cấp (sử dụng window.location để điều hướng nhanh)
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

    // Cleanup khi unmount
    useEffect(() => {
        return () => {
            clearRecordingTimer();
            stopMediaTracks();
            if (recordedUrl) URL.revokeObjectURL(recordedUrl);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    const content = selectedArticle?.content?.replace(/\/n\/n/g, "\n\n") ?? "";

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

                                            {/* <span className={cx("moreLink")}>
                                                Xem thêm →
                                            </span> */}
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

                            <div className={cx("articleText", { withFurigana: furiganaOn })}>
                                {selectedArticle.syncData && selectedArticle.syncData.length ? (
                                    <p>
                                        {selectedArticle.syncData.map((segment, index) => {
                                            const isActive = currentTime >= segment.s && currentTime <= segment.e;
                                            const cached = furiganaCache[selectedArticle.id];
                                            const segs = furiganaOn && cached?.mode === "sync"
                                                ? cached.segments[index]
                                                : null;
                                            return (
                                                <span
                                                    key={index}
                                                    className={cx("sentence", { active: isActive })}
                                                >
                                                    {segs
                                                        ? renderFuriganaSegments(segs)
                                                        : segment.t}
                                                    {" "}
                                                </span>
                                            )
                                        })}
                                    </p>
                                ) : (
                                    <p>
                                        {furiganaOn && furiganaCache[selectedArticle.id]?.mode === "plain"
                                            ? renderFuriganaSegments(furiganaCache[selectedArticle.id].segments[0])
                                            : content}
                                    </p>
                                )}
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
                                <Button
                                    primary={furiganaOn}
                                    outline={!furiganaOn}
                                    disabled={furiganaLoading}
                                    className={cx("toolButton", "no-margin")}
                                    onClick={handleToggleFurigana}
                                    leftIcon={
                                        furiganaLoading ? (
                                            <FontAwesomeIcon icon={faSpinner} spin />
                                        ) : null
                                    }
                                >
                                    {furiganaLoading
                                        ? "Đang tải furigana..."
                                        : furiganaOn
                                            ? "Tắt furigana"
                                            : "Hiện furigana"}
                                </Button>
                                <Button
                                    primary
                                    className={cx("toolButton", "no-margin")}
                                    onClick={handleOpenPractice}
                                    leftIcon={
                                        <FontAwesomeIcon icon={faMicrophone} />
                                    }
                                >
                                    Luyện đọc
                                </Button>
                            </div>
                        </Card>
                    </section>
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
                            <Button
                                primary={furiganaOn}
                                outline={!furiganaOn}
                                disabled={furiganaLoading}
                                className={cx("toolButton", "no-margin")}
                                onClick={onToggleFurigana}
                                leftIcon={
                                    furiganaLoading ? (
                                        <FontAwesomeIcon icon={faSpinner} spin />
                                    ) : null
                                }
                            >
                                {furiganaLoading
                                    ? "Đang tải..."
                                    : furiganaOn
                                        ? "Tắt furigana"
                                        : "Hiện furigana"}
                            </Button>
                        </div>
                        <div
                            className={cx("practiceText", { withFurigana: showRuby })}
                        >
                            {showRuby
                                ? renderFuriganaSegments(furiganaSegments)
                                : text}
                        </div>
                    </div>

                    <div className={cx("practiceRecorder")}>
                        <div
                            className={cx("micWrapper", {
                                recording: isRecording,
                            })}
                        >
                            <button
                                type="button"
                                className={cx("micButton", {
                                    recording: isRecording,
                                })}
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
                                <Button
                                    outline
                                    className={cx("toolButton", "no-margin")}
                                    onClick={onRetake}
                                    disabled={isAssessing}
                                    leftIcon={
                                        <FontAwesomeIcon icon={faRotateRight} />
                                    }
                                >
                                    Ghi lại
                                </Button>
                                <Button
                                    primary
                                    className={cx("toolButton", "no-margin")}
                                    onClick={onSubmit}
                                    disabled={isAssessing}
                                    leftIcon={
                                        isAssessing ? (
                                            <FontAwesomeIcon
                                                icon={faSpinner}
                                                spin
                                            />
                                        ) : null
                                    }
                                >
                                    {isAssessing ? "Đang chấm điểm..." : "Gửi chấm điểm"}
                                </Button>
                            </div>
                        )}

                        {assessResult && !isAssessing && (
                            <div className={cx("assessResult")}>
                                <div
                                    className={cx(
                                        "assessScore",
                                        scoreColor,
                                    )}
                                >
                                    {Math.round(assessResult.score ?? 0)}
                                    <span className={cx("scoreUnit")}>điểm</span>
                                </div>

                                <div
                                    className={cx("assessTokens", {
                                        withFurigana: furiganaOn,
                                    })}
                                >
                                    {Array.isArray(assessResult.tokens) && assessResult.tokens.length > 0
                                        ? assessResult.tokens.map((tok, i) => {
                                            const orig = tok.orig || "";
                                            const hira = tok.hira || "";
                                            const isKanji = KANJI_RE.test(orig);
                                            const showRuby = furiganaOn && hira && hira !== orig && isKanji;
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