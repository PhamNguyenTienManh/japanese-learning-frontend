import Button from "~/components/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import classNames from "classnames/bind";
import styles from "./CommunityHeader.module.scss";

const cx = classNames.bind(styles);

function CommunityHeader() {
  return (
    <section className={cx("hero")}>
      <div className={cx("hero-inner")}>
        <div className={cx("hero-left")}>
          <h1 className={cx("title")}>
            Cộng đồng <span className={cx("accent")}>học tiếng Nhật</span>
          </h1>
          <p className={cx("subtitle")}>
            Nơi bạn chia sẻ kinh nghiệm, đặt câu hỏi và cùng nhau tiến bộ mỗi ngày.
          </p>

          <Button
            primary
            href="/community/new"
            className={cx("create-btn")}
            leftIcon={<FontAwesomeIcon icon={faPenToSquare} />}
          >
            Tạo bài viết
          </Button>
        </div>
      </div>
    </section>
  );
}

export default CommunityHeader;
