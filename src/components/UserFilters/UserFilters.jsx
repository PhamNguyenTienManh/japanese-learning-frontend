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
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_200px_200px]">
        <label className="relative block">
          <span className="sr-only">Tìm kiếm người dùng</span>
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm theo tên hoặc email..."
            className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
          />
        </label>

        <label>
          <span className="sr-only">Lọc trạng thái</span>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
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
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
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
