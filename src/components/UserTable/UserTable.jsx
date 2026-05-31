import UserTableRow from "../UserTableRow/UserTableRow";

function UserTable({ users, onToggleStatus, onChangeRole, onViewActivity }) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-normal text-slate-500">
                Người dùng
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-normal text-slate-500">
                Vai trò
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-normal text-slate-500">
                Trạng thái
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-normal text-slate-500">
                Premium
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-normal text-slate-500">
                Provider
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-normal text-slate-500">
                Ngày đăng ký
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-normal text-slate-500">
                Hoạt động
              </th>
              <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-normal text-slate-500">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <UserTableRow
                key={user._id}
                user={user}
                onToggleStatus={onToggleStatus}
                onChangeRole={onChangeRole}
                onViewActivity={onViewActivity}
              />
            ))}
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-14 text-center text-sm font-semibold text-slate-500"
                >
                  Không tìm thấy người dùng nào phù hợp
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default UserTable;
