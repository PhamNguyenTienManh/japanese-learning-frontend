import React from "react";
import classNames from "classnames/bind";
import styles from "./Progress.module.scss";

const cx = classNames.bind(styles);

function Progress({
  value = 0,
  max = 100,
  showLabel = false,
  className = "",
  ...props
}) {
  const safeMax = typeof max === "number" && max > 0 ? max : 100;
  const safeValue = typeof value === "number" ? value : 0;
  const pct = Math.round(
    Math.max(0, Math.min(100, (safeValue / safeMax) * 100))
  );

  // support passing module class names (cx) + global classes
  const base = cx("progress");
  const classes = className ? `${base} ${className}` : base;

  return (
    <div
      className={classes}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={safeValue}
      aria-valuetext={`${pct}%`}
      {...props}
    >
      <div className={cx("track")}>
        <div className={cx("bar")} style={{ width: `${pct}%` }} />
      </div>

      {showLabel && <div className={cx("label")}>{pct}%</div>}
    </div>
  );
}

export default Progress;
