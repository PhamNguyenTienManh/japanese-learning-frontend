import { Plus } from "lucide-react";
import UserTableRow from "../UserTableRow/UserTableRow";

function UserTable({
  users,
  showingFrom,
  showingTo,
  totalCount,
  pagination,
  onViewActivity,
  onEditUser,
  onCreateUser,
}) {
  return (
    <section className="overflow-hidden rounded-[20px] border-[1.5px] border-slate-200 bg-white shadow-[0_18px_48px_-30px_rgba(0,135,154,0.36)]">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-[18px]">
        <div>
          <h2 className="m-0 text-[17px] font-extrabold leading-tight text-slate-900">
            Danh sách người dùng
          </h2>
          <p className="m-0 mt-1 text-sm font-semibold text-slate-500">
            Hiển thị {showingFrom}-{showingTo} trên {totalCount} người dùng
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateUser}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-px hover:bg-slate-800"
        >
          <Plus size={16} aria-hidden="true" />
          Thêm user
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[940px] border-separate border-spacing-0">
          <thead className="bg-slate-50">
            <tr>
              <th className="border-b border-slate-200 px-4 py-3.5 text-left text-[11px] font-black uppercase tracking-[0.6px] text-slate-600">
                Người dùng
              </th>
              <th className="border-b border-slate-200 px-4 py-3.5 text-left text-[11px] font-black uppercase tracking-[0.6px] text-slate-600">
                Vai trò
              </th>
              <th className="border-b border-slate-200 px-4 py-3.5 text-left text-[11px] font-black uppercase tracking-[0.6px] text-slate-600">
                Trạng thái
              </th>
              <th className="border-b border-slate-200 px-4 py-3.5 text-left text-[11px] font-black uppercase tracking-[0.6px] text-slate-600">
                Premium
              </th>
              <th className="border-b border-slate-200 px-4 py-3.5 text-left text-[11px] font-black uppercase tracking-[0.6px] text-slate-600">
                Provider
              </th>
              <th className="border-b border-slate-200 px-4 py-3.5 text-left text-[11px] font-black uppercase tracking-[0.6px] text-slate-600">
                Ngày đăng ký
              </th>
              <th className="border-b border-slate-200 px-4 py-3.5 text-right text-[11px] font-black uppercase tracking-[0.6px] text-slate-600">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <UserTableRow
                key={user._id}
                user={user}
                onViewActivity={onViewActivity}
                onEditUser={onEditUser}
              />
            ))}
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-14 text-center text-sm font-bold text-slate-500"
                >
                  Không tìm thấy người dùng nào phù hợp
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="border-t border-slate-200 bg-[#fbfffd] px-[18px] py-3.5">
          {pagination}
        </div>
      )}
    </section>
  );
}

export default UserTable;
