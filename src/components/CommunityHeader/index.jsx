import Button from "~/components/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import classNames from "classnames/bind";
import styles from "./CommunityHeader.module.scss";

const cx = classNames.bind(styles);

function CommunityHeader() {
  return (
    <div className={cx("header")}>
      <div className={cx("header-left")}>
        <h1 className={cx("title")}>Cộng đồng</h1>
        <p className={cx("subtitle")}>Chia sẻ và học hỏi cùng nhau</p>
      </div>
      <Button
        primary
        href="/community/new"
        className={cx("create-btn")}
        leftIcon={<FontAwesomeIcon icon={faPenToSquare} />}
      >
        Tạo bài viết
      </Button>
    </div>
  );
}

export default CommunityHeader;
