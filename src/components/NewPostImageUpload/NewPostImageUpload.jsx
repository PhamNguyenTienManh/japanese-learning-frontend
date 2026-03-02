import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faImage } from "@fortawesome/free-solid-svg-icons";
import classNames from "classnames/bind";
import styles from "./NewPostImageUpload.module.scss";

const cx = classNames.bind(styles);

function NewPostImageUpload({ imagePreview, loading, onImageChange, onRemoveImage }) {
  return (
    <div className={cx("image-upload")}>
      {imagePreview ? (
        <div className={cx("image-preview-container")}>
          <img src={imagePreview} alt="Preview" className={cx("image-preview")} />
          <button
            type="button"
            className={cx("image-remove-btn")}
            onClick={onRemoveImage}
            disabled={loading}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
      ) : (
        <div className={cx("image-upload-placeholder")}>
          <input
            type="file"
            id="post-image-input"
            accept="image/*"
            onChange={onImageChange}
            className={cx("image-input")}
            disabled={loading}
          />
          <label htmlFor="post-image-input" className={cx("image-upload-label")}>
            <FontAwesomeIcon icon={faImage} className={cx("upload-icon")} />
            <span>Chọn ảnh</span>
          </label>
          <p className={cx("upload-hint")}>JPG, PNG hoặc GIF (tối đa 5MB)</p>
        </div>
      )}
    </div>
  );
}

export default NewPostImageUpload;
