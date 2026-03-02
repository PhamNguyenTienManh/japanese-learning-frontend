import classNames from "classnames/bind";
import styles from "./PostHeader.module.scss";
import formatDateVN from "~/services/formatDate";
import ActionBtn from "~/components/ActionBtnInCommunity";

const cx = classNames.bind(styles);

function PostHeader({ post, isOwner, isEditing, onEdit, onDelete }) {
  return (
    <div className={cx("post-header")}>
      <img
        src={post.profile_id?.image_url || post.authorAvatar || "/placeholder.svg"}
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
          <span>{post.created_at ? formatDateVN(post.created_at) : "Vừa xong"}</span>
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
          <ActionBtn onEdit={onEdit} onDelete={onDelete} />
        )}
      </div>
    </div>
  );
}

export default PostHeader;
