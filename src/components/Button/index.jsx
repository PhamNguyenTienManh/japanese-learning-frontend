import classNames from "classnames/bind";
import styles from "./Button.module.scss";
import { Link } from "react-router-dom";

const cx = classNames.bind(styles);

function Button({
  to,
  href,
  onClick,
  primary = false,
  outline = false,
  text = false,
  link = false,
  back = false,
  disabled = false,
  full = false,
  leftIcon,
  rightIcon,
  children,
  className,
  ...passProps
}) {
  let Comp = "button";
  const props = { onClick, ...passProps };

  if (to) {
    props.to = to;
    Comp = Link;
  } else if (href) {
    props.href = href;
    Comp = "a";
  }

  //⭐ Auto detect button chỉ có icon
  const isIconOnly = (leftIcon || rightIcon) && !children;

  const classes = cx("wrapper", {
    [className]: className,
    primary,
    outline,
    text,
    link,
    back,
    full,
    disabled,
    iconOnly: isIconOnly,
  });

  return (
    <Comp className={classes} {...props}>
      {leftIcon && <span className={cx("icon")}>{leftIcon}</span>}
      {children && <span className={cx("title")}>{children}</span>}
      {rightIcon && <span className={cx("icon")}>{rightIcon}</span>}
    </Comp>
  );
}

export default Button;
