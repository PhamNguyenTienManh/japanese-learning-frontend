import { useState, useEffect } from "react";
import classNames from "classnames/bind";
import styles from "./NewPost.module.scss";

import Card from "~/components/Card";
import Button from "~/components/Button";
import Input from "~/components/Input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faXmark } from "@fortawesome/free-solid-svg-icons";
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
    } catch (error) {
      alert("Không thể tải dữ liệu bài viết!");
    } finally {
      setLoading(false);
    }
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

  const handleSubmit = async () => {
    // Validation
    if (!title.trim() || !content.trim() || !categoryId) {
      alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    const postData = {
      title: title.trim(),
      content: content.trim(),
      category_id: categoryId,
    };

    if (tags.length > 0) {
      postData.tags = tags;
    }

    try {
      setLoading(true);

      if (isEdit) {
        await postService.updatePost(postId, postData);
        alert("Bài viết đã được cập nhật thành công!");
      } else {
        await postService.createPost(postData);
        alert("Bài viết đã được tạo thành công!");
      }

      window.location.href = "/community";
    } catch (error) {
      alert(`Lỗi: ${error.message}`);
    } finally {
      setLoading(false);
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

              {/* Tags */}
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
                  disabled={loading}
                >
                  {loading
                    ? "Đang xử lý..."
                    : isEdit
                      ? "Cập nhật"
                      : "Đăng bài"}
                </Button>
                <Button
                  outline
                  className={cx("action-btn")}
                  href="/community"
                  disabled={loading}
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
              <li>• Thêm thẻ phù hợp để dễ tìm kiếm</li>
              <li>• Không spam hoặc quảng cáo</li>
            </ul>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default NewPost;