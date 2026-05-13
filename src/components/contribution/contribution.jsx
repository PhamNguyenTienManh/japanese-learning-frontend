import { useState, useEffect, useCallback } from "react";
import { ThumbsUp, ThumbsDown, Send, MessageSquare, X } from "lucide-react";
import classNames from "classnames/bind";
import ContributionService from "~/services/contributionService";
import styles from "./contribution.module.scss";

const cx = classNames.bind(styles);

const CommentSection = ({ kanjiId, kanjiChar, totalComments: initialTotal }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);

    const [comments, setComments] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [newComment, setNewComment] = useState("");
    const [likedComments, setLikedComments] = useState(new Set());
    const [dislikedComments, setDislikedComments] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const commentsPerPage = 5;
    const totalComments = comments.length || initialTotal || 0;
    const totalPages = Math.ceil(totalComments / commentsPerPage) || 1;

    const indexOfLastComment = currentPage * commentsPerPage;
    const indexOfFirstComment = indexOfLastComment - commentsPerPage;
    const currentComments = comments.slice(indexOfFirstComment, indexOfLastComment);

    const fetchComments = useCallback(async () => {
        if (!kanjiChar) return;
        setLoading(true);
        setError(null);
        try {
            const data = await ContributionService.getComments(kanjiId, kanjiChar);
            if (data.status === 200 && data.result) {
                const mapped = data.result.map((item) => ({
                    id: item.reportId,
                    author: item.username,
                    content: item.mean,
                    likes: item.like,
                    dislikes: item.dislike,
                    userId: item.userId,
                    status: item.status,
                    type: item.type,
                }));
                setComments(mapped);
            } else {
                setComments([]);
            }
        } catch (err) {
            console.error('Error fetching comments:', err);
            setError(err.message);
        } finally {
            setLoading(false);
            setHasLoaded(true);
        }
    }, [kanjiId, kanjiChar]);

    // Reset cached results when the kanji changes
    useEffect(() => {
        setHasLoaded(false);
        setComments([]);
        setCurrentPage(1);
    }, [kanjiId, kanjiChar]);

    const handleOpen = () => {
        setIsOpen(true);
        if (!hasLoaded) {
            fetchComments();
        }
    };

    const handleClose = useCallback(() => {
        setIsOpen(false);
    }, []);

    // Lock body scroll while drawer is open + close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKey = (e) => {
            if (e.key === "Escape") handleClose();
        };
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = prev;
            window.removeEventListener("keydown", onKey);
        };
    }, [isOpen, handleClose]);

    const handleLike = (commentId) => {
        const newLiked = new Set(likedComments);
        const newDisliked = new Set(dislikedComments);
        if (newLiked.has(commentId)) {
            newLiked.delete(commentId);
        } else {
            newLiked.add(commentId);
            newDisliked.delete(commentId);
        }
        setLikedComments(newLiked);
        setDislikedComments(newDisliked);
    };

    const handleDislike = (commentId) => {
        const newLiked = new Set(likedComments);
        const newDisliked = new Set(dislikedComments);
        if (newDisliked.has(commentId)) {
            newDisliked.delete(commentId);
        } else {
            newDisliked.add(commentId);
            newLiked.delete(commentId);
        }
        setLikedComments(newLiked);
        setDislikedComments(newDisliked);
    };

    const handleSubmitComment = async () => {
        if (!newComment.trim()) return;

        const tempComment = {
            id: Date.now(),
            author: "Bạn",
            content: newComment,
            likes: 0,
            dislikes: 0,
            userId: null,
            status: 1,
            type: 0,
        };

        setComments([tempComment, ...comments]);
        setNewComment("");
        setCurrentPage(1);

        try {
            const token = localStorage.getItem("token");
            await ContributionService.addComment(
                { kanjiId, content: newComment },
                token
            );
        } catch (err) {
            console.error('Error submitting comment:', err);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && e.shiftKey) return;
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmitComment();
        }
    };

    const renderPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else if (currentPage <= 3) {
            for (let i = 1; i <= 4; i++) pages.push(i);
            pages.push('...');
            pages.push(totalPages);
        } else if (currentPage >= totalPages - 2) {
            pages.push(1);
            pages.push('...');
            for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            pages.push('...');
            for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
            pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <>
            <button
                type="button"
                className={cx("fab", { hidden: isOpen })}
                onClick={handleOpen}
                aria-label="Xem ý kiến đóng góp"
                title="Xem ý kiến đóng góp"
            >
                <MessageSquare size={24} />
                {totalComments > 0 && (
                    <span className={cx("fab-count")}>
                        {totalComments > 99 ? "99+" : totalComments}
                    </span>
                )}
            </button>

            <div
                className={cx("overlay", { open: isOpen })}
                onClick={handleClose}
                aria-hidden="true"
            />

            <aside
                className={cx("drawer", { open: isOpen })}
                role="dialog"
                aria-modal="true"
                aria-label="Ý kiến đóng góp"
            >
                <header className={cx("drawer-head")}>
                    <div>
                        <h2 className={cx("drawer-title")}>Ý kiến đóng góp</h2>
                        <p className={cx("drawer-subtitle")}>
                            {kanjiChar
                                ? `Cho chữ ${kanjiChar} — ${totalComments} ý kiến`
                                : "Chưa có kanji được chọn"}
                        </p>
                    </div>
                    <button
                        type="button"
                        className={cx("drawer-close")}
                        onClick={handleClose}
                        aria-label="Đóng"
                    >
                        <X size={20} />
                    </button>
                </header>

                <div className={cx("drawer-body")}>
                    {/* Comment input */}
                    <div className={cx("comment-form")}>
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Thêm nghĩa hoặc ví dụ. Shift + Enter để xuống dòng."
                            className={cx("comment-input")}
                        />
                        <button
                            type="button"
                            onClick={handleSubmitComment}
                            disabled={!newComment.trim()}
                            className={cx("send-btn", { disabled: !newComment.trim() })}
                            aria-label="Gửi"
                        >
                            <Send size={18} />
                        </button>
                    </div>

                    {/* States */}
                    {loading ? (
                        <div className={cx("state")}>
                            <div className={cx("spinner")} />
                            <div>Đang tải bình luận...</div>
                        </div>
                    ) : error ? (
                        <div className={cx("state", "state-error")}>Lỗi: {error}</div>
                    ) : comments.length === 0 ? (
                        <div className={cx("state")}>Chưa có ý kiến đóng góp nào</div>
                    ) : (
                        <>
                            <div className={cx("comments-list")}>
                                {currentComments.map((comment) => {
                                    const isLiked = likedComments.has(comment.id);
                                    const isDisliked = dislikedComments.has(comment.id);
                                    const displayLikes = comment.likes + (isLiked ? 1 : 0);
                                    const displayDislikes =
                                        comment.dislikes + (isDisliked ? 1 : 0);

                                    return (
                                        <div key={comment.id} className={cx("comment-item")}>
                                            <div className={cx("comment-content")}>
                                                {comment.content}
                                            </div>
                                            <div className={cx("comment-actions")}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleLike(comment.id)}
                                                    className={cx("action-btn", { active: isLiked })}
                                                >
                                                    <ThumbsUp
                                                        size={14}
                                                        fill={isLiked ? "currentColor" : "none"}
                                                    />
                                                    {displayLikes > 0 && <span>{displayLikes}</span>}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleDislike(comment.id)}
                                                    className={cx("action-btn", { active: isDisliked })}
                                                >
                                                    <ThumbsDown
                                                        size={14}
                                                        fill={isDisliked ? "currentColor" : "none"}
                                                    />
                                                    {displayDislikes > 0 && (
                                                        <span>{displayDislikes}</span>
                                                    )}
                                                </button>

                                                <span className={cx("comment-author")}>
                                                    {comment.author}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {totalPages > 1 && (
                                <div className={cx("pagination")}>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCurrentPage((p) => Math.max(1, p - 1))
                                        }
                                        disabled={currentPage === 1}
                                        className={cx("page-btn")}
                                    >
                                        ‹
                                    </button>

                                    {renderPageNumbers().map((page, index) =>
                                        page === '...' ? (
                                            <span
                                                key={`ellipsis-${index}`}
                                                className={cx("page-dots")}
                                            >
                                                ...
                                            </span>
                                        ) : (
                                            <button
                                                key={page}
                                                type="button"
                                                onClick={() => setCurrentPage(page)}
                                                className={cx("page-btn", {
                                                    active: currentPage === page,
                                                })}
                                            >
                                                {page}
                                            </button>
                                        )
                                    )}

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCurrentPage((p) => Math.min(totalPages, p + 1))
                                        }
                                        disabled={currentPage === totalPages}
                                        className={cx("page-btn")}
                                    >
                                        ›
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </aside>
        </>
    );
};

export default CommentSection;
