import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart,
  faCommentDots,
  faShareNodes,
  faEye,
} from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
import classNames from "classnames/bind";
import styles from "./PostViewMode.module.scss";

const cx = classNames.bind(styles);

function PostViewMode({ post, countComment, currentUserId, isLoggedIn, onLike, onShare, onZoomImage }) {
  const likeCount = post.liked?.length || 0;
  const isLiked = post.liked?.includes(currentUserId);

  const handleLikeClick = () => {
    if (!isLoggedIn) {
      alert("Bạn cần đăng nhập để thực hiện thao tác này.");
      return;
    }
    onLike();
  };

  return (
    <>
      <h1 className={cx("title")}>{post.title}</h1>

      <div className={cx("meta-row")}>
        <span className={cx("meta-item")}>
          <FontAwesomeIcon icon={faEye} />
          {post.view_count || 0} lượt xem
        </span>
        <span className={cx("meta-dot")}>•</span>
        <span className={cx("meta-item")}>
          <FontAwesomeIcon icon={faHeart} />
          {likeCount} thích
        </span>
        <span className={cx("meta-dot")}>•</span>
        <span className={cx("meta-item")}>
          <FontAwesomeIcon icon={faCommentDots} />
          {countComment || 0} bình luận
        </span>
      </div>

      {post.image_url && (
        <div
          className={cx("post-image-container")}
          onClick={() => onZoomImage(post.image_url)}
        >
          <img src={post.image_url} alt={post.title} className={cx("post-image")} />
          <span className={cx("zoom-hint")}>Bấm để phóng to</span>
        </div>
      )}

      <div className={cx("content")}>
        <p className={cx("content-text")}>
          {(post.content || post.description || "")
            .split("\n")
            .map((line, i, arr) => (
              <span key={i}>
                {line}
                {i < arr.length - 1 && <br />}
              </span>
            ))}
        </p>
      </div>

      <div className={cx("actions")}>
        <button
          type="button"
          className={cx("action-btn", "like-btn", { active: isLiked })}
          onClick={handleLikeClick}
        >
          <FontAwesomeIcon icon={isLiked ? faHeart : faHeartRegular} />
          <span>{isLiked ? "Đã thích" : "Thích"}</span>
          {likeCount > 0 && <span className={cx("count-pill")}>{likeCount}</span>}
        </button>

        <button
          type="button"
          className={cx("action-btn", "share-btn")}
          onClick={onShare}
        >
          <FontAwesomeIcon icon={faShareNodes} />
          <span>Chia sẻ</span>
        </button>
      </div>
    </>
  );
}

export default PostViewMode;
