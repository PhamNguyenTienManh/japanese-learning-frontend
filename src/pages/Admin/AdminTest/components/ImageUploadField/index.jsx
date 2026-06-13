import { useRef, useState } from "react";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload, faXmark } from "@fortawesome/free-solid-svg-icons";

import { uploadImage } from "~/services/uploadService";

import styles from "./ImageUploadField.module.scss";

const cx = classNames.bind(styles);
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

function ImageUploadField({
    value,
    onChange,
    label,
    placeholder = "Nhập URL ảnh nếu có",
    disabled = false,
    onError,
    onSuccess,
}) {
    const inputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);

    const showError = (message) => {
        onError?.(message);
    };

    const handleFileChange = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;

        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            showError("Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP.");
            return;
        }

        if (file.size > MAX_IMAGE_SIZE) {
            showError("Kích thước ảnh không được vượt quá 5MB.");
            return;
        }

        try {
            setIsUploading(true);
            const uploadedImage = await uploadImage(file);
            const uploadedUrl = uploadedImage?.url || uploadedImage?.image_url;

            if (!uploadedUrl) {
                throw new Error("Không nhận được URL ảnh sau khi upload.");
            }

            onChange(uploadedUrl);
            onSuccess?.("Upload ảnh thành công.");
        } catch (error) {
            console.error("Upload image error:", error);
            showError(error.message || "Upload ảnh thất bại.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className={cx("imageField")}>
            {label && <label className={cx("label")}>{label}</label>}

            <div className={cx("controlRow")}>
                <input
                    value={value || ""}
                    onChange={(event) => onChange(event.target.value)}
                    className={cx("urlInput")}
                    placeholder={placeholder}
                    disabled={disabled || isUploading}
                />

                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className={cx("fileInput")}
                    onChange={handleFileChange}
                    disabled={disabled || isUploading}
                />

                <button
                    type="button"
                    className={cx("uploadButton")}
                    onClick={() => inputRef.current?.click()}
                    disabled={disabled || isUploading}
                >
                    <FontAwesomeIcon icon={faUpload} />
                    <span>{isUploading ? "Đang tải..." : "Upload"}</span>
                </button>
            </div>

            {value && (
                <div className={cx("previewRow")}>
                    <img src={value} alt="" className={cx("previewImage")} />
                    <button
                        type="button"
                        className={cx("removeButton")}
                        onClick={() => onChange("")}
                        disabled={disabled || isUploading}
                    >
                        <FontAwesomeIcon icon={faXmark} />
                        <span>Xóa ảnh</span>
                    </button>
                </div>
            )}
        </div>
    );
}

export default ImageUploadField;
