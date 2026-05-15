import classNames from "classnames/bind";
import styles from "./UserHeader.module.scss";

const cx = classNames.bind(styles);

function UserHeader({ total, filteredCount, page }) {
  const isFiltered = filteredCount !== total;

  return (
    <div className={cx("header")}>
      <div className={cx("headerMain")}>
        <div className={cx("titleBlock")}>
          <span className={cx("eyebrow")}>Quản trị</span>
          <h1 className={cx("title")}>
            Quản lý <span className={cx("titleAccent")}>{page}</span>
          </h1>
          <p className={cx("subtitle")}>
            Tổng cộng <strong>{total}</strong> {page}
            {isFiltered && (
              <>
                {" "}· hiển thị <strong>{filteredCount}</strong> kết quả
              </>
            )}
          </p>
        </div>

        <div className={cx("statsRow")}>
          <div className={cx("statPill", "tonePrimary")}>
            <span className={cx("statValue")}>{total}</span>
            <span className={cx("statLabel")}>Tổng</span>
          </div>
          {isFiltered && (
            <div className={cx("statPill", "toneOrange")}>
              <span className={cx("statValue")}>{filteredCount}</span>
              <span className={cx("statLabel")}>Hiển thị</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserHeader;
