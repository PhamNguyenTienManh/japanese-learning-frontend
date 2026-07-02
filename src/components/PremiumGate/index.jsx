import React from "react";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock } from "@fortawesome/free-solid-svg-icons";
import Button from "~/components/Button";
import styles from "./PremiumGate.module.scss";

const cx = classNames.bind(styles);

export default function PremiumGate({
  title = "Tính năng dành cho gói Pro",
  description = "Nâng cấp lên gói Pro để mở khóa tính năng này.",
  icon = faLock,
  className,
}) {
  return (
    <div className={cx("premiumGate", className)}>
      <div className={cx("premiumGateContent")}>
        <div className={cx("iconWrapper")}>
          <FontAwesomeIcon icon={icon} className={cx("icon")} />
        </div>
        <h2 className={cx("title")}>{title}</h2>
        <p className={cx("description")}>{description}</p>
        <div className={cx("actions")}>
          <Button to="/payment?plan=Pro" primary>
            Nâng cấp Pro
          </Button>
          <Button to="/" outline>
            Quay lại
          </Button>
        </div>
      </div>
    </div>
  );
}
