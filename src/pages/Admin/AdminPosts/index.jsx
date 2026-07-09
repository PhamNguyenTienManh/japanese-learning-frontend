import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import classNames from "classnames/bind";
import { AnimatePresence, motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faEye,
  faImage,
  faMagnifyingGlass,
  faPen,
  faPlus,
  faRotateLeft,
  faSpinner,
  faTrash,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import styles from "./AdminPosts.module.scss";

import postService from "~/services/postService";
import moderationService, {
  MODERATION_COUNTS_REFRESH_EVENT,
} from "~/services/moderationService";
import { useToast } from "~/context/ToastContext";
import { REPORT_REASONS } from "~/components/ReportPostModal/ReportPostModal";

const cx = classNames.bind(styles);

const easeOut = [0.22, 1, 0.36, 1];
const PAGE_SIZE_OPTIONS = [10, 25, 50];
const STATUS_OPTIONS = [
  { value: "active", label: "Đang hiển thị" },
  { value: "deleted", label: "Đã xóa mềm" },
  { value: "all", label: "Tất cả trạng thái" },
];

const EMPTY_FORM = {
  title: "",
  content: "",
  categoryId: "",
  imagePreview: "",
  imageFile: null,
  imageChanged: false,
};

function unwrapListResponse(response) {
  if (response?.data && Array.isArray(response.data.data)) return response.data;
  if (response && Array.isArray(response.data)) return response;
  return { data: [], countComment: [], total: 0, page: 1, limit: 10, totalPage: 1 };
}

function getPostId(post) {
  return post?._id || post?.id;
}

function isDeletedPost(post) {
  return post?.isDeleted === true || Number(post?.status) === 0;
}

function getCommentId(comment) {
  return comment?._id || comment?.id;
}

function isDeletedComment(comment) {
  return comment?.isDeleted === true || Number(comment?.status) === 0;
}

function getCommentPostId(comment) {
  const post = comment?.postId;
  if (!post) return "";
  return typeof post === "string" ? post : post._id || post.id || "";
}

function getCommentPostTitle(comment) {
  const post = comment?.postId;
  if (!post || typeof post === "string") return "Bài viết";
  return post.title || "Bài viết";
}

function getCommentAuthorName(comment) {
  return comment?.profileId?.name || "Ẩn danh";
}

function getCommentAuthorEmail(comment) {
  return comment?.profileId?.email || comment?.profileId?.userId?.email || "";
}

function stripHtml(value = "") {
  return String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getAuthorName(post) {
  return post?.profile_id?.name || post?.author?.name || "Ẩn danh";
}

function getAuthorEmail(post) {
  return post?.profile_id?.email || post?.profile_id?.userId?.email || "";
}

function AdminSelect({ className, options, value, onChange, ariaLabel }) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    if (!open) return undefined;

    const close = () => setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  return (
    <div className={cx("adminSelect", className, { open })} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className={cx("adminSelectTrigger")}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selectedOption?.label || "Chọn"}</span>
        <FontAwesomeIcon icon={faChevronDown} />
      </button>

      {open && (
        <div className={cx("adminSelectMenu")} role="listbox">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={cx("adminSelectOption", { selected: option.value === value })}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminPosts() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState("posts");
  const [posts, setPosts] = useState([]);
  const [adminComments, setAdminComments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [commentCounts, setCommentCounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [commentsError, setCommentsError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPage: 1 });
  const [commentsPagination, setCommentsPagination] = useState({ total: 0, totalPage: 1 });
  const [refreshKey, setRefreshKey] = useState(0);
  const [commentsRefreshKey, setCommentsRefreshKey] = useState(0);

  const [modalMode, setModalMode] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [formState, setFormState] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteCategory, setDeleteCategory] = useState("");
  const [deleteSubcategory, setDeleteSubcategory] = useState("");
  const [deleteDescription, setDeleteDescription] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [restoreError, setRestoreError] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoringId, setRestoringId] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [commentContent, setCommentContent] = useState("");
  const [commentError, setCommentError] = useState("");
  const [isSavingComment, setIsSavingComment] = useState(false);
  const [commentDeleteTarget, setCommentDeleteTarget] = useState(null);
  const [commentDeleteCategory, setCommentDeleteCategory] = useState("");
  const [commentDeleteSubcategory, setCommentDeleteSubcategory] = useState("");
  const [commentDeleteDescription, setCommentDeleteDescription] = useState("");
  const [commentDeleteError, setCommentDeleteError] = useState("");
  const [isDeletingComment, setIsDeletingComment] = useState(false);
  const [commentRestoreTarget, setCommentRestoreTarget] = useState(null);
  const [commentRestoreError, setCommentRestoreError] = useState("");
  const [isRestoringComment, setIsRestoringComment] = useState(false);
  const [restoringCommentId, setRestoringCommentId] = useState("");

  const categoryOptions = useMemo(
    () => [
      { value: "all", label: "Tất cả danh mục" },
      ...categories.map((category) => ({
        value: category._id,
        label: category.name,
      })),
    ],
    [categories],
  );

  const pageSizeOptions = PAGE_SIZE_OPTIONS.map((size) => ({
    value: size,
    label: `${size} / trang`,
  }));

  const selectedDeleteReason = useMemo(
    () => REPORT_REASONS.find((reason) => reason.value === deleteCategory),
    [deleteCategory],
  );

  const selectedCommentDeleteReason = useMemo(
    () => REPORT_REASONS.find((reason) => reason.value === commentDeleteCategory),
    [commentDeleteCategory],
  );

  const activePagination = activeTab === "comments" ? commentsPagination : pagination;
  const activeTotal = activePagination.total || 0;
  const activeTotalPage = activePagination.totalPage || 1;
  const activeLoading = activeTab === "comments" ? commentsLoading : isLoading;
  const activeError = activeTab === "comments" ? commentsError : loadError;
  const commentRows = Array.isArray(adminComments) ? adminComments : [];
  const postRows = Array.isArray(posts) ? posts : [];
  const activeRows = activeTab === "comments" ? commentRows : postRows;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await postService.getCategories();
        setCategories(data || []);
      } catch (err) {
        console.error("Error loading post categories:", err);
        addToast("Không tải được danh mục bài viết", "error");
      }
    }

    fetchCategories();
  }, [addToast]);

  useEffect(() => {
    let isActive = true;

    async function fetchPosts() {
      if (activeTab !== "posts") {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setLoadError("");
        const response = await postService.getAdminPosts({
          page: currentPage,
          limit: pageSize,
          q: debouncedSearch,
          category: categoryFilter,
          status: statusFilter,
        });
        const payload = unwrapListResponse(response);

        if (!isActive) return;
        setPosts(payload.data || []);
        setCommentCounts(payload.countComment || []);
        setPagination({
          total: payload.total || 0,
          totalPage: payload.totalPage || 1,
        });
      } catch (err) {
        if (!isActive) return;
        console.error("Error loading admin posts:", err);
        setPosts([]);
        setCommentCounts([]);
        setPagination({ total: 0, totalPage: 1 });
        setLoadError("Không tải được danh sách bài viết.");
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    fetchPosts();
    return () => {
      isActive = false;
    };
  }, [activeTab, currentPage, pageSize, debouncedSearch, categoryFilter, statusFilter, refreshKey]);

  useEffect(() => {
    let isActive = true;

    async function fetchComments() {
      if (activeTab !== "comments") {
        setCommentsLoading(false);
        return;
      }

      try {
        setCommentsLoading(true);
        setCommentsError("");
        const response = await postService.getAdminComments({
          page: currentPage,
          limit: pageSize,
          q: debouncedSearch,
          status: statusFilter,
        });
        const payload = unwrapListResponse(response);

        if (!isActive) return;
        setAdminComments(payload.data || []);
        setCommentsPagination({
          total: payload.total || 0,
          totalPage: payload.totalPage || 1,
        });
      } catch (err) {
        if (!isActive) return;
        console.error("Error loading admin comments:", err);
        setAdminComments([]);
        setCommentsPagination({ total: 0, totalPage: 1 });
        setCommentsError("Không tải được danh sách bình luận.");
      } finally {
        if (isActive) setCommentsLoading(false);
      }
    }

    fetchComments();
    return () => {
      isActive = false;
    };
  }, [activeTab, currentPage, pageSize, debouncedSearch, statusFilter, commentsRefreshKey]);

  function resetToFirstPage() {
    setCurrentPage(1);
  }

  function handleTabChange(tab) {
    setActiveTab(tab);
    setSearchQuery("");
    setDebouncedSearch("");
    setCategoryFilter("all");
    setStatusFilter("active");
    setCurrentPage(1);
  }

  function openCreateModal() {
    setModalMode("create");
    setEditingPost(null);
    setFormState({
      ...EMPTY_FORM,
      categoryId: categories[0]?._id || "",
    });
    setFormError("");
  }

  function openEditModal(post) {
    setModalMode("edit");
    setEditingPost(post);
    setFormState({
      title: post.title || "",
      content: post.content || "",
      categoryId: post.category_id?._id || post.category_id || "",
      imagePreview: post.image_url || "",
      imageFile: null,
      imageChanged: false,
    });
    setFormError("");
  }

  function closeFormModal(force = false) {
    if (isSaving && force !== true) return;
    setModalMode(null);
    setEditingPost(null);
    setFormState(EMPTY_FORM);
    setFormError("");
  }

  function openDeleteModal(post) {
    setDeleteTarget(post);
    setDeleteCategory("");
    setDeleteSubcategory("");
    setDeleteDescription("");
    setDeleteError("");
  }

  function closeDeleteModal(force = false) {
    if (isDeleting && force !== true) return;
    setDeleteTarget(null);
    setDeleteCategory("");
    setDeleteSubcategory("");
    setDeleteDescription("");
    setDeleteError("");
  }

  function openRestoreModal(post) {
    setRestoreTarget(post);
    setRestoreError("");
  }

  function closeRestoreModal(force = false) {
    if (isRestoring && force !== true) return;
    setRestoreTarget(null);
    setRestoreError("");
  }

  function markPostRestoredInTable(postId) {
    setPosts((currentPosts) => {
      if (statusFilter === "deleted") {
        return currentPosts.filter((post) => String(getPostId(post)) !== String(postId));
      }

      return currentPosts.map((post) =>
        String(getPostId(post)) === String(postId)
          ? {
              ...post,
              status: 1,
              isDeleted: false,
              deleted_at: null,
              deleted_by: null,
            }
          : post,
      );
    });

    if (statusFilter === "deleted") {
      setPagination((current) => {
        const nextTotal = Math.max((current.total || 0) - 1, 0);
        return {
          ...current,
          total: nextTotal,
          totalPage: Math.max(Math.ceil(nextTotal / pageSize), 1),
        };
      });
    }
  }

  function openEditCommentModal(comment) {
    setEditingComment(comment);
    setCommentContent(comment.content || "");
    setCommentError("");
  }

  function closeEditCommentModal(force = false) {
    if (isSavingComment && force !== true) return;
    setEditingComment(null);
    setCommentContent("");
    setCommentError("");
  }

  function openCommentDeleteModal(comment) {
    setCommentDeleteTarget(comment);
    setCommentDeleteCategory("");
    setCommentDeleteSubcategory("");
    setCommentDeleteDescription("");
    setCommentDeleteError("");
  }

  function closeCommentDeleteModal(force = false) {
    if (isDeletingComment && force !== true) return;
    setCommentDeleteTarget(null);
    setCommentDeleteCategory("");
    setCommentDeleteSubcategory("");
    setCommentDeleteDescription("");
    setCommentDeleteError("");
  }

  function openCommentRestoreModal(comment) {
    setCommentRestoreTarget(comment);
    setCommentRestoreError("");
  }

  function closeCommentRestoreModal(force = false) {
    if (isRestoringComment && force !== true) return;
    setCommentRestoreTarget(null);
    setCommentRestoreError("");
  }

  function markCommentRestoredInTable(commentId) {
    setAdminComments((currentComments) => {
      const rows = Array.isArray(currentComments) ? currentComments : [];

      if (statusFilter === "deleted") {
        return rows.filter((comment) => String(getCommentId(comment)) !== String(commentId));
      }

      return rows.map((comment) =>
        String(getCommentId(comment)) === String(commentId)
          ? {
              ...comment,
              status: 1,
              isDeleted: false,
            }
          : comment,
      );
    });

    if (statusFilter === "deleted") {
      setCommentsPagination((current) => {
        const nextTotal = Math.max((current.total || 0) - 1, 0);
        return {
          ...current,
          total: nextTotal,
          totalPage: Math.max(Math.ceil(nextTotal / pageSize), 1),
        };
      });
    }
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFormError("Kích thước ảnh không được vượt quá 5MB.");
      return;
    }

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setFormError("Chỉ chấp nhận ảnh JPG, PNG, GIF hoặc WEBP.");
      return;
    }

    setFormState((current) => ({
      ...current,
      imageFile: file,
      imagePreview: URL.createObjectURL(file),
      imageChanged: true,
    }));
    setFormError("");
  }

  function removeImage() {
    setFormState((current) => ({
      ...current,
      imageFile: null,
      imagePreview: "",
      imageChanged: true,
    }));
  }

  async function uploadPostImage(file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${process.env.REACT_APP_API_URL}/posts/image`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Không tải được ảnh bài viết.");
    }

    const result = await response.json();
    return result?.data?.data || result?.data || result;
  }

  async function handleSubmitForm(event) {
    event.preventDefault();
    const title = formState.title.trim();
    const content = formState.content.trim();

    if (!title || !content || !formState.categoryId) {
      setFormError("Vui lòng nhập đầy đủ tiêu đề, danh mục và nội dung.");
      return;
    }

    try {
      setIsSaving(true);
      setFormError("");

      const payload = {
        title,
        content,
        category_id: formState.categoryId,
      };

      if (formState.imageChanged && formState.imageFile) {
        const uploadedImage = await uploadPostImage(formState.imageFile);
        payload.image_url = uploadedImage.image_url;
        payload.image_publicId = uploadedImage.image_publicId;
      } else if (formState.imageChanged && !formState.imagePreview) {
        payload.image_url = null;
        payload.image_publicId = null;
      } else if (modalMode === "edit") {
        payload.image_url = editingPost?.image_url || null;
        payload.image_publicId = editingPost?.image_publicId || null;
      }

      if (modalMode === "edit" && editingPost) {
        await postService.updatePost(getPostId(editingPost), payload);
        addToast("Đã cập nhật bài viết", "success");
      } else {
        await postService.createPost(payload);
        addToast("Đã tạo bài viết", "success");
        resetToFirstPage();
      }

      closeFormModal(true);
      setRefreshKey((key) => key + 1);
    } catch (err) {
      console.error("Save post error:", err);
      setFormError(err?.response?.data?.message || err.message || "Lưu bài viết thất bại.");
      addToast("Lưu bài viết thất bại", "error");
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmSoftDelete() {
    if (!deleteTarget) return;
    if (!deleteCategory || !deleteSubcategory) {
      setDeleteError("Vui lòng chọn lý do xóa bài viết.");
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteError("");
      const postId = getPostId(deleteTarget);
      await moderationService.deletePostWithReason(postId, {
        category: deleteCategory,
        subcategory: deleteSubcategory,
        description: deleteDescription.trim(),
      });

      addToast("Đã xóa mềm và ghi nhận lý do vi phạm", "success");
      closeDeleteModal(true);
      window.dispatchEvent(new Event(MODERATION_COUNTS_REFRESH_EVENT));

      if (posts.length === 1 && currentPage > 1) {
        setCurrentPage((page) => page - 1);
      } else {
        setRefreshKey((key) => key + 1);
      }
    } catch (err) {
      console.error("Delete post error:", err);
      setDeleteError(err?.response?.data?.message || "Xóa mềm bài viết thất bại.");
      addToast("Xóa mềm bài viết thất bại", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  async function confirmRestorePost() {
    if (!restoreTarget) return;

    const postId = getPostId(restoreTarget);
    if (!postId || restoringId) return;

    try {
      setIsRestoring(true);
      setRestoringId(postId);
      setRestoreError("");
      await postService.restorePost(postId);
      markPostRestoredInTable(postId);
      addToast("Đã khôi phục bài viết", "success");
      closeRestoreModal(true);
      window.dispatchEvent(new Event(MODERATION_COUNTS_REFRESH_EVENT));

      if (posts.length === 1 && currentPage > 1) {
        setCurrentPage((page) => page - 1);
      } else {
        setRefreshKey((key) => key + 1);
      }
    } catch (err) {
      console.error("Restore post error:", err);
      const message = err?.response?.data?.message || "Khôi phục bài viết thất bại";
      setRestoreError(message);
      addToast(message, "error");
    } finally {
      setIsRestoring(false);
      setRestoringId("");
    }
  }

  async function handleSubmitCommentEdit(event) {
    event.preventDefault();
    const content = commentContent.trim();
    if (!editingComment || !content) {
      setCommentError("Nội dung bình luận không được để trống.");
      return;
    }

    try {
      setIsSavingComment(true);
      setCommentError("");
      await postService.updateComment(getCommentId(editingComment), { content });
      addToast("Đã cập nhật bình luận", "success");
      closeEditCommentModal(true);
      setCommentsRefreshKey((key) => key + 1);
    } catch (err) {
      console.error("Save comment error:", err);
      const message = err?.response?.data?.message || "Lưu bình luận thất bại.";
      setCommentError(message);
      addToast(message, "error");
    } finally {
      setIsSavingComment(false);
    }
  }

  async function confirmCommentSoftDelete() {
    if (!commentDeleteTarget) return;
    if (!commentDeleteCategory || !commentDeleteSubcategory) {
      setCommentDeleteError("Vui lòng chọn lý do xóa bình luận.");
      return;
    }

    try {
      setIsDeletingComment(true);
      setCommentDeleteError("");
      await moderationService.deleteCommentWithReason(getCommentId(commentDeleteTarget), {
        category: commentDeleteCategory,
        subcategory: commentDeleteSubcategory,
        description: commentDeleteDescription.trim(),
      });

      addToast("Đã xóa mềm bình luận và ghi nhận lý do vi phạm", "success");
      closeCommentDeleteModal(true);
      window.dispatchEvent(new Event(MODERATION_COUNTS_REFRESH_EVENT));

      if (adminComments.length === 1 && currentPage > 1) {
        setCurrentPage((page) => page - 1);
      } else {
        setCommentsRefreshKey((key) => key + 1);
      }
    } catch (err) {
      console.error("Delete comment error:", err);
      const message = err?.response?.data?.message || "Xóa mềm bình luận thất bại.";
      setCommentDeleteError(message);
      addToast(message, "error");
    } finally {
      setIsDeletingComment(false);
    }
  }

  async function confirmCommentRestore() {
    if (!commentRestoreTarget) return;

    const commentId = getCommentId(commentRestoreTarget);
    if (!commentId || restoringCommentId) return;

    try {
      setIsRestoringComment(true);
      setRestoringCommentId(commentId);
      setCommentRestoreError("");
      await postService.restoreComment(commentId);
      markCommentRestoredInTable(commentId);
      addToast("Đã khôi phục bình luận", "success");
      closeCommentRestoreModal(true);
      window.dispatchEvent(new Event(MODERATION_COUNTS_REFRESH_EVENT));

      if (adminComments.length === 1 && currentPage > 1) {
        setCurrentPage((page) => page - 1);
      } else {
        setCommentsRefreshKey((key) => key + 1);
      }
    } catch (err) {
      console.error("Restore comment error:", err);
      const message = err?.response?.data?.message || "Khôi phục bình luận thất bại";
      setCommentRestoreError(message);
      addToast(message, "error");
    } finally {
      setIsRestoringComment(false);
      setRestoringCommentId("");
    }
  }

  const showingFrom = activeTotal === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const showingTo = Math.min(currentPage * pageSize, activeTotal);

  return (
    <div className={cx("wrapper")}>
      <main className={cx("main")}>
        <motion.div
          className={cx("header")}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: easeOut }}
        >
          <div>
            <h1>{activeTab === "comments" ? "Quản lý bình luận" : "Quản lý bài viết"}</h1>
            <p>
              {activeTab === "comments"
                ? "Theo dõi, chỉnh sửa và xóa mềm bình luận cộng đồng."
                : "Theo dõi, chỉnh sửa và xóa mềm nội dung cộng đồng."}
            </p>
          </div>
          {activeTab === "posts" && (
            <button type="button" className={cx("primaryBtn")} onClick={openCreateModal}>
              <FontAwesomeIcon icon={faPlus} />
              <span>Tạo bài viết</span>
            </button>
          )}
        </motion.div>

        <div className={cx("adminTabs")}>
          <button
            type="button"
            className={cx({ active: activeTab === "posts" })}
            onClick={() => handleTabChange("posts")}
          >
            Bài viết
          </button>
          <button
            type="button"
            className={cx({ active: activeTab === "comments" })}
            onClick={() => handleTabChange("comments")}
          >
            Bình luận
          </button>
        </div>

        <motion.section
          className={cx("filterCard", { commentsFilter: activeTab === "comments" })}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: easeOut, delay: 0.05 }}
        >
          <div className={cx("searchWrapper")}>
            <FontAwesomeIcon icon={faMagnifyingGlass} className={cx("searchIcon")} />
            <input
              type="search"
              value={searchQuery}
              placeholder={activeTab === "comments" ? "Tìm theo nội dung bình luận" : "Tìm theo tiêu đề bài viết"}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                resetToFirstPage();
              }}
            />
          </div>

          {activeTab === "posts" && (
            <AdminSelect
              className="categorySelect"
              options={categoryOptions}
              value={categoryFilter}
              ariaLabel="Lọc theo danh mục"
              onChange={(nextCategory) => {
                setCategoryFilter(nextCategory);
                resetToFirstPage();
              }}
            />
          )}

          <AdminSelect
            className="statusSelect"
            options={STATUS_OPTIONS}
            value={statusFilter}
            ariaLabel="Lọc theo trạng thái"
            onChange={(nextStatus) => {
              setStatusFilter(nextStatus);
              resetToFirstPage();
            }}
          />

          <AdminSelect
            className="pageSizeSelect"
            options={pageSizeOptions}
            value={pageSize}
            ariaLabel="Số bài viết mỗi trang"
            onChange={(nextSize) => {
              setPageSize(Number(nextSize));
              resetToFirstPage();
            }}
          />
        </motion.section>

        <motion.section
          className={cx("tablePanel")}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: easeOut, delay: 0.1 }}
        >
          <div className={cx("tableHeader")}>
            <div>
              <h2>{activeTab === "comments" ? "Danh sách bình luận" : "Danh sách bài viết"}</h2>
              <p>
                Hiển thị {showingFrom}-{showingTo} trên {activeTotal}{" "}
                {activeTab === "comments" ? "bình luận" : "bài viết"}
              </p>
            </div>
          </div>

          {activeTab === "posts" && (
            <div className={cx("tableWrap")}>
            <table className={cx("postsTable")}>
              <thead>
                <tr>
                  <th>Bài viết</th>
                  <th>Danh mục</th>
                  <th>Tác giả</th>
                  <th>Ngày tạo</th>
                  <th>Trạng thái</th>
                  <th>Tương tác</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {postRows.map((post) => {
                  const postId = getPostId(post);
                  const commentCount =
                    commentCounts.find((item) => String(item._id) === String(postId))
                      ?.totalComment || 0;
                  const deleted = isDeletedPost(post);

                  return (
                    <tr key={postId} className={cx({ deletedRow: deleted })}>
                      <td>
                        <div className={cx("postCell")}>
                          <strong>{post.title || "Không có tiêu đề"}</strong>
                          <span>{stripHtml(post.content || "Không có nội dung") || "-"}</span>
                        </div>
                      </td>
                      <td>{post.category_id?.name || "Khác"}</td>
                      <td>
                        <div className={cx("authorCell")}>
                          <strong>{getAuthorName(post)}</strong>
                          {getAuthorEmail(post) && <span>{getAuthorEmail(post)}</span>}
                        </div>
                      </td>
                      <td>{formatDate(post.created_at)}</td>
                      <td>
                        <span className={cx("statusBadge", deleted ? "deleted" : "active")}>
                          {deleted ? "Đã xóa mềm" : "Đang hiển thị"}
                        </span>
                      </td>
                      <td>
                        <span className={cx("metricText")}>
                          {(post.liked || []).length} thích · {commentCount} BL
                        </span>
                      </td>
                      <td>
                        <div className={cx("tableActions")}>
                          <Link
                            className={cx("iconBtn")}
                            to={`/community?postId=${postId}`}
                            state={{
                              fromAdminPosts: true,
                              returnTo: "/admin/posts",
                              backLabel: "Quay lại quản lý bài viết",
                            }}
                            title="Xem bài viết"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </Link>
                          <button
                            type="button"
                            className={cx("iconBtn")}
                            title="Chỉnh sửa"
                            onClick={() => openEditModal(post)}
                          >
                            <FontAwesomeIcon icon={faPen} />
                          </button>
                          {deleted ? (
                            <button
                              type="button"
                              className={cx("iconBtn", "restore")}
                              title="Khôi phục"
                              disabled={restoringId === postId}
                              onClick={() => openRestoreModal(post)}
                            >
                              <FontAwesomeIcon
                                icon={restoringId === postId ? faSpinner : faRotateLeft}
                                spin={restoringId === postId}
                              />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className={cx("iconBtn", "danger")}
                              title="Xóa mềm"
                              onClick={() => openDeleteModal(post)}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          )}

          {activeTab === "comments" && (
            <div className={cx("tableWrap")}>
              <table className={cx("postsTable")}>
                <thead>
                  <tr>
                    <th>Bình luận</th>
                    <th>Bài viết</th>
                    <th>Tác giả</th>
                    <th>Ngày tạo / Đã sửa</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {commentRows.map((comment) => {
                    const commentId = getCommentId(comment);
                    const postId = getCommentPostId(comment);
                    const deleted = isDeletedComment(comment);

                    return (
                      <tr key={commentId} className={cx({ deletedRow: deleted })}>
                        <td>
                          <div className={cx("postCell")}>
                            <strong>{stripHtml(comment.content || "Không có nội dung") || "-"}</strong>
                            <span>{(comment.liked || []).length} lượt thích</span>
                          </div>
                        </td>
                        <td>
                          <div className={cx("postCell")}>
                            <strong>{getCommentPostTitle(comment)}</strong>
                            {postId && <span>ID: {postId}</span>}
                          </div>
                        </td>
                        <td>
                          <div className={cx("authorCell")}>
                            <strong>{getCommentAuthorName(comment)}</strong>
                            {getCommentAuthorEmail(comment) && <span>{getCommentAuthorEmail(comment)}</span>}
                          </div>
                        </td>
                        <td>
                          <div className={cx("dateCell")}>
                            <span>{formatDate(comment.createdAt)}</span>
                            {comment.edited_at && <small>Đã sửa {formatDate(comment.edited_at)}</small>}
                          </div>
                        </td>
                        <td>
                          <span className={cx("statusBadge", deleted ? "deleted" : "active")}>
                            {deleted ? "Đã xóa mềm" : "Đang hiển thị"}
                          </span>
                        </td>
                        <td>
                          <div className={cx("tableActions")}>
                            {postId && (
                              <Link
                                className={cx("iconBtn")}
                                to={{ pathname: "/community", search: `?postId=${postId}` }}
                                state={{
                                  fromAdminPosts: true,
                                  returnTo: "/admin/posts",
                                  backLabel: "Quay lại quản lý bài viết",
                                  focusCommentId: commentId,
                                }}
                                title="Xem bình luận"
                              >
                                <FontAwesomeIcon icon={faEye} />
                              </Link>
                            )}
                            <button
                              type="button"
                              className={cx("iconBtn")}
                              title="Chỉnh sửa"
                              onClick={() => openEditCommentModal(comment)}
                            >
                              <FontAwesomeIcon icon={faPen} />
                            </button>
                            {deleted ? (
                              <button
                                type="button"
                                className={cx("iconBtn", "restore")}
                                title="Khôi phục"
                                disabled={restoringCommentId === commentId}
                                onClick={() => openCommentRestoreModal(comment)}
                              >
                                <FontAwesomeIcon
                                  icon={restoringCommentId === commentId ? faSpinner : faRotateLeft}
                                  spin={restoringCommentId === commentId}
                                />
                              </button>
                            ) : (
                              <button
                                type="button"
                                className={cx("iconBtn", "danger")}
                                title="Xóa mềm"
                                onClick={() => openCommentDeleteModal(comment)}
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeLoading && (
            <div className={cx("tableState")}>
              <FontAwesomeIcon icon={faSpinner} spin />
              <span>Đang tải dữ liệu...</span>
            </div>
          )}

          {!activeLoading && (activeError || activeRows.length === 0) && (
            <div className={cx("tableState")}>
              <span>
                {activeError ||
                  (activeTab === "comments"
                    ? "Không tìm thấy bình luận phù hợp."
                    : "Không tìm thấy bài viết phù hợp.")}
              </span>
            </div>
          )}

          <div className={cx("paginationBar")}>
            <span>
              Trang {Math.min(currentPage, activeTotalPage)} / {activeTotalPage}
            </span>
            <div className={cx("pageControls")}>
              <button
                type="button"
                className={cx("pageButton")}
                disabled={currentPage <= 1 || activeLoading}
                onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              <button
                type="button"
                className={cx("pageButton")}
                disabled={currentPage >= activeTotalPage || activeLoading}
                onClick={() => setCurrentPage((page) => Math.min(page + 1, activeTotalPage))}
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
          </div>
        </motion.section>
      </main>

      <AnimatePresence>
        {modalMode && (
          <motion.div
            className={cx("modalBackdrop")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={closeFormModal}
          >
            <motion.form
              className={cx("postModal")}
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.22, ease: easeOut }}
              onMouseDown={(event) => event.stopPropagation()}
              onSubmit={handleSubmitForm}
            >
              <div className={cx("modalHeader")}>
                <div>
                  <h2>{modalMode === "edit" ? "Chỉnh sửa bài viết" : "Tạo bài viết"}</h2>
                  <p>{modalMode === "edit" ? "Cập nhật nội dung bài viết cộng đồng." : "Tạo bài viết mới từ khu vực quản trị."}</p>
                </div>
                <button type="button" className={cx("closeBtn")} onClick={closeFormModal}>
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>

              {formError && <div className={cx("formAlert")}>{formError}</div>}

              <label className={cx("field")}>
                <span>Tiêu đề</span>
                <input
                  value={formState.title}
                  maxLength={120}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder="Nhập tiêu đề bài viết"
                />
              </label>

              <label className={cx("field")}>
                <span>Danh mục</span>
                <select
                  value={formState.categoryId}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, categoryId: event.target.value }))
                  }
                >
                  <option value="">Chọn danh mục</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className={cx("field")}>
                <span>Nội dung</span>
                <textarea
                  rows={8}
                  value={formState.content}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, content: event.target.value }))
                  }
                  placeholder="Nhập nội dung bài viết"
                />
              </label>

              <div className={cx("field")}>
                <span>Ảnh bài viết</span>
                {formState.imagePreview ? (
                  <div className={cx("imagePreview")}>
                    <img src={formState.imagePreview} alt="Ảnh bài viết" />
                    <button type="button" onClick={removeImage}>
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  </div>
                ) : (
                  <label className={cx("imageUpload")}>
                    <input type="file" accept="image/*" onChange={handleImageChange} />
                    <FontAwesomeIcon icon={faImage} />
                    <span>Chọn ảnh</span>
                  </label>
                )}
              </div>

              <div className={cx("modalActions")}>
                <button type="button" className={cx("secondaryBtn")} onClick={closeFormModal} disabled={isSaving}>
                  Hủy
                </button>
                <button type="submit" className={cx("primaryBtn")} disabled={isSaving}>
                  {isSaving && <FontAwesomeIcon icon={faSpinner} spin />}
                  <span>{isSaving ? "Đang lưu..." : "Lưu bài viết"}</span>
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingComment && (
          <motion.div
            className={cx("modalBackdrop")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={closeEditCommentModal}
          >
            <motion.form
              className={cx("postModal")}
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.22, ease: easeOut }}
              onMouseDown={(event) => event.stopPropagation()}
              onSubmit={handleSubmitCommentEdit}
            >
              <div className={cx("modalHeader")}>
                <div>
                  <h2>Chỉnh sửa bình luận</h2>
                  <p>Cập nhật nội dung bình luận trong cộng đồng.</p>
                </div>
                <button type="button" className={cx("closeBtn")} onClick={closeEditCommentModal}>
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>

              {commentError && <div className={cx("formAlert")}>{commentError}</div>}

              <label className={cx("field")}>
                <span>Nội dung bình luận</span>
                <textarea
                  rows={7}
                  value={commentContent}
                  onChange={(event) => setCommentContent(event.target.value)}
                  placeholder="Nhập nội dung bình luận"
                />
              </label>

              <div className={cx("modalActions")}>
                <button
                  type="button"
                  className={cx("secondaryBtn")}
                  onClick={closeEditCommentModal}
                  disabled={isSavingComment}
                >
                  Hủy
                </button>
                <button type="submit" className={cx("primaryBtn")} disabled={isSavingComment}>
                  {isSavingComment && <FontAwesomeIcon icon={faSpinner} spin />}
                  <span>{isSavingComment ? "Đang lưu..." : "Lưu bình luận"}</span>
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {commentDeleteTarget && (
          <motion.div
            className={cx("modalBackdrop")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={closeCommentDeleteModal}
          >
            <motion.div
              className={cx("deleteDialog")}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className={cx("modalHeader")}>
                <div>
                  <h2>Xóa mềm bình luận?</h2>
                  <p>Chọn lý do vi phạm cho bình luận này.</p>
                </div>
                <button type="button" className={cx("closeBtn")} onClick={closeCommentDeleteModal}>
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>

              {!commentDeleteCategory ? (
                <div className={cx("reasonGrid")}>
                  {REPORT_REASONS.map((reason) => (
                    <button
                      key={reason.value}
                      type="button"
                      onClick={() => {
                        setCommentDeleteCategory(reason.value);
                        setCommentDeleteSubcategory("");
                        setCommentDeleteError("");
                      }}
                    >
                      {reason.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className={cx("deleteReasonStep")}>
                  <button
                    type="button"
                    className={cx("backReasonBtn")}
                    onClick={() => {
                      setCommentDeleteCategory("");
                      setCommentDeleteSubcategory("");
                      setCommentDeleteError("");
                    }}
                    disabled={isDeletingComment}
                  >
                    Chọn nhóm lý do khác
                  </button>
                  <div className={cx("selectedReason")}>{selectedCommentDeleteReason?.label}</div>
                  <div className={cx("subReasonList")}>
                    {selectedCommentDeleteReason?.options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={cx({ selected: commentDeleteSubcategory === option })}
                        onClick={() => {
                          setCommentDeleteSubcategory(option);
                          setCommentDeleteError("");
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  <label className={cx("field")}>
                    <span>Mô tả thêm</span>
                    <textarea
                      value={commentDeleteDescription}
                      maxLength={500}
                      rows={4}
                      onChange={(event) => setCommentDeleteDescription(event.target.value)}
                      placeholder="Ghi chú thêm để lưu vào báo cáo xử lý."
                      disabled={isDeletingComment}
                    />
                  </label>
                </div>
              )}

              {commentDeleteError && <div className={cx("formAlert")}>{commentDeleteError}</div>}

              <div className={cx("confirmActions")}>
                <button
                  type="button"
                  className={cx("secondaryBtn")}
                  disabled={isDeletingComment}
                  onClick={closeCommentDeleteModal}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className={cx("dangerBtn")}
                  disabled={isDeletingComment}
                  onClick={confirmCommentSoftDelete}
                >
                  {isDeletingComment ? "Đang xóa..." : "Xóa mềm"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {commentRestoreTarget && (
          <motion.div
            className={cx("modalBackdrop")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={closeCommentRestoreModal}
          >
            <motion.div
              className={cx("confirmDialog")}
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.98 }}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <h2>Khôi phục bình luận?</h2>
              <p>Bình luận này sẽ được hiển thị lại ở trang người dùng.</p>

              {commentRestoreError && <div className={cx("formAlert")}>{commentRestoreError}</div>}

              <div className={cx("confirmActions")}>
                <button
                  type="button"
                  className={cx("secondaryBtn")}
                  disabled={isRestoringComment}
                  onClick={closeCommentRestoreModal}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className={cx("primaryBtn")}
                  disabled={isRestoringComment}
                  onClick={confirmCommentRestore}
                >
                  {isRestoringComment && <FontAwesomeIcon icon={faSpinner} spin />}
                  {!isRestoringComment && <FontAwesomeIcon icon={faRotateLeft} />}
                  <span>{isRestoringComment ? "Đang khôi phục..." : "Khôi phục"}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {restoreTarget && (
          <motion.div
            className={cx("modalBackdrop")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={closeRestoreModal}
          >
            <motion.div
              className={cx("confirmDialog")}
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.98 }}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <h2>Khôi phục bài viết?</h2>
              <p>
                Bài viết <strong>{restoreTarget.title}</strong> sẽ được hiển thị lại ở trang
                người dùng.
              </p>

              {restoreError && <div className={cx("formAlert")}>{restoreError}</div>}

              <div className={cx("confirmActions")}>
                <button
                  type="button"
                  className={cx("secondaryBtn")}
                  disabled={isRestoring}
                  onClick={closeRestoreModal}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className={cx("primaryBtn")}
                  disabled={isRestoring}
                  onClick={confirmRestorePost}
                >
                  {isRestoring && <FontAwesomeIcon icon={faSpinner} spin />}
                  {!isRestoring && <FontAwesomeIcon icon={faRotateLeft} />}
                  <span>{isRestoring ? "Đang khôi phục..." : "Khôi phục"}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            className={cx("modalBackdrop")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={closeDeleteModal}
          >
            <motion.div
              className={cx("deleteDialog")}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className={cx("modalHeader")}>
                <div>
                  <h2>Xóa mềm bài viết?</h2>
                  <p>
                    Chọn lý do vi phạm cho <strong>{deleteTarget.title}</strong>.
                  </p>
                </div>
                <button type="button" className={cx("closeBtn")} onClick={closeDeleteModal}>
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>

              {!deleteCategory ? (
                <div className={cx("reasonGrid")}>
                  {REPORT_REASONS.map((reason) => (
                    <button
                      key={reason.value}
                      type="button"
                      onClick={() => {
                        setDeleteCategory(reason.value);
                        setDeleteSubcategory("");
                        setDeleteError("");
                      }}
                    >
                      {reason.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className={cx("deleteReasonStep")}>
                  <button
                    type="button"
                    className={cx("backReasonBtn")}
                    onClick={() => {
                      setDeleteCategory("");
                      setDeleteSubcategory("");
                      setDeleteError("");
                    }}
                    disabled={isDeleting}
                  >
                    Chọn nhóm lý do khác
                  </button>
                  <div className={cx("selectedReason")}>{selectedDeleteReason?.label}</div>
                  <div className={cx("subReasonList")}>
                    {selectedDeleteReason?.options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={cx({ selected: deleteSubcategory === option })}
                        onClick={() => {
                          setDeleteSubcategory(option);
                          setDeleteError("");
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  <label className={cx("field")}>
                    <span>Mô tả thêm</span>
                    <textarea
                      value={deleteDescription}
                      maxLength={500}
                      rows={4}
                      onChange={(event) => setDeleteDescription(event.target.value)}
                      placeholder="Ghi chú thêm để lưu vào báo cáo xử lý."
                      disabled={isDeleting}
                    />
                  </label>
                </div>
              )}

              {deleteError && <div className={cx("formAlert")}>{deleteError}</div>}

              <div className={cx("confirmActions")}>
                <button type="button" className={cx("secondaryBtn")} disabled={isDeleting} onClick={closeDeleteModal}>
                  Hủy
                </button>
                <button type="button" className={cx("dangerBtn")} disabled={isDeleting} onClick={confirmSoftDelete}>
                  {isDeleting ? "Đang xóa..." : "Xóa mềm"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminPosts;
