import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faHeart as faHeartSolid,
  faMessage,
} from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
import formatDateVN from "~/services/formatDate";
import { useAuth } from "~/context/AuthContext";
import { useToast } from "~/context/ToastContext";
import postService from "~/services/postService";
import PostActionsMenu from "~/components/PostActionsMenu/PostActionsMenu";

function PostCard({ post, commentCount }) {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { isLoggedIn, userId: currentUserId } = useAuth();
  const authorName = post.profile_id?.name || "Anonymous";
  const avatarUrl = post.profile_id?.image_url || "/placeholder.svg";
  const hasImage = Boolean(post.image_url);
  const postId = post._id || post.id;
  const isOwner = Boolean(currentUserId && post.profile_id?.userId === currentUserId);

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

  return (
    <article className="group relative block overflow-hidden rounded-[18px] border border-border bg-white px-6 py-[22px] text-inherit shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition before:absolute before:bottom-0 before:left-0 before:top-0 before:w-1 before:bg-[linear-gradient(180deg,var(--primary)_0%,var(--primary-hover)_100%)] before:opacity-0 before:transition-opacity before:content-[''] hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)] hover:before:opacity-100 max-[640px]:rounded-2xl max-[640px]:px-[18px] max-[640px]:py-[18px]">
      <div className={`flex items-stretch gap-[18px] ${hasImage ? "max-[640px]:flex-col" : ""}`}>
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <div className="flex items-center gap-3">
            <img
              src={avatarUrl}
              alt={authorName}
              className="h-10 w-10 shrink-0 rounded-full border-2 border-white object-cover shadow-[0_2px_6px_rgba(0,0,0,0.08)]"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-sm font-semibold text-text-high">{authorName}</span>
              <span className="text-xs text-grey">
                {formatDateVN(post.created_at) || "Vừa xong"}
              </span>
            </div>
            {post.category_id && (
              <span className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                {post.category_id.name}
              </span>
            )}
            <PostActionsMenu
              postId={postId}
              isOwner={isOwner}
              isLoggedIn={isLoggedIn}
              onEdit={handleEdit}
              onDelete={handleDelete}
              compact
            />
          </div>

          <Link to={`/community/${postId}`} className="block text-inherit no-underline">
            <h3 className="m-0 mt-1 overflow-hidden text-[19px] font-bold leading-[1.35] text-text-high transition [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] group-hover:text-primary max-[640px]:text-[17px]">
              {post.title}
            </h3>
            <p className="m-0 overflow-hidden text-sm leading-[1.6] text-grey-low [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
              {post.excerpt || post.content}
            </p>
          </Link>

          <div className="mt-1 flex items-center justify-between pt-3">
            <div className="flex items-center gap-[18px]">
              <span
                className={[
                  "inline-flex items-center gap-1.5 text-[13px] transition [&_svg]:text-[13px]",
                  post.isLiked ? "text-[#e11d63]" : "text-grey",
                ].join(" ")}
              >
                <FontAwesomeIcon icon={post.isLiked ? faHeartSolid : faHeartRegular} />
                {post.likeCount || 0}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[13px] text-grey transition [&_svg]:text-[13px]">
                <FontAwesomeIcon icon={faMessage} />
                {commentCount || 0}
              </span>
            </div>
            <Link
              to={`/community/${postId}`}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-grey no-underline transition-all group-hover:gap-2.5 group-hover:text-primary"
            >
              Đọc tiếp <FontAwesomeIcon icon={faArrowRight} className="text-[11px]" />
            </Link>
          </div>
        </div>

        {hasImage && (
          <Link
            to={`/community/${postId}`}
            className="block max-h-[180px] w-[180px] shrink-0 self-stretch overflow-hidden rounded-[14px] bg-[var(--card)] max-[640px]:order-first max-[640px]:max-h-[220px] max-[640px]:w-full"
          >
            <img
              className="block h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              src={post.image_url}
              alt=""
            />
          </Link>
        )}
      </div>
    </article>
  );
}

export default PostCard;
