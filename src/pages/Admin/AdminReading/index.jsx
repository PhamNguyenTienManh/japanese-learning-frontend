import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeft,
    faMagnifyingGlass,
    faPenToSquare,
    faTrash,
    faEye,
    faPlus,
    faVolumeHigh,
    faXmark,
    faImage,
    faLink,
    faMagic,
} from "@fortawesome/free-solid-svg-icons";

import Card from "~/components/Card";
import Button from "~/components/Button";
import Input from "~/components/Input";

import styles from "./AdminReading.module.scss";
import { getNews, createNews } from "~/services/newsService";
import { uploadVoice } from "~/services/textToSpeechService";

const cx = classNames.bind(styles);

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

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
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

    // ref cho input file
    const imageInputRef = useRef(null);
    const audioInputRef = useRef(null);

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                const response = await getNews();
                if (response.success && response.data) {
                    const transformedArticles = response.data.map(item => ({
                        id: item._id,
                        title: item.title,
                        link: item.link || "",
                        content: item.content.textbody,
                        imagePreview: item.content.image,
                        audioFile: item.content.audio,
                        audioLink: item.content.audio,
                        difficulty: item.type,
                        level: item.level || 1,
                        date: new Date(item.dateField).toLocaleDateString('vi-VN'),
                        read: item.publish || false,
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
            a.title.toLowerCase().includes(q) ||
            a.content.toLowerCase().includes(q);

        const matchDiff =
            difficultyFilter === "all" || a.difficulty === difficultyFilter;

        return matchSearch && matchDiff;
    });

    // ===== CRUD =====

    const handleStartCreate = () => {
        setMode("create");
        setAudioInputType("link");
        setEditingArticle({
            id: "",
            title: "",
            link: "",
            content: "",
            difficulty: "easy",
            level: 1,
            read: false,
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
        if (article.audioPreview || article.audioLink) {
            setAudioInputType("link");
        } else {
            setAudioInputType("link");
        }
        setEditingArticle({
            ...article,
            link: article.link || "",
            audioPreview: article.audioLink || article.audioFile || "",
            audioLink: article.audioLink || article.audioFile || "",
        });

        window.scrollTo({
            top: 340,
            behavior: 'smooth'
        });
    };

    const handleCancelEdit = () => {
        setEditingArticle(null);
        setAudioInputType("link");
    };

    const handleChangeField = (field, value) => {
        setEditingArticle((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

    const handleToggleRead = () => {
        setEditingArticle((prev) =>
            prev ? { ...prev, read: !prev.read } : prev
        );
    };

    const handleSave = async () => {
        if (!editingArticle) return;
        if (!editingArticle.title.trim()) {
            alert("Tiêu đề không được để trống");
            return;
        }
        if (!editingArticle.content.trim()) {
            alert("Nội dung không được để trống");
            return;
        }

        try {
            if (mode === "create") {
                // Tạo DTO theo format backend
                const newsDto = {
                    title: editingArticle.title,
                    link: editingArticle.link || "",
                    type: editingArticle.difficulty,
                    content: {
                        audio: editingArticle.audioLink || "",
                        image: editingArticle.imagePreview || "",
                        textbody: editingArticle.content,
                    },
                    level: editingArticle.level,
                    publish: editingArticle.read,
                };

                // Gọi API tạo news
                const response = await createNews(newsDto);

                if (response) {
                    // Thêm vào danh sách local
                    const newArticle = {
                        id: response._id || Date.now().toString(),
                        title: editingArticle.title,
                        content: editingArticle.content,
                        imagePreview: editingArticle.imagePreview,
                        audioFile: editingArticle.audioLink,
                        audioLink: editingArticle.audioLink,
                        difficulty: editingArticle.difficulty,
                        level: editingArticle.level,
                        date: new Date().toLocaleDateString('vi-VN'),
                        read: editingArticle.read,
                    };
                    setArticles((prev) => [newArticle, ...prev]);
                    alert("Thêm bài đọc thành công!");
                }
            } else {
                // Chế độ edit - có thể thêm API update ở đây
                setArticles((prev) =>
                    prev.map((a) => (a.id === editingArticle.id ? {
                        ...editingArticle,
                        audioFile: editingArticle.audioLink,
                    } : a))
                );
                alert("Cập nhật bài đọc thành công!");
            }

            setEditingArticle(null);
        } catch (error) {
            console.error("Error saving article:", error);
            alert("Có lỗi xảy ra khi lưu bài đọc. Vui lòng thử lại.");
        }
    };

    const handleDelete = (id) => {
        if (!window.confirm("Bạn có chắc muốn xóa bài đọc này?")) return;
        setArticles((prev) => prev.filter((a) => a.id !== id));
    };

    // ===== FILE HANDLERS =====

    const handlePickImage = () => {
        if (imageInputRef.current) {
            imageInputRef.current.click();
        }
    };

    const handleImageChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const preview = URL.createObjectURL(file);
        setEditingArticle((prev) =>
            prev
                ? {
                    ...prev,
                    imageFile: file,
                    imagePreview: preview,
                }
                : prev
        );
    };

    const handleAudioLinkChange = (link) => {
        const trimmedLink = link.trim();
        setEditingArticle((prev) =>
            prev
                ? {
                    ...prev,
                    audioLink: link, // Lưu link gốc (có thể có khoảng trắng)
                    // Set audioPreview ngay lập tức nếu link hợp lệ
                    audioPreview: trimmedLink && (trimmedLink.startsWith('http://') || trimmedLink.startsWith('https://'))
                        ? trimmedLink
                        : '',
                }
                : prev
        );
    };

    const handleGenerateAudio = async () => {
        if (!editingArticle?.content.trim()) {
            alert("Vui lòng nhập nội dung trước khi tạo audio");
            return;
        }

        setIsGeneratingAudio(true);

        try {
            // Gọi API text-to-speech
            const response = await uploadVoice(editingArticle.content, 6);

            // API trả về { success: true, data: { audioUrl: "..." } }
            const audioUrl = response?.data?.audioUrl || response?.audioUrl || response;

            if (audioUrl) {
                setEditingArticle((prev) =>
                    prev
                        ? {
                            ...prev,
                            audioLink: audioUrl,
                            audioPreview: audioUrl,
                        }
                        : prev
                );
                alert("Tạo audio thành công!");
            } else {
                throw new Error("Không nhận được URL audio");
            }
        } catch (error) {
            console.error("Error generating audio:", error);
            alert("Có lỗi xảy ra khi tạo audio. Vui lòng thử lại.");
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
        // Clear audio data when switching type
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
        <div className={cx("wrapper")}>
            <main className={cx("main")}>
                <div className={cx("inner")}>
                    {/* Header */}
                    <div className={cx("header")}>
                        <Link to="/admin" className={cx("backLink")}>
                            <FontAwesomeIcon icon={faArrowLeft} className={cx("backIcon")} />
                            <span>Quay lại bảng quản trị</span>
                        </Link>
                        <div className={cx("headerMain")}>
                            <div>
                                <h1 className={cx("title")}>Quản lý bài luyện đọc</h1>
                                <p className={cx("subtitle")}>
                                    Tổng cộng {articles.length} bài đọc
                                    {filteredArticles.length !== articles.length &&
                                        ` · ${filteredArticles.length} kết quả`}
                                </p>
                            </div>
                            <Button
                                primary
                                leftIcon={<FontAwesomeIcon icon={faPlus} />}
                                onClick={handleStartCreate}
                            >
                                Thêm bài đọc mới
                            </Button>
                        </div>
                    </div>

                    {/* Filters */}
                    <Card className={cx("filterCard")}>
                        <div className={cx("filterRow")}>
                            <div className={cx("searchWrapper")}>
                                <FontAwesomeIcon
                                    icon={faMagnifyingGlass}
                                    className={cx("searchIcon")}
                                />
                                <Input
                                    placeholder="Tìm theo tiêu đề, hoặc nội dung..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={cx("searchInput")}
                                />
                            </div>
                            <div className={cx("selectGroup")}>
                                <select
                                    className={cx("select")}
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
                            </div>
                        </div>
                    </Card>

                    {/* Form thêm / sửa */}
                    {editingArticle && (
                        <Card className={cx("formCard")}>
                            <div className={cx("formHeader")}>
                                <h2 className={cx("formTitle")}>
                                    {mode === "create"
                                        ? "Thêm bài đọc mới"
                                        : "Chỉnh sửa bài đọc"}
                                </h2>
                                <button
                                    type="button"
                                    className={cx("formClose")}
                                    onClick={handleCancelEdit}
                                >
                                    <FontAwesomeIcon icon={faXmark} />
                                </button>
                            </div>

                            <div className={cx("formGrid")}>
                                <div className={cx("field")}>
                                    <label className={cx("label")}>Tiêu đề</label>
                                    <Input
                                        value={editingArticle.title}
                                        onChange={(e) =>
                                            handleChangeField("title", e.target.value)
                                        }
                                        className={cx("input")}
                                        placeholder="Nhập tiêu đề bài đọc"
                                    />
                                </div>

                                <div className={cx("field")}>
                                    <label className={cx("label")}>Link bài viết gốc</label>
                                    <Input
                                        value={editingArticle.link || ""}
                                        onChange={(e) =>
                                            handleChangeField("link", e.target.value)
                                        }
                                        className={cx("input")}
                                        placeholder="https://example.com/article"
                                    />
                                </div>

                                <div className={cx("field", "fieldFull")}>
                                    <label className={cx("label")}>Nội dung</label>
                                    <textarea
                                        value={editingArticle.content}
                                        onChange={(e) =>
                                            handleChangeField("content", e.target.value)
                                        }
                                        className={cx("textarea")}
                                        rows={4}
                                        placeholder="Nhập đoạn văn tiếng Nhật..."
                                    />
                                </div>

                                {/* Ảnh minh họa */}
                                <div className={cx("field")}>
                                    <label className={cx("label")}>Ảnh minh họa (URL)</label>
                                    <Input
                                        value={editingArticle.imagePreview || ""}
                                        onChange={(e) =>
                                            handleChangeField("imagePreview", e.target.value)
                                        }
                                        className={cx("input")}
                                        placeholder="https://example.com/image.jpg"
                                    />
                                    {editingArticle.imagePreview && (
                                        <div className={cx("imagePreviewWrap")}>
                                            <img
                                                src={editingArticle.imagePreview}
                                                alt="preview"
                                                className={cx("imagePreview")}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Audio */}
                                <div className={cx("field", "fieldFull")}>
                                    <label className={cx("label")}>Audio</label>

                                    {/* Radio buttons cho loại input */}
                                    <div className={cx("audioTypeSelector")}>
                                        <label className={cx("radioLabel")}>
                                            <input
                                                type="radio"
                                                name="audioType"
                                                value="link"
                                                checked={audioInputType === "link"}
                                                onChange={() => handleAudioInputTypeChange("link")}
                                                className={cx("radio")}
                                            />
                                            <FontAwesomeIcon icon={faLink} className={cx("radioIcon")} />
                                            <span>Gắn link audio</span>
                                        </label>
                                        <label className={cx("radioLabel")}>
                                            <input
                                                type="radio"
                                                name="audioType"
                                                value="generate"
                                                checked={audioInputType === "generate"}
                                                onChange={() => handleAudioInputTypeChange("generate")}
                                                className={cx("radio")}
                                            />
                                            <FontAwesomeIcon icon={faMagic} className={cx("radioIcon")} />
                                            <span>Tạo audio tự động</span>
                                        </label>
                                    </div>

                                    {/* Input theo loại được chọn */}
                                    {audioInputType === "link" ? (
                                        <div className={cx("audioLinkInput")}>
                                            <Input
                                                value={editingArticle.audioLink || ""}
                                                onChange={(e) => handleAudioLinkChange(e.target.value)}
                                                className={cx("input")}
                                                placeholder="Nhập URL của file audio (ví dụ: https://example.com/audio.mp3)"
                                            />
                                            {editingArticle.audioLink && !editingArticle.audioPreview && (
                                                <p className={cx("linkHint")}>
                                                    Link chưa hợp lệ. Vui lòng nhập URL đầy đủ (bắt đầu bằng http:// hoặc https://)
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className={cx("generateAudioSection")}>
                                            <p className={cx("generateHint")}>
                                                Audio sẽ được tạo từ nội dung bài đọc bằng công nghệ text-to-speech
                                            </p>
                                            <Button
                                                primary
                                                leftIcon={<FontAwesomeIcon icon={faMagic} />}
                                                onClick={handleGenerateAudio}
                                                disabled={isGeneratingAudio || !editingArticle.content.trim()}
                                            >
                                                {isGeneratingAudio ? "Đang tạo audio..." : "Tạo audio"}
                                            </Button>
                                        </div>
                                    )}

                                    {/* Audio Preview */}
                                    {editingArticle.audioPreview && (
                                        <div className={cx("audioPreviewWrap")}>
                                            <audio
                                                controls
                                                src={editingArticle.audioPreview}
                                                className={cx("audioPreview")}
                                                onLoadedMetadata={handleAudioLoaded}
                                            />
                                            {editingArticle.audioDuration > 0 && (
                                                <span className={cx("audioDuration")}>
                                                    Thời lượng: {formatTime(editingArticle.audioDuration)}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className={cx("field")}>
                                    <label className={cx("label")}>Độ khó</label>
                                    <select
                                        value={editingArticle.difficulty}
                                        onChange={(e) =>
                                            handleChangeField("difficulty", e.target.value)
                                        }
                                        className={cx("select")}
                                    >
                                        {difficultyOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className={cx("field")}>
                                    <label className={cx("label")}>Level (N5-N1)</label>
                                    <select
                                        value={editingArticle.level || 1}
                                        onChange={(e) =>
                                            handleChangeField("level", parseInt(e.target.value))
                                        }
                                        className={cx("select")}
                                    >
                                        {levelOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className={cx("field")}>
                                    <label className={cx("label")}>Trạng thái</label>
                                    <label className={cx("checkboxRow")}>
                                        <input
                                            type="checkbox"
                                            checked={editingArticle.read}
                                            onChange={handleToggleRead}
                                            className={cx("checkbox")}
                                        />
                                        <span>Đã xuất bản</span>
                                    </label>
                                </div>
                            </div>

                            <div className={cx("formActions")}>
                                <Button outline onClick={handleCancelEdit}>
                                    Hủy
                                </Button>
                                <Button primary onClick={handleSave}>
                                    {mode === "create" ? "Thêm bài đọc" : "Lưu thay đổi"}
                                </Button>
                            </div>
                        </Card>
                    )}

                    {/* List */}
                    <div className={cx("list")}>
                        {filteredArticles.map((article) => (
                            <Card key={article.id} className={cx("articleCard")}>
                                <div className={cx("articleInner")}>
                                    {/* thumb */}
                                    <div className={cx("thumb")}>
                                        <img
                                            src={article.imagePreview || "/placeholder.svg"}
                                            alt={article.title}
                                            className={cx("thumbImage")}
                                        />
                                    </div>

                                    {/* info */}
                                    <div className={cx("info")}>
                                        <div className={cx("infoHeader")}>
                                            <div>
                                                <h3 className={cx("articleTitle")}>
                                                    {article.title}
                                                </h3>
                                            </div>
                                            <span
                                                className={cx(
                                                    "badge",
                                                    article.difficulty === "easy" && "badgeEasy",
                                                    article.difficulty === "hard" && "badgeHard"
                                                )}
                                            >
                                                {article.difficulty === "easy" ? "Dễ" : "Khó"}
                                            </span>
                                        </div>

                                        <p className={cx("articleExcerpt")}>
                                            {article.content.slice(0, 80)}
                                            {article.content.length > 80 && "…"}
                                        </p>

                                        <div className={cx("metaRow")}>
                                            <span className={cx("metaItem")}>
                                                Level:{" "}
                                                <span className={cx("metaValue")}>
                                                    {levelOptions.find(l => l.value === article.level)?.label || 'N/A'}
                                                </span>
                                            </span>
                                            <span className={cx("metaItem")}>
                                                Ngày tạo:{" "}
                                                <span className={cx("metaValue")}>
                                                    {article.date}
                                                </span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* actions */}
                                    <div className={cx("actions")}>
                                        <Button
                                            outline
                                            rounded
                                            leftIcon={<FontAwesomeIcon icon={faEye} />}
                                        />
                                        <Button
                                            outline
                                            rounded
                                            leftIcon={<FontAwesomeIcon icon={faPenToSquare} />}
                                            onClick={() => handleStartEdit(article)}
                                        />
                                        <Button
                                            outline
                                            rounded
                                            className={cx("dangerBtn")}
                                            leftIcon={<FontAwesomeIcon icon={faTrash} />}
                                            onClick={() => handleDelete(article.id)}
                                        />
                                    </div>
                                </div>
                            </Card>
                        ))}

                        {filteredArticles.length === 0 && (
                            <Card className={cx("emptyCard")}>
                                <p className={cx("emptyText")}>
                                    Không tìm thấy bài đọc nào phù hợp
                                </p>
                            </Card>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default AdminReading;





