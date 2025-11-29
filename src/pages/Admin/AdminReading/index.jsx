import React, { useState, useRef } from "react";
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
} from "@fortawesome/free-solid-svg-icons";

import Card from "~/components/Card";
import Button from "~/components/Button";
import Input from "~/components/Input";

import styles from "./AdminReading.module.scss";

const cx = classNames.bind(styles);

// mock data: dùng imagePreview là URL sẵn (sau này backend trả về)
const initialArticles = [
    {
        id: "1",
        title: "日本の秋祭り",
        hiragana: "にほんのあきまつり",
        content:
            "日本の秋祭りは、色とりどりの紅葉とともに行われます。屋台や神輿など、にぎやかな雰囲気が楽しめます。",
        difficulty: "easy",
        date: "2025-11-25 03:01:17Z",
        read: true,
        audioDuration: 95,
        imageFile: null,
        imagePreview:
            "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/attachments/gen-images/public/japanese-seafood-shells-nIV9KBSzmKHcyhXtcEfalFhFx4LzFb.jpg",
        audioFile: null,
        audioPreview: "",
    },
    {
        id: "2",
        title: "日本の朝ごはん",
        hiragana: "にほんのあさごはん",
        content:
            "日本の朝ごはんには、ごはん、みそしる、さかな、たまごやさいなど、バランスのよい料理がならびます。",
        difficulty: "easy",
        date: "2025-11-25 03:01:12Z",
        read: false,
        audioDuration: 120,
        imageFile: null,
        imagePreview:
            "https://images.pexels.com/photos/1580466/pexels-photo-1580466.jpeg?auto=compress&cs=tinysrgb&w=1200",
        audioFile: null,
        audioPreview: "",
    },
    {
        id: "3",
        title: "世界のニュースを読む",
        hiragana: "せかいのにゅーすをよむ",
        content:
            "インターネットを使えば、世界中のニュースを日本語で読むことができます。語彙力アップにも役立ちます。",
        difficulty: "hard",
        date: "2025-11-25 03:00:00Z",
        read: false,
        audioDuration: 150,
        imageFile: null,
        imagePreview:
            "https://images.pexels.com/photos/261949/pexels-photo-261949.jpeg?auto=compress&cs=tinysrgb&w=1200",
        audioFile: null,
        audioPreview: "",
    },
];

const difficultyOptions = [
    { value: "easy", label: "Dễ" },
    { value: "hard", label: "Khó" },
];

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(
        2,
        "0"
    )}`;
}

function AdminReading() {
    const [articles, setArticles] = useState(initialArticles);
    const [searchQuery, setSearchQuery] = useState("");
    const [difficultyFilter, setDifficultyFilter] = useState("all");

    // form state
    const [editingArticle, setEditingArticle] = useState(null); // null = ẩn form
    const [mode, setMode] = useState("create"); // "create" | "edit"

    // ref cho input file
    const imageInputRef = useRef(null);
    const audioInputRef = useRef(null);

    const filteredArticles = articles.filter((a) => {
        const q = searchQuery.trim().toLowerCase();
        const matchSearch =
            !q ||
            a.title.toLowerCase().includes(q) ||
            a.hiragana.toLowerCase().includes(q) ||
            a.content.toLowerCase().includes(q);

        const matchDiff =
            difficultyFilter === "all" || a.difficulty === difficultyFilter;

        return matchSearch && matchDiff;
    });

    // ===== CRUD =====

    const handleStartCreate = () => {
        setMode("create");
        setEditingArticle({
            id: "",
            title: "",
            hiragana: "",
            content: "",
            difficulty: "easy",
            date: new Date().toISOString(),
            read: false,
            audioDuration: 0,
            imageFile: null,
            imagePreview: "",
            audioFile: null,
            audioPreview: "",
        });
    };

    const handleStartEdit = (article) => {
        setMode("edit");
        setEditingArticle({ ...article });
    };

    const handleCancelEdit = () => {
        setEditingArticle(null);
    };

    const handleChangeField = (field, value) => {
        setEditingArticle((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

    const handleToggleRead = () => {
        setEditingArticle((prev) =>
            prev ? { ...prev, read: !prev.read } : prev
        );
    };

    const handleSave = () => {
        if (!editingArticle) return;
        if (!editingArticle.title.trim()) {
            alert("Tiêu đề không được để trống");
            return;
        }

        if (mode === "create") {
            const newId = Date.now().toString();
            const newArticle = { ...editingArticle, id: newId };
            setArticles((prev) => [newArticle, ...prev]);
        } else {
            setArticles((prev) =>
                prev.map((a) => (a.id === editingArticle.id ? editingArticle : a))
            );
        }

        // TODO: ở đây bạn có thể gọi API, upload imageFile / audioFile lên cloud
        setEditingArticle(null);
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

    const handlePickAudio = () => {
        if (audioInputRef.current) {
            audioInputRef.current.click();
        }
    };

    const handleAudioChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const preview = URL.createObjectURL(file);
        setEditingArticle((prev) =>
            prev
                ? {
                    ...prev,
                    audioFile: file,
                    audioPreview: preview,
                }
                : prev
        );
    };

    const handleAudioLoaded = (e) => {
        const duration = e.currentTarget.duration || 0;
        setEditingArticle((prev) =>
            prev ? { ...prev, audioDuration: Math.round(duration) } : prev
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
                                    placeholder="Tìm theo tiêu đề, hiragana hoặc nội dung..."
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
                                    <label className={cx("label")}>Hiragana</label>
                                    <Input
                                        value={editingArticle.hiragana}
                                        onChange={(e) =>
                                            handleChangeField("hiragana", e.target.value)
                                        }
                                        className={cx("input")}
                                        placeholder="にほんのあきまつり"
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
                                    <label className={cx("label")}>Ảnh minh họa</label>
                                    <div className={cx("fileRow")}>
                                        <Button
                                            outline
                                            leftIcon={<FontAwesomeIcon icon={faImage} />}
                                            onClick={handlePickImage}
                                        >
                                            Chọn ảnh
                                        </Button>
                                        <input
                                            ref={imageInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className={cx("fileInput")}
                                        />
                                        {editingArticle.imagePreview && (
                                            <span className={cx("fileHint")}>Đã chọn ảnh</span>
                                        )}
                                    </div>
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
                                <div className={cx("field")}>
                                    <label className={cx("label")}>Audio</label>
                                    <div className={cx("fileRow")}>
                                        <Button
                                            outline
                                            leftIcon={<FontAwesomeIcon icon={faVolumeHigh} />}
                                            onClick={handlePickAudio}
                                        >
                                            Chọn file audio
                                        </Button>
                                        <input
                                            ref={audioInputRef}
                                            type="file"
                                            accept="audio/*"
                                            onChange={handleAudioChange}
                                            className={cx("fileInput")}
                                        />
                                        {editingArticle.audioPreview && (
                                            <span className={cx("fileHint")}>Đã chọn audio</span>
                                        )}
                                    </div>
                                    {editingArticle.audioPreview && (
                                        <audio
                                            controls
                                            src={editingArticle.audioPreview}
                                            className={cx("audioPreview")}
                                            onLoadedMetadata={handleAudioLoaded}
                                        />
                                    )}
                                    {editingArticle.audioDuration > 0 && (
                                        <span className={cx("hint")}>
                                            Thời lượng:{" "}
                                            {formatTime(editingArticle.audioDuration)}
                                        </span>
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
                                    <label className={cx("label")}>Ngày tạo</label>
                                    <Input
                                        value={editingArticle.date}
                                        onChange={(e) =>
                                            handleChangeField("date", e.target.value)
                                        }
                                        className={cx("input")}
                                    />
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
                                            src={
                                                article.imagePreview || "/placeholder.svg"
                                            }
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
                                                <p className={cx("articleHiragana")}>
                                                    {article.hiragana}
                                                </p>
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
                                                Ngày tạo:{" "}
                                                <span className={cx("metaValue")}>
                                                    {article.date}
                                                </span>
                                            </span>
                                            <span className={cx("metaItem")}>
                                                <FontAwesomeIcon
                                                    icon={faVolumeHigh}
                                                    className={cx("metaIcon")}
                                                />{" "}
                                                <span className={cx("metaValue")}>
                                                    {formatTime(article.audioDuration || 0)}
                                                </span>
                                            </span>
                                            {article.read && (
                                                <span className={cx("metaItem")}>
                                                    Đã xuất bản
                                                </span>
                                            )}
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
                                            leftIcon={
                                                <FontAwesomeIcon icon={faPenToSquare} />
                                            }
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
