import classNames from "classnames/bind";

import { SuccessIcon, CloseIcon, ErrorIcon } from "~/components/Icons";
import styles from "./Toast.module.scss";
import { useEffect, useState } from "react";

const cx = classNames.bind(styles);
function Toast({ type, text, duration, onClose }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFadeOut(true);
    }, duration - 200);

    const removeTimeout = setTimeout(() => {
      onClose?.();
    }, duration);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(removeTimeout);
    };
  }, [duration, onClose]);
  return (
    <div className={cx("wrapper", { "fade-out": fadeOut })}>
      <div className={cx("inner")}>
        <div className={cx("body")}>
          {type === "success" && (
            <div className={cx("icon")}>{<SuccessIcon />}</div>
          )}
          {type === "error" && (
            <div className={cx("icon")}>{<ErrorIcon />}</div>
          )}
          <button className={cx("close")} onClick={onClose}>
            <CloseIcon />
          </button>
          <div className={cx("text")}>{text}</div>
        </div>
        <div className={cx("progress-bar")}>
          <div className={cx("background", type)}></div>
          <div className={cx("fill", type)}></div>
        </div>
      </div>
    </div>
  );
}

export default Toast;
