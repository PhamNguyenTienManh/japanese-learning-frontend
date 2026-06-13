import { useEffect, useRef, useState } from "react";
import { Edit3, Flag, MoreHorizontal, Trash2 } from "lucide-react";

import { useToast } from "~/context/ToastContext";
import ReportPostModal from "~/components/ReportPostModal/ReportPostModal";

const menuButtonClass =
  "flex w-full cursor-pointer items-center gap-[9px] rounded-md border-0 bg-transparent px-[11px] py-2.5 text-left font-bold text-text-high transition hover:bg-primary/[0.08] hover:text-primary";

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
        className={[
          "inline-flex cursor-pointer items-center justify-center rounded-full border border-border bg-white text-grey-low transition hover:border-primary/40 hover:bg-primary/[0.07] hover:text-primary",
          compact ? "h-8 w-8" : "h-9 w-9",
        ].join(" ")}
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
          className="absolute right-0 top-[calc(100%+8px)] z-20 w-max min-w-[190px] rounded-lg border border-border bg-white p-1.5 shadow-[0_16px_38px_rgba(15,23,42,0.16)]"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          {isOwner ? (
            <>
              <button type="button" className={menuButtonClass} onClick={handleEdit}>
                <Edit3 size={16} />
                <span>Chỉnh sửa bài viết</span>
              </button>
              <button
                type="button"
                className={`${menuButtonClass} text-[#b91c1c] hover:bg-[#fef2f2] hover:text-[#991b1b]`}
                onClick={handleDelete}
              >
                <Trash2 size={16} />
                <span>Xóa bài viết</span>
              </button>
            </>
          ) : (
            <button type="button" className={menuButtonClass} onClick={handleReport}>
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
