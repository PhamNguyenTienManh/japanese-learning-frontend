import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart,
  faCommentDots,
  faShareNodes,
} from "@fortawesome/free-solid-svg-icons";
import classNames from "classnames/bind";
import styles from "./PostViewMode.module.scss";
import Button from "~/components/Button";

const cx = classNames.bind(styles);

function PostViewMode({ post, countComment, currentUserId, isLoggedIn, onLike, onShare, onZoomImage }) {
  return (
    <>
      <h1 className={cx("title")}>{post.title}</h1>

      {post.image_url && (
        <div
          className={cx("post-image-container")}
          onClick={() => onZoomImage(post.image_url)}
          style={{ cursor: "zoom-in" }}
        >
          <img src={post.image_url} alt={post.title} className={cx("post-image")} />
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

      <div className={cx("stats")}>
        <div className={cx("stat-item")}>
          <FontAwesomeIcon icon={faHeart} className={cx("stat-icon")} />
          <span>{post.liked.length || 0} lượt thích</span>
        </div>
        <div className={cx("stat-item")}>
          <FontAwesomeIcon icon={faCommentDots} className={cx("stat-icon")} />
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
            onLike();
          }}
          leftIcon={
            <FontAwesomeIcon
              icon={faHeart}
              className={cx("like-icon", { filled: post.isLiked })}
            />
          }
        >
          <span className={cx("like-text", { liked: post.liked.includes(currentUserId) })}>
            {post.liked.includes(currentUserId) ? "Đã thích" : "Thích"}
          </span>
        </Button>

        <Button
          outline
          className={"orange"}
          onClick={onShare}
          leftIcon={<FontAwesomeIcon icon={faShareNodes} className={cx("icon")} />}
        >
          Chia sẻ
        </Button>
      </div>
    </>
  );
}

export default PostViewMode;
