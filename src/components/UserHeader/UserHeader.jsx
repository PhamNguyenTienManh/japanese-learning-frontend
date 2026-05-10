import classNames from "classnames/bind";
import styles from "./UserHeader.module.scss";

const cx = classNames.bind(styles);

function UserHeader({ total, filteredCount, page }) {
  return (
    <div className={cx("header")}>
      <div className={cx("headerMain")}>
        <div>
          <h1 className={cx("title")}>Quản lý {page}</h1>
          <p className={cx("subtitle")}>
            Tổng cộng {total} {page}
            {filteredCount !== total && ` · ${filteredCount} kết quả`}
          </p>
        </div>
      </div>
    </div>
  );
}

export default UserHeader;
