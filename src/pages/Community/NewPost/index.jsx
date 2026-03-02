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
import NewPostHeader from "~/components/NewPostHeader/NewPostHeader";
import NewPostForm from "~/components/NewPostForm/NewPostForm";
import NewPostGuidelines from "~/components/NewPostGuideline/NewPostGuidelines";

const cx = classNames.bind(styles);

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
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [postId, setPostId] = useState(null);
  const [error, setError] = useState(null);

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageChanged, setImageChanged] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    fetchCategories();
    checkEditMode();
  }, []);


  const fetchCategories = async () => {
    try {
      const data = await postService.getCategories();
      setCategories(data);
    } catch {
      setCategories(DEFAULT_CATEGORIES);
    }
  };

  const checkEditMode = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const editPostId = urlParams.get("edit");
    if (editPostId) {
      setIsEdit(true);
      setPostId(editPostId);
      fetchPostData(editPostId);
    }
  };

  const fetchPostData = async (id) => {
    try {
      setLoading(true);
      const data = await postService.getPostById(id);
      setTitle(data.title || "");
      setContent(data.content || "");
      setCategoryId(data.category_id || "");
      setImagePreview(data.image_url || null);
    } catch {
      alert("Không thể tải dữ liệu bài viết!");
    } finally {
      setLoading(false);
    }
  };


  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Kích thước ảnh không được vượt quá 5MB"); return; }
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) { setError("Chỉ chấp nhận file ảnh định dạng JPG, PNG hoặc GIF"); return; }
    setImage(file);
    setImageChanged(true);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
    setError(null);
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    setImageChanged(true);
    setError(null);
  };

  const uploadPostImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const token = localStorage.getItem("token") || "";
    const response = await fetch(`${process.env.REACT_APP_BASE_URL_API}/posts/image`, {
      method: "POST",
      headers: { Authorization: token ? `Bearer ${token}` : "" },
      body: formData,
    });
    if (!response.ok) throw new Error(`Failed to upload image: ${response.statusText}`);
    return response.json();
  };


  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || !categoryId) {
      alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let uploadedImageData = null;
      if (imageChanged && image) {
        setIsUploadingImage(true);
        const imageResult = await uploadPostImage(image);
        uploadedImageData = imageResult.data.data;
        setIsUploadingImage(false);
      }

      const postData = {
        title: title.trim(),
        content: content.trim(),
        category_id: categoryId,
        image_url: "",
        image_publicId: "",
      };

      if (uploadedImageData) {
        postData.image_url = uploadedImageData.image_url;
        postData.image_publicId = uploadedImageData.image_publicId;
      } else if (imageChanged && !image && isEdit) {
        postData.image_url = null;
        postData.image_publicId = null;
      }

      if (isEdit) {
        await postService.updatePost(postId, postData);
        alert("Bài viết đã được cập nhật thành công!");
      } else {
        await postService.createPost(postData);
        alert("Bài viết đã được tạo thành công!");
      }

      window.location.href = "/community";
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra. Vui lòng thử lại.");
      alert(`Lỗi: ${err.message}`);
    } finally {
      setLoading(false);
      setIsUploadingImage(false);
    }
  };

  const handleBack = () => window.history.back();


  if (loading && isEdit) {
    return (
      <div className={cx("wrapper")}>
        <main className={cx("main")}>
          <div className={cx("container")}>
            <Card className={cx("form-card")}>
              <p style={{ textAlign: "center", padding: "40px" }}>Đang tải dữ liệu...</p>
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
          <NewPostHeader isEdit={isEdit} onBack={handleBack} />

          <Card className={cx("form-card")}>
            <NewPostForm
              title={title}
              content={content}
              categoryId={categoryId}
              categories={categories}
              imagePreview={imagePreview}
              loading={loading}
              isUploadingImage={isUploadingImage}
              isEdit={isEdit}
              error={error}
              onTitleChange={setTitle}
              onContentChange={setContent}
              onCategoryChange={setCategoryId}
              onImageChange={handleImageChange}
              onRemoveImage={handleRemoveImage}
              onSubmit={handleSubmit}
            />
          </Card>

          <NewPostGuidelines />
        </div>
      </main>
    </div>
  );
}

export default NewPost;
