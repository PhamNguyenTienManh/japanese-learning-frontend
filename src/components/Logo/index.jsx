import classNames from "classnames/bind";
import { Link } from "react-router-dom";
import logoImage from "~/assets/images/javi-logo.png";
import styles from "./Logo.module.scss";

const cx = classNames.bind(styles);

function Logo({ color = "white" }) {
  return (
    <Link to="/" className={cx("logo", `color-${color}`)} aria-label="JAVI">
      <img className={cx("logo-image")} src={logoImage} alt="JAVI" />
    </Link>
  );
}

export default Logo;
