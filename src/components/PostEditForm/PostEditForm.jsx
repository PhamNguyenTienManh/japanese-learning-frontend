import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faSave,
  faTimes,
  faImage,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import classNames from "classnames/bind";
import styles from "./PostEditForm.module.scss";
import Button from "~/components/Button";
import CategorySelector from "~/components/CategorySelection";

const cx = classNames.bind(styles);

function PostEditForm({
  editedTitle,
  editedContent,
  categoryId,
  categories,
  imagePreview,
  saving,
  isUploadingImage,
  error,
  onTitleChange,
  onContentChange,
  onCategoryChange,
  onImageChange,
  onRemoveImage,
  onSave,
  onCancel,
}) {
  return (
    <div className={cx("edit-mode")}>
      <div className={cx("edit-form")}>
        {error && <div className={cx("alert", "alert-error")}>{error}</div>}

        <div className={cx("form-group")}>
          <label className={cx("form-label")}>Danh mục</label>
          <CategorySelector
            categories={categories}
            value={categoryId}
            onChange={onCategoryChange}
            disabled={saving || isUploadingImage}
          />
        </div>

        <div className={cx("form-group")}>
          <label className={cx("form-label")}>Tiêu đề</label>
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            className={cx("form-input")}
            placeholder="Nhập tiêu đề bài viết"
            disabled={saving || isUploadingImage}
          />
        </div>

        <div className={cx("form-group")}>
          <label className={cx("form-label")}>Ảnh bài viết</label>
          <div className={cx("image-upload")}>
            {imagePreview ? (
              <div className={cx("image-preview-container")}>
                <img src={imagePreview} alt="Preview" className={cx("image-preview")} />
                <button
                  type="button"
                  className={cx("image-remove-btn")}
                  onClick={onRemoveImage}
                  disabled={saving || isUploadingImage}
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
            ) : (
              <div className={cx("image-upload-placeholder")}>
                <input
                  type="file"
                  id="post-image-input-edit"
                  accept="image/*"
                  onChange={onImageChange}
                  className={cx("image-input")}
                  disabled={saving || isUploadingImage}
                />
                <label htmlFor="post-image-input-edit" className={cx("image-upload-label")}>
                  <FontAwesomeIcon icon={faImage} className={cx("upload-icon")} />
                  <span>Chọn ảnh</span>
                </label>
                <p className={cx("upload-hint")}>JPG, PNG hoặc GIF (tối đa 5MB)</p>
              </div>
            )}
          </div>
        </div>

        <div className={cx("form-group")}>
          <label className={cx("form-label")}>Nội dung</label>
          <textarea
            value={editedContent}
            onChange={(e) => onContentChange(e.target.value)}
            className={cx("form-textarea")}
            placeholder="Nhập nội dung bài viết"
            rows={10}
            disabled={saving || isUploadingImage}
          />
        </div>

        <div className={cx("edit-actions")}>
          <Button
            primary
            onClick={onSave}
            disabled={
              saving || isUploadingImage || !editedTitle.trim() || !editedContent.trim() || !categoryId
            }
            leftIcon={
              isUploadingImage || saving ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                <FontAwesomeIcon icon={faSave} />
              )
            }
          >
            {isUploadingImage ? "Đang tải ảnh..." : saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
          <Button
            outline
            onClick={onCancel}
            disabled={saving || isUploadingImage}
            leftIcon={<FontAwesomeIcon icon={faTimes} />}
          >
            Hủy
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PostEditForm;
