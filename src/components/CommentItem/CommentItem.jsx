import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSave,
  faTimes,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartSolid } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
import { Edit3, Flag, MoreHorizontal, Trash2 } from "lucide-react";
import classNames from "classnames/bind";
import styles from "./CommentItem.module.scss";
import Button from "~/components/Button";
import formatDateVN from "~/services/formatDate";
import ReportPostModal from "~/components/ReportPostModal/ReportPostModal";
import { useToast } from "~/context/ToastContext";
import UserAvatar from "~/components/UserAvatar/UserAvatar";

const cx = classNames.bind(styles);

function CommentItem({
  comment,
  isOwner,
  isEditing,
  editedContent,
  savingComment,
  isLoggedIn,
  isHighlighted,
  onLike,
  onEdit,
  onDelete,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
}) {
  const { addToast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const menuRef = useRef(null);
  const commentId = comment._id || comment.id || comment.commentId;
  const isDeleted = comment.isDeleted === true || Number(comment.status) === 0;
  const authorName = comment.profileId?.name || comment.profile_id?.name || "Anonymous";
  const authorAvatar = comment.profileId?.image_url || comment.profile_id?.image_url;

  useEffect(() => {
    if (!menuOpen) return undefined;

    const handleOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [menuOpen]);

  const handleReport = () => {
    setMenuOpen(false);
    if (!isLoggedIn) {
      addToast("Vui lòng đăng nhập để báo cáo bình luận", "warning");
      return;
    }
    setShowReportModal(true);
  };

  return (
    <div
      className={cx("comment-item", { highlighted: isHighlighted })}
      data-comment-id={commentId}
    >
      <UserAvatar
        src={authorAvatar}
        name={authorName}
        alt={authorName}
        className={cx("comment-avatar")}
        fallbackStyle={{ fontSize: "13px" }}
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
                  {authorName}
                </span>
                <span className={cx("comment-time")}>
                  • {formatDateVN(comment.createdAt)}
                </span>
                {comment.edited_at && <span className={cx("edited-badge")}>Đã sửa</span>}
                {isDeleted && <span className={cx("deleted-badge")}>Đã xóa mềm</span>}
                <div className={cx("comment-menu-wrap")} ref={menuRef}>
                  <button
                    type="button"
                    className={cx("comment-menu-trigger")}
                    onClick={() => setMenuOpen((value) => !value)}
                    aria-label="Mở menu bình luận"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                  {menuOpen && (
                    <div className={cx("comment-menu")}>
                      {isOwner ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpen(false);
                              onEdit(comment);
                            }}
                          >
                            <Edit3 size={15} />
                            <span>Chỉnh sửa</span>
                          </button>
                          <button
                            type="button"
                            className={cx("danger")}
                            onClick={() => {
                              setMenuOpen(false);
                              onDelete(commentId);
                            }}
                          >
                            <Trash2 size={15} />
                            <span>Xóa</span>
                          </button>
                        </>
                      ) : (
                        <button type="button" onClick={handleReport}>
                          <Flag size={15} />
                          <span>Báo cáo vi phạm</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
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
      {showReportModal && (
        <ReportPostModal
          commentId={commentId}
          targetLabel="bình luận"
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}

export default CommentItem;
