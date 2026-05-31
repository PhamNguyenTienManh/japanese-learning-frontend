import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart as faHeartSolid,
  faMessage,
  faShareNodes,
} from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
import formatDateVN from "~/services/formatDate";
import { useAuth } from "~/context/AuthContext";
import { useToast } from "~/context/ToastContext";
import postService from "~/services/postService";
import PostActionsMenu from "~/components/PostActionsMenu/PostActionsMenu";
import { getAvatarUrl, handleAvatarError } from "~/utils/avatar";

function PostCard({ post, commentCount }) {
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
    const url = `${window.location.origin}/community/${postId}`;
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
    <article className="relative overflow-hidden rounded-[18px] border border-border bg-white px-6 py-[22px] text-inherit shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition hover:border-primary/30 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)] max-[640px]:rounded-2xl max-[640px]:px-[18px] max-[640px]:py-[18px]">
      <div className="flex items-start gap-3">
        <img
          src={avatarUrl}
          alt={authorName}
          className="h-11 w-11 shrink-0 rounded-full border-2 border-white object-cover shadow-[0_2px_6px_rgba(0,0,0,0.08)]"
          onError={handleAvatarError}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-text-high">{authorName}</span>
            {categoryName && (
              <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {categoryName}
              </span>
            )}
          </div>
          <div className="mt-0.5 text-xs text-grey">
            {formatDateVN(post.created_at) || "Vừa xong"}
            {post.edited_at && <span className="ml-1.5">· Đã sửa</span>}
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

      <div className="mt-4">
        <h3 className="m-0 text-[20px] font-bold leading-[1.35] text-text-high max-[640px]:text-[18px]">
          {post.title}
        </h3>
        {content && (
          <p className="m-0 mt-3 whitespace-pre-line break-words text-[15px] leading-7 text-grey-low">
            {content}
          </p>
        )}
      </div>

      {hasImage && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-[var(--card)]">
          <img
            className="block max-h-[520px] w-full object-contain"
            src={post.image_url}
            alt={post.title || ""}
          />
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 border-b border-border pb-3 text-[13px] text-grey max-[480px]:flex-col max-[480px]:items-start">
        <div className="flex items-center gap-[18px]">
          <span
            className={[
              "inline-flex items-center gap-1.5",
              isLiked ? "text-[#e11d63]" : "text-grey",
            ].join(" ")}
          >
            <FontAwesomeIcon icon={isLiked ? faHeartSolid : faHeartRegular} />
            {likeCount}
          </span>
          <Link
            to={`/community/${postId}`}
            className="inline-flex items-center gap-1.5 text-grey no-underline transition hover:text-primary"
          >
            <FontAwesomeIcon icon={faMessage} />
            {displayCommentCount} bình luận
          </Link>
        </div>
        {post.view_count != null && <span>{post.view_count || 0} lượt xem</span>}
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2">
        <button
          type="button"
          className={[
            "inline-flex h-10 items-center justify-center gap-2 rounded-xl border-none bg-transparent text-sm font-semibold transition hover:bg-primary/10",
            isLiked ? "text-[#e11d63]" : "text-grey-low hover:text-primary",
            liking ? "cursor-wait opacity-70" : "cursor-pointer",
          ].join(" ")}
          onClick={handleLike}
          disabled={liking}
        >
          <FontAwesomeIcon icon={isLiked ? faHeartSolid : faHeartRegular} />
          <span>{isLiked ? "Đã thích" : "Thích"}</span>
        </button>
        <button
          type="button"
          className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border-none bg-transparent text-sm font-semibold text-grey-low transition hover:bg-primary/10 hover:text-primary"
          onClick={() => navigate(`/community/${postId}`)}
        >
          <FontAwesomeIcon icon={faMessage} />
          <span>Bình luận</span>
        </button>
        <button
          type="button"
          className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border-none bg-transparent text-sm font-semibold text-grey-low transition hover:bg-primary/10 hover:text-primary"
          onClick={handleShare}
        >
          <FontAwesomeIcon icon={faShareNodes} />
          <span>Chia sẻ</span>
        </button>
      </div>
    </article>
  );
}

export default PostCard;
