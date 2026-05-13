import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMessage,
  faArrowRight,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import {
  faHeart as faHeartSolid,
} from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
import classNames from "classnames/bind";
import styles from "./PostCard.module.scss";
import formatDateVN from "~/services/formatDate";

const cx = classNames.bind(styles);

function PostCard({ post, commentCount }) {
  const authorName = post.profile_id?.name || "Anonymous";
  const avatarUrl = post.profile_id?.image_url || "/placeholder.svg";
  const hasImage = Boolean(post.image_url);

  return (
    <a href={`/community/${post._id}`} className={cx("post-card")}>
      <div className={cx("post-main", { "has-image": hasImage })}>
        <div className={cx("post-body")}>
          <div className={cx("post-header")}>
            <img src={avatarUrl} alt={authorName} className={cx("avatar")} />
            <div className={cx("post-meta")}>
              <span className={cx("post-author")}>{authorName}</span>
              <span className={cx("post-time")}>
                <FontAwesomeIcon icon={faClock} />
                {formatDateVN(post.created_at) || "Vừa xong"}
              </span>
            </div>
            {post.category_id && (
              <span className={cx("post-category")}>{post.category_id.name}</span>
            )}
          </div>

          <h3 className={cx("post-title")}>{post.title}</h3>
          <p className={cx("post-excerpt")}>{post.excerpt || post.content}</p>

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
            <span className={cx("read-more")}>
              Đọc tiếp <FontAwesomeIcon icon={faArrowRight} />
            </span>
          </div>
        </div>

        {hasImage && (
          <div className={cx("post-thumb-wrap")}>
            <img className={cx("post-thumb")} src={post.image_url} alt="" />
          </div>
        )}
      </div>
    </a>
  );
}

export default PostCard;
