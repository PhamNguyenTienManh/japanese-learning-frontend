import styles from "./Card.module.scss";
import classNames from "classnames/bind";

const cx = classNames.bind(styles);

function Card({ children, className, onClick }) {
  return (
    <div className={cx("card", className)} onClick={onClick}>
      {children}
    </div>
  );
}

export default Card;
