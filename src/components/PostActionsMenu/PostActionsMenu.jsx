import { useEffect, useRef, useState } from "react";
import classNames from "classnames/bind";
import { Edit3, Flag, MoreHorizontal, Trash2 } from "lucide-react";

import { useToast } from "~/context/ToastContext";
import ReportPostModal from "~/components/ReportPostModal/ReportPostModal";
import styles from "./PostActionsMenu.module.scss";

const cx = classNames.bind(styles);

function PostActionsMenu({
  postId,
  isOwner,
  isLoggedIn,
  isEditing,
  onEdit,
  onDelete,
  compact = false,
}) {
  const { addToast } = useToast();
  const [open, setOpen] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handleOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  if (isEditing) return null;

  const handleReport = () => {
    setOpen(false);
    if (!isLoggedIn) {
      addToast("Vui lòng đăng nhập để báo cáo bài viết", "warning");
      return;
    }
    setShowReportModal(true);
  };

  const handleEdit = () => {
    setOpen(false);
    onEdit?.();
  };

  const handleDelete = () => {
    setOpen(false);
    onDelete?.();
  };

  return (
    <div className={cx("menuWrap", { compact })} ref={menuRef}>
      <button
        type="button"
        className={cx("trigger")}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        aria-label="Mở menu bài viết"
      >
        <MoreHorizontal size={20} />
      </button>

      {open && (
        <div
          className={cx("menu")}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          {isOwner ? (
            <>
              <button type="button" onClick={handleEdit}>
                <Edit3 size={16} />
                <span>Chỉnh sửa bài viết</span>
              </button>
              <button type="button" className={cx("danger")} onClick={handleDelete}>
                <Trash2 size={16} />
                <span>Xóa bài viết</span>
              </button>
            </>
          ) : (
            <button type="button" onClick={handleReport}>
              <Flag size={16} />
              <span>Báo cáo vi phạm</span>
            </button>
          )}
        </div>
      )}

      {showReportModal && (
        <ReportPostModal
          postId={postId}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}

export default PostActionsMenu;
