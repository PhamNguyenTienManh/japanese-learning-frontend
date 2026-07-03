import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart as faHeartSolid,
} from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
import formatDateVN from "~/services/formatDate";
import { useAuth } from "~/context/AuthContext";
import { useToast } from "~/context/ToastContext";
import postService from "~/services/postService";
import PostActionsMenu from "~/components/PostActionsMenu/PostActionsMenu";
import { getAvatarUrl, getInitials, getAvatarGradient } from "~/utils/avatar";

function PostCard({ post, commentCount, onCommentClick }) {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { isLoggedIn, userId: currentUserId } = useAuth();
  const authorName = post.profile_id?.name || "Anonymous";
  const avatarUrl = getAvatarUrl(post.profile_id?.image_url);
  const hasImage = Boolean(post.image_url);
  const postId = post._id || post.id;
  const isOwner = Boolean(currentUserId && post.profile_id?.userId === currentUserId);
  const likedArray = Array.isArray(post.liked) ? post.liked : [];
  const derivedIsLiked = Boolean(post.isLiked ?? (currentUserId && likedArray.includes(currentUserId)));
  const derivedLikeCount = Number(post.likeCount ?? likedArray.length ?? post.likes ?? 0);
  const displayCommentCount = Number(commentCount ?? post.comments ?? post.countComment ?? 0);
  const categoryName = post.category_id?.name || post.categoryName || post.category;
  const content = post.content || post.description || post.excerpt || "";
  const [isLiked, setIsLiked] = useState(derivedIsLiked);
  const [likeCount, setLikeCount] = useState(derivedLikeCount);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    setIsLiked(derivedIsLiked);
    setLikeCount(derivedLikeCount);
  }, [derivedIsLiked, derivedLikeCount, postId]);

  const handleEdit = () => {
    navigate(`/community/new?edit=${postId}`);
  };

  const handleDelete = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này?")) return;
    try {
      await postService.deletePost(postId);
      addToast("Đã xóa bài viết thành công", "success");
      window.location.reload();
    } catch (err) {
      addToast("Không thể xóa bài viết. Vui lòng thử lại.", "error");
    }
  };

  const handleLike = async () => {
    if (!isLoggedIn) {
      addToast("Bạn cần đăng nhập để thích bài viết.", "warning");
      return;
    }
    if (liking) return;

    const nextLiked = !isLiked;
    const previousLiked = isLiked;
    const previousCount = likeCount;

    setLiking(true);
    setIsLiked(nextLiked);
    setLikeCount((prev) => Math.max(prev + (nextLiked ? 1 : -1), 0));

    try {
      const response = await postService.toggleLike(postId);
      const nextLikedArray = response?.data?.liked;
      if (Array.isArray(nextLikedArray)) {
        setIsLiked(nextLikedArray.includes(currentUserId));
        setLikeCount(nextLikedArray.length);
      }
    } catch (err) {
      setIsLiked(previousLiked);
      setLikeCount(previousCount);
      addToast("Không thể cập nhật lượt thích. Vui lòng thử lại.", "error");
    } finally {
      setLiking(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/community?postId=${postId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        addToast("Đã sao chép liên kết bài viết", "success");
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        addToast("Không thể chia sẻ bài viết. Vui lòng thử lại.", "error");
      }
    }
  };

  return (
    <article className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/30 hover:border-outline-variant/60 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={authorName}
              data-name={authorName}
              className="w-10 h-10 rounded-full object-cover border border-outline-variant/20"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.dataset.fallbacked) return;
                target.dataset.fallbacked = "true";
                const parent = target.parentNode;
                const span = document.createElement("span");
                span.className = "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0 border border-outline-variant/20";
                span.style.background = getAvatarGradient(authorName);
                span.textContent = getInitials(authorName);
                parent.replaceChild(span, target);
              }}
            />
          ) : (
            <span
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0 border border-outline-variant/20"
              style={{ background: getAvatarGradient(authorName) }}
            >
              {getInitials(authorName)}
            </span>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-on-surface">{authorName}</h3>
              {categoryName && (
                <span className="bg-tertiary-container/10 text-tertiary text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {categoryName}
                </span>
              )}
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {formatDateVN(post.created_at) || "Vừa xong"}
              {post.edited_at && <span className="ml-1.5">· Đã sửa</span>}
            </p>
          </div>
        </div>
        <PostActionsMenu
          postId={postId}
          isOwner={isOwner}
          isLoggedIn={isLoggedIn}
          onEdit={handleEdit}
          onDelete={handleDelete}
          compact
        />
      </div>

      <h2 className="text-[20px] font-bold leading-snug text-on-surface mb-3">{post.title}</h2>

      {content && (
        <div className="text-base leading-6 text-on-surface-variant mb-5 space-y-3">
          <p className="whitespace-pre-line break-words">{content}</p>
        </div>
      )}

      {hasImage && (
        <div className="mt-4 mb-4 overflow-hidden rounded-xl">
          <img
            className="block max-h-[520px] w-full object-contain"
            src={post.image_url}
            alt={post.title || ""}
          />
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-surface-container-high">
        <div className="flex items-center gap-6">
          <button
            className={`flex items-center gap-1.5 text-sm font-semibold transition-colors bg-transparent border-none cursor-pointer ${isLiked ? "text-[#e11d63]" : "text-on-surface-variant hover:text-primary"}`}
            onClick={handleLike}
            disabled={liking}
          >
            <FontAwesomeIcon icon={isLiked ? faHeartSolid : faHeartRegular} className="text-[20px]" />
            <span>{likeCount}</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors text-sm font-semibold bg-transparent border-none cursor-pointer"
            onClick={() => (onCommentClick ? onCommentClick(postId) : navigate(`/community?postId=${postId}`))}
          >
            <span className="material-symbols-outlined text-[20px]">chat_bubble_outline</span>
            <span>{displayCommentCount} bình luận</span>
          </button>
        </div>
        <button
          className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors text-sm font-semibold bg-transparent border-none cursor-pointer"
          onClick={handleShare}
        >
          <span className="material-symbols-outlined text-[20px]">share</span>
          <span className="hidden sm:inline">Chia sẻ</span>
        </button>
      </div>
    </article>
  );
}

export default PostCard;
