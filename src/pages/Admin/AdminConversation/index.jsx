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

const blankLine = { order: 1, japanese: "", kana: "", vietnamese: "" };
const blankVocab = { order: 1, word: "", furigana: "", meaning: "" };
const blankGrammar = { order: 1, title: "", meaning: "", example: "", exampleMeaning: "" };

const blankLesson = {
  slug: "",
  level: "N5",
  title: "",
  image: "",
  description: "",
  order: 1,
  published: true,
  categoryId: "",
  lines: [{ ...blankLine }],
  vocabulary: [],
  grammar: [],
};

const LESSON_TABS = [
  { key: "info", label: "Thông tin" },
  { key: "lines", label: "Hội thoại" },
  { key: "vocabulary", label: "Từ vựng" },
  { key: "grammar", label: "Ngữ pháp" },
];

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
    categories: (payload?.categories || []).map((cat) => ({
      ...cat,
      id: cat.id || cat.slug || cat._id,
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

/* ========== SHARED COMPONENTS ========== */

function Modal({ open, onClose, title, subtitle, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-[10vh]">
      <div className="w-full max-w-3xl rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="m-0 text-lg font-bold text-slate-950">{title}</h2>
            {subtitle && <p className="m-0 mt-1 text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">{footer}</div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`grid gap-1.5 ${className}`}>
      <span className="text-xs font-bold uppercase text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function SummaryCard({ title, value, icon: Icon, tone = "slate" }) {
  const toneClasses = {
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    sky: "bg-sky-50 text-sky-700 ring-sky-100",
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
  };
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="m-0 text-xs font-semibold uppercase text-slate-500">{title}</p>
          <p className="m-0 mt-2 text-xl font-bold text-slate-950 [font-variant-numeric:tabular-nums]">
            {formatNumber(value)}
          </p>
        </div>
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ring-1 ring-inset ${toneClasses[tone]}`}>
          <Icon size={19} />
        </span>
      </div>
    </div>
  );
}

function Toast({ toast, onClose }) {
  if (!toast) return null;
  return (
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
        onClick={onClose}
        className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-current hover:bg-black/5"
      >
        <X size={15} />
      </button>
    </div>
  );
}

/* ========== MAIN COMPONENT ========== */

function AdminConversation() {
  const [categories, setCategories] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  // modals
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);

  const [categoryForm, setCategoryForm] = useState(null);
  const [lessonForm, setLessonForm] = useState(null);
  const [lessonTab, setLessonTab] = useState("info");

  const nextCategoryOrder = useMemo(
    () => categories.reduce((max, c) => Math.max(max, Number(c.order) || 0), 0) + 1,
    [categories],
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const data = normalizeAdminData(await getConversationAdminData());
      setCategories(data.categories);
      setLessons(data.lessons);
    } catch {
      setToast({ type: "error", message: "Không tải được dữ liệu." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const lessonCountByCategory = useMemo(
    () =>
      lessons.reduce((acc, l) => {
        const cid = l.category?.id || l.categoryId;
        if (cid) acc.set(cid, (acc.get(cid) || 0) + 1);
        return acc;
      }, new Map()),
    [lessons],
  );

  const filteredLessons = lessons.filter((l) => {
    const q = searchQuery.trim().toLowerCase();
    return (
      (!q || l.title?.toLowerCase().includes(q) || l.slug?.toLowerCase().includes(q)) &&
      (categoryFilter === "all" || l.category?.id === categoryFilter || l.categoryId === categoryFilter)
    );
  });

  const publishedCount = lessons.filter((l) => l.published).length;
  const activeCategoryCount = categories.filter((c) => c.isActive).length;

  /* ====== category handlers ====== */
  const openCategoryModal = (cat) => {
    if (cat) {
      setEditingCategory(cat);
      setCategoryForm({ id: cat.id, title: cat.title, order: cat.order, isActive: !!cat.isActive });
    } else {
      setEditingCategory(null);
      setCategoryForm({ ...blankCategory, order: nextCategoryOrder });
    }
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
      isActive: !!categoryForm.isActive,
    };
    try {
      if (editingCategory?._id) {
        await updateConversationCategory(editingCategory._id, payload);
      } else {
        await createConversationCategory(payload);
      }
      setCategoryForm(null);
      setEditingCategory(null);
      setToast({ type: "success", message: "Đã lưu chủ đề." });
      loadData();
    } catch {
      setToast({ type: "error", message: "Lưu chủ đề thất bại." });
    }
  };

  const deleteCategory = async (cat) => {
    if (!window.confirm(`Xóa chủ đề "${cat.title}"?`)) return;
    try {
      await deleteConversationCategory(cat._id);
      setToast({ type: "success", message: "Đã xóa chủ đề." });
      loadData();
    } catch {
      setToast({ type: "error", message: "Xóa chủ đề thất bại." });
    }
  };

  /* ====== lesson handlers ====== */
  const openLessonModal = (lesson) => {
    if (lesson) {
      setEditingLesson(lesson);
      setLessonForm({
        ...lesson,
        description: lesson.description || "",
        categoryId: lesson.category?.id || lesson.categoryId || "",
        lines: lesson.lines?.length ? lesson.lines : [{ ...blankLine }],
        vocabulary: lesson.vocabulary || [],
        grammar: lesson.grammar || [],
      });
    } else {
      setEditingLesson(null);
      setLessonForm({
        ...blankLesson,
        categoryId: categories[0]?.id || "",
        order: lessons.length + 1,
      });
    }
    setLessonTab("info");
  };

  const setLessonField = (field, value) => setLessonForm((cur) => ({ ...cur, [field]: value }));

  // lines
  const setLine = (i, field, value) =>
    setLessonForm((cur) => {
      const lines = [...cur.lines];
      lines[i] = { ...lines[i], [field]: value };
      return { ...cur, lines };
    });
  const addLine = () =>
    setLessonForm((cur) => ({
      ...cur,
      lines: [...cur.lines, { ...blankLine, order: cur.lines.length + 1 }],
    }));
  const removeLine = (i) =>
    setLessonForm((cur) => ({
      ...cur,
      lines: cur.lines.filter((_, idx) => idx !== i).map((l, idx) => ({ ...l, order: idx + 1 })),
    }));

  // vocab
  const setVocab = (i, field, value) =>
    setLessonForm((cur) => {
      const arr = [...cur.vocabulary];
      arr[i] = { ...arr[i], [field]: value };
      return { ...cur, vocabulary: arr };
    });
  const addVocab = () =>
    setLessonForm((cur) => ({
      ...cur,
      vocabulary: [...cur.vocabulary, { ...blankVocab, order: cur.vocabulary.length + 1 }],
    }));
  const removeVocab = (i) =>
    setLessonForm((cur) => ({
      ...cur,
      vocabulary: cur.vocabulary.filter((_, idx) => idx !== i).map((v, idx) => ({ ...v, order: idx + 1 })),
    }));

  // grammar
  const setGrammar = (i, field, value) =>
    setLessonForm((cur) => {
      const arr = [...cur.grammar];
      arr[i] = { ...arr[i], [field]: value };
      return { ...cur, grammar: arr };
    });
  const addGrammar = () =>
    setLessonForm((cur) => ({
      ...cur,
      grammar: [...cur.grammar, { ...blankGrammar, order: cur.grammar.length + 1 }],
    }));
  const removeGrammar = (i) =>
    setLessonForm((cur) => ({
      ...cur,
      grammar: cur.grammar.filter((_, idx) => idx !== i).map((g, idx) => ({ ...g, order: idx + 1 })),
    }));

  const saveLesson = async () => {
    const cat = categoryMap.get(lessonForm?.categoryId);
    if (!lessonForm?.title?.trim() || !lessonForm?.slug?.trim() || !cat) {
      setToast({ type: "error", message: "Vui lòng nhập tiêu đề, slug và chọn chủ đề." });
      return;
    }
    const payload = {
      category: { id: cat.id, title: cat.title, order: Number(cat.order) || 0 },
      slug: lessonForm.slug.trim(),
      level: lessonForm.level,
      title: lessonForm.title.trim(),
      image: lessonForm.image || "",
      description: lessonForm.description || "",
      order: Number(lessonForm.order) || 0,
      published: !!lessonForm.published,
      lines: lessonForm.lines
        .filter((l) => l.japanese || l.kana || l.vietnamese)
        .map((l, i) => ({ order: i + 1, japanese: l.japanese || "", kana: l.kana || "", vietnamese: l.vietnamese || "" })),
      vocabulary: lessonForm.vocabulary
        .filter((v) => v.word || v.furigana || v.meaning)
        .map((v, i) => ({ order: i + 1, word: v.word || "", furigana: v.furigana || "", meaning: v.meaning || "" })),
      grammar: lessonForm.grammar
        .filter((g) => g.title || g.meaning || g.example)
        .map((g, i) => ({ order: i + 1, title: g.title || "", meaning: g.meaning || "", example: g.example || "", exampleMeaning: g.exampleMeaning || "" })),
    };
    try {
      if (editingLesson?.id) {
        await updateConversationLesson(editingLesson.id, payload);
      } else {
        await createConversationLesson(payload);
      }
      setLessonForm(null);
      setEditingLesson(null);
      setToast({ type: "success", message: "Đã lưu bài hội thoại." });
      loadData();
    } catch {
      setToast({ type: "error", message: "Lưu bài hội thoại thất bại." });
    }
  };

  const deleteLesson = async (lesson) => {
    if (!window.confirm(`Xóa bài "${lesson.title}"?`)) return;
    try {
      await deleteConversationLesson(lesson.id);
      setToast({ type: "success", message: "Đã xóa bài hội thoại." });
      loadData();
    } catch {
      setToast({ type: "error", message: "Xóa bài thất bại." });
    }
  };

  /* ====== input styles ====== */
  const inputC =
    "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm outline outline-1 outline-slate-200 placeholder:text-slate-400 focus:border-slate-500 focus:outline-slate-500 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-50 disabled:text-slate-500";
  const selectC =
    "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm outline outline-1 outline-slate-200 focus:border-slate-500 focus:outline-slate-500 focus:ring-4 focus:ring-slate-100";
  const textareaC =
    "min-h-[80px] w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium leading-6 text-slate-900 shadow-sm outline outline-1 outline-slate-200 placeholder:text-slate-400 focus:border-slate-500 focus:outline-slate-500 focus:ring-4 focus:ring-slate-100";
  const btn2 =
    "inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60";
  const btn1 =
    "inline-flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60";

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#f7f8fb] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        {/* Header */}
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="m-0 text-[28px] font-extrabold text-[#0f172a]">Nội dung luyện hội thoại</h1>
            <p className="m-0 mt-2 text-sm font-medium text-slate-500">
              <strong className="text-slate-700">{formatNumber(categories.length)}</strong> chủ đề ·{" "}
              <strong className="text-slate-700">{formatNumber(lessons.length)}</strong> bài hội thoại
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={loadData} disabled={loading} className={btn2}>
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Làm mới
            </button>
            <button type="button" onClick={() => openCategoryModal(null)} className={btn2}>
              <Plus size={16} /> Chủ đề
            </button>
            <button type="button" onClick={() => openLessonModal(null)} className={btn1}>
              <Plus size={16} /> Thêm bài
            </button>
          </div>
        </section>

        {/* Summary */}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="Chủ đề" value={categories.length} icon={FolderOpen} tone="sky" />
          <SummaryCard title="Đang hiển thị" value={activeCategoryCount} icon={Check} tone="emerald" />
          <SummaryCard title="Bài học" value={lessons.length} icon={BookOpen} />
          <SummaryCard title="Công khai" value={publishedCount} icon={MessageSquareText} tone="amber" />
        </section>

        {/* Search + Filter */}
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_240px]">
            <label className="relative block">
              <span className="sr-only">Tìm kiếm</span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tiêu đề hoặc slug..."
                className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm font-medium text-slate-900 shadow-sm outline outline-1 outline-slate-200 placeholder:text-slate-400 focus:border-slate-500 focus:outline-slate-500 focus:ring-4 focus:ring-slate-100"
              />
            </label>
            <label>
              <span className="sr-only">Lọc chủ đề</span>
              <select className={selectC} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="all">Tất cả chủ đề</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {/* Main content */}
        <section className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
          {/* Category sidebar */}
          <aside className="self-start rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
              <div>
                <h2 className="m-0 text-base font-bold text-slate-950">Chủ đề</h2>
                <p className="m-0 mt-1 text-sm font-medium text-slate-500">{formatNumber(categories.length)} mục</p>
              </div>
              <button
                type="button"
                onClick={() => openCategoryModal(null)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              >
                <Plus size={17} />
              </button>
            </div>
            <div className="grid gap-2 p-4">
              {loading && !categories.length ? (
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-4 text-sm font-semibold text-slate-500">
                  <Loader2 size={17} className="animate-spin" /> Đang tải...
                </div>
              ) : !categories.length ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-6 text-center text-sm font-semibold text-slate-500">
                  Chưa có chủ đề.
                </div>
              ) : (
                categories.map((c) => (
                  <div key={c._id || c.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 hover:border-slate-300 hover:bg-white">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <strong className="truncate text-sm font-bold text-slate-950">{c.title}</strong>
                          {!c.isActive && (
                            <span className="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-600">Ẩn</span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-500">
                          <span className="flex items-center gap-1"><Hash size={12} /><span className="truncate">{c.id}</span></span>
                          <span>{formatNumber(lessonCountByCategory.get(c.id))} bài</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openCategoryModal(c)}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        ><Edit3 size={15} /></button>
                        <button
                          type="button"
                          onClick={() => deleteCategory(c)}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-rose-100 bg-white text-rose-600 hover:bg-rose-50"
                        ><Trash2 size={15} /></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>

          {/* Lesson table */}
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
              <div>
                <h2 className="m-0 text-base font-bold text-slate-950">Danh sách bài hội thoại</h2>
                <p className="m-0 mt-1 text-sm text-slate-500">Hiển thị {formatNumber(filteredLessons.length)} trên {formatNumber(lessons.length)}</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] table-fixed border-collapse">
                <colgroup>
                  <col className="w-[360px]" /><col className="w-[190px]" /><col className="w-[90px]" />
                  <col className="w-[100px]" /><col className="w-[130px]" /><col className="w-[100px]" />
                </colgroup>
                <thead className="bg-slate-50">
                  <tr>
                    {["Bài học", "Chủ đề", "Level", "Câu", "Trạng thái", "Hành động"].map((h, i) => (
                      <th key={h} className={`px-4 py-3 text-xs font-bold uppercase text-slate-500 ${i === 5 ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading && (
                    <tr><td colSpan={6} className="px-4 py-14 text-center">
                      <span className="inline-flex items-center gap-3 text-sm font-semibold text-slate-500"><Loader2 size={18} className="animate-spin" />Đang tải...</span>
                    </td></tr>
                  )}
                  {!loading && filteredLessons.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="grid h-12 w-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200">
                            {l.image ? <img src={l.image} alt={l.title} className="h-full w-full object-cover" /> : <MessageSquareText size={20} />}
                          </div>
                          <div className="min-w-0">
                            <h3 className="m-0 truncate text-sm font-bold text-slate-950">{l.title}</h3>
                            <p className="m-0 mt-1 truncate font-mono text-xs font-semibold text-slate-500">{l.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex max-w-full items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                          <span className="truncate">{l.category?.title || "Chưa có chủ đề"}</span>
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex min-h-7 items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700 ring-1 ring-inset ring-sky-100">{l.level}</span>
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-slate-700">{formatNumber(l.lines?.length)}</td>
                      <td className="px-4 py-4">
                        {l.published ? (
                          <span className="inline-flex min-h-7 items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-100"><Check size={14} />Công khai</span>
                        ) : (
                          <span className="inline-flex min-h-7 items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-inset ring-slate-200">Nháp</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button type="button" onClick={() => openLessonModal(l)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50"><Edit3 size={16} /></button>
                          <button type="button" onClick={() => deleteLesson(l)} className="grid h-9 w-9 place-items-center rounded-lg border border-rose-100 bg-white text-rose-600 shadow-sm hover:bg-rose-50"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loading && !filteredLessons.length && (
                    <tr><td colSpan={6} className="px-4 py-14 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-slate-500">
                        <MessageSquareText size={34} />
                        <p className="m-0 text-sm font-semibold">Không có bài hội thoại phù hợp.</p>
                      </div>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {/* ======== CATEGORY MODAL ======== */}
      <Modal
        open={!!categoryForm}
        onClose={() => { setCategoryForm(null); setEditingCategory(null); }}
        title={editingCategory ? "Sửa chủ đề" : "Thêm chủ đề"}
        subtitle="Chủ đề dùng để nhóm các bài hội thoại."
        footer={
          <>
            <button type="button" onClick={() => { setCategoryForm(null); setEditingCategory(null); }} className={btn2}>Hủy</button>
            <button type="button" onClick={saveCategory} className={btn1}>Lưu</button>
          </>
        }
      >
        <div className="grid gap-4">
          <Field label="Tên chủ đề">
            <input value={categoryForm?.title || ""} onChange={(e) => setCategoryForm((c) => ({ ...c, title: e.target.value }))} placeholder="Ví dụ: Chào hỏi" className={inputC} />
          </Field>
          <Field label="Mã chủ đề">
            <input
              value={categoryForm?.id || ""}
              onChange={(e) => setCategoryForm((c) => ({ ...c, id: e.target.value }))}
              placeholder="Ví dụ: greeting"
              className={inputC}
              disabled={!!editingCategory}
            />
            {editingCategory && <p className="m-0 text-xs text-slate-500">Mã chủ đề bị khóa khi chỉnh sửa để giữ liên kết.</p>}
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Thứ tự">
              <input type="number" value={categoryForm?.order ?? 1} onChange={(e) => setCategoryForm((c) => ({ ...c, order: e.target.value }))} className={inputC} />
            </Field>
            <Field label="Trạng thái">
              <label className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={!!categoryForm?.isActive} onChange={(e) => setCategoryForm((c) => ({ ...c, isActive: e.target.checked }))} className="h-4 w-4 rounded accent-slate-950" />
                Đang hiển thị
              </label>
            </Field>
          </div>
        </div>
      </Modal>

      {/* ======== LESSON MODAL ======== */}
      <Modal
        open={!!lessonForm}
        onClose={() => { setLessonForm(null); setEditingLesson(null); }}
        title={editingLesson ? "Sửa bài hội thoại" : "Thêm bài hội thoại"}
        footer={
          <>
            <button type="button" onClick={() => { setLessonForm(null); setEditingLesson(null); }} className={btn2}>Hủy</button>
            <button type="button" onClick={saveLesson} className={btn1}>Lưu bài hội thoại</button>
          </>
        }
      >
        {/* Tabs */}
        <div className="mb-4 flex gap-1 rounded-lg bg-slate-100 p-1">
          {LESSON_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setLessonTab(t.key)}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${
                lessonTab === t.key ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
              {t.key === "lines" && <span className="ml-1.5 text-xs text-slate-400">{lessonForm?.lines?.length || 0}</span>}
              {t.key === "vocabulary" && <span className="ml-1.5 text-xs text-slate-400">{lessonForm?.vocabulary?.length || 0}</span>}
              {t.key === "grammar" && <span className="ml-1.5 text-xs text-slate-400">{lessonForm?.grammar?.length || 0}</span>}
            </button>
          ))}
        </div>

        {/* Tab: Info */}
        {lessonTab === "info" && (
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Chủ đề">
              <select className={selectC} value={lessonForm?.categoryId || ""} onChange={(e) => setLessonField("categoryId", e.target.value)}>
                <option value="">Chọn chủ đề</option>
                {categories.map((c) => (<option key={c.id} value={c.id}>{c.title}</option>))}
              </select>
            </Field>
            <Field label="Level">
              <select className={selectC} value={lessonForm?.level || "N5"} onChange={(e) => setLessonField("level", e.target.value)}>
                {["N5", "N4", "N3", "N2", "N1"].map((lv) => (<option key={lv} value={lv}>{lv}</option>))}
              </select>
            </Field>
            <Field label="Tiêu đề">
              <input value={lessonForm?.title || ""} onChange={(e) => setLessonField("title", e.target.value)} className={inputC} />
            </Field>
            <Field label="Slug">
              <input value={lessonForm?.slug || ""} onChange={(e) => setLessonField("slug", e.target.value)} className={inputC} />
            </Field>
            <Field label="Ảnh" className="md:col-span-2">
              <input value={lessonForm?.image || ""} onChange={(e) => setLessonField("image", e.target.value)} className={inputC} placeholder="https://..." />
            </Field>
            <Field label="Mô tả tình huống" className="md:col-span-2">
              <textarea value={lessonForm?.description || ""} onChange={(e) => setLessonField("description", e.target.value)} className={textareaC} placeholder="Ví dụ: Bạn được Sato, một người quen trong bữa tiệc, tới chào hỏi..." />
            </Field>
            <Field label="Thứ tự">
              <input type="number" value={lessonForm?.order ?? 1} onChange={(e) => setLessonField("order", e.target.value)} className={inputC} />
            </Field>
            <Field label="Trạng thái">
              <label className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={!!lessonForm?.published} onChange={(e) => setLessonField("published", e.target.checked)} className="h-4 w-4 rounded accent-slate-950" />
                Công khai
              </label>
            </Field>
          </div>
        )}

        {/* Tab: Lines */}
        {lessonTab === "lines" && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="m-0 text-sm font-medium text-slate-500">Xen kẽ B (đối phương) → A (người học)</p>
              <button type="button" onClick={addLine} className={btn2}><Plus size={16} /> Thêm câu</button>
            </div>
            <div className="grid gap-3 max-h-[50vh] overflow-y-auto pr-1">
              {(lessonForm?.lines || []).map((line, i) => (
                <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="grid h-7 w-14 place-items-center rounded-lg bg-slate-950 text-xs font-bold text-white">{i + 1}</span>
                      <span className={`grid h-7 place-items-center rounded-lg px-2 text-xs font-bold ${i % 2 === 0 ? "bg-sky-100 text-sky-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {i % 2 === 0 ? "B · Đối phương" : "A · Người học"}
                      </span>
                    </div>
                    <button type="button" onClick={() => removeLine(i)} disabled={lessonForm.lines.length <= 1} className="grid h-7 w-7 place-items-center rounded-lg border border-rose-100 bg-white text-rose-600 hover:bg-rose-50 disabled:opacity-40"><Trash2 size={14} /></button>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-3">
                    <textarea value={line.japanese} onChange={(e) => setLine(i, "japanese", e.target.value)} placeholder="Tiếng Nhật" className={textareaC} />
                    <textarea value={line.kana} onChange={(e) => setLine(i, "kana", e.target.value)} placeholder="Kana" className={textareaC} />
                    <textarea value={line.vietnamese} onChange={(e) => setLine(i, "vietnamese", e.target.value)} placeholder="Nghĩa tiếng Việt" className={textareaC} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Vocabulary */}
        {lessonTab === "vocabulary" && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="m-0 text-sm font-medium text-slate-500">{formatNumber(lessonForm?.vocabulary?.length || 0)} từ</p>
              <button type="button" onClick={addVocab} className={btn2}><Plus size={16} /> Thêm từ</button>
            </div>
            <div className="grid gap-3 max-h-[50vh] overflow-y-auto pr-1">
              {!lessonForm?.vocabulary?.length ? (
                <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-6 text-center text-sm font-medium text-slate-500">Chưa có từ vựng.</p>
              ) : (
                (lessonForm.vocabulary || []).map((item, i) => (
                  <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="grid h-7 w-14 place-items-center rounded-lg bg-slate-950 text-xs font-bold text-white">{i + 1}</span>
                      <button type="button" onClick={() => removeVocab(i)} className="grid h-7 w-7 place-items-center rounded-lg border border-rose-100 bg-white text-rose-600 hover:bg-rose-50"><Trash2 size={14} /></button>
                    </div>
                    <div className="grid gap-3 lg:grid-cols-3">
                      <input value={item.word} onChange={(e) => setVocab(i, "word", e.target.value)} placeholder="Từ vựng (楽しい)" className={inputC} />
                      <input value={item.furigana} onChange={(e) => setVocab(i, "furigana", e.target.value)} placeholder="Cách đọc (たのしい)" className={inputC} />
                      <input value={item.meaning} onChange={(e) => setVocab(i, "meaning", e.target.value)} placeholder="Nghĩa (Vui vẻ)" className={inputC} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab: Grammar */}
        {lessonTab === "grammar" && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="m-0 text-sm font-medium text-slate-500">{formatNumber(lessonForm?.grammar?.length || 0)} mẫu</p>
              <button type="button" onClick={addGrammar} className={btn2}><Plus size={16} /> Thêm mẫu</button>
            </div>
            <div className="grid gap-3 max-h-[50vh] overflow-y-auto pr-1">
              {!lessonForm?.grammar?.length ? (
                <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-6 text-center text-sm font-medium text-slate-500">Chưa có ngữ pháp.</p>
              ) : (
                (lessonForm.grammar || []).map((item, i) => (
                  <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="grid h-7 w-14 place-items-center rounded-lg bg-slate-950 text-xs font-bold text-white">{i + 1}</span>
                      <button type="button" onClick={() => removeGrammar(i)} className="grid h-7 w-7 place-items-center rounded-lg border border-rose-100 bg-white text-rose-600 hover:bg-rose-50"><Trash2 size={14} /></button>
                    </div>
                    <div className="grid gap-3 lg:grid-cols-2">
                      <input value={item.title} onChange={(e) => setGrammar(i, "title", e.target.value)} placeholder="Mẫu ngữ pháp (～は～です)" className={inputC} />
                      <input value={item.meaning} onChange={(e) => setGrammar(i, "meaning", e.target.value)} placeholder="Nghĩa / giải thích" className={inputC} />
                      <input value={item.example} onChange={(e) => setGrammar(i, "example", e.target.value)} placeholder="Câu ví dụ (わたしは学生です。)" className={inputC} />
                      <input value={item.exampleMeaning} onChange={(e) => setGrammar(i, "exampleMeaning", e.target.value)} placeholder="Nghĩa câu ví dụ" className={inputC} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Modal>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default AdminConversation;
