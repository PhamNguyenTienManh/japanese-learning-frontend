import { useState, useEffect } from "react";
import classNames from "classnames/bind";
import styles from "./NewPost.module.scss";

import Card from "~/components/Card";
import Button from "~/components/Button";
import Input from "~/components/Input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faXmark, faImage } from "@fortawesome/free-solid-svg-icons";
import postService from "~/services/postService";
import CategorySelector from "~/components/CategorySelection";

const cx = classNames.bind(styles);

// Fallback categories nếu API lỗi
const DEFAULT_CATEGORIES = [
  { _id: "1", name: "Ngữ pháp" },
  { _id: "2", name: "Từ vựng" },
  { _id: "3", name: "Kanji" },
  { _id: "4", name: "Tài liệu" },
  { _id: "5", name: "Kinh nghiệm" },
  { _id: "6", name: "Hỏi đáp" },
];

function NewPost() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [postId, setPostId] = useState(null);

  // Image upload states
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageChanged, setImageChanged] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCategories();
    checkEditMode();
  }, []);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const data = await postService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Failed to load categories, using defaults");
      setCategories(DEFAULT_CATEGORIES);
    }
  };

  // Check if editing mode
  const checkEditMode = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const editPostId = urlParams.get("edit");
    if (editPostId) {
      setIsEdit(true);
      setPostId(editPostId);
      fetchPostData(editPostId);
    }
  };

  // Fetch post data for editing
  const fetchPostData = async (id) => {
    try {
      setLoading(true);
      const data = await postService.getPostById(id);
      setTitle(data.title || "");
      setContent(data.content || "");
      setCategoryId(data.category_id || "");
      setTags(data.tags || []);
      setImagePreview(data.image_url || null);
    } catch (error) {
      alert("Không thể tải dữ liệu bài viết!");
    } finally {
      setLoading(false);
    }
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB for posts)
      if (file.size > 5 * 1024 * 1024) {
        setError("Kích thước ảnh không được vượt quá 5MB");
        return;
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setError("Chỉ chấp nhận file ảnh định dạng JPG, PNG hoặc GIF");
        return;
      }

      setImage(file);
      setImageChanged(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    setImageChanged(true);
    setError(null);
  };

  const handleAddTag = () => {
    const value = tagInput.trim();
    if (value && !tags.includes(value)) {
      setTags((prev) => [...prev, value]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  // Upload image to server (similar to updateAvatar)
  const uploadPostImage = async (file) => {
    if (!file) throw new Error("File is required");

    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("token") || "";
    const response = await fetch(`${process.env.REACT_APP_BASE_URL_API}/posts/image`, {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload image: ${response.statusText}`);
    }

    return response.json();
  };

  const handleSubmit = async () => {
    // Validation
    if (!title.trim() || !content.trim() || !categoryId) {
      alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Step 1: Upload image if changed
      let uploadedImageData = null;
      if (imageChanged && image) {
        try {
          setIsUploadingImage(true);
          const imageResult = await uploadPostImage(image);
          uploadedImageData = imageResult.data.data;

          setIsUploadingImage(false);
        } catch (uploadErr) {
          setIsUploadingImage(false);
          throw new Error("Không thể tải ảnh lên. Vui lòng thử lại.");
        }
      }

      // Step 2: Prepare post data
      const postData = {
        title: title.trim(),
        content: content.trim(),
        category_id: categoryId,
        image_url: "",
        image_publicId: ""
      };

      if (tags.length > 0) {
        postData.tags = tags;
      }

      // Add image data if uploaded
      if (uploadedImageData) {

        postData.image_url = uploadedImageData.image_url;
        postData.image_publicId = uploadedImageData.image_publicId;
      } else if (imageChanged && !image && isEdit) {
        // If image was removed in edit mode
        postData.image_url = null;
        postData.image_publicId = null;
      }


      // Step 3: Create or update post
      if (isEdit) {
        await postService.updatePost(postId, postData);
        alert("Bài viết đã được cập nhật thành công!");
      } else {
        await postService.createPost(postData);
        alert("Bài viết đã được tạo thành công!");
      }

      window.location.href = "/community";
    } catch (error) {
      setError(error.message || "Có lỗi xảy ra. Vui lòng thử lại.");
      alert(`Lỗi: ${error.message}`);
    } finally {
      setLoading(false);
      setIsUploadingImage(false);
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  if (loading && isEdit) {
    return (
      <div className={cx("wrapper")}>
        <main className={cx("main")}>
          <div className={cx("container")}>
            <Card className={cx("form-card")}>
              <p style={{ textAlign: "center", padding: "40px" }}>
                Đang tải dữ liệu...
              </p>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={cx("wrapper")}>
      <main className={cx("main")}>
        <div className={cx("container")}>
          {/* Header */}
          <div className={cx("header")}>
            <button
              type="button"
              onClick={handleBack}
              className={cx("back-link")}
            >
              <FontAwesomeIcon icon={faArrowLeft} className={cx("back-icon")} />
              <span>Quay lại cộng đồng</span>
            </button>
            <h1 className={cx("title")}>
              {isEdit ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}
            </h1>
            <p className={cx("subtitle")}>
              Chia sẻ kiến thức và kinh nghiệm của bạn
            </p>
          </div>

          {/* Form */}
          <Card className={cx("form-card")}>
            <div className={cx("form")}>
              {error && (
                <div className={cx("alert", "alert-error")}>
                  {error}
                </div>
              )}

              {/* Title */}
              <div className={cx("field")}>
                <label htmlFor="title" className={cx("label")}>
                  Tiêu đề <span className={cx("required")}>*</span>
                </label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tiêu đề bài viết..."
                  className={"newpost-input"}
                  disabled={loading}
                />
              </div>

              {/* Category */}
              <CategorySelector
                categories={categories}
                value={categoryId}
                onChange={setCategoryId}
                disabled={loading}
              />

              {/* Image Upload */}
              <div className={cx("field")}>
                <label className={cx("label")}>Ảnh bài viết</label>
                <div className={cx("image-upload")}>
                  {imagePreview ? (
                    <div className={cx("image-preview-container")}>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className={cx("image-preview")}
                      />
                      <button
                        type="button"
                        className={cx("image-remove-btn")}
                        onClick={handleRemoveImage}
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
                        onChange={handleImageChange}
                        className={cx("image-input")}
                        disabled={loading}
                      />
                      <label
                        htmlFor="post-image-input"
                        className={cx("image-upload-label")}
                      >
                        <FontAwesomeIcon icon={faImage} className={cx("upload-icon")} />
                        <span>Chọn ảnh</span>
                      </label>
                      <p className={cx("upload-hint")}>
                        JPG, PNG hoặc GIF (tối đa 5MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className={cx("field")}>
                <label htmlFor="content" className={cx("label")}>
                  Nội dung <span className={cx("required")}>*</span>
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Viết nội dung bài viết của bạn..."
                  className={cx("textarea")}
                  disabled={loading}
                />
                <p className={cx("helper")}>{content.length} ký tự</p>
              </div>

              {/* Tags - Commented out in original */}
              {/* <div className={cx("field")}>
                <label htmlFor="tags" className={cx("label")}>
                  Thẻ (Tags)
                </label>
                <div className={cx("tag-input-row")}>
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Nhập thẻ và nhấn Enter..."
                    className={"newpost-input"}
                    disabled={loading}
                  />
                  <Button
                    outline
                    className={cx("tag-add-btn")}
                    onClick={handleAddTag}
                    disabled={loading}
                  >
                    Thêm
                  </Button>
                </div>

                {tags.length > 0 && (
                  <div className={cx("tags-list")}>
                    {tags.map((tag) => (
                      <span key={tag} className={cx("tag-chip")}>
                        #{tag}
                        <button
                          type="button"
                          className={cx("tag-remove")}
                          onClick={() => handleRemoveTag(tag)}
                          disabled={loading}
                        >
                          <FontAwesomeIcon
                            icon={faXmark}
                            className={cx("tag-remove-icon")}
                          />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div> */}

              {/* Actions */}
              <div className={cx("actions")}>
                <Button
                  primary
                  className={cx("action-btn")}
                  onClick={handleSubmit}
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
          </Card>

          {/* Guidelines */}
          <Card className={cx("guide-card")}>
            <h3 className={cx("guide-title")}>Hướng dẫn viết bài</h3>
            <ul className={cx("guide-list")}>
              <li>• Viết tiêu đề rõ ràng, súc tích</li>
              <li>• Chia sẻ nội dung hữu ích và chính xác</li>
              <li>• Sử dụng ngôn ngữ lịch sự, tôn trọng</li>
              <li>• Thêm ảnh minh họa nếu cần thiết</li>
              <li>• Không spam hoặc quảng cáo</li>
            </ul>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default NewPost;