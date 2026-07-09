import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import classNames from "classnames/bind";
import styles from "./NewPost.module.scss";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import postService from "~/services/postService";
import NewPostHeader from "~/components/NewPostHeader/NewPostHeader";
import NewPostForm from "~/components/NewPostForm/NewPostForm";
import NewPostGuidelines from "~/components/NewPostGuideline/NewPostGuidelines";
import { useToast } from "~/context/ToastContext";

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
  const navigate = useNavigate();
  const { addToast } = useToast();
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

  const fetchCategories = useCallback(async () => {
    try {
      const data = await postService.getCategories();
      setCategories(data);
    } catch {
      setCategories(DEFAULT_CATEGORIES);
    }
  }, []);

  const fetchPostData = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await postService.getPostById(id);
      const data = response?.data?.data || response?.data || response;
      setTitle(data.title || "");
      setContent(data.content || "");
      setCategoryId(data.category_id?._id || data.category_id || "");
      setImagePreview(data.image_url || null);
    } catch {
      addToast("Không thể tải dữ liệu bài viết!", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const checkEditMode = useCallback(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const editPostId = urlParams.get("edit");
    if (editPostId) {
      setIsEdit(true);
      setPostId(editPostId);
      fetchPostData(editPostId);
    }
  }, [fetchPostData]);

  useEffect(() => {
    fetchCategories();
    checkEditMode();
  }, [fetchCategories, checkEditMode]);


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
    const response = await fetch(`${process.env.REACT_APP_API_URL}/posts/image`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    if (!response.ok) throw new Error(`Failed to upload image: ${response.statusText}`);
    return response.json();
  };


  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || !categoryId) {
      addToast("Vui lòng điền đầy đủ thông tin!", "warning");
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
        addToast("Bài viết đã được cập nhật thành công!", "success");
      } else {
        await postService.createPost(postData);
        addToast("Bài viết đã được tạo thành công!", "success");
      }

      navigate("/community");
    } catch (err) {
      const message = err.message || "Có lỗi xảy ra. Vui lòng thử lại.";
      setError(message);
      addToast(`Lỗi: ${message}`, "error");
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
            <div className={cx("loading-card")}>
              <FontAwesomeIcon icon={faSpinner} spin />
              <span style={{ marginLeft: 10 }}>Đang tải dữ liệu...</span>
            </div>
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

          <div className={cx("form-card")}>
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
          </div>

          <NewPostGuidelines />
        </div>
      </main>
    </div>
  );
}

export default NewPost;
