import classNames from "classnames/bind";
import styles from "./Input.module.scss";

const cx = classNames.bind(styles);

function Input({
  type = "text",
  value,
  onChange,
  placeholder = "",
  leftIcon,
  rightIcon,
  disabled = false,
  error = false,
  rounded = false,
  className,
  ...passProps
}) {
  const props = {
    type,
    value,
    onChange,
    placeholder,
    disabled,
    ...passProps,
  };

  const classes = cx("wrapper", {
    [className]: className,
    disabled,
    error,
    rounded,
    hasLeft: leftIcon,
    hasRight: rightIcon,
  });

  return (
    <div className={classes}>
      {leftIcon && <span className={cx("icon", "left")}>{leftIcon}</span>}
      <input className={cx("input")} {...props} />
      {rightIcon && <span className={cx("icon", "right")}>{rightIcon}</span>}
    </div>
  );
}

export default Input;
