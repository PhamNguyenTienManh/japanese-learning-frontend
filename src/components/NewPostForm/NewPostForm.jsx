import classNames from "classnames/bind";
import styles from "./NewPostForm.module.scss";
import Input from "~/components/Input";
import Button from "~/components/Button";
import CategorySelector from "~/components/CategorySelection";
import NewPostImageUpload from "../NewPostImageUpload/NewPostImageUpload";

const cx = classNames.bind(styles);

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
  return (
    <div className={cx("form")}>
      {error && (
        <div className={cx("alert", "alert-error")}>{error}</div>
      )}

      <div className={cx("field")}>
        <label htmlFor="title" className={cx("label")}>
          Tiêu đề <span className={cx("required")}>*</span>
        </label>
        <Input
          id="title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Nhập tiêu đề bài viết..."
          className={"newpost-input"}
          disabled={loading}
        />
      </div>

      <CategorySelector
        categories={categories}
        value={categoryId}
        onChange={onCategoryChange}
        disabled={loading}
      />

      <div className={cx("field")}>
        <label className={cx("label")}>Ảnh bài viết</label>
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
          placeholder="Viết nội dung bài viết của bạn..."
          className={cx("textarea")}
          disabled={loading}
        />
        <p className={cx("helper")}>{content.length} ký tự</p>
      </div>

      <div className={cx("actions")}>
        <Button
          primary
          className={cx("action-btn")}
          onClick={onSubmit}
          disabled={loading || isUploadingImage}
        >
          {isUploadingImage
            ? "Đang tải ảnh..."
            : loading
              ? "Đang xử lý..."
              : isEdit
                ? "Cập nhật"
                : "Đăng bài"}
        </Button>
        <Button
          outline
          className={cx("action-btn")}
          href="/community"
          disabled={loading || isUploadingImage}
        >
          Hủy
        </Button>
      </div>
    </div>
  );
}

export default NewPostForm;
