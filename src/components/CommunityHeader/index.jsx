import Button from "~/components/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faComments, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import classNames from "classnames/bind";
import styles from "./CommunityHeader.module.scss";

const cx = classNames.bind(styles);

function CommunityHeader() {
  return (
    <section className={cx("hero")}>
      <div className={cx("hero-bg")} aria-hidden="true">
        <span className={cx("kanji", "kanji-1")}>友</span>
        <span className={cx("kanji", "kanji-2")}>学</span>
        <span className={cx("blob", "blob-1")} />
        <span className={cx("blob", "blob-2")} />
      </div>

      <div className={cx("hero-inner")}>
        <div className={cx("hero-left")}>
          <span className={cx("eyebrow")}>
            <FontAwesomeIcon icon={faComments} />
            みんなのコミュニティ
          </span>
          <h1 className={cx("title")}>
            Cộng đồng <span className={cx("accent")}>học tiếng Nhật</span>
          </h1>
          <p className={cx("subtitle")}>
            Nơi bạn chia sẻ kinh nghiệm, đặt câu hỏi và cùng nhau tiến bộ mỗi ngày — issho ni がんばろう!
          </p>

          <div className={cx("cta-row")}>
            <Button
              primary
              href="/community/new"
              className={cx("create-btn")}
              leftIcon={<FontAwesomeIcon icon={faPenToSquare} />}
            >
              Tạo bài viết
            </Button>
            <a className={cx("explore-link")} href="#feed">
              Khám phá ngay <FontAwesomeIcon icon={faArrowRight} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CommunityHeader;