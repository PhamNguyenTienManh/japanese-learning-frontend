import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faTrash,
  faSave,
  faTimes,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartSolid } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
import classNames from "classnames/bind";
import styles from "./CommentItem.module.scss";
import Button from "~/components/Button";
import formatDateVN from "~/services/formatDate";

const cx = classNames.bind(styles);

function CommentItem({
  comment,
  isOwner,
  isEditing,
  editedContent,
  savingComment,
  onLike,
  onEdit,
  onDelete,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
}) {
  const commentId = comment._id || comment.id || comment.commentId;

  return (
    <div className={cx("comment-item")}>
      <img
        src={
          comment.profileId?.image_url ||
          "https://img.tripi.vn/cdn-cgi/image/width=700,height=700/https://gcs.tripi.vn/public-tripi/tripi-feed/img/482752AXp/anh-mo-ta.png"
        }
        alt={comment.profileId?.name}
        className={cx("comment-avatar")}
      />
      <div className={cx("comment-body")}>
        {isEditing ? (
          <div className={cx("comment-edit-form")}>
            <textarea
              value={editedContent}
              onChange={(e) => onEditChange(e.target.value)}
              className={cx("comment-edit-input")}
              rows={3}
            />
            <div className={cx("comment-edit-actions")}>
              <Button
                primary
                small
                onClick={() => onSaveEdit(commentId)}
                disabled={savingComment || !editedContent.trim()}
                leftIcon={
                  savingComment ? (
                    <FontAwesomeIcon icon={faSpinner} spin />
                  ) : (
                    <FontAwesomeIcon icon={faSave} />
                  )
                }
              >
                {savingComment ? "Đang lưu..." : "Lưu"}
              </Button>
              <Button
                outline
                small
                onClick={onCancelEdit}
                disabled={savingComment}
                leftIcon={<FontAwesomeIcon icon={faTimes} />}
              >
                Hủy
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className={cx("comment-bubble")}>
              <div className={cx("comment-header")}>
                <span className={cx("comment-author")}>
                  {comment.profileId?.name || "Anonymous"}
                </span>
                <span className={cx("comment-time")}>
                  • {formatDateVN(comment.createdAt)}
                </span>
                {isOwner && (
                  <div className={cx("comment-owner-actions")}>
                    <button
                      type="button"
                      className={cx("comment-action-btn")}
                      onClick={() => onEdit(comment)}
                      title="Chỉnh sửa"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      type="button"
                      className={cx("comment-action-btn", "delete")}
                      onClick={() => onDelete(commentId)}
                      title="Xóa"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                )}
              </div>
              <p className={cx("comment-text")}>
                {(comment.content || "").split("\n").map((line, i, arr) => (
                  <span key={i}>
                    {line}
                    {i < arr.length - 1 && <br />}
                  </span>
                ))}
              </p>
            </div>
            <div className={cx("comment-actions")}>
              <button
                type="button"
                className={cx("comment-like-btn", { liked: comment.isLiked })}
                onClick={() => onLike(commentId)}
              >
                <FontAwesomeIcon
                  icon={comment.isLiked ? faHeartSolid : faHeartRegular}
                  className={cx("comment-like-icon")}
                />
                <span>{comment.likeCount}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CommentItem;
