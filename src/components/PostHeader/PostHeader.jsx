import classNames from "classnames/bind";
import styles from "./PostHeader.module.scss";
import formatDateVN from "~/services/formatDate";
import PostActionsMenu from "~/components/PostActionsMenu/PostActionsMenu";
import UserAvatar from "~/components/UserAvatar/UserAvatar";

const cx = classNames.bind(styles);

function PostHeader({
  post,
  isOwner,
  isEditing,
  isLoggedIn,
  onEdit,
  onDelete,
}) {
  const authorName = post.profile_id?.name || post.profileId?.name || "Anonymous";
  const authorAvatar =
    post.profile_id?.image_url || post.profileId?.image_url || post.authorAvatar;

  return (
    <div className={cx("post-header")}>
      <UserAvatar
        src={authorAvatar}
        name={authorName}
        alt={authorName}
        className={cx("avatar")}
        fallbackStyle={{ fontSize: "14px" }}
      />
      <div className={cx("post-header-main")}>
        <div className={cx("post-author-row")}>
          <span className={cx("author-name")}>
            {authorName}
          </span>
        </div>
        <div className={cx("author-meta")}>
          <span>{post.created_at ? formatDateVN(post.created_at) : "Vừa xong"}</span>
          {post.edited_at && (
            <>
              <span className={cx("dot")}>•</span>
              <span className={cx("edited-badge")}>Đã sửa</span>
            </>
          )}
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
        <PostActionsMenu
          postId={post._id}
          isOwner={isOwner}
          isLoggedIn={isLoggedIn}
          isEditing={isEditing}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}

export default PostHeader;
