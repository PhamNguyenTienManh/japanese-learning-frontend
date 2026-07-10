import { useEffect, useState } from "react";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const skillMeta = {
  reading: { icon: "library_books", label: "Đọc hiểu" },
  writing: { icon: "edit", label: "Viết" },
  conversation: { icon: "chat_bubble", label: "Hội thoại" },
  jlpt_exam: { icon: "assignment", label: "Đề JLPT" },
};

// Các skill được backend tự ghi nhận tiến độ khi học ở trang chuyên dụng.
// Với những skill này, đóng panel là đủ để roadmap cập nhật; không cần bấm tay.
const AUTO_TRACKED = ["reading", "writing", "jlpt_exam"];

/**
 * Xây URL trang thực hành tương ứng với skill, kèm ?embed=true để ẩn header/footer.
 */
function buildPracticeUrl(skill, level) {
  const lv = (level || "n5").toLowerCase();
  switch (skill) {
    case "reading":
      return `/reading?embed=true`;
    case "jlpt_exam":
      return `/practice/${lv}?embed=true`;
    case "writing":
      return `/jlpt?writing=1&embed=true`;
    case "conversation":
      return `/conversation?embed=true`;
    default:
      return null;
  }
}

/**
 * PracticePanel — ngăn kéo trượt ra từ cạnh phải, nhúng trang thực hành qua iframe.
 *
 * Giữ user trong ngữ cảnh roadmap: phần bên trái làm mờ vẫn thấy lộ trình.
 * Đóng panel sẽ gọi onClose (kèm cờ completed nếu user bấm Hoàn thành).
 */
export default function PracticePanel({
  task,
  level,
  onClose,
  onComplete,
  isCompleting,
}) {
  const [visible, setVisible] = useState(false);
  const meta = skillMeta[task.skill] || { icon: "menu_book", label: task.skill };
  const src = buildPracticeUrl(task.skill, level);
  const isAutoTracked = AUTO_TRACKED.includes(task.skill);
  const isCompleted = Boolean(task.completedAt || task.progress?.isComplete);

  // Kích hoạt hiệu ứng trượt vào sau khi mount.
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Đánh dấu body để các component khác (vd: FloatingAIChatIcon) biết panel đang mở.
  useEffect(() => {
    document.body.setAttribute("data-practice-panel-open", "true");
    return () => document.body.removeAttribute("data-practice-panel-open");
  }, []);

  // Trượt ra rồi mới gọi onClose để hoàn tất animation.
  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onClose?.(), 300);
  };

  // Đóng bằng phím Esc.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex justify-end">
      {/* Overlay mờ bên trái — vẫn thấy roadmap phía sau */}
      <div
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-300",
          visible ? "opacity-100" : "opacity-0"
        )}
        onClick={handleClose}
      />

      {/* Panel trượt */}
      <div
        className={cn(
          "relative h-full w-full max-w-[70%] bg-surface-container-lowest shadow-2xl flex flex-col transition-transform duration-300 ease-out",
          visible ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-0 border-b border-solid border-surface-variant/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-[22px]">{meta.icon}</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="bg-primary/10 text-primary font-label-sm text-[10px] px-2 py-0.5 rounded-sm uppercase tracking-widest font-bold">
                  {meta.label} • {level}
                </span>
                {isCompleted && (
                  <span className="bg-secondary/10 text-secondary font-label-sm text-[10px] px-2 py-0.5 rounded-sm uppercase tracking-widest font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">check_circle</span>
                    Đã học
                  </span>
                )}
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">{task.title || "Bài học"}</h3>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 hover:bg-surface-variant/50 rounded-full text-on-surface-variant flex items-center justify-center transition-colors"
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        {/* Nội dung: iframe trang thực hành */}
        <div className="flex-1 relative bg-surface-container-low overflow-hidden">
          {src ? (
            <iframe
              key={src}
              src={src}
              title={task.title || meta.label}
              className="w-full h-full border-0"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
              Chưa hỗ trợ dạng bài này.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-0 border-t border-solid border-surface-variant/30 flex justify-between items-center gap-4 shrink-0">
          <div className="text-on-surface-variant font-label-md text-sm flex items-center gap-2">
            {isAutoTracked ? (
              <>
                <span className="material-symbols-outlined text-[18px] text-primary">auto_awesome</span>
                Hệ thống tự ghi nhận khi bạn hoàn thành ở trang bên phải.
              </>
            ) : (
              "Bấm Hoàn thành sau khi luyện xong nhé."
            )}
          </div>
          <div className="flex gap-3 shrink-0">
            <button
              onClick={handleClose}
              className="bg-transparent hover:bg-surface-variant/50 text-on-surface font-label-lg px-5 py-2.5 rounded-full transition-colors"
            >
              Đóng
            </button>
            {/* Skill auto-track không cần nút hoàn thành thủ công (backend từ chối). */}
            {!isCompleted && !isAutoTracked && (
              <button
                onClick={() => onComplete(task)}
                disabled={isCompleting}
                className="bg-primary hover:bg-primary-hover text-on-primary font-label-lg px-6 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isCompleting ? (
                  <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[20px]">task_alt</span>
                )}
                Hoàn thành bài học
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
