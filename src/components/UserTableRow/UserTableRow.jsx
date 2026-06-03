import { History, Lock, LockOpen } from "lucide-react";
import {
  USER_ROLES,
  USER_STATUS,
  PROVIDER_LABELS,
} from "~/services/userConstants";
import { getAvatarUrl, handleAvatarError } from "~/utils/avatar";

function UserTableRow({ user, onToggleStatus, onChangeRole, onViewActivity }) {
  const isBanned = user.status === USER_STATUS.BANNED;
  const premiumExpiredAt = user.premium_expired_date
    ? new Date(user.premium_expired_date)
    : null;
  const isPremium =
    premiumExpiredAt &&
    !Number.isNaN(premiumExpiredAt.getTime()) &&
    premiumExpiredAt > new Date();

  return (
    <tr className="transition hover:bg-slate-50 [&:last-child_td]:border-b-0">
      <td className="border-b border-slate-200 px-4 py-4 align-middle">
        <div className="flex items-center gap-3">
          <img
            src={getAvatarUrl(user.profile?.image_url)}
            alt={user.profile?.name || "User"}
            className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm outline outline-1 outline-slate-200"
            onError={handleAvatarError}
          />
          <div className="min-w-0">
            <p className="m-0 truncate text-[15px] font-black leading-snug text-slate-950">
              {user.profile?.name || "Chưa có tên"}
            </p>
            <p className="m-0 mt-0.5 truncate text-xs font-semibold text-slate-500">
              {user.email}
            </p>
          </div>
        </div>
      </td>

      <td className="border-b border-slate-200 px-4 py-4 align-middle">
        <select
          value={user.role || USER_ROLES.STUDENT}
          onChange={(e) => onChangeRole(user._id, e.target.value)}
          className="h-9 cursor-pointer rounded-xl border-[1.5px] border-slate-200 bg-white px-3 text-xs font-extrabold text-slate-800 shadow-[0_1px_2px_rgba(16,24,40,0.04)] outline-none transition hover:border-blue-200 hover:bg-blue-50/30 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
        >
          <option value={USER_ROLES.STUDENT}>Học viên</option>
          <option value={USER_ROLES.ADMIN}>Quản trị viên</option>
        </select>
      </td>

      <td className="border-b border-slate-200 px-4 py-4 align-middle">
        <span
          className={`inline-flex min-h-7 items-center rounded-full px-3 py-1 text-xs font-extrabold ring-1 ring-inset ${
            isBanned
              ? "bg-rose-50 text-rose-700 ring-rose-200"
              : "bg-emerald-50 text-emerald-700 ring-emerald-200"
          }`}
        >
          {isBanned ? "Bị cấm" : "Hoạt động"}
        </span>
      </td>

      <td className="border-b border-slate-200 px-4 py-4 align-middle">
        <div className="flex flex-col items-start gap-1">
          <span
            className={`inline-flex min-h-7 items-center rounded-full px-3 py-1 text-xs font-extrabold ring-1 ring-inset ${
              isPremium
                ? "bg-amber-50 text-amber-700 ring-amber-200"
                : "bg-slate-100 text-slate-600 ring-slate-200"
            }`}
          >
            {isPremium ? "Premium" : "Thường"}
          </span>
          {isPremium && (
            <span className="whitespace-nowrap text-[11px] font-medium text-slate-500">
              Hết hạn {premiumExpiredAt.toLocaleDateString("vi-VN")}
            </span>
          )}
        </div>
      </td>

      <td className="border-b border-slate-200 px-4 py-4 align-middle">
        <span className="inline-flex min-h-7 items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold capitalize text-slate-700">
          {PROVIDER_LABELS[user.provider] || user.provider || "local"}
        </span>
      </td>

      <td className="whitespace-nowrap border-b border-slate-200 px-4 py-4 align-middle text-sm font-bold text-slate-600">
        {new Date(user.registeredAt || user.createdAt).toLocaleDateString("vi-VN")}
      </td>

      <td className="border-b border-slate-200 px-4 py-4 align-middle">
        <button
          type="button"
          onClick={() => onViewActivity(user)}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border-[1.5px] border-blue-100 bg-white px-3 text-xs font-extrabold text-slate-700 shadow-sm transition hover:-translate-y-px hover:border-blue-600 hover:bg-blue-600 hover:text-white hover:shadow-[0_8px_16px_-10px_rgba(37,99,235,0.45)]"
        >
          <History size={14} aria-hidden="true" />
          Xem lịch sử
        </button>
      </td>

      <td className="border-b border-slate-200 px-4 py-4 text-right align-middle">
        <button
          type="button"
          onClick={() => onToggleStatus(user._id, user.status)}
          className={`inline-flex h-9 items-center gap-1.5 rounded-xl border-[1.5px] px-3 text-xs font-extrabold shadow-sm transition hover:-translate-y-px ${
            isBanned
              ? "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
              : "border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
          }`}
        >
          {isBanned ? (
            <LockOpen size={14} aria-hidden="true" />
          ) : (
            <Lock size={14} aria-hidden="true" />
          )}
          {isBanned ? "Mở khóa" : "Cấm"}
        </button>
      </td>
    </tr>
  );
}

export default UserTableRow;
