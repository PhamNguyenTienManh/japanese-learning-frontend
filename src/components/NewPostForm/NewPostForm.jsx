import classNames from "classnames/bind";
import styles from "./NewPostForm.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faSpinner } from "@fortawesome/free-solid-svg-icons";
import CategorySelector from "~/components/CategorySelection";
import NewPostImageUpload from "../NewPostImageUpload/NewPostImageUpload";

const cx = classNames.bind(styles);

const TITLE_MAX = 120;

function NewPostForm({
  title,
  content,
  categoryId,
  categories,
  imagePreview,
  loading,
  isUploadingImage,
  isEdit,
  error,
  onTitleChange,
  onContentChange,
  onCategoryChange,
  onImageChange,
  onRemoveImage,
  onSubmit,
}) {
  const submitting = loading || isUploadingImage;
  const submitLabel = isUploadingImage
    ? "Đang tải ảnh..."
    : loading
      ? "Đang xử lý..."
      : isEdit
        ? "Cập nhật bài viết"
        : "Đăng bài";

  return (
    <div className={cx("form")}>
      {error && (
        <div className={cx("alert", "alert-error")}>{error}</div>
      )}

      <div className={cx("field")}>
        <label htmlFor="title" className={cx("label")}>
          Tiêu đề <span className={cx("required")}>*</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value.slice(0, TITLE_MAX))}
          placeholder="Vd: Mẹo nhớ kanji nhanh hơn với phương pháp hình ảnh"
          className={cx("text-input")}
          disabled={loading}
          maxLength={TITLE_MAX}
        />
        <p className={cx("helper-row")}>
          <span>Tiêu đề rõ ràng giúp bài viết tiếp cận nhiều người hơn</span>
          <span className={cx("counter")}>{title.length}/{TITLE_MAX}</span>
        </p>
      </div>

      <CategorySelector
        categories={categories}
        value={categoryId}
        onChange={onCategoryChange}
        disabled={loading}
      />

      <div className={cx("field")}>
        <label className={cx("label")}>
          Ảnh bài viết
          <span className={cx("optional")}>(tuỳ chọn)</span>
        </label>
        <NewPostImageUpload
          imagePreview={imagePreview}
          loading={loading}
          onImageChange={onImageChange}
          onRemoveImage={onRemoveImage}
        />
      </div>

      <div className={cx("field")}>
        <label htmlFor="content" className={cx("label")}>
          Nội dung <span className={cx("required")}>*</span>
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="Viết nội dung bài viết của bạn... Bạn có thể chia sẻ ngữ pháp, từ vựng, kanji, mẹo học, hoặc đặt câu hỏi cho cộng đồng."
          className={cx("textarea")}
          disabled={loading}
        />
        <p className={cx("helper-row")}>
          <span>Hỗ trợ xuống dòng — nội dung càng chi tiết càng có giá trị</span>
          <span className={cx("counter")}>{content.length} ký tự</span>
        </p>
      </div>

      <div className={cx("actions")}>
        <a
          href="/community"
          className={cx("cancel-btn", { disabled: submitting })}
        >
          Huỷ
        </a>
        <button
          type="button"
          className={cx("submit-btn", { disabled: submitting })}
          onClick={onSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <FontAwesomeIcon icon={faSpinner} spin />
          ) : (
            <FontAwesomeIcon icon={faPaperPlane} />
          )}
          <span>{submitLabel}</span>
        </button>
      </div>
    </div>
  );
}

export default NewPostForm;
