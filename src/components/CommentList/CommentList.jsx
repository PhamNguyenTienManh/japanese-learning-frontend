import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import classNames from "classnames/bind";
import styles from "./CommentList.module.scss";
import CommentItem from "../CommentItem/CommentItem";

const cx = classNames.bind(styles);

function CommentList({
  comments,
  commentsLoading,
  editingCommentId,
  editedCommentContent,
  savingComment,
  isCommentOwner,
  onLike,
  onEdit,
  onDelete,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
}) {
  if (commentsLoading) {
    return (
      <div className={cx("comments-loading")}>
        <FontAwesomeIcon icon={faSpinner} spin />
        <span>Đang tải bình luận...</span>
      </div>
    );
  }

  return (
    <div className={cx("comment-list")}>
      {comments.length === 0 ? (
        <p className={cx("no-comments")}>
          Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
        </p>
      ) : (
        comments.map((c) => {
          const commentId = c._id || c.id || c.commentId;
          return (
            <CommentItem
              key={commentId}
              comment={c}
              isOwner={isCommentOwner(c)}
              isEditing={editingCommentId === commentId}
              editedContent={editedCommentContent}
              savingComment={savingComment}
              onLike={onLike}
              onEdit={onEdit}
              onDelete={onDelete}
              onEditChange={onEditChange}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
            />
          );
        })
      )}
    </div>
  );
}

export default CommentList;
