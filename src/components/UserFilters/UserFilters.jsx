import { Search } from "lucide-react";
import { USER_ROLES, USER_STATUS } from "~/services/userConstants";

function UserFilters({
  searchQuery,
  statusFilter,
  roleFilter,
  onSearchChange,
  onStatusChange,
  onRoleChange,
}) {
  return (
    <section className="rounded-[18px] border-[1.5px] border-slate-200 bg-white px-[18px] py-4 shadow-[0_4px_14px_-10px_rgba(0,135,154,0.25)]">
      <div className="grid gap-3 md:grid-cols-[minmax(260px,1fr)_180px_170px] md:items-center">
        <label className="relative block">
          <span className="sr-only">Tìm kiếm người dùng</span>
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600"
          />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm theo tên hoặc email..."
            className="h-10 w-full rounded-xl border-[1.5px] border-slate-300 bg-white pl-10 pr-3 text-sm font-semibold text-slate-900 shadow-[0_1px_2px_rgba(16,24,40,0.04)] outline-none transition placeholder:text-slate-400 hover:border-blue-200 hover:bg-blue-50/30 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <label>
          <span className="sr-only">Lọc trạng thái</span>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="h-10 w-full cursor-pointer rounded-xl border-[1.5px] border-slate-300 bg-white px-3 text-sm font-extrabold text-slate-900 shadow-[0_1px_2px_rgba(16,24,40,0.04)] outline-none transition hover:border-blue-200 hover:bg-blue-50/30 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value={USER_STATUS.ACTIVE}>Đang hoạt động</option>
            <option value={USER_STATUS.BANNED}>Bị cấm</option>
          </select>
        </label>

        <label>
          <span className="sr-only">Lọc vai trò</span>
          <select
            value={roleFilter}
            onChange={(e) => onRoleChange(e.target.value)}
            className="h-10 w-full cursor-pointer rounded-xl border-[1.5px] border-slate-300 bg-white px-3 text-sm font-extrabold text-slate-900 shadow-[0_1px_2px_rgba(16,24,40,0.04)] outline-none transition hover:border-blue-200 hover:bg-blue-50/30 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          >
            <option value="all">Tất cả vai trò</option>
            <option value={USER_ROLES.STUDENT}>Học viên</option>
            <option value={USER_ROLES.ADMIN}>Quản trị viên</option>
          </select>
        </label>

      </div>
    </section>
  );
}

export default UserFilters;
