import { useState } from "react";
import classNames from "classnames/bind";
import styles from "./NewPost.module.scss";

import Card from "~/components/Card";
import Button from "~/components/Button";
import Input from "~/components/Input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faXmark } from "@fortawesome/free-solid-svg-icons";

const cx = classNames.bind(styles);

const categories = [
  "Ngữ pháp",
  "Từ vựng",
  "Kanji",
  "Tài liệu",
  "Kinh nghiệm",
  "Hỏi đáp",
];

function NewPost() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

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

  const handleSubmit = () => {
    if (!title.trim() || !content.trim() || !category) {
      alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    console.log("Creating post:", { title, content, category, tags });
    alert("Bài viết đã được tạo thành công!");
    window.location.href = "/community";
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
            <h1 className={cx("title")}>Tạo bài viết mới</h1>
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
                />
              </div>

              {/* Category */}
              <div className={cx("field")}>
                <span className={cx("label")}>
                  Danh mục <span className={cx("required")}>*</span>
                </span>
                <div className={cx("category-list")}>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={cx("category-item", {
                        active: category === cat,
                      })}
                    >
                      {cat}
                    </button>
                  ))}
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
                />
                <p className={cx("helper")}>{content.length} ký tự</p>
              </div>

              {/* Tags */}
              <div className={cx("field")}>
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
                  />
                  <Button
                    outline
                    className={cx("tag-add-btn")}
                    onClick={handleAddTag}
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
              </div>

              {/* Actions */}
              <div className={cx("actions")}>
                <Button
                  primary
                  className={cx("action-btn")}
                  onClick={handleSubmit}
                >
                  Đăng bài
                </Button>
                <Button outline className={cx("action-btn")} href="/community">
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
