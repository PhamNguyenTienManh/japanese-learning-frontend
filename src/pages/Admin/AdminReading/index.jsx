import { useState, useRef, useEffect } from "react";
import {
    BookText,
    Edit3,
    Eye,
    EyeOff,
    Link2,
    Loader2,
    Plus,
    Search,
    Sparkles,
    X,
} from "lucide-react";

import { getNews, createNews, updateNews } from "~/services/newsService";
import { uploadVoice } from "~/services/textToSpeechService";

const difficultyOptions = [
    { value: "easy", label: "Dễ" },
    { value: "hard", label: "Khó" },
];

const levelOptions = [
    { value: 1, label: "N5" },
    { value: 2, label: "N4" },
    { value: 3, label: "N3" },
    { value: 4, label: "N2" },
    { value: 5, label: "N1" },
];

const inputClass =
    "h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

const selectClass =
    "h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100";

const textareaClass =
    "min-h-[96px] w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100";

const secondaryButtonClass =
    "inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";

const primaryButtonClass =
    "inline-flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60";

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
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

function Field({ label, required = false, children, className = "" }) {
    return (
        <label className={`grid gap-2 ${className}`}>
            <span className="text-xs font-bold uppercase tracking-normal text-slate-500">
                {label}
                {required && <span className="ml-0.5 text-rose-500">*</span>}
            </span>
            {children}
        </label>
    );
}

function AdminReading() {
    const [articles, setArticles] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [difficultyFilter, setDifficultyFilter] = useState("all");

    // form state
    const [editingArticle, setEditingArticle] = useState(null);
    const [mode, setMode] = useState("create");
    const [audioInputType, setAudioInputType] = useState("link");
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState({ show: false, message: "", type: "" });
    const [contentParagraphs, setContentParagraphs] = useState([""]);

    const titleRef = useRef(null);
    const contentRef = useRef(null);
    const linkRef = useRef(null);
    const imageUrlRef = useRef(null);
    const audioLinkRef = useRef(null);

    // Auto hide toast after 3 seconds
    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => {
                setToast({ show: false, message: "", type: "" });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toast.show]);

    const handleParagraphChange = (index, value) => {
        const newParagraphs = [...contentParagraphs];
        newParagraphs[index] = value;
        setContentParagraphs(newParagraphs);

        const joinedContent = newParagraphs.join("/n/n");
        handleChangeField("content", joinedContent);
    };

    const handleAddParagraph = () => {
        setContentParagraphs([...contentParagraphs, ""]);
    };

    const handleRemoveParagraph = (index) => {
        if (contentParagraphs.length <= 1) return;

        const newParagraphs = contentParagraphs.filter((_, i) => i !== index);
        setContentParagraphs(newParagraphs);

        const joinedContent = newParagraphs.join("/n/n");
        handleChangeField("content", joinedContent);
    };

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                const response = await getNews();
                if (response.success && response.data) {
                    const transformedArticles = response.data.map((item) => ({
                        id: item._id,
                        title: item.title,
                        link: item.link || "",
                        content: item.content?.textbody || "",
                        syncData: item.content?.syncData,
                        imagePreview: item.content?.image || "",
                        audioFile: item.content?.audio || "",
                        audioLink: item.content?.audio || "",
                        difficulty: item.type,
                        level: item.level || 1,
                        date: new Date(item.dateField).toLocaleDateString("vi-VN"),
                        published: item.published || false,
                    }));

                    setArticles(transformedArticles);
                }
            } catch (error) {
                console.error("Error fetching articles:", error);
            }
        };

        fetchArticles();
    }, []);

    const filteredArticles = articles.filter((a) => {
        const q = searchQuery.trim().toLowerCase();
        const matchSearch =
            !q ||
            (a.title || "").toLowerCase().includes(q) ||
            (a.content || "").toLowerCase().includes(q);

        const matchDiff =
            difficultyFilter === "all" || a.difficulty === difficultyFilter;

        return matchSearch && matchDiff;
    });

    // ===== CRUD =====

    const handleStartCreate = () => {
        setMode("create");
        setAudioInputType("link");
        setContentParagraphs([""]);
        setErrors({});
        setEditingArticle({
            id: "",
            title: "",
            link: "",
            content: "",
            difficulty: "easy",
            level: 1,
            published: false,
            audioDuration: 0,
            imageFile: null,
            imagePreview: "",
            audioFile: null,
            audioPreview: "",
            audioLink: "",
        });
    };

    const handleStartEdit = (article) => {
        setMode("edit");
        setErrors({});
        const paragraphs = article.content
            ? article.content.split("/n/n").filter((p) => p.trim())
            : [];
        setContentParagraphs(paragraphs.length > 0 ? paragraphs : [""]);
        setAudioInputType("link");
        setEditingArticle({
            ...article,
            link: article.link || "",
            audioPreview: article.audioLink || article.audioFile || "",
            audioLink: article.audioLink || article.audioFile || "",
        });

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const handleCancelEdit = () => {
        setEditingArticle(null);
        setAudioInputType("link");
        setErrors({});
    };

    const handleChangeField = (field, value) => {
        setEditingArticle((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

    const handleToggleRead = () => {
        setEditingArticle((prev) =>
            prev ? { ...prev, published: !prev.published } : prev
        );
    };

    const handleSave = async () => {
        if (!editingArticle) return;

        let newErrors = {};
        if (!editingArticle.title.trim()) {
            newErrors.title = "Tiêu đề không được để trống";
            titleRef.current?.focus();
        }

        if (!editingArticle.link.trim()) {
            newErrors.link = "Link bài viết gốc không được để trống";
            if (!newErrors.title) linkRef.current?.focus();
        }

        if (!editingArticle.content.trim()) {
            newErrors.content = "Nội dung không được để trống";
            if (!newErrors.link) contentRef.current?.focus();
        }

        if (!editingArticle.imagePreview.trim()) {
            newErrors.imageUrl = "Link hình ảnh không được để trống";
            if (!newErrors.content) imageUrlRef.current?.focus();
        }

        if (audioInputType === "link") {
            if (!editingArticle.audioLink.trim() && !isGeneratingAudio) {
                newErrors.audioLink = "Link audio không được để trống";
                if (!newErrors.imageUrl) audioLinkRef.current?.focus();
            }
        }

        if (audioInputType === "link") {
            if (editingArticle.audioLink && !editingArticle.audioPreview) {
                newErrors.audioLink =
                    "Link chưa hợp lệ. Vui lòng nhập URL đầy đủ (bắt đầu bằng http:// hoặc https://)";
                if (!newErrors.imageUrl) audioLinkRef.current?.focus();
            }
        }

        if (audioInputType !== "link") {
            if (!editingArticle.audioLink || !editingArticle.audioPreview) {
                newErrors.audioLink = "Bạn chưa tạo file audio";
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});

        try {
            if (mode === "create") {
                const newsDto = {
                    title: editingArticle.title,
                    link: editingArticle.link || "",
                    type: editingArticle.difficulty,
                    content: {
                        audio: editingArticle.audioLink || "",
                        image: editingArticle.imagePreview || "",
                        textbody: editingArticle.content,
                        syncData: editingArticle.syncData,
                    },
                    level: editingArticle.level,
                    published: editingArticle.published,
                };

                const response = await createNews(newsDto);

                if (response) {
                    const newArticle = {
                        id: response.data._id || Date.now().toString(),
                        title: editingArticle.title,
                        link: editingArticle.link || "",
                        content: editingArticle.content,
                        imagePreview: editingArticle.imagePreview,
                        audioFile: editingArticle.audioLink,
                        audioLink: editingArticle.audioLink,
                        difficulty: editingArticle.difficulty,
                        syncData: editingArticle.syncData,
                        level: editingArticle.level,
                        date: new Date().toLocaleDateString("vi-VN"),
                        published: editingArticle.published,
                    };
                    setArticles((prev) => [newArticle, ...prev]);
                    setToast({
                        show: true,
                        message: "Thêm bài đọc thành công!",
                        type: "success",
                    });
                }
            } else {
                const newsDto = {
                    title: editingArticle.title,
                    link: editingArticle.link || "",
                    type: editingArticle.difficulty,
                    content: {
                        audio: editingArticle.audioLink || "",
                        image: editingArticle.imagePreview || "",
                        textbody: editingArticle.content || "",
                        syncData: editingArticle.syncData,
                    },
                    level: editingArticle.level,
                    published: editingArticle.published,
                };
                const response = await updateNews(editingArticle.id, newsDto);

                if (response) {
                    setArticles((prev) =>
                        prev.map((a) =>
                            a.id === editingArticle.id
                                ? {
                                      ...editingArticle,
                                      audioFile: editingArticle.audioLink,
                                  }
                                : a
                        )
                    );
                    setToast({
                        show: true,
                        message: "Cập nhật bài đọc thành công!",
                        type: "success",
                    });
                }
            }

            setEditingArticle(null);
        } catch (error) {
            console.error("Error saving article:", error);
            setToast({
                show: true,
                message: "Có lỗi xảy ra khi lưu bài đọc. Vui lòng thử lại.",
                type: "error",
            });
        }
    };

    const handleChangeStatus = async (articleId, value) => {
        try {
            let published = false;
            if (value === "published") published = true;

            const updateDto = {
                published: published,
            };
            const response = await updateNews(articleId, updateDto);

            if (response.success) {
                setToast({
                    show: true,
                    message: "Cập nhật trạng thái thành công",
                    type: "success",
                });
            }

            setArticles((prev) =>
                prev.map((a) =>
                    a.id === articleId ? { ...a, published: published } : a
                )
            );
        } catch (err) {
            setToast({
                show: true,
                message: "Cập nhật trạng thái thất bại: " + err,
                type: "error",
            });
        }
    };

    const handleAudioLinkChange = (link) => {
        const trimmedLink = link.trim();
        setEditingArticle((prev) =>
            prev
                ? {
                      ...prev,
                      audioLink: link,
                      audioPreview:
                          trimmedLink &&
                          (trimmedLink.startsWith("http://") ||
                              trimmedLink.startsWith("https://"))
                              ? trimmedLink
                              : "",
                  }
                : prev
        );
    };

    const publishedCount = articles.filter((article) => article.published).length;
    const hiddenCount = articles.length - publishedCount;

    const handleGenerateAudio = async () => {
        if (!editingArticle?.content.trim()) {
            alert("Vui lòng nhập nội dung trước khi tạo audio");
            return;
        }

        setIsGeneratingAudio(true);

        try {
            const cleanText = editingArticle.content
                .replace(/\/n\/n/g, " ")
                .replace(/\n+/g, " ")
                .trim();

            const response = await uploadVoice(cleanText, 6);

            const audioUrl =
                response?.data?.audioUrl || response?.audioUrl || response;
            const syncData =
                response?.data?.syncData || response?.syncData || response;

            if (audioUrl) {
                setEditingArticle((prev) =>
                    prev
                        ? {
                              ...prev,
                              syncData: syncData,
                              audioLink: audioUrl,
                              audioPreview: audioUrl,
                          }
                        : prev
                );

                setToast({
                    show: true,
                    message: "Tạo audio thành công!",
                    type: "success",
                });
            } else {
                throw new Error("Không nhận được URL audio");
            }
        } catch (error) {
            console.error("Error generating audio:", error);
            setToast({
                show: true,
                message: "Có lỗi xảy ra khi tạo audio. Vui lòng thử lại.",
                type: "error",
            });
        } finally {
            setIsGeneratingAudio(false);
        }
    };

    const handleAudioLoaded = (e) => {
        const duration = e.currentTarget.duration || 0;
        setEditingArticle((prev) =>
            prev ? { ...prev, audioDuration: Math.round(duration) } : prev
        );
    };

    const handleAudioInputTypeChange = (type) => {
        setAudioInputType(type);
        setEditingArticle((prev) =>
            prev
                ? {
                      ...prev,
                      audioPreview: "",
                      audioLink: "",
                      audioDuration: 0,
                  }
                : prev
        );
    };

    return (
        <div className="min-h-[calc(100vh-64px)] bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-7xl flex-col gap-5">
                <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <div className="inline-flex min-h-8 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 shadow-sm">
                            <BookText size={16} aria-hidden="true" />
                            Quản lý bài luyện đọc
                        </div>
                        <h1 className="m-0 mt-3 text-2xl font-bold leading-tight text-slate-950 sm:text-3xl">
                            Quản lý bài luyện đọc
                        </h1>
                        <p className="m-0 mt-2 text-sm font-medium text-slate-500">
                            Tổng cộng{" "}
                            <strong className="font-bold text-slate-700">
                                {formatNumber(articles.length)}
                            </strong>{" "}
                            bài đọc
                            {filteredArticles.length !== articles.length && (
                                <>
                                    {" "}· hiển thị{" "}
                                    <strong className="font-bold text-slate-700">
                                        {formatNumber(filteredArticles.length)}
                                    </strong>{" "}
                                    kết quả
                                </>
                            )}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            className={primaryButtonClass}
                            onClick={handleStartCreate}
                        >
                            <Plus size={16} aria-hidden="true" />
                            Thêm bài đọc
                        </button>
                    </div>
                </section>

                <section className="grid gap-3 sm:grid-cols-3">
                    <SummaryCard
                        title="Tổng bài đọc"
                        value={articles.length}
                        icon={BookText}
                        tone="sky"
                    />
                    <SummaryCard
                        title="Công khai"
                        value={publishedCount}
                        icon={Eye}
                        tone="emerald"
                    />
                    <SummaryCard
                        title="Ẩn"
                        value={hiddenCount}
                        icon={EyeOff}
                        tone="slate"
                    />
                </section>

                {/* Filters */}
                <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_220px]">
                        <label className="relative block">
                            <span className="sr-only">Tìm kiếm bài đọc</span>
                            <input
                                placeholder="Tìm theo tiêu đề, hoặc nội dung..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                            />
                        </label>

                        <label>
                            <span className="sr-only">Lọc độ khó</span>
                            <select
                                className={selectClass}
                                value={difficultyFilter}
                                onChange={(e) => setDifficultyFilter(e.target.value)}
                            >
                                <option value="all">Tất cả độ khó</option>
                                {difficultyOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                </section>

                {/* Form thêm / sửa */}
                {editingArticle && (
                    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
                            <div>
                                <h2 className="m-0 text-base font-bold text-slate-950">
                                    {mode === "create"
                                        ? "Thêm bài đọc mới"
                                        : "Chỉnh sửa bài đọc"}
                                </h2>
                                <p className="m-0 mt-1 text-sm font-medium text-slate-500">
                                    {mode === "create"
                                        ? "Tạo nội dung luyện đọc"
                                        : "Cập nhật nội dung luyện đọc"}
                                </p>
                            </div>
                            <button
                                type="button"
                                className="inline-grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                                onClick={handleCancelEdit}
                                aria-label="Đóng"
                            >
                                <X size={18} aria-hidden="true" />
                            </button>
                        </div>

                        <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
                            <Field label="Tiêu đề" required>
                                <input
                                    ref={titleRef}
                                    value={editingArticle.title}
                                    onChange={(e) =>
                                        handleChangeField("title", e.target.value)
                                    }
                                    className={inputClass}
                                    placeholder="Nhập tiêu đề bài đọc"
                                />
                                {errors.title && (
                                    <p className="m-0 text-xs font-semibold text-rose-600">
                                        {errors.title}
                                    </p>
                                )}
                            </Field>

                            <Field label="Link bài viết gốc" required>
                                <input
                                    ref={linkRef}
                                    value={editingArticle.link || ""}
                                    onChange={(e) =>
                                        handleChangeField("link", e.target.value)
                                    }
                                    className={inputClass}
                                    placeholder="https://example.com/article"
                                />
                                {errors.link && (
                                    <p className="m-0 text-xs font-semibold text-rose-600">
                                        {errors.link}
                                    </p>
                                )}
                            </Field>

                            <Field label="Nội dung" required className="sm:col-span-2">
                                <div className="grid gap-3">
                                    {contentParagraphs.map((paragraph, index) => (
                                        <div
                                            key={index}
                                            className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                                        >
                                            <div className="mb-2 flex items-center justify-between">
                                                <span className="text-xs font-bold uppercase tracking-normal text-slate-500">
                                                    Đoạn {index + 1}
                                                </span>
                                                {contentParagraphs.length > 1 && (
                                                    <button
                                                        type="button"
                                                        className="inline-grid h-7 w-7 place-items-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                                                        onClick={() =>
                                                            handleRemoveParagraph(index)
                                                        }
                                                        title="Xóa đoạn văn này"
                                                    >
                                                        <X size={14} aria-hidden="true" />
                                                    </button>
                                                )}
                                            </div>
                                            <textarea
                                                ref={index === 0 ? contentRef : null}
                                                value={paragraph}
                                                onChange={(e) =>
                                                    handleParagraphChange(
                                                        index,
                                                        e.target.value
                                                    )
                                                }
                                                className={textareaClass}
                                                rows={4}
                                                placeholder={`Nhập đoạn văn ${index + 1}...`}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    className="inline-flex items-center gap-2 self-start rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
                                    onClick={handleAddParagraph}
                                >
                                    <Plus size={15} aria-hidden="true" />
                                    Thêm đoạn văn
                                </button>

                                {errors.content && (
                                    <p className="m-0 text-xs font-semibold text-rose-600">
                                        {errors.content}
                                    </p>
                                )}
                            </Field>

                            {/* Ảnh minh họa */}
                            <Field label="Ảnh minh họa (URL)" required>
                                <input
                                    ref={imageUrlRef}
                                    value={editingArticle.imagePreview || ""}
                                    onChange={(e) =>
                                        handleChangeField("imagePreview", e.target.value)
                                    }
                                    className={inputClass}
                                    placeholder="https://example.com/image.jpg"
                                />
                                {errors.imageUrl && (
                                    <p className="m-0 text-xs font-semibold text-rose-600">
                                        {errors.imageUrl}
                                    </p>
                                )}
                                {editingArticle.imagePreview && (
                                    <div className="mt-1 overflow-hidden rounded-lg border border-slate-200">
                                        <img
                                            src={editingArticle.imagePreview}
                                            alt="preview"
                                            className="h-40 w-full object-cover"
                                        />
                                    </div>
                                )}
                            </Field>

                            {/* Audio */}
                            <Field label="Audio" required className="sm:col-span-2">
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleAudioInputTypeChange("link")}
                                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                                            audioInputType === "link"
                                                ? "border-slate-950 bg-slate-950 text-white"
                                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                        }`}
                                    >
                                        <Link2 size={15} aria-hidden="true" />
                                        Gắn link audio
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleAudioInputTypeChange("generate")
                                        }
                                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                                            audioInputType === "generate"
                                                ? "border-slate-950 bg-slate-950 text-white"
                                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                        }`}
                                    >
                                        <Sparkles size={15} aria-hidden="true" />
                                        Tạo audio tự động
                                    </button>
                                </div>

                                {audioInputType === "link" ? (
                                    <div className="grid gap-2">
                                        <input
                                            ref={audioLinkRef}
                                            value={editingArticle.audioLink || ""}
                                            onChange={(e) =>
                                                handleAudioLinkChange(e.target.value)
                                            }
                                            className={inputClass}
                                            placeholder="Nhập URL của file audio (ví dụ: https://example.com/audio.mp3)"
                                        />
                                        {errors.audioLink && (
                                            <p className="m-0 text-xs font-semibold text-rose-600">
                                                {errors.audioLink}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                                        <p className="m-0 text-sm font-medium text-slate-500">
                                            Audio sẽ được tạo từ nội dung bài đọc bằng công
                                            nghệ text-to-speech.
                                        </p>
                                        {errors.audioLink && (
                                            <p className="m-0 text-xs font-semibold text-rose-600">
                                                {errors.audioLink}
                                            </p>
                                        )}
                                        <button
                                            type="button"
                                            onClick={handleGenerateAudio}
                                            disabled={
                                                isGeneratingAudio ||
                                                !editingArticle.content.trim()
                                            }
                                            className={`${primaryButtonClass} self-start`}
                                        >
                                            {isGeneratingAudio ? (
                                                <Loader2
                                                    size={16}
                                                    className="animate-spin"
                                                    aria-hidden="true"
                                                />
                                            ) : (
                                                <Sparkles size={16} aria-hidden="true" />
                                            )}
                                            {isGeneratingAudio
                                                ? "Đang tạo audio..."
                                                : "Tạo audio"}
                                        </button>
                                    </div>
                                )}

                                {editingArticle.audioPreview && (
                                    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
                                        <audio
                                            controls
                                            src={editingArticle.audioPreview}
                                            className="h-10 w-full max-w-md"
                                            onLoadedMetadata={handleAudioLoaded}
                                        />
                                        {editingArticle.audioDuration > 0 && (
                                            <span className="text-sm font-semibold text-slate-500">
                                                Thời lượng:{" "}
                                                {formatTime(editingArticle.audioDuration)}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </Field>

                            <Field label="Độ khó">
                                <select
                                    value={editingArticle.difficulty}
                                    onChange={(e) =>
                                        handleChangeField("difficulty", e.target.value)
                                    }
                                    className={selectClass}
                                >
                                    {difficultyOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="Level (N5-N1)">
                                <select
                                    value={editingArticle.level || 1}
                                    onChange={(e) =>
                                        handleChangeField(
                                            "level",
                                            parseInt(e.target.value)
                                        )
                                    }
                                    className={selectClass}
                                >
                                    {levelOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <label className="flex items-center gap-2 self-end pb-2.5 text-sm font-semibold text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={editingArticle.published}
                                    onChange={handleToggleRead}
                                    className="h-4 w-4 rounded border-slate-300 accent-slate-950"
                                />
                                Đã xuất bản
                            </label>
                        </div>

                        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className={secondaryButtonClass}
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                className={primaryButtonClass}
                            >
                                {mode === "create" ? "Thêm bài đọc" : "Lưu thay đổi"}
                            </button>
                        </div>
                    </section>
                )}

                {/* List */}
                <section className="grid gap-3">
                    {filteredArticles.map((article) => (
                        <div
                            key={article.id}
                            className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-slate-300"
                        >
                            <div className="flex flex-col gap-4 p-4 sm:flex-row">
                                {/* thumb */}
                                <div className="h-36 w-full shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 sm:h-24 sm:w-40">
                                    <img
                                        src={article.imagePreview || "/placeholder.svg"}
                                        alt={article.title}
                                        className="h-full w-full object-cover"
                                    />
                                </div>

                                {/* info */}
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <h3 className="m-0 truncate text-base font-bold text-slate-950">
                                            {article.title}
                                        </h3>
                                        <span
                                            className={`inline-flex min-h-6 shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${
                                                article.difficulty === "easy"
                                                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                                    : "bg-amber-50 text-amber-700 ring-amber-200"
                                            }`}
                                        >
                                            {article.difficulty === "easy" ? "Dễ" : "Khó"}
                                        </span>
                                    </div>

                                    <p className="m-0 mt-1 line-clamp-2 text-sm font-medium text-slate-500">
                                        {(article.content || "").slice(0, 160)}
                                        {(article.content || "").length > 160 && "…"}
                                    </p>

                                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
                                        <span>
                                            Level:{" "}
                                            <span className="text-slate-800">
                                                {levelOptions.find(
                                                    (l) => l.value === article.level
                                                )?.label || "N/A"}
                                            </span>
                                        </span>
                                        <span>
                                            Trạng thái:{" "}
                                            <span className="text-slate-800">
                                                {article.published ? "Công khai" : "Ẩn"}
                                            </span>
                                        </span>
                                        <span>
                                            Ngày tạo:{" "}
                                            <span className="text-slate-800">
                                                {article.date}
                                            </span>
                                        </span>
                                    </div>
                                </div>

                                {/* actions */}
                                <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                                    <button
                                        type="button"
                                        onClick={() => handleStartEdit(article)}
                                        className="inline-grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                                        aria-label="Sửa bài đọc"
                                        title="Sửa"
                                    >
                                        <Edit3 size={16} aria-hidden="true" />
                                    </button>
                                    <select
                                        className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm font-semibold text-slate-800 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                                        value={article.published ? "published" : "hidden"}
                                        onChange={(e) =>
                                            handleChangeStatus(article.id, e.target.value)
                                        }
                                    >
                                        <option value="published">Công khai</option>
                                        <option value="hidden">Ẩn</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredArticles.length === 0 && (
                        <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-14 text-center shadow-sm">
                            <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-slate-500">
                                <Search size={34} aria-hidden="true" />
                                <p className="m-0 text-sm font-semibold">
                                    Không tìm thấy bài đọc nào phù hợp
                                </p>
                            </div>
                        </div>
                    )}
                </section>
            </div>

            {/* Toast Notification */}
            {toast.show && (
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
                        onClick={() =>
                            setToast({ show: false, message: "", type: "" })
                        }
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

export default AdminReading;
