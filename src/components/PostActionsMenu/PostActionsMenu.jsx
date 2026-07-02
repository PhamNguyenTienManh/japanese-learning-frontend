import { useEffect, useRef, useState } from "react";

import { useToast } from "~/context/ToastContext";
import ReportPostModal from "~/components/ReportPostModal/ReportPostModal";

const menuButtonClass =
  "flex w-full cursor-pointer items-center gap-[9px] rounded-md border-0 bg-transparent px-[11px] py-2.5 text-left text-sm font-semibold text-on-surface transition hover:bg-surface-container hover:text-primary";

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
    <div className="relative shrink-0" ref={menuRef}>
      <button
        type="button"
        className="text-outline hover:text-on-surface transition-colors p-1 rounded-full hover:bg-surface-container bg-transparent border-0 cursor-pointer"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        aria-label="Mở menu bài viết"
      >
        <span className="material-symbols-outlined text-xl">more_horiz</span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+8px)] z-20 w-max min-w-[190px] rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-1.5 shadow-[0_16px_38px_rgba(15,23,42,0.16)]"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          {isOwner ? (
            <>
              <button type="button" className={menuButtonClass} onClick={handleEdit}>
                <span className="material-symbols-outlined text-base">edit</span>
                <span>Chỉnh sửa bài viết</span>
              </button>
              <button
                type="button"
                className={`${menuButtonClass} text-error hover:bg-error-container/10 hover:text-error`}
                onClick={handleDelete}
              >
                <span className="material-symbols-outlined text-base">delete</span>
                <span>Xóa bài viết</span>
              </button>
            </>
          ) : (
            <button type="button" className={menuButtonClass} onClick={handleReport}>
              <span className="material-symbols-outlined text-base">flag</span>
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
