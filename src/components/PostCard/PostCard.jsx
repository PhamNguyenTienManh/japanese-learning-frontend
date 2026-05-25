import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMessage,
  faArrowRight,
  faHeart as faHeartSolid,
} from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
import classNames from "classnames/bind";
import styles from "./PostCard.module.scss";
import formatDateVN from "~/services/formatDate";
import { useAuth } from "~/context/AuthContext";
import { useToast } from "~/context/ToastContext";
import postService from "~/services/postService";
import PostActionsMenu from "~/components/PostActionsMenu/PostActionsMenu";

const cx = classNames.bind(styles);

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
    <article className={cx("post-card")}>
      <div className={cx("post-main", { "has-image": hasImage })}>
        <div className={cx("post-body")}>
          <div className={cx("post-header")}>
            <img src={avatarUrl} alt={authorName} className={cx("avatar")} />
            <div className={cx("post-meta")}>
              <span className={cx("post-author")}>{authorName}</span>
              <span className={cx("post-time")}>
                {formatDateVN(post.created_at) || "Vừa xong"}
              </span>
            </div>
            {post.category_id && (
              <span className={cx("post-category")}>{post.category_id.name}</span>
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

          <Link to={`/community/${postId}`} className={cx("post-link")}>
            <h3 className={cx("post-title")}>{post.title}</h3>
            <p className={cx("post-excerpt")}>{post.excerpt || post.content}</p>
          </Link>

          <div className={cx("post-footer")}>
            <div className={cx("post-stats")}>
              <span className={cx("stat", { liked: post.isLiked })}>
                <FontAwesomeIcon
                  icon={post.isLiked ? faHeartSolid : faHeartRegular}
                />
                {post.likeCount || 0}
              </span>
              <span className={cx("stat")}>
                <FontAwesomeIcon icon={faMessage} />
                {commentCount || 0}
              </span>
            </div>
            <Link to={`/community/${postId}`} className={cx("read-more")}>
              Đọc tiếp <FontAwesomeIcon icon={faArrowRight} />
            </Link>
          </div>
        </div>

        {hasImage && (
          <Link to={`/community/${postId}`} className={cx("post-thumb-wrap")}>
            <img className={cx("post-thumb")} src={post.image_url} alt="" />
          </Link>
        )}
      </div>
    </article>
  );
}

export default PostCard;
