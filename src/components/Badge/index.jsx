import styles from "./Badge.module.scss";
import classNames from "classnames/bind";

const cx = classNames.bind(styles);

function Badge({ children, type = "default", className }) {
  return <span className={cx("badge", type, className)}>{children}</span>;
}

export default Badge;
