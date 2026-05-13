import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import classNames from "classnames/bind";
import styles from "./NewPostHeader.module.scss";

const cx = classNames.bind(styles);

function NewPostHeader({ isEdit, onBack }) {
  return (
    <div className={cx("header")}>
      <button type="button" onClick={onBack} className={cx("back-link")}>
        <FontAwesomeIcon icon={faArrowLeft} className={cx("back-icon")} />
        <span>Quay lại cộng đồng</span>
      </button>

      <h1 className={cx("title")}>
        {isEdit ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}
      </h1>
      <p className={cx("subtitle")}>
        {isEdit
          ? "Cập nhật nội dung để bài viết của bạn hay hơn"
          : "Chia sẻ kiến thức và kinh nghiệm học tiếng Nhật của bạn"}
      </p>
    </div>
  );
}

export default NewPostHeader;
