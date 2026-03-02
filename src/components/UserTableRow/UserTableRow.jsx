import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBan, faCircleCheck, faLock, faLockOpen } from "@fortawesome/free-solid-svg-icons";
import classNames from "classnames/bind";
import styles from "./UserTableRow.module.scss";
import Button from "~/components/Button";
import { USER_ROLES, USER_STATUS, PROVIDER_LABELS } from "~/services/userConstants";

const cx = classNames.bind(styles);

function UserTableRow({ user, onToggleStatus, onChangeRole }) {
  const isBanned = user.status === USER_STATUS.BANNED;

  return (
    <tr className={cx("row")}>
      {/* User info */}
      <td className={cx("td")}>
        <div className={cx("userCell")}>
          <img
            src={user.profile?.image_url || "/placeholder.svg"}
            alt={user.profile?.name || "User"}
            className={cx("avatar")}
          />
          <div>
            <p className={cx("userName")}>{user.profile?.name || "Chưa có tên"}</p>
            <p className={cx("userEmail")}>{user.email}</p>
          </div>
        </div>
      </td>

      {/* Role */}
      <td className={cx("td")}>
        <select
          className={cx("roleSelect")}
          value={user.role || USER_ROLES.STUDENT}
          onChange={(e) => onChangeRole(user._id, e.target.value)}
        >
          <option value={USER_ROLES.STUDENT}>Học viên</option>
          <option value={USER_ROLES.ADMIN}>Quản trị viên</option>
        </select>
      </td>

      {/* Status */}
      <td className={cx("td")}>
        {isBanned ? (
          <span className={cx("badge", "badgeBanned")}>
            <FontAwesomeIcon icon={faBan} className={cx("badgeIcon")} />
            <span>Bị cấm</span>
          </span>
        ) : (
          <span className={cx("badge", "badgeActive")}>
            <FontAwesomeIcon icon={faCircleCheck} className={cx("badgeIcon")} />
            <span>Hoạt động</span>
          </span>
        )}
      </td>

      {/* Provider */}
      <td className={cx("td")}>
        <span className={cx("badge", "badgeProvider")}>
          {PROVIDER_LABELS[user.provider] || user.provider || "local"}
        </span>
      </td>

      {/* Registered date */}
      <td className={cx("td", "tdText")}>
        {new Date(user.registeredAt || user.createdAt).toLocaleDateString("vi-VN")}
      </td>

      {/* Actions */}
      <td className={cx("td")}>
        <div className={cx("actions")}>
          <Button
            className={cx("actionButton", isBanned ? "unlockButton" : "banButton")}
            rounded
            onClick={() => onToggleStatus(user._id, user.status)}
          >
            <FontAwesomeIcon icon={isBanned ? faLockOpen : faLock} />
            <span>{isBanned ? "Mở khóa" : "Cấm"}</span>
          </Button>
        </div>
      </td>
    </tr>
  );
}

export default UserTableRow;
