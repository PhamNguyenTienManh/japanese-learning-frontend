import classNames from "classnames/bind";
import styles from "./UserTable.module.scss";
import Card from "~/components/Card";
import UserTableRow from "../UserTableRow/UserTableRow";

const cx = classNames.bind(styles);

function UserTable({ users, onToggleStatus, onChangeRole }) {
  return (
    <Card className={cx("usersCard")}>
      <div className={cx("tableWrapper")}>
        <table className={cx("table")}>
          <thead className={cx("thead")}>
            <tr>
              <th className={cx("th")}>Người dùng</th>
              <th className={cx("th")}>Vai trò</th>
              <th className={cx("th")}>Trạng thái</th>
              <th className={cx("th")}>Provider</th>
              <th className={cx("th")}>Ngày đăng ký</th>
              <th className={cx("th", "thRight")}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <UserTableRow
                key={user._id}
                user={user}
                onToggleStatus={onToggleStatus}
                onChangeRole={onChangeRole}
              />
            ))}
            {users.length === 0 && (
              <tr>
                <td className={cx("tdEmpty")} colSpan={6}>
                  Không tìm thấy người dùng nào phù hợp
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default UserTable;
