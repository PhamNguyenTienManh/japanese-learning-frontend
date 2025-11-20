import classNames from "classnames/bind";
import Button from "~/components/Button";
import styles from "./Logo.module.scss";

const cx = classNames.bind(styles);

function Logo({ color = "white" }) {
  return (
    <Button to="/" className={cx("logo", `color-${color}`)} text>
      <span className={cx("logo-main")}>日本語</span>
      <span className={cx("logo-sub")}>Learn</span>
    </Button>
  );
}

export default Logo;
