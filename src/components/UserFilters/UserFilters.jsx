import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import classNames from "classnames/bind";
import styles from "./UserFilters.module.scss";
import Card from "~/components/Card";
import Input from "~/components/Input";
import { USER_ROLES, USER_STATUS } from "~/services/userConstants";

const cx = classNames.bind(styles);

function UserFilters({ searchQuery, statusFilter, roleFilter, onSearchChange, onStatusChange, onRoleChange }) {
  return (
    <Card className={cx("filterCard")}>
      <div className={cx("filterRow")}>
        <div className={cx("searchWrapper")}>
          <FontAwesomeIcon icon={faMagnifyingGlass} className={cx("searchIcon")} />
          <Input
            placeholder="Tìm kiếm theo tên hoặc email..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={cx("searchInput")}
          />
        </div>
        <div className={cx("selectGroup")}>
          <select
            className={cx("select")}
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value={USER_STATUS.ACTIVE}>Đang hoạt động</option>
            <option value={USER_STATUS.BANNED}>Bị cấm</option>
          </select>
          <select
            className={cx("select")}
            value={roleFilter}
            onChange={(e) => onRoleChange(e.target.value)}
          >
            <option value="all">Tất cả vai trò</option>
            <option value={USER_ROLES.STUDENT}>Học viên</option>
            <option value={USER_ROLES.ADMIN}>Quản trị viên</option>
          </select>
        </div>
      </div>
    </Card>
  );
}

export default UserFilters;
