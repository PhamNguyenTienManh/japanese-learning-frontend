import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown, Send } from "lucide-react";
import ContributionService from "~/services/contributionService";
const CommentSection = ({ kanjiId, kanjiChar, totalComments: initialTotal }) => {
    
    const [comments, setComments] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [newComment, setNewComment] = useState("");
    const [likedComments, setLikedComments] = useState(new Set());
    const [dislikedComments, setDislikedComments] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const commentsPerPage = 5;
    const totalComments = comments.length || initialTotal || 0;
    const totalPages = Math.ceil(totalComments / commentsPerPage);

    const indexOfLastComment = currentPage * commentsPerPage;
    const indexOfFirstComment = indexOfLastComment - commentsPerPage;
    const currentComments = comments.slice(indexOfFirstComment, indexOfLastComment);

    // Fetch comments from API using service
    useEffect(() => {
        if (!kanjiChar) return;

        const fetchComments = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await ContributionService.getComments(kanjiId, kanjiChar);

                if (data.status === 200 && data.result) {
                    // Map API data to component format
                    const mappedComments = data.result.map(item => ({
                        id: item.reportId,
                        author: item.username,
                        content: item.mean,
                        likes: item.like,
                        dislikes: item.dislike,
                        userId: item.userId,
                        status: item.status,
                        type: item.type
                    }));
                    setComments(mappedComments);
                } else {
                    setComments([]);
                }
            } catch (err) {
                console.error('Error fetching comments:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchComments();
    }, [kanjiId, kanjiChar]);

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

        // Tạo comment tạm thời để hiển thị ngay
        const tempComment = {
            id: Date.now(),
            author: "Bạn",
            content: newComment,
            likes: 0,
            dislikes: 0,
            userId: null,
            status: 1,
            type: 0
        };

        setComments([tempComment, ...comments]);
        setNewComment("");
        setCurrentPage(1);

        try {
            await ContributionService.addComment({
                wordId: kanjiId,
                word: kanjiChar,
                mean: newComment,
                type: 'kanji',
                dict: 'javi'
            });
        } catch (err) {
            console.error('Error submitting comment:', err);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && e.shiftKey) {
            return;
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmitComment();
        }
    };

    const renderPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    if (loading) {
        return (
            <div style={{ 
                maxWidth: '1000px', 
                margin: '0 auto', 
                padding: '40px',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '24px', marginBottom: '12px' }}>⏳</div>
                <div style={{ color: '#666' }}>Đang tải bình luận...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ 
                maxWidth: '1000px', 
                margin: '0 auto', 
                padding: '40px',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '24px', marginBottom: '12px', color: '#d32f2f' }}>❌</div>
                <div style={{ color: '#d32f2f' }}>Lỗi: {error}</div>
            </div>
        );
    }

    return (
        <div style={{ 
            maxWidth: '1000px', 
            margin: '0 auto', 
            padding: '20px',
            backgroundColor: '#fff',
            borderRadius: '8px'
        }}>
            {/* Header */}
            <div style={{ 
                fontSize: '15px', 
                color: '#606060', 
                marginBottom: '20px',
                fontWeight: '500'
            }}>
                Có {totalComments} ý kiến đóng góp
            </div>

            {/* Comment Input */}
            <div style={{ marginBottom: '32px' }}>
                <div style={{ 
                    display: 'flex', 
                    gap: '12px',
                    alignItems: 'flex-start',
                    position: 'relative'
                }}>
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Thêm nghĩa hoặc ví dụ. Ấn SHIFT + ENTER để xuống dòng"
                        style={{
                            flex: 1,
                            padding: '12px 48px 12px 12px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                            fontSize: '14px',
                            minHeight: '44px',
                            maxHeight: '120px',
                            resize: 'vertical',
                            fontFamily: 'inherit',
                            outline: 'none',
                            transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#1976d2'}
                        onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    />
                    <button
                        onClick={handleSubmitComment}
                        disabled={!newComment.trim()}
                        style={{
                            position: 'absolute',
                            right: '8px',
                            top: '8px',
                            padding: '8px',
                            backgroundColor: newComment.trim() ? '#1976d2' : '#e0e0e0',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            cursor: newComment.trim() ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            width: '36px',
                            height: '36px'
                        }}
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>

            {/* Comments List */}
            {comments.length === 0 ? (
                <div style={{ 
                    textAlign: 'center', 
                    padding: '40px', 
                    color: '#999' 
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>💬</div>
                    <div>Chưa có ý kiến đóng góp nào</div>
                </div>
            ) : (
                <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {currentComments.map((comment) => {
                            const isLiked = likedComments.has(comment.id);
                            const isDisliked = dislikedComments.has(comment.id);
                            const displayLikes = comment.likes + (isLiked ? 1 : 0);
                            const displayDislikes = comment.dislikes + (isDisliked ? 1 : 0);

                            return (
                                <div key={comment.id} style={{ 
                                    padding: '12px 0',
                                    borderBottom: '1px solid #f0f0f0'
                                }}>
                                    {/* Comment Content */}
                                    <div style={{ marginBottom: '8px' }}>
                                        <div style={{ 
                                            fontSize: '14px', 
                                            lineHeight: '1.6', 
                                            color: '#030303',
                                            marginBottom: '4px',
                                            whiteSpace: 'pre-wrap'
                                        }}>
                                            {comment.content}
                                        </div>
                                    </div>

                                    {/* Comment Actions */}
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '16px',
                                        fontSize: '13px',
                                        color: '#606060'
                                    }}>
                                        {/* Like Button */}
                                        <button
                                            onClick={() => handleLike(comment.id)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '4px 8px',
                                                backgroundColor: 'transparent',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: isLiked ? '#1976d2' : '#606060',
                                                fontSize: '13px',
                                                borderRadius: '4px',
                                                transition: 'background-color 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <ThumbsUp size={14} fill={isLiked ? '#1976d2' : 'none'} />
                                            {displayLikes > 0 && <span>{displayLikes}</span>}
                                        </button>

                                        {/* Dislike Button */}
                                        <button
                                            onClick={() => handleDislike(comment.id)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '4px 8px',
                                                backgroundColor: 'transparent',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: isDisliked ? '#1976d2' : '#606060',
                                                fontSize: '13px',
                                                borderRadius: '4px',
                                                transition: 'background-color 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <ThumbsDown size={14} fill={isDisliked ? '#1976d2' : 'none'} />
                                            {displayDislikes > 0 && <span>{displayDislikes}</span>}
                                        </button>

                                        {/* Author */}
                                        <div style={{ 
                                            marginLeft: 'auto',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontSize: '12px',
                                            color: '#909090'
                                        }}>
                                            <span style={{ 
                                                color: '#606060',
                                                fontWeight: '500',
                                            }}>
                                                {comment.author}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center',
                            gap: '8px',
                            marginTop: '32px',
                            paddingTop: '20px',
                            borderTop: '1px solid #f0f0f0'
                        }}>
                            {/* Previous Button */}
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                style={{
                                    padding: '8px 12px',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                    color: currentPage === 1 ? '#ccc' : '#606060',
                                    fontSize: '20px',
                                    borderRadius: '4px',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    if (currentPage !== 1) e.currentTarget.style.backgroundColor = '#f0f0f0';
                                }}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                «
                            </button>

                            {/* Page Numbers */}
                            {renderPageNumbers().map((page, index) => (
                                page === '...' ? (
                                    <span key={`ellipsis-${index}`} style={{ 
                                        padding: '8px 12px',
                                        color: '#606060'
                                    }}>
                                        ...
                                    </span>
                                ) : (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        style={{
                                            padding: '8px 12px',
                                            minWidth: '36px',
                                            backgroundColor: currentPage === page ? '#1976d2' : 'transparent',
                                            color: currentPage === page ? 'white' : '#606060',
                                            border: 'none',
                                            borderRadius: '50%',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: currentPage === page ? '600' : '400',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (currentPage !== page) {
                                                e.currentTarget.style.backgroundColor = '#f0f0f0';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (currentPage !== page) {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }
                                        }}
                                    >
                                        {page}
                                    </button>
                                )
                            ))}

                            {/* Next Button */}
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                style={{
                                    padding: '8px 12px',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                    color: currentPage === totalPages ? '#ccc' : '#606060',
                                    fontSize: '20px',
                                    borderRadius: '4px',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    if (currentPage !== totalPages) e.currentTarget.style.backgroundColor = '#f0f0f0';
                                }}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                »
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};


export default CommentSection;