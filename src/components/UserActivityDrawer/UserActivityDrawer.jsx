import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  BookOpen,
  ExternalLink,
  FileText,
  GraduationCap,
  MessageSquare,
  RefreshCw,
  Search,
  Timer,
  X,
} from "lucide-react";
import UserAvatar from "~/components/UserAvatar/UserAvatar";

const ACTIVITY_META = {
  study_time_added: {
    label: "Học tập",
    icon: Timer,
    tone: "bg-teal-50 text-teal-700 ring-teal-100",
  },
  exam_completed: {
    label: "Luyện thi",
    icon: GraduationCap,
    tone: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  },
  post_created: {
    label: "Bài viết",
    icon: FileText,
    tone: "bg-orange-50 text-orange-700 ring-orange-100",
  },
  comment_created: {
    label: "Bình luận",
    icon: MessageSquare,
    tone: "bg-orange-50 text-orange-700 ring-orange-100",
  },
  notebook_created: {
    label: "Sổ tay",
    icon: BookOpen,
    tone: "bg-blue-50 text-blue-700 ring-blue-100",
  },
  notebook_item_added: {
    label: "Sổ tay",
    icon: BookOpen,
    tone: "bg-blue-50 text-blue-700 ring-blue-100",
  },
  dictionary_looked_up: {
    label: "Tra cứu",
    icon: Search,
    tone: "bg-violet-50 text-violet-700 ring-violet-100",
  },
};

function formatActivityTime(value) {
  if (!value) return "Không rõ thời gian";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Không rõ thời gian";

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getUserName(user) {
  return user?.profile?.name || user?.email || "Người dùng";
}

function UserActivityDrawer({
  open,
  user,
  activities,
  loading,
  error,
  onClose,
  onRetry,
}) {
  const [visible, setVisible] = useState(false);

  const handleClose = useCallback(() => {
    setVisible(false);
    window.setTimeout(onClose, 180);
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      setVisible(false);
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => setVisible(true));
    const handleKeyDown = (event) => {
      if (event.key === "Escape") handleClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90]">
      <button
        type="button"
        className={[
          "absolute inset-0 cursor-default border-0 bg-slate-950/35 transition-opacity duration-200",
          visible ? "opacity-100" : "opacity-0",
        ].join(" ")}
        aria-label="Đóng lịch sử hoạt động"
        onClick={handleClose}
      />

      <aside
        className={[
          "fixed right-0 top-0 flex h-full w-full max-w-[520px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out",
          visible ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
        aria-label="Lịch sử hoạt động người dùng"
      >
        <header className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              {(() => {
                const userName = getUserName(user);
                return (
                  <UserAvatar
                    src={user?.profile?.image_url}
                    name={userName}
                    alt={userName}
                    className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
                    fallbackStyle={{ fontSize: "14px" }}
                  />
                );
              })()}
              <div className="min-w-0">
                <h2 className="m-0 truncate text-lg font-bold text-slate-950">
                  Lịch sử hoạt động
                </h2>
                <p className="m-0 mt-1 truncate text-sm font-medium text-slate-500">
                  {getUserName(user)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
              aria-label="Đóng"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          {user?.email && (
            <p className="m-0 mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
              {user.email}
            </p>
          )}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="grid min-h-[220px] place-items-center rounded-lg border border-slate-200 bg-slate-50 p-6">
              <div className="flex flex-col items-center gap-3 text-sm font-semibold text-slate-500">
                <RefreshCw size={22} className="animate-spin" aria-hidden="true" />
                Đang tải lịch sử hoạt động...
              </div>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
              <p className="m-0 text-sm font-semibold text-rose-700">{error}</p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-3 inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
              >
                <RefreshCw size={14} aria-hidden="true" />
                Thử lại
              </button>
            </div>
          ) : activities.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <Activity size={28} className="mx-auto text-slate-400" aria-hidden="true" />
              <p className="m-0 mt-3 text-sm font-semibold text-slate-600">
                Người dùng này chưa có hoạt động nào được ghi nhận.
              </p>
            </div>
          ) : (
            <div className="relative flex flex-col gap-3 before:absolute before:left-[18px] before:top-3 before:h-[calc(100%-24px)] before:w-px before:bg-slate-200 before:content-['']">
              {activities.map((activity) => {
                const meta = ACTIVITY_META[activity.type] || {
                  label: "Hoạt động",
                  icon: Activity,
                  tone: "bg-slate-50 text-slate-700 ring-slate-100",
                };
                const Icon = meta.icon;

                return (
                  <div key={activity.id} className="relative flex gap-3 rounded-lg bg-white py-1">
                    <div
                      className={`relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1 ${meta.tone}`}
                    >
                      <Icon size={16} aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                          {meta.label}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">
                          {formatActivityTime(activity.createdAt)}
                        </span>
                      </div>
                      <p className="m-0 mt-2 text-sm font-bold leading-5 text-slate-950">
                        {activity.title}
                      </p>
                      {activity.description && (
                        <p className="m-0 mt-1 text-sm leading-5 text-slate-600">
                          {activity.description}
                        </p>
                      )}
                      {activity.href && (
                        <a
                          href={activity.href}
                          className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 no-underline transition hover:text-slate-950"
                        >
                          Mở liên kết
                          <ExternalLink size={13} aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

export default UserActivityDrawer;
