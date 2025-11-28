import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import classNames from "classnames/bind";
import styles from "./PostDetail.module.scss";

import Card from "~/components/Card";
import Button from "~/components/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart,
  faCommentDots,
  faEye,
  faShareNodes,
  faArrowLeft,
  faPaperPlane,
  faSpinner,
  faEdit,
  faTrash,
  faTimes,
  faSave,
} from "@fortawesome/free-solid-svg-icons";
import formatDateVN from "~/services/formatDate";
import postService from "~/services/postService";
import { faHeart as faHeartSolid } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
import decodeToken from "~/services/pairToken";
import CategorySelector from "~/components/CategorySelection";

const cx = classNames.bind(styles);

function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  const [countComment, setCountComment] = useState(0);

  const getLoggedInUserId = () => {
    const token = localStorage.getItem("token");

    if (!token) return null;

    const decoded = decodeToken(token);
    const isExpired = decoded?.exp ? decoded.exp * 1000 < Date.now() : false;

    if (isExpired) {
      localStorage.removeItem("token");
      return null;
    }

    return decoded?.sub || null;
  };

  const currentUserId = getLoggedInUserId();

  // Fetch post detail
  useEffect(() => {
    const fetchPostDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await postService.getPostById(id);
        const postData = response.data.data;

        // Thêm isLiked vào postData
        const likedArray = Array.isArray(postData.liked) ? postData.liked : [];
        const enrichedPost = {
          ...postData,
          isLiked: likedArray.includes(currentUserId)
        };
        setPost(enrichedPost);
        
        setCountComment( response.data.countComment);
        
        
        const postOwnerId = postData.profile_id.userId;

        setIsOwner(currentUserId === postOwnerId);

        await fetchComments();
      } catch (err) {
        setError("Không thể tải bài viết. Vui lòng thử lại sau.");
        console.error("Fetch post error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPostDetail();
    }
  }, [id, currentUserId]);

  // Fetch comments
  const fetchComments = async () => {
    setCommentsLoading(true);
    try {
      const response = await postService.getComments(id);

      // Xử lý response
      let commentsData = [];
      if (Array.isArray(response)) {
        commentsData = response;
      } else if (response?.comments && Array.isArray(response.comments)) {
        commentsData = response.comments;
      } else if (response?.data && Array.isArray(response.data)) {
        commentsData = response.data;
      }

      // Map comments với thông tin like
      const mappedComments = commentsData.map(c => {
        const likedArray = Array.isArray(c.liked) ? c.liked : [];
        const isUserLiked = likedArray.includes(currentUserId);

        return {
          ...c,
          // Đếm số lượng like từ mảng liked
          likeCount: likedArray.length || (c.likes || c.likeCount || 0),
          // Kiểm tra user hiện tại đã like chưa
          isLiked: isUserLiked
        };
      });

      setComments(mappedComments);
    } catch (err) {
      console.error("Fetch comments error:", err);
      // Không set error, chỉ log để comments section vẫn hiển thị
    } finally {
      setCommentsLoading(false);
    }
  };

  // Handle like post
  const handleLike = async () => {
    try {
      const response = await postService.toggleLike(id);

      setPost((prev) => {
        const currentLiked = Array.isArray(prev.liked) ? prev.liked : [];
        const isCurrentlyLiked = currentLiked.includes(currentUserId);

        if (response?.data?.liked && Array.isArray(response.data.liked)) {
          return {
            ...prev,
            liked: response.data.liked,
            isLiked: response.data.liked.includes(currentUserId)
          };
        }

        let newLiked;
        if (isCurrentlyLiked) {
          newLiked = currentLiked.filter(uid => uid !== currentUserId);
        } else {
          newLiked = [...currentLiked, currentUserId];
        }

        return {
          ...prev,
          liked: newLiked,
          isLiked: !isCurrentlyLiked
        };
      });
    } catch (err) {
      console.error("Toggle like error:", err);
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;

    setSubmitting(true);
    try {
      const response = await postService.addComment(id, comment);

      await fetchComments();

      setPost((prev) => ({
        ...prev,
        comments: prev.comments + 1
      }));

      setComment("");
    } catch (err) {
      console.error("Add comment error:", err);
      alert("Không thể gửi bình luận. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCommentLike = async (commentId) => {
    try {
      const response = await postService.toggleCommentLike(commentId);

      setComments((prev) =>
        prev.map((c) => {
          const cId = c._id || c.id || c.commentId;
          if (cId === commentId) {
            if (response?.data?.liked) {
              return {
                ...c,
                liked: response.data.liked,
                likeCount: response.data.liked.length,
                isLiked: response.data.liked.includes(currentUserId)
              };
            }
            return {
              ...c,
              isLiked: !c.isLiked,
              likeCount: c.isLiked ? c.likeCount - 1 : c.likeCount + 1,
            };
          }
          return c;
        })
      );
    } catch (err) {
      console.error("Toggle comment like error:", err);
    }
  };
  const fetchCategories = async () => {
    try {
      const data = await postService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Failed to load categories, using defaults");
    }
  };
  // Handle start editing
  const handleEdit = () => {
    setEditedTitle(post.title);
    fetchCategories();
    setEditedContent(post.content || post.description || "");
    setIsEditing(true);
  };

  // Handle cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedTitle("");
    setEditedContent("");
  };

  // Handle save edited post
  const handleSaveEdit = async () => {
    if (!editedTitle.trim() || !editedContent.trim() || !categoryId) {
      alert("Tiêu đề và nội dung không được để trống!");
      return;
    }

    setSaving(true);
    try {
      const response = await postService.updatePost(id, {
        title: editedTitle,
        content: editedContent,
        category_id: categoryId
      });

      // Cập nhật post state với dữ liệu mới
      setPost((prev) => ({
        ...prev,
        title: editedTitle,
        content: editedContent,
        description: editedContent
      }));

      setIsEditing(false);
      alert("Đã cập nhật bài viết thành công!");
    } catch (err) {
      console.error("Update post error:", err);
      alert("Không thể cập nhật bài viết. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  // Handle delete post
  const handleDelete = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này?")) {
      return;
    }

    try {
      await postService.deletePost(id);
      alert("Đã xóa bài viết thành công!");
      navigate("/community");
    } catch (err) {
      console.error("Delete post error:", err);
      alert("Không thể xóa bài viết. Vui lòng thử lại.");
    }
  };

  // Handle back
  const handleBack = () => {
    navigate("/community");
  };

  // Handle share
  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: post.title,
        url: url,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(url);
      alert("Link đã được sao chép!");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={cx("wrapper")}>
        <main className={cx("main")}>
          <div className={cx("container")}>
            <div className={cx("loading")}>
              <FontAwesomeIcon icon={faSpinner} spin size="2x" />
              <p>Đang tải bài viết...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error || !post) {
    return (
      <div className={cx("wrapper")}>
        <main className={cx("main")}>
          <div className={cx("container")}>
            <Card className={cx("error-card")}>
              <p className={cx("error-message")}>
                {error || "Không tìm thấy bài viết"}
              </p>
              <Button outline onClick={handleBack}>
                Quay lại cộng đồng
              </Button>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={cx("wrapper")}>
      <main className={cx("main")}>
        <div className={cx("container")}>
          {/* Back Button */}
          <button type="button" onClick={handleBack} className={cx("back-link")}>
            <FontAwesomeIcon icon={faArrowLeft} className={cx("back-icon")} />
            <span>Quay lại cộng đồng</span>
          </button>

          {/* Post Card */}
          <Card className={cx("post-card")}>
            {/* Header */}
            <div className={cx("post-header")}>
              <img
                src={
                  post.profile_id?.image_url ||
                  post.authorAvatar ||
                  "/placeholder.svg"
                }
                alt={post.profile_id?.name || "Anonymous"}
                className={cx("avatar")}
              />
              <div className={cx("post-header-main")}>
                <div className={cx("post-author-row")}>
                  <span className={cx("author-name")}>
                    {post.profile_id?.name || "Anonymous"}
                  </span>
                </div>
                <div className={cx("author-meta")}>
                  <span>{post.created_at ? formatDateVN(post.created_at) : "Vừa xong"}</span>
                  {(post.author?.posts || post.authorPosts) && (
                    <>
                      <span className={cx("dot")}>•</span>
                      <span>
                        {post.author?.posts || post.authorPosts} bài viết
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className={cx("post-header-actions")}>
                {(post.category_id) && (
                  <span className={cx("badge", "badge-category")}>
                    {post.category_id.name ||"Từ vựng"}
                  </span>
                )}
                {isOwner && !isEditing && (
                  <div className={cx("owner-actions")}>
                    <button
                      type="button"
                      onClick={handleEdit}
                      className={cx("action-btn", "edit-btn")}
                      title="Chỉnh sửa"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className={cx("action-btn", "delete-btn")}
                      title="Xóa"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Edit Mode */}
            {isEditing ? (
              <div className={cx("edit-mode")}>
                <div className={cx("edit-form")}>
                  <div className={cx("form-group")}>
                    <label className={cx("form-label")}>Tiêu đề</label>
                    <CategorySelector
                      categories={categories}
                      value={categoryId}
                      onChange={setCategoryId}
                      disabled={loading}
                    />
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className={cx("form-input")}
                      placeholder="Nhập tiêu đề bài viết"
                    />
                  </div>
                  <div className={cx("form-group")}>
                    <label className={cx("form-label")}>Nội dung</label>
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className={cx("form-textarea")}
                      placeholder="Nhập nội dung bài viết"
                      rows={10}
                    />
                  </div>
                  <div className={cx("edit-actions")}>
                    <Button
                      primary
                      onClick={handleSaveEdit}
                      disabled={saving || !editedTitle.trim() || !editedContent.trim()}
                      leftIcon={
                        saving ? (
                          <FontAwesomeIcon icon={faSpinner} spin />
                        ) : (
                          <FontAwesomeIcon icon={faSave} />
                        )
                      }
                    >
                      {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                    <Button
                      outline
                      onClick={handleCancelEdit}
                      disabled={saving}
                      leftIcon={<FontAwesomeIcon icon={faTimes} />}
                    >
                      Hủy
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* View Mode */}
                {/* Title */}
                <h1 className={cx("title")}>{post.title}</h1>

                {/* Content */}
                <div className={cx("content")}>
                  <p className={cx("content-text")}>
                    {(post.content || post.description || "").split("\n").map((line, i) => (
                      <span key={i}>
                        {line}
                        {i < (post.content || post.description || "").split("\n").length - 1 && <br />}
                      </span>
                    ))}
                  </p>
                </div>

                {/* Stats */}
                <div className={cx("stats")}>
                  <div className={cx("stat-item")}>
                    <FontAwesomeIcon icon={faHeart} className={cx("stat-icon")} />
                    <span>{post.liked.length || 0} lượt thích</span>
                  </div>
                  <div className={cx("stat-item")}>
                    <FontAwesomeIcon
                      icon={faCommentDots}
                      className={cx("stat-icon")}
                    />
                    <span>
                      {countComment|| 0} bình luận
                    </span>
                  </div>
                </div>

                <div className={cx("actions")}>
                  <Button
                    className={"orange"}
                    primary={post.isLiked}
                    outline={!post.isLiked}
                    onClick={handleLike}
                    leftIcon={
                      <FontAwesomeIcon
                        icon={faHeart}
                        className={cx("like-icon", { filled: post.isLiked })}
                      />
                    }
                  >
                    {post.liked.includes(currentUserId) ? "Đã thích" : "Thích"}
                  </Button>

                  <Button
                    outline
                    className={"orange"}
                    onClick={handleShare}
                    leftIcon={
                      <FontAwesomeIcon icon={faShareNodes} className={cx("icon")} />
                    }
                  >
                    Chia sẻ
                  </Button>
                </div>
              </>
            )}
          </Card>

          {/* Comments - Hidden in edit mode */}
          {!isEditing && (
            <Card className={cx("comments-card")}>
              <h2 className={cx("comments-title")}>
                Bình luận ({comments.length})
              </h2>

              {/* Comment input */}
              <div className={cx("comment-form")}>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Viết bình luận của bạn..."
                  className={cx("comment-input")}
                />
                <Button
                  primary
                  disabled={!comment.trim() || submitting}
                  leftIcon={
                    submitting ? (
                      <FontAwesomeIcon icon={faSpinner} spin />
                    ) : (
                      <FontAwesomeIcon icon={faPaperPlane} />
                    )
                  }
                  onClick={handleComment}
                >
                  {submitting ? "Đang gửi..." : "Gửi bình luận"}
                </Button>
              </div>

              {/* Comment list */}
              {commentsLoading ? (
                <div className={cx("comments-loading")}>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  <span>Đang tải bình luận...</span>
                </div>
              ) : (
                <div className={cx("comment-list")}>
                  {comments.length === 0 ? (
                    <p className={cx("no-comments")}>
                      Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
                    </p>
                  ) : (
                    comments.map((c) => (
                      <div key={c._id || c.id || c.commentId} className={cx("comment-item")}>
                        <img
                          src={
                            c.profileId?.image_url || "https://img.tripi.vn/cdn-cgi/image/width=700,height=700/https://gcs.tripi.vn/public-tripi/tripi-feed/img/482752AXp/anh-mo-ta.png"
                          }
                          alt={c.profileId?.name}
                          className={cx("comment-avatar")}
                        />
                        <div className={cx("comment-body")}>
                          <div className={cx("comment-bubble")}>
                            <div className={cx("comment-header")}>
                              <span className={cx("comment-author")}>
                                {c.profileId?.name || "Anonymous"}
                              </span>
                              <span className={cx("comment-time")}>
                                • {formatDateVN(c.createdAt)}
                              </span>
                            </div>
                            <p className={cx("comment-text")}>
                              {(c.content || "").split("\n").map((line, i) => (
                                <span key={i}>
                                  {line}
                                  {i < (c.content || "").split("\n").length - 1 && <br />}
                                </span>
                              ))}
                            </p>
                          </div>

                          <div className={cx("comment-actions")}>
                            <button
                              type="button"
                              className={cx("comment-like-btn", {
                                liked: c.isLiked,
                              })}
                              onClick={() =>
                                handleCommentLike(c._id || c.id || c.commentId)
                              }
                            >
                              <FontAwesomeIcon
                                icon={c.isLiked ? faHeartSolid : faHeartRegular}
                                className={cx("comment-like-icon")}
                              />
                              <span>{c.likeCount}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

export default PostDetail;