import Card from "~/components/Card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMessage } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartSolid } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
import classNames from "classnames/bind";
import styles from "./PostCard.module.scss";
import formatDateVN from "~/services/formatDate";

const cx = classNames.bind(styles);

function PostCard({ post, commentCount }) {
  return (
    <Card className={cx("post-card")}>
      <a href={`/community/${post._id}`}>
        <div className={cx("post-inner")}>
          <div className={cx("post-header")}>
            <img
              src={post.profile_id?.image_url || "/placeholder.svg"}
              alt={post.profile_id?.name || "User"}
              className={cx("avatar")}
            />
            <div className={cx("post-header-info")}>
              <div className={cx("post-author-row")}>
                <span className={cx("post-author")}>
                  {post.profile_id?.name || "Anonymous"}
                </span>
                <span className={cx("post-time")}>
                  {formatDateVN(post.created_at) || "Vừa xong"}
                </span>
              </div>
            </div>
            {post.category_id && (
              <span className={cx("post-category")}>{post.category_id.name}</span>
            )}
          </div>

          <div className={cx("post-content")}>
            <h3 className={cx("post-title")}>{post.title}</h3>
            <p className={cx("post-excerpt")}>{post.excerpt || post.content}</p>
          </div>

          {post.image_url && (
            <div className={cx("post-image-container")}>
              <img className={cx("post-image")} src={post.image_url} alt="" />
            </div>
          )}

          <div className={cx("post-stats")}>
            <div className={cx("post-stat-item", { liked: post.isLiked })}>
              <FontAwesomeIcon
                icon={post.isLiked ? faHeartSolid : faHeartRegular}
                className={cx("post-stat-icon")}
              />
              <span>{post.likeCount || 0}</span>
            </div>
            <div className={cx("post-stat-item")}>
              <FontAwesomeIcon icon={faMessage} className={cx("post-stat-icon")} />
              <span>{commentCount || 0}</span>
            </div>
          </div>
        </div>
      </a>
    </Card>
  );
}

export default PostCard;
