import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import classNames from "classnames/bind";
import styles from "./PostDetail.module.scss";

import Button from "~/components/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import postService from "~/services/postService";
import notificationService from "~/services/notificationService";
import { useAuth } from "~/context/AuthContext";
import { getProfile } from "~/services/profileService";
import PostHeader from "~/components/PostHeader/PostHeader";
import PostEditForm from "~/components/PostEditForm/PostEditForm";
import PostViewMode from "~/components/PostViewMode/PostViewMode";
import CommentForm from "~/components/CommentForm/CommentForm";
import CommentList from "~/components/CommentList/CommentList";
import ImageZoomModal from "~/components/ImageZoomModal/ImageZoomModal";

const cx = classNames.bind(styles);

function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, userId: currentUserId } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [countComment, setCountComment] = useState(0);
  const [profile, setProfile] = useState({});
  const [zoomedImage, setZoomedImage] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageChanged, setImageChanged] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [originalImageUrl, setOriginalImageUrl] = useState(null);
  const [originalImagePublicId, setOriginalImagePublicId] = useState(null);

  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentContent, setEditedCommentContent] = useState("");
  const [savingComment, setSavingComment] = useState(false);


  const getMe = async (id) => {
    const response = await getProfile(id);
    setProfile(response.data);
  };

  const pushNotification = async (targetUserId, targetId, title, message) => {
    if (currentUserId === targetUserId) return;
    try {
      await notificationService.pushNotification({ userId: targetUserId, targetId, title, message });
    } catch (err) {
      console.error("Error pushing notification:", err);
    }
  };

  const isCommentOwner = (c) => {
    if (!currentUserId) return false;
    const ownerId = c.profileId?.userId || c.userId;
    return currentUserId === ownerId;
  };


  const fetchComments = async () => {
    setCommentsLoading(true);
    try {
      const response = await postService.getComments(id);
      let commentsData = [];
      if (Array.isArray(response)) commentsData = response;
      else if (response?.comments && Array.isArray(response.comments)) commentsData = response.comments;
      else if (response?.data && Array.isArray(response.data)) commentsData = response.data;

      setComments(
        commentsData.map((c) => {
          const likedArray = Array.isArray(c.liked) ? c.liked : [];
          return { ...c, likeCount: likedArray.length || c.likes || c.likeCount || 0, isLiked: likedArray.includes(currentUserId) };
        })
      );
    } catch (err) {
      console.error("Fetch comments error:", err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await postService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error("Failed to load categories");
    }
  };

  useEffect(() => {
    const fetchPostDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await postService.getPostById(id);
        const postData = response.data.data;
        const likedArray = Array.isArray(postData.liked) ? postData.liked : [];
        setPost({ ...postData, isLiked: likedArray.includes(currentUserId) });
        setCountComment(response.data.countComment);
        setIsOwner(currentUserId === postData.profile_id.userId);
        if (localStorage.getItem("token")) await getMe(currentUserId);
        await fetchComments();
      } catch (err) {
        setError("Không thể tải bài viết. Vui lòng thử lại sau.");
        console.error("Fetch post error:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchPostDetail();
  }, [id, currentUserId]);


  const handleLike = async () => {
    try {
      const response = await postService.toggleLike(id);
      const liked = response.data.liked;
      const currentLiked = Array.isArray(liked) ? liked : [];
      const isCurrentlyLiked = currentLiked.includes(currentUserId);

      if (isCurrentlyLiked) {
        pushNotification(post.profile_id.userId, id, "Bạn có lượt thích mới", `${profile.name || "Ai đó"} đã thích bài viết của bạn.`);
      }

      setPost((prev) => {
        if (response?.data?.liked && Array.isArray(response.data.liked)) {
          return { ...prev, liked: response.data.liked, isLiked: response.data.liked.includes(currentUserId) };
        }
        const newLiked = isCurrentlyLiked
          ? currentLiked.filter((uid) => uid !== currentUserId)
          : [...currentLiked, currentUserId];
        return { ...prev, liked: newLiked, isLiked: !isCurrentlyLiked };
      });
    } catch (err) {
      console.error("Toggle like error:", err);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: post.title, url });
    } else {
      navigator.clipboard.writeText(url);
      alert("Link đã được sao chép!");
    }
  };

  const handleBack = () => navigate("/community");


  const handleEdit = () => {
    setEditedTitle(post.title);
    setEditedContent(post.content || post.description || "");
    setCategoryId(post.category_id?._id || post.category_id || "");
    setOriginalImageUrl(post.image_url || null);
    setOriginalImagePublicId(post.image_publicId || null);
    setImagePreview(post.image_url || null);
    setImage(null);
    setImageChanged(false);
    fetchCategories();
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedTitle(""); setEditedContent(""); setCategoryId("");
    setImage(null); setImagePreview(null); setImageChanged(false);
    setOriginalImageUrl(null); setOriginalImagePublicId(null);
    setError(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Kích thước ảnh không được vượt quá 5MB"); return; }
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) { setError("Chỉ chấp nhận file ảnh định dạng JPG, PNG hoặc GIF"); return; }
    setImage(file); setImageChanged(true);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
    setError(null);
  };

  const handleRemoveImage = () => { setImage(null); setImagePreview(null); setImageChanged(true); setError(null); };

  const uploadPostImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const token = localStorage.getItem("token") || "";
    const response = await fetch(`${process.env.REACT_APP_BASE_URL_API}/posts/image`, {
      method: "POST",
      headers: { Authorization: token ? `Bearer ${token}` : "" },
      body: formData,
    });
    if (!response.ok) throw new Error(`Failed to upload image: ${response.statusText}`);
    return response.json();
  };

  const handleSaveEdit = async () => {
    if (!editedTitle.trim() || !editedContent.trim() || !categoryId) {
      alert("Tiêu đề, nội dung và danh mục không được để trống!");
      return;
    }
    setSaving(true); setError(null);
    try {
      let uploadedImageData = null;
      if (imageChanged && image) {
        setIsUploadingImage(true);
        const imageResult = await uploadPostImage(image);
        uploadedImageData = imageResult.data.data;
        setIsUploadingImage(false);
      }

      const updateData = { title: editedTitle.trim(), content: editedContent.trim(), category_id: categoryId };
      if (uploadedImageData) {
        updateData.image_url = uploadedImageData.image_url;
        updateData.image_publicId = uploadedImageData.image_publicId;
      } else if (imageChanged && !image && !imagePreview) {
        updateData.image_url = null; updateData.image_publicId = null;
      } else if (!imageChanged && originalImageUrl) {
        updateData.image_url = originalImageUrl; updateData.image_publicId = originalImagePublicId;
      }

      await postService.updatePost(id, updateData);
      setPost((prev) => ({ ...prev, title: editedTitle, content: editedContent, description: editedContent, image_url: updateData.image_url, image_publicId: updateData.image_publicId }));
      setIsEditing(false);
      setImage(null); setImagePreview(null); setImageChanged(false);
      setOriginalImageUrl(null); setOriginalImagePublicId(null);
      alert("Đã cập nhật bài viết thành công!");
    } catch (err) {
      setError(err.message || "Không thể cập nhật bài viết. Vui lòng thử lại.");
      alert(err.message || "Không thể cập nhật bài viết. Vui lòng thử lại.");
    } finally {
      setSaving(false); setIsUploadingImage(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này?")) return;
    try {
      await postService.deletePost(id);
      alert("Đã xóa bài viết thành công!");
      navigate("/community");
    } catch (err) {
      console.error("Delete post error:", err);
      alert("Không thể xóa bài viết. Vui lòng thử lại.");
    }
  };


  const handleComment = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await postService.addComment(id, comment);
      await fetchComments();
      setPost((prev) => ({ ...prev, comments: prev.comments + 1 }));
      if (post.profile_id?.userId) {
        pushNotification(post.profile_id.userId, id, "Bạn có bình luận mới", `${profile.name || "Ai đó"} đã bình luận bài viết của bạn.`);
      }
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
          if (cId !== commentId) return c;
          if (response?.data?.liked) {
            return { ...c, liked: response.data.liked, likeCount: response.data.liked.length, isLiked: response.data.liked.includes(currentUserId) };
          }
          return { ...c, isLiked: !c.isLiked, likeCount: c.isLiked ? c.likeCount - 1 : c.likeCount + 1 };
        })
      );
    } catch (err) {
      console.error("Toggle comment like error:", err);
    }
  };

  const handleEditComment = (c) => {
    setEditingCommentId(c._id);
    setEditedCommentContent(c.content || "");
  };

  const handleCancelEditComment = () => { setEditingCommentId(null); setEditedCommentContent(""); };

  const handleSaveEditComment = async (commentId) => {
    if (!editedCommentContent.trim()) { alert("Nội dung bình luận không được để trống!"); return; }
    setSavingComment(true);
    try {
      await postService.updateComment(commentId, { content: editedCommentContent });
      setComments((prev) =>
        prev.map((c) => {
          const cId = c._id || c.id || c.commentId;
          return cId === commentId ? { ...c, content: editedCommentContent } : c;
        })
      );
      setEditingCommentId(null); setEditedCommentContent("");
    } catch (err) {
      console.error("Update comment error:", err);
      alert("Không thể cập nhật bình luận. Vui lòng thử lại.");
    } finally {
      setSavingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bình luận này?")) return;
    try {
      await postService.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => (c._id || c.id || c.commentId) !== commentId));
      setPost((prev) => ({ ...prev, comments: prev.comments - 1 }));
      setCountComment((prev) => prev - 1);
      alert("Đã xóa bình luận thành công!");
    } catch (err) {
      console.error("Delete comment error:", err);
      alert("Không thể xóa bình luận. Vui lòng thử lại.");
    }
  };


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

  if (error && !post) {
    return (
      <div className={cx("wrapper")}>
        <main className={cx("main")}>
          <div className={cx("container")}>
            <div className={cx("error-card")}>
              <p className={cx("error-message")}>{error || "Không tìm thấy bài viết"}</p>
              <Button outline onClick={handleBack}>Quay lại cộng đồng</Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={cx("wrapper")}>
      <main className={cx("main")}>
        <div className={cx("container")}>
          <button type="button" onClick={handleBack} className={cx("back-link")}>
            <FontAwesomeIcon icon={faArrowLeft} className={cx("back-icon")} />
            <span>Quay lại cộng đồng</span>
          </button>

          <article className={cx("post-card")}>
            <PostHeader
              post={post}
              isOwner={isOwner}
              isEditing={isEditing}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />

            {isEditing ? (
              <PostEditForm
                editedTitle={editedTitle}
                editedContent={editedContent}
                categoryId={categoryId}
                categories={categories}
                imagePreview={imagePreview}
                saving={saving}
                isUploadingImage={isUploadingImage}
                error={error}
                onTitleChange={setEditedTitle}
                onContentChange={setEditedContent}
                onCategoryChange={setCategoryId}
                onImageChange={handleImageChange}
                onRemoveImage={handleRemoveImage}
                onSave={handleSaveEdit}
                onCancel={handleCancelEdit}
              />
            ) : (
              <PostViewMode
                post={post}
                countComment={countComment}
                currentUserId={currentUserId}
                isLoggedIn={isLoggedIn}
                onLike={handleLike}
                onShare={handleShare}
                onZoomImage={setZoomedImage}
              />
            )}
          </article>

          {!isEditing && (
            <section className={cx("comments-card")}>
              <h2 className={cx("comments-title")}>
                Bình luận ({comments.length})
              </h2>
              <CommentForm
                comment={comment}
                submitting={submitting}
                isLoggedIn={isLoggedIn}
                onChange={(e) => setComment(e.target.value)}
                onSubmit={handleComment}
              />
              <CommentList
                comments={comments}
                commentsLoading={commentsLoading}
                editingCommentId={editingCommentId}
                editedCommentContent={editedCommentContent}
                savingComment={savingComment}
                isCommentOwner={isCommentOwner}
                onLike={handleCommentLike}
                onEdit={handleEditComment}
                onDelete={handleDeleteComment}
                onEditChange={setEditedCommentContent}
                onSaveEdit={handleSaveEditComment}
                onCancelEdit={handleCancelEditComment}
              />
            </section>
          )}
        </div>
      </main>

      {zoomedImage && (
        <ImageZoomModal imageUrl={zoomedImage} onClose={() => setZoomedImage(null)} />
      )}
    </div>
  );
}

export default PostDetail;
