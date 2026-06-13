import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  Edit3,
  FolderOpen,
  Hash,
  Loader2,
  MessageSquareText,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import {
  createConversationCategory,
  createConversationLesson,
  deleteConversationCategory,
  deleteConversationLesson,
  getConversationAdminData,
  updateConversationCategory,
  updateConversationLesson,
} from "~/services/conversationService";

const blankCategory = {
  id: "",
  slug: "",
  title: "",
  order: 1,
  isActive: true,
};

const blankLine = {
  order: 1,
  japanese: "",
  kana: "",
  vietnamese: "",
};

const blankLesson = {
  slug: "",
  level: "N5",
  title: "",
  image: "",
  order: 1,
  published: true,
  categoryId: "",
  lines: [{ ...blankLine }],
};

const inputClass =
  "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm outline outline-1 outline-slate-200 transition placeholder:text-slate-400 focus:border-slate-500 focus:outline-slate-500 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

const selectClass =
  "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm outline outline-1 outline-slate-200 transition focus:border-slate-500 focus:outline-slate-500 focus:ring-4 focus:ring-slate-100";

const textareaClass =
  "min-h-[88px] w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium leading-6 text-slate-900 shadow-sm outline outline-1 outline-slate-200 transition placeholder:text-slate-400 focus:border-slate-500 focus:outline-slate-500 focus:ring-4 focus:ring-slate-100";

const secondaryButtonClass =
  "inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";

const primaryButtonClass =
  "inline-flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60";

function slugify(value) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeAdminData(payload) {
  return {
    categories: (payload?.categories || []).map((category) => ({
      ...category,
      id: category.id || category.slug || category._id,
    })),
    lessons: (payload?.lessons || []).map((lesson) => ({
      ...lesson,
      id: lesson.id || lesson._id,
      categoryId: lesson.category?.id || lesson.categoryId || "",
    })),
  };
}

function formatNumber(value) {
  return new Intl.NumberFormat("vi-VN").format(Number(value) || 0);
}

function SummaryCard({ title, value, icon: Icon, tone = "slate" }) {
  const toneClass = {
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    sky: "bg-sky-50 text-sky-700 ring-sky-100",
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
  }[tone];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="m-0 text-xs font-semibold uppercase tracking-normal text-slate-500">
            {title}
          </p>
          <p className="m-0 mt-2 text-xl font-bold text-slate-950 [font-variant-numeric:tabular-nums]">
            {formatNumber(value)}
          </p>
        </div>
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ring-1 ring-inset ${toneClass}`}
        >
          <Icon size={19} aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`grid gap-2 ${className}`}>
      <span className="text-xs font-bold uppercase tracking-normal text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function AdminConversation() {
  const [categories, setCategories] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [categoryForm, setCategoryForm] = useState(null);
  const [lessonForm, setLessonForm] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const nextCategoryOrder = useMemo(() => {
    return (
      categories.reduce((max, category) => {
        return Math.max(max, Number(category.order) || 0);
      }, 0) + 1
    );
  }, [categories]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = normalizeAdminData(await getConversationAdminData());
      setCategories(data.categories);
      setLessons(data.lessons);
    } catch (error) {
      console.error("Load conversation admin error:", error);
      setToast({ type: "error", message: "Không tải được dữ liệu hội thoại." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const categoryMap = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category]));
  }, [categories]);

  const lessonCountByCategory = useMemo(() => {
    return lessons.reduce((result, lesson) => {
      const categoryId = lesson.category?.id || lesson.categoryId;
      if (!categoryId) return result;
      result.set(categoryId, (result.get(categoryId) || 0) + 1);
      return result;
    }, new Map());
  }, [lessons]);

  const filteredLessons = lessons.filter((lesson) => {
    const q = searchQuery.trim().toLowerCase();
    const matchSearch =
      !q ||
      lesson.title?.toLowerCase().includes(q) ||
      lesson.slug?.toLowerCase().includes(q);
    const matchCategory =
      categoryFilter === "all" ||
      lesson.category?.id === categoryFilter ||
      lesson.categoryId === categoryFilter;

    return matchSearch && matchCategory;
  });

  const publishedCount = lessons.filter((lesson) => lesson.published).length;
  const activeCategoryCount = categories.filter((category) => category.isActive).length;

  const handleCategoryChange = (field, value) => {
    setCategoryForm((current) => ({ ...current, [field]: value }));
  };

  const handleLessonChange = (field, value) => {
    setLessonForm((current) => ({ ...current, [field]: value }));
  };

  const handleLineChange = (index, field, value) => {
    setLessonForm((current) => {
      const lines = [...(current.lines || [])];
      lines[index] = { ...lines[index], [field]: value };
      return { ...current, lines };
    });
  };

  const addLine = () => {
    setLessonForm((current) => ({
      ...current,
      lines: [
        ...(current.lines || []),
        { ...blankLine, order: (current.lines || []).length + 1 },
      ],
    }));
  };

  const removeLine = (index) => {
    setLessonForm((current) => ({
      ...current,
      lines: (current.lines || [])
        .filter((_, lineIndex) => lineIndex !== index)
        .map((line, lineIndex) => ({ ...line, order: lineIndex + 1 })),
    }));
  };

  const saveCategory = async () => {
    if (!categoryForm?.title?.trim() || !categoryForm?.id?.trim()) {
      setToast({ type: "error", message: "Vui lòng nhập tên và mã chủ đề." });
      return;
    }

    const stableId = slugify(categoryForm.id);

    const payload = {
      id: stableId,
      slug: stableId,
      title: categoryForm.title.trim(),
      order: Number(categoryForm.order) || nextCategoryOrder,
      isActive: Boolean(categoryForm.isActive),
    };

    try {
      if (categoryForm._id) {
        await updateConversationCategory(categoryForm._id, payload);
      } else {
        await createConversationCategory(payload);
      }
      setCategoryForm(null);
      setToast({ type: "success", message: "Đã lưu chủ đề hội thoại." });
      loadData();
    } catch (error) {
      console.error("Save category error:", error);
      setToast({ type: "error", message: "Lưu chủ đề thất bại." });
    }
  };

  const saveLesson = async () => {
    const category = categoryMap.get(lessonForm?.categoryId);
    if (!lessonForm?.title?.trim() || !lessonForm?.slug?.trim() || !category) {
      setToast({
        type: "error",
        message: "Vui lòng nhập tiêu đề, slug và chọn chủ đề.",
      });
      return;
    }

    const payload = {
      category: {
        id: category.id,
        title: category.title,
        order: Number(category.order) || 0,
      },
      slug: lessonForm.slug.trim(),
      level: lessonForm.level,
      title: lessonForm.title.trim(),
      image: lessonForm.image || "",
      order: Number(lessonForm.order) || 0,
      published: Boolean(lessonForm.published),
      lines: (lessonForm.lines || [])
        .filter((line) => line.japanese || line.kana || line.vietnamese)
        .map((line, index) => ({
          order: index + 1,
          japanese: line.japanese || "",
          kana: line.kana || "",
          vietnamese: line.vietnamese || "",
        })),
    };

    try {
      if (lessonForm.id) {
        await updateConversationLesson(lessonForm.id, payload);
      } else {
        await createConversationLesson(payload);
      }
      setLessonForm(null);
      setToast({ type: "success", message: "Đã lưu bài hội thoại." });
      loadData();
    } catch (error) {
      console.error("Save lesson error:", error);
      setToast({ type: "error", message: "Lưu bài hội thoại thất bại." });
    }
  };

  const handleDeleteCategory = async (category) => {
    if (!window.confirm(`Xóa chủ đề "${category.title}"?`)) return;
    try {
      await deleteConversationCategory(category._id);
      setToast({ type: "success", message: "Đã xóa chủ đề." });
      loadData();
    } catch (error) {
      console.error("Delete category error:", error);
      setToast({ type: "error", message: "Xóa chủ đề thất bại." });
    }
  };

  const handleDeleteLesson = async (lesson) => {
    if (!window.confirm(`Xóa bài "${lesson.title}"?`)) return;
    try {
      await deleteConversationLesson(lesson.id);
      setToast({ type: "success", message: "Đã xóa bài hội thoại." });
      loadData();
    } catch (error) {
      console.error("Delete lesson error:", error);
      setToast({ type: "error", message: "Xóa bài thất bại." });
    }
  };

  const startCreateCategory = () => {
    setCategoryForm({ ...blankCategory, order: nextCategoryOrder });
  };

  const startCreateLesson = () => {
    setLessonForm({
      ...blankLesson,
      categoryId: categories[0]?.id || "",
      order: lessons.length + 1,
    });
  };

  const startEditLesson = (lesson) => {
    setLessonForm({
      ...lesson,
      categoryId: lesson.category?.id || lesson.categoryId || "",
      lines: lesson.lines?.length ? lesson.lines : [{ ...blankLine }],
    });
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#f7f8fb] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="m-0 text-[28px] font-extrabold leading-[1.2] text-[#0f172a]">
              Nội dung luyện hội thoại
            </h1>
            <p className="m-0 mt-2 text-sm font-medium text-slate-500">
              Tổng cộng{" "}
              <strong className="font-bold text-slate-700">
                {formatNumber(categories.length)}
              </strong>{" "}
              chủ đề ·{" "}
              <strong className="font-bold text-slate-700">
                {formatNumber(lessons.length)}
              </strong>{" "}
              bài hội thoại
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className={secondaryButtonClass}
            >
              <RefreshCw
                size={16}
                aria-hidden="true"
                className={loading ? "animate-spin" : ""}
              />
              Làm mới
            </button>
            <button
              type="button"
              onClick={startCreateCategory}
              className={secondaryButtonClass}
            >
              <Plus size={16} aria-hidden="true" />
              Chủ đề
            </button>
            <button
              type="button"
              onClick={startCreateLesson}
              className={primaryButtonClass}
            >
              <Plus size={16} aria-hidden="true" />
              Thêm bài
            </button>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Chủ đề"
            value={categories.length}
            icon={FolderOpen}
            tone="sky"
          />
          <SummaryCard
            title="Đang hiển thị"
            value={activeCategoryCount}
            icon={Check}
            tone="emerald"
          />
          <SummaryCard title="Bài học" value={lessons.length} icon={BookOpen} />
          <SummaryCard
            title="Công khai"
            value={publishedCount}
            icon={MessageSquareText}
            tone="amber"
          />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_240px]">
            <label className="relative block">
              <span className="sr-only">Tìm kiếm bài hội thoại</span>
              <Search
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Tìm theo tiêu đề hoặc slug..."
                className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm font-medium text-slate-900 shadow-sm outline outline-1 outline-slate-200 transition placeholder:text-slate-400 focus:border-slate-500 focus:outline-slate-500 focus:ring-4 focus:ring-slate-100"
              />
            </label>

            <label>
              <span className="sr-only">Lọc chủ đề</span>
              <select
                className={selectClass}
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="all">Tất cả chủ đề</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4">
              <div>
                <h2 className="m-0 text-base font-bold text-slate-950">Chủ đề</h2>
                <p className="m-0 mt-1 text-sm font-medium text-slate-500">
                  {formatNumber(categories.length)} mục
                </p>
              </div>
              <button
                type="button"
                onClick={startCreateCategory}
                className="inline-grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                aria-label="Thêm chủ đề"
                title="Thêm chủ đề"
              >
                <Plus size={17} aria-hidden="true" />
              </button>
            </div>

            {categoryForm && (
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-4">
                <div className="grid gap-3">
                  <Field label="Tên chủ đề">
                    <input
                      value={categoryForm.title}
                      onChange={(event) =>
                        handleCategoryChange("title", event.target.value)
                      }
                      placeholder="Ví dụ: Chào hỏi"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Mã chủ đề">
                    <input
                      value={categoryForm.id}
                      onChange={(event) => handleCategoryChange("id", event.target.value)}
                      placeholder="Ví dụ: greeting"
                      className={inputClass}
                      disabled={Boolean(categoryForm._id)}
                    />
                    {categoryForm._id && (
                      <p className="m-0 text-xs font-medium leading-5 text-slate-500">
                        Mã chủ đề được khóa khi chỉnh sửa để giữ liên kết với bài hội thoại.
                      </p>
                    )}
                  </Field>

                  <Field label="Thứ tự">
                    <input
                      type="number"
                      value={categoryForm.order}
                      onChange={(event) =>
                        handleCategoryChange("order", event.target.value)
                      }
                      className={inputClass}
                    />
                  </Field>

                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(categoryForm.isActive)}
                      onChange={(event) =>
                        handleCategoryChange("isActive", event.target.checked)
                      }
                      className="h-4 w-4 rounded border-slate-300 accent-slate-950"
                    />
                    Đang hiển thị
                  </label>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setCategoryForm(null)}
                      className={secondaryButtonClass}
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={saveCategory}
                      className={primaryButtonClass}
                    >
                      Lưu
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-2 p-4">
              {loading && categories.length === 0 ? (
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-4 text-sm font-semibold text-slate-500">
                  <Loader2 size={17} className="animate-spin" aria-hidden="true" />
                  Đang tải chủ đề...
                </div>
              ) : categories.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-6 text-center text-sm font-semibold text-slate-500">
                  Chưa có chủ đề hội thoại.
                </div>
              ) : (
                categories.map((category) => (
                  <div
                    key={category._id || category.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3 transition hover:border-slate-300 hover:bg-white"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-2">
                          <strong className="truncate text-sm font-bold text-slate-950">
                            {category.title}
                          </strong>
                          {!category.isActive && (
                            <span className="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                              Ẩn
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                          <span className="inline-flex min-w-0 items-center gap-1">
                            <Hash size={12} aria-hidden="true" />
                            <span className="truncate">{category.id}</span>
                          </span>
                          <span>{formatNumber(lessonCountByCategory.get(category.id))} bài</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setCategoryForm(category)}
                          className="inline-grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                          aria-label="Sửa chủ đề"
                          title="Sửa"
                        >
                          <Edit3 size={15} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(category)}
                          className="inline-grid h-8 w-8 place-items-center rounded-lg border border-rose-100 bg-white text-rose-600 transition hover:bg-rose-50"
                          aria-label="Xóa chủ đề"
                          title="Xóa"
                        >
                          <Trash2 size={15} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>

          <div className="flex min-w-0 flex-col gap-5">
            {lessonForm && (
              <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-4">
                  <div>
                    <h2 className="m-0 text-base font-bold text-slate-950">
                      {lessonForm.id ? "Chỉnh sửa bài hội thoại" : "Thêm bài hội thoại"}
                    </h2>
                    <p className="m-0 mt-1 text-sm font-medium text-slate-500">
                      Nội dung hiển thị ở trang luyện hội thoại.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLessonForm(null)}
                    className="inline-grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                    aria-label="Đóng form"
                    title="Đóng"
                  >
                    <X size={18} aria-hidden="true" />
                  </button>
                </div>

                <div className="grid gap-4 px-4 py-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Chủ đề">
                      <select
                        className={selectClass}
                        value={lessonForm.categoryId}
                        onChange={(event) =>
                          handleLessonChange("categoryId", event.target.value)
                        }
                      >
                        <option value="">Chọn chủ đề</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.title}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Level">
                      <select
                        className={selectClass}
                        value={lessonForm.level}
                        onChange={(event) => handleLessonChange("level", event.target.value)}
                      >
                        {["N5", "N4", "N3", "N2", "N1"].map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Tiêu đề">
                      <input
                        value={lessonForm.title}
                        onChange={(event) => handleLessonChange("title", event.target.value)}
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Slug">
                      <input
                        value={lessonForm.slug}
                        onChange={(event) => handleLessonChange("slug", event.target.value)}
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Ảnh" className="md:col-span-2">
                      <input
                        value={lessonForm.image}
                        onChange={(event) => handleLessonChange("image", event.target.value)}
                        className={inputClass}
                        placeholder="https://..."
                      />
                    </Field>

                    <Field label="Thứ tự">
                      <input
                        type="number"
                        value={lessonForm.order}
                        onChange={(event) => handleLessonChange("order", event.target.value)}
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Trạng thái">
                      <label className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={Boolean(lessonForm.published)}
                          onChange={(event) =>
                            handleLessonChange("published", event.target.checked)
                          }
                          className="h-4 w-4 rounded border-slate-300 accent-slate-950"
                        />
                        Công khai
                      </label>
                    </Field>
                  </div>

                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="m-0 text-base font-bold text-slate-950">
                          Câu hội thoại
                        </h3>
                        <p className="m-0 mt-1 text-sm font-medium text-slate-500">
                          {formatNumber((lessonForm.lines || []).length)} câu
                        </p>
                      </div>
                      <button type="button" className={secondaryButtonClass} onClick={addLine}>
                        <Plus size={16} aria-hidden="true" />
                        Thêm câu
                      </button>
                    </div>

                    <div className="mt-3 grid gap-3">
                      {(lessonForm.lines || []).map((line, index) => (
                        <div
                          className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                          key={index}
                        >
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-slate-950 px-2 text-sm font-bold text-white">
                              {index + 1}
                            </span>
                            <button
                              type="button"
                              className="inline-grid h-8 w-8 place-items-center rounded-lg border border-rose-100 bg-white text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                              onClick={() => removeLine(index)}
                              disabled={(lessonForm.lines || []).length <= 1}
                              aria-label="Xóa câu"
                              title="Xóa câu"
                            >
                              <Trash2 size={15} aria-hidden="true" />
                            </button>
                          </div>

                          <div className="grid gap-3 lg:grid-cols-3">
                            <textarea
                              value={line.japanese}
                              onChange={(event) =>
                                handleLineChange(index, "japanese", event.target.value)
                              }
                              placeholder="Tiếng Nhật"
                              className={textareaClass}
                            />
                            <textarea
                              value={line.kana}
                              onChange={(event) =>
                                handleLineChange(index, "kana", event.target.value)
                              }
                              placeholder="Kana"
                              className={textareaClass}
                            />
                            <textarea
                              value={line.vietnamese}
                              onChange={(event) =>
                                handleLineChange(index, "vietnamese", event.target.value)
                              }
                              placeholder="Nghĩa tiếng Việt"
                              className={textareaClass}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                    <button
                      type="button"
                      onClick={() => setLessonForm(null)}
                      className={secondaryButtonClass}
                    >
                      Hủy
                    </button>
                    <button type="button" onClick={saveLesson} className={primaryButtonClass}>
                      Lưu bài hội thoại
                    </button>
                  </div>
                </div>
              </section>
            )}

            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-1 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="m-0 text-base font-bold text-slate-950">
                    Danh sách bài hội thoại
                  </h2>
                  <p className="m-0 mt-1 text-sm font-medium text-slate-500">
                    Hiển thị {formatNumber(filteredLessons.length)} trên{" "}
                    {formatNumber(lessons.length)}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] table-fixed border-collapse">
                  <colgroup>
                    <col className="w-[360px]" />
                    <col className="w-[190px]" />
                    <col className="w-[90px]" />
                    <col className="w-[100px]" />
                    <col className="w-[130px]" />
                    <col className="w-[100px]" />
                  </colgroup>
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-normal text-slate-500">
                        Bài học
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-normal text-slate-500">
                        Chủ đề
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-normal text-slate-500">
                        Level
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-normal text-slate-500">
                        Câu
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-normal text-slate-500">
                        Trạng thái
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-normal text-slate-500">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading && (
                      <tr>
                        <td colSpan={6} className="px-4 py-14 text-center">
                          <div className="inline-flex items-center gap-3 text-sm font-semibold text-slate-500">
                            <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                            Đang tải dữ liệu...
                          </div>
                        </td>
                      </tr>
                    )}

                    {!loading &&
                      filteredLessons.map((lesson) => (
                        <tr key={lesson.id} className="transition hover:bg-slate-50">
                          <td className="px-4 py-4 align-middle">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="grid h-12 w-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200">
                                {lesson.image ? (
                                  <img
                                    src={lesson.image}
                                    alt={lesson.title}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <MessageSquareText size={20} aria-hidden="true" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <h3 className="m-0 truncate text-sm font-bold text-slate-950">
                                  {lesson.title}
                                </h3>
                                <p className="m-0 mt-1 truncate font-mono text-xs font-semibold text-slate-500">
                                  {lesson.slug}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 align-middle">
                            <span className="inline-flex max-w-full items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                              <span className="truncate">
                                {lesson.category?.title || "Chưa có chủ đề"}
                              </span>
                            </span>
                          </td>
                          <td className="px-4 py-4 align-middle">
                            <span className="inline-flex min-h-7 items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700 ring-1 ring-inset ring-sky-100">
                              {lesson.level}
                            </span>
                          </td>
                          <td className="px-4 py-4 align-middle text-sm font-bold text-slate-700">
                            {formatNumber(lesson.lines?.length)}
                          </td>
                          <td className="px-4 py-4 align-middle">
                            {lesson.published ? (
                              <span className="inline-flex min-h-7 items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-100">
                                <Check size={14} aria-hidden="true" />
                                Công khai
                              </span>
                            ) : (
                              <span className="inline-flex min-h-7 items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-inset ring-slate-200">
                                Nháp
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right align-middle">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => startEditLesson(lesson)}
                                className="inline-grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                                aria-label="Sửa bài hội thoại"
                                title="Sửa"
                              >
                                <Edit3 size={16} aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteLesson(lesson)}
                                className="inline-grid h-9 w-9 place-items-center rounded-lg border border-rose-100 bg-white text-rose-600 shadow-sm transition hover:bg-rose-50"
                                aria-label="Xóa bài hội thoại"
                                title="Xóa"
                              >
                                <Trash2 size={16} aria-hidden="true" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                    {!loading && filteredLessons.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-14 text-center">
                          <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-slate-500">
                            <MessageSquareText size={34} aria-hidden="true" />
                            <p className="m-0 text-sm font-semibold">
                              Không có bài hội thoại phù hợp.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </section>
      </div>

      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-[10000] flex max-w-sm items-start gap-3 rounded-lg border px-4 py-3 text-sm font-semibold shadow-lg ${
            toast.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-white text-emerald-700"
          }`}
        >
          <span className="min-w-0 flex-1">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="inline-grid h-6 w-6 shrink-0 place-items-center rounded-md text-current transition hover:bg-black/5"
            aria-label="Đóng thông báo"
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminConversation;
