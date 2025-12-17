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
  faEllipsisV,
  faImage,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import formatDateVN from "~/services/formatDate";
import postService from "~/services/postService";
import notificationService from "~/services/notificationService";
import { faHeart as faHeartSolid } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
import decodeToken from "~/services/pairToken";
import CategorySelector from "~/components/CategorySelection";
import ActionBtn from "~/components/ActionBtnInCommunity";
import { useAuth } from "~/context/AuthContext";
import { getProfile } from "~/services/profileService";

const cx = classNames.bind(styles);
function ImageZoomModal({ imageUrl, onClose }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div
      className={cx("image-zoom-modal")}
      onClick={onClose}
    >
      <button
        className={cx("zoom-close-btn")}
        onClick={onClose}
      >
        <FontAwesomeIcon icon={faTimes} />
      </button>

      <img
        src={imageUrl}
        alt="Zoomed"
        className={cx("zoomed-image")}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
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
  const { isLoggedIn, userId: currentUserId, profileId } = useAuth();

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentContent, setEditedCommentContent] = useState("");
  const [savingComment, setSavingComment] = useState(false);
  const [profile, setProfile] = useState({});
  const [zoomedImage, setZoomedImage] = useState(null);

  // Image upload states
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageChanged, setImageChanged] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [originalImageUrl, setOriginalImageUrl] = useState(null);
  const [originalImagePublicId, setOriginalImagePublicId] = useState(null);

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

  const getMe = async (id) => {
    const response = await getProfile(id);
    setProfile(response.data);
    return response.data;
  };

  const pushNotification = async (targetUserId, targetId, title, message) => {
    if (currentUserId === targetUserId) return;

    try {
      await notificationService.pushNotification({
        userId: targetUserId,
        targetId: targetId,
        title: title,
        message: message,
      });
    } catch (error) {
      console.error("Error pushing notification:", error);
    }
  };

  const isCommentOwner = (comment) => {
    if (!currentUserId) return false;
    const commentOwnerId = comment.profileId?.userId || comment.userId;
    return currentUserId === commentOwnerId;
  };

  useEffect(() => {
    const fetchPostDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await postService.getPostById(id);
        const postData = response.data.data;

        const likedArray = Array.isArray(postData.liked) ? postData.liked : [];
        const enrichedPost = {
          ...postData,
          isLiked: likedArray.includes(currentUserId),
        };
        setPost(enrichedPost);
        setCountComment(response.data.countComment);

        const postOwnerId = postData.profile_id.userId;
        setIsOwner(currentUserId === postOwnerId);
        if (localStorage.getItem("token")) {
          const me = await getMe(currentUserId);
        }


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

      let commentsData = [];
      if (Array.isArray(response)) {
        commentsData = response;
      } else if (response?.comments && Array.isArray(response.comments)) {
        commentsData = response.comments;
      } else if (response?.data && Array.isArray(response.data)) {
        commentsData = response.data;
      }

      const mappedComments = commentsData.map((c) => {
        const likedArray = Array.isArray(c.liked) ? c.liked : [];
        const isUserLiked = likedArray.includes(currentUserId);

        return {
          ...c,
          likeCount: likedArray.length || c.likes || c.likeCount || 0,
          isLiked: isUserLiked,
        };
      });

      setComments(mappedComments);
    } catch (err) {
      console.error("Fetch comments error:", err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const response = await postService.toggleLike(id);
      const liked = response.data.liked;
      const currentLiked = Array.isArray(liked) ? liked : [];
      const isCurrentlyLiked = currentLiked.includes(currentUserId);

      console.log("like", isCurrentlyLiked, response.data.profile_id?.userId);

      if (isCurrentlyLiked) {
        const postOwnerUserId = post.profile_id.userId;
        pushNotification(
          postOwnerUserId,
          id,
          "Bạn có lượt thích mới",
          `${profile.name || "Ai đó"} đã thích bài viết của bạn.`
        );
      }

      setPost((prev) => {
        if (response?.data?.liked && Array.isArray(response.data.liked)) {
          return {
            ...prev,
            liked: response.data.liked,
            isLiked: response.data.liked.includes(currentUserId),
          };
        }

        let newLiked;
        if (isCurrentlyLiked) {
          newLiked = currentLiked.filter((uid) => uid !== currentUserId);
        } else {
          newLiked = [...currentLiked, currentUserId];
        }

        return {
          ...prev,
          liked: newLiked,
          isLiked: !isCurrentlyLiked,
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

      setPost((prev) => {
        return {
          ...prev,
          comments: prev.comments + 1,
        };
      });
      if (post.profile_id?.userId) {
        const postOwnerUserId = post.profile_id.userId;
        pushNotification(
          postOwnerUserId,
          id,
          "Bạn có bình luận mới",
          `${profile.name || "Ai đó"} đã bình luận bài viết của bạn.`
        );
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
          if (cId === commentId) {
            if (response?.data?.liked) {
              return {
                ...c,
                liked: response.data.liked,
                likeCount: response.data.liked.length,
                isLiked: response.data.liked.includes(currentUserId),
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

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Kích thước ảnh không được vượt quá 5MB");
        return;
      }

      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
      if (!validTypes.includes(file.type)) {
        setError("Chỉ chấp nhận file ảnh định dạng JPG, PNG hoặc GIF");
        return;
      }

      setImage(file);
      setImageChanged(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    setImageChanged(true);
    setError(null);
  };

  // Upload image to server
  const uploadPostImage = async (file) => {
    if (!file) throw new Error("File is required");

    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("token") || "";
    const response = await fetch(`${process.env.REACT_APP_BASE_URL_API}/posts/image`, {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload image: ${response.statusText}`);
    }

    return response.json();
  };

  // Bắt đầu chỉnh sửa comment
  const handleEditComment = (comment) => {
    const commentId = comment._id;
    setEditingCommentId(commentId);
    setEditedCommentContent(comment.content || "");
  };

  // Hủy chỉnh sửa comment
  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditedCommentContent("");
  };

  // Lưu comment đã chỉnh sửa
  const handleSaveEditComment = async (commentId) => {
    if (!editedCommentContent.trim()) {
      alert("Nội dung bình luận không được để trống!");
      return;
    }

    setSavingComment(true);
    try {
      await postService.updateComment(commentId, {
        content: editedCommentContent,
      });

      setComments((prev) =>
        prev.map((c) => {
          const cId = c._id || c.id || c.commentId;
          if (cId === commentId) {
            return {
              ...c,
              content: editedCommentContent,
            };
          }
          return c;
        })
      );

      setEditingCommentId(null);
      setEditedCommentContent("");
    } catch (err) {
      console.error("Update comment error:", err);
      alert("Không thể cập nhật bình luận. Vui lòng thử lại.");
    } finally {
      setSavingComment(false);
    }
  };

  // Xóa comment
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bình luận này?")) {
      return;
    }

    try {
      await postService.deleteComment(commentId);

      setComments((prev) =>
        prev.filter((c) => {
          const cId = c._id || c.id || c.commentId;
          return cId !== commentId;
        })
      );

      setPost((prev) => ({
        ...prev,
        comments: prev.comments - 1,
      }));

      setCountComment((prev) => prev - 1);

      alert("Đã xóa bình luận thành công!");
    } catch (err) {
      console.error("Delete comment error:", err);
      alert("Không thể xóa bình luận. Vui lòng thử lại.");
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
    setEditedContent(post.content || post.description || "");
    setCategoryId(post.category_id?._id || post.category_id || "");

    // Backup original image data
    setOriginalImageUrl(post.image_url || null);
    setOriginalImagePublicId(post.image_publicId || null);

    // Set current image as preview
    setImagePreview(post.image_url || null);
    setImage(null);
    setImageChanged(false);

    fetchCategories();
    setIsEditing(true);
  };

  // Handle cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedTitle("");
    setEditedContent("");
    setCategoryId("");
    setImage(null);
    setImagePreview(null);
    setImageChanged(false);
    setOriginalImageUrl(null);
    setOriginalImagePublicId(null);
    setError(null);
  };

  // Handle save edited post
  const handleSaveEdit = async () => {
    if (!editedTitle.trim() || !editedContent.trim() || !categoryId) {
      alert("Tiêu đề, nội dung và danh mục không được để trống!");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Step 1: Upload image if changed
      let uploadedImageData = null;
      if (imageChanged && image) {
        try {
          setIsUploadingImage(true);
          const imageResult = await uploadPostImage(image);
          uploadedImageData = imageResult.data.data;
          setIsUploadingImage(false);
        } catch (uploadErr) {
          setIsUploadingImage(false);
          throw new Error("Không thể tải ảnh lên. Vui lòng thử lại.");
        }
      }

      // Step 2: Prepare update data
      const updateData = {
        title: editedTitle.trim(),
        content: editedContent.trim(),
        category_id: categoryId,
      };

      // Add image data
      if (uploadedImageData) {
        // New image uploaded
        updateData.image_url = uploadedImageData.image_url;
        updateData.image_publicId = uploadedImageData.image_publicId;
      } else if (imageChanged && !image && !imagePreview) {
        // Image was removed
        updateData.image_url = null;
        updateData.image_publicId = null;
      } else if (!imageChanged) {
        // Keep original image
        if (originalImageUrl) {
          updateData.image_url = originalImageUrl;
          updateData.image_publicId = originalImagePublicId;
        }
      }

      // Step 3: Update post
      const response = await postService.updatePost(id, updateData);

      // Update local state
      setPost((prev) => ({
        ...prev,
        title: editedTitle,
        content: editedContent,
        description: editedContent,
        image_url: updateData.image_url,
        image_publicId: updateData.image_publicId,
      }));

      setIsEditing(false);
      setImage(null);
      setImagePreview(null);
      setImageChanged(false);
      setOriginalImageUrl(null);
      setOriginalImagePublicId(null);

      alert("Đã cập nhật bài viết thành công!");
    } catch (err) {
      setError(err.message || "Không thể cập nhật bài viết. Vui lòng thử lại.");
      console.error("Update post error:", err);
      alert(err.message || "Không thể cập nhật bài viết. Vui lòng thử lại.");
    } finally {
      setSaving(false);
      setIsUploadingImage(false);
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
  if (error && !post) {
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
                  <span>
                    {post.created_at ? formatDateVN(post.created_at) : "Vừa xong"}
                  </span>
                  {(post.author?.posts || post.authorPosts) && (
                    <>
                      <span className={cx("dot")}>•</span>
                      <span>{post.author?.posts || post.authorPosts} bài viết</span>
                    </>
                  )}
                </div>
              </div>
              <div className={cx("post-header-actions")}>
                {post.category_id && (
                  <span className={cx("badge", "badge-category")}>
                    {post.category_id.name || "Từ vựng"}
                  </span>
                )}
                {isOwner && !isEditing && (
                  <ActionBtn onEdit={handleEdit} onDelete={handleDelete} />
                )}
              </div>
            </div>

            {/* Edit Mode */}
            {isEditing ? (
              <div className={cx("edit-mode")}>
                <div className={cx("edit-form")}>
                  {error && (
                    <div className={cx("alert", "alert-error")}>
                      {error}
                    </div>
                  )}

                  <div className={cx("form-group")}>
                    <label className={cx("form-label")}>Danh mục</label>
                    <CategorySelector
                      categories={categories}
                      value={categoryId}
                      onChange={setCategoryId}
                      disabled={saving || isUploadingImage}
                    />
                  </div>

                  <div className={cx("form-group")}>
                    <label className={cx("form-label")}>Tiêu đề</label>
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className={cx("form-input")}
                      placeholder="Nhập tiêu đề bài viết"
                      disabled={saving || isUploadingImage}
                    />
                  </div>

                  {/* Image Upload */}
                  <div className={cx("form-group")}>
                    <label className={cx("form-label")}>Ảnh bài viết</label>
                    <div className={cx("image-upload")}>
                      {imagePreview ? (
                        <div className={cx("image-preview-container")}>
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className={cx("image-preview")}
                          />
                          <button
                            type="button"
                            className={cx("image-remove-btn")}
                            onClick={handleRemoveImage}
                            disabled={saving || isUploadingImage}
                          >
                            <FontAwesomeIcon icon={faXmark} />
                          </button>
                        </div>
                      ) : (
                        <div className={cx("image-upload-placeholder")}>
                          <input
                            type="file"
                            id="post-image-input-edit"
                            accept="image/*"
                            onChange={handleImageChange}
                            className={cx("image-input")}
                            disabled={saving || isUploadingImage}
                          />
                          <label
                            htmlFor="post-image-input-edit"
                            className={cx("image-upload-label")}
                          >
                            <FontAwesomeIcon
                              icon={faImage}
                              className={cx("upload-icon")}
                            />
                            <span>Chọn ảnh</span>
                          </label>
                          <p className={cx("upload-hint")}>
                            JPG, PNG hoặc GIF (tối đa 5MB)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={cx("form-group")}>
                    <label className={cx("form-label")}>Nội dung</label>
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className={cx("form-textarea")}
                      placeholder="Nhập nội dung bài viết"
                      rows={10}
                      disabled={saving || isUploadingImage}
                    />
                  </div>

                  <div className={cx("edit-actions")}>
                    <Button
                      primary
                      onClick={handleSaveEdit}
                      disabled={
                        saving ||
                        isUploadingImage ||
                        !editedTitle.trim() ||
                        !editedContent.trim() ||
                        !categoryId
                      }
                      leftIcon={
                        isUploadingImage || saving ? (
                          <FontAwesomeIcon icon={faSpinner} spin />
                        ) : (
                          <FontAwesomeIcon icon={faSave} />
                        )
                      }
                    >
                      {isUploadingImage
                        ? "Đang tải ảnh..."
                        : saving
                          ? "Đang lưu..."
                          : "Lưu thay đổi"}
                    </Button>
                    <Button
                      outline
                      onClick={handleCancelEdit}
                      disabled={saving || isUploadingImage}
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

                {/* Post Image */}
                {post.image_url && (
                  <div
                    className={cx("post-image-container")}
                    onClick={() => setZoomedImage(post.image_url)}
                    style={{ cursor: 'zoom-in' }}
                  >
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className={cx("post-image")}
                    />
                  </div>
                )}

                {/* Content */}
                <div className={cx("content")}>
                  <p className={cx("content-text")}>
                    {(post.content || post.description || "")
                      .split("\n")
                      .map((line, i) => (
                        <span key={i}>
                          {line}
                          {i <
                            (post.content || post.description || "").split("\n")
                              .length -
                            1 && <br />}
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
                    <span>{countComment || 0} bình luận</span>
                  </div>
                </div>

                <div className={cx("actions")}>
                  <Button
                    className={"orange"}
                    primary={post.isLiked}
                    outline={!post.isLiked}
                    onClick={() => {
                      if (!isLoggedIn) {
                        alert("Bạn cần đăng nhập để thực hiện thao tác này.");
                        return;
                      }
                      handleLike();
                    }}
                    leftIcon={
                      <FontAwesomeIcon
                        icon={faHeart}
                        className={cx("like-icon", { filled: post.isLiked })}
                      />
                    }
                  >
                    <span
                      className={cx(
                        "like-text",
                        post.liked.includes(currentUserId) && "liked"
                      )}
                    >
                      {post.liked.includes(currentUserId) ? "Đã thích" : "Thích"}
                    </span>

                  </Button>

                  <Button
                    outline
                    className={"orange"}
                    onClick={handleShare}
                    leftIcon={
                      <FontAwesomeIcon
                        icon={faShareNodes}
                        className={cx("icon")}
                      />
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
                {isLoggedIn ?
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
                  :
                  <Button primary disabled>
                    Đăng nhập để gửi bình luận
                  </Button>
                }
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
                    comments.map((c) => {
                      const commentId = c._id || c.id || c.commentId;
                      const isEditing = editingCommentId === commentId;
                      const isOwner = isCommentOwner(c);

                      return (
                        <div key={commentId} className={cx("comment-item")}>
                          <img
                            src={
                              c.profileId?.image_url ||
                              "https://img.tripi.vn/cdn-cgi/image/width=700,height=700/https://gcs.tripi.vn/public-tripi/tripi-feed/img/482752AXp/anh-mo-ta.png"
                            }
                            alt={c.profileId?.name}
                            className={cx("comment-avatar")}
                          />
                          <div className={cx("comment-body")}>
                            {isEditing ? (
                              <div className={cx("comment-edit-form")}>
                                <textarea
                                  value={editedCommentContent}
                                  onChange={(e) =>
                                    setEditedCommentContent(e.target.value)
                                  }
                                  className={cx("comment-edit-input")}
                                  rows={3}
                                />
                                <div className={cx("comment-edit-actions")}>
                                  <Button
                                    primary
                                    small
                                    onClick={() => handleSaveEditComment(commentId)}
                                    disabled={
                                      savingComment || !editedCommentContent.trim()
                                    }
                                    leftIcon={
                                      savingComment ? (
                                        <FontAwesomeIcon icon={faSpinner} spin />
                                      ) : (
                                        <FontAwesomeIcon icon={faSave} />
                                      )
                                    }
                                  >
                                    {savingComment ? "Đang lưu..." : "Lưu"}
                                  </Button>
                                  <Button
                                    outline
                                    small
                                    onClick={handleCancelEditComment}
                                    disabled={savingComment}
                                    leftIcon={<FontAwesomeIcon icon={faTimes} />}
                                  >
                                    Hủy
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className={cx("comment-bubble")}>
                                  <div className={cx("comment-header")}>
                                    <span className={cx("comment-author")}>
                                      {c.profileId?.name || "Anonymous"}
                                    </span>
                                    <span className={cx("comment-time")}>
                                      • {formatDateVN(c.createdAt)}
                                    </span>
                                    {isOwner && (
                                      <div className={cx("comment-owner-actions")}>
                                        <button
                                          type="button"
                                          className={cx("comment-action-btn")}
                                          onClick={() => handleEditComment(c)}
                                          title="Chỉnh sửa"
                                        >
                                          <FontAwesomeIcon icon={faEdit} />
                                        </button>
                                        <button
                                          type="button"
                                          className={cx(
                                            "comment-action-btn",
                                            "delete"
                                          )}
                                          onClick={() =>
                                            handleDeleteComment(commentId)
                                          }
                                          title="Xóa"
                                        >
                                          <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  <p className={cx("comment-text")}>
                                    {(c.content || "")
                                      .split("\n")
                                      .map((line, i) => (
                                        <span key={i}>
                                          {line}
                                          {i <
                                            (c.content || "").split("\n").length -
                                            1 && <br />}
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
                                    onClick={() => handleCommentLike(commentId)}
                                  >
                                    <FontAwesomeIcon
                                      icon={
                                        c.isLiked ? faHeartSolid : faHeartRegular
                                      }
                                      className={cx("comment-like-icon")}
                                    />
                                    <span>{c.likeCount}</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </Card>
          )}
        </div>
      </main>
      {zoomedImage && (
        <ImageZoomModal
          imageUrl={zoomedImage}
          onClose={() => setZoomedImage(null)}
        />
      )}
    </div>
  );
}

export default PostDetail;