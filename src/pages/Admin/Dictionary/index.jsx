// DictionaryAdmin.jsx
import { useEffect, useMemo, useState } from "react";
import classNames from "classnames/bind";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faMagnifyingGlass,
    faPlus,
    faPenToSquare,
    faTrash,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";

import Card from "~/components/Card";
import Button from "~/components/Button";
import Input from "~/components/Input";

import {
    getJlptWordsAdmin,
    updateJlptWord,
    deleteJlptWord,
    getJlptKanjiAdmin,
    updateJlptKanji,
    deleteJlptKanji,
    getJlptGrammarAdmin,
    updateJlptGrammar,
    deleteJlptGrammar,
} from "~/services/jlptService";
import styles from "./DictionaryAdmin.module.scss";

const BASE_URL = process.env.REACT_APP_BASE_URL_API;

const cx = classNames.bind(styles);

const easeOut = [0.22, 1, 0.36, 1];

const TYPE_OPTIONS = [
    "Danh từ",
    "Động từ",
    "Tính từ -i",
    "Tính từ -na",
    "Trạng từ",
    "Trợ từ",
    "Trợ động từ",
    "Định từ",
    "Liên từ",
    "Thán từ",
];

function DictionaryAdmin() {
    const [activeTab, setActiveTab] = useState("words");
    const [searchQuery, setSearchQuery] = useState("");
    const [levelFilter, setLevelFilter] = useState("all");
    const [showAddForm, setShowAddForm] = useState(false);

    const [words, setWords] = useState([]);
    const [grammar, setGrammar] = useState([]);
    const [kanji, setKanji] = useState([]);

    const [editingItem, setEditingItem] = useState(null);

    const [formState, setFormState] = useState({});

    function resetFormForTab(tab) {
        if (tab === "words") {
            setFormState({
                word: "",
                phonetic: "",
                type: TYPE_OPTIONS[0],
                meanings: "",
                level: "N5",
                isJlpt: true,
            });
        } else if (tab === "grammar") {
            setFormState({
                title: "",
                mean: "",
                level: "N5",
                isJlpt: true,
            });
        } else {
            setFormState({
                kanji: "",
                mean: "",
                detail: "",
                kun: "",
                on: "",
                stroke_count: "",
                level: "N5",
                isJlpt: true,
            });
        }
    }

    useEffect(() => {
        async function load() {
            try {
                if (activeTab === "words") {
                    const res = await getJlptWordsAdmin(1, 9999, "", "");
                    setWords(res?.data?.data || res?.data || []);
                } else if (activeTab === "grammar") {
                    const res = await getJlptGrammarAdmin(1, 9999, "", "");
                    setGrammar(res?.data?.data || res?.data || []);
                } else {
                    const res = await getJlptKanjiAdmin(1, 9999, "", "");
                    setKanji(res?.data?.data || res?.data || []);
                }
            } catch (err) {
                console.error("Load error:", err);
            }
        }
        load();
    }, [activeTab]);

    const unwrapResp = (resJson) => {
        if (!resJson) return null;
        return resJson?.data?.data || resJson?.data || resJson || null;
    };

    async function createWord(payload) {
        try {
            const resp = await fetch(`${BASE_URL}/jlpt-word`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const body = await resp.json().catch(() => null);
            if (!resp.ok) return { ok: false, error: body || { status: resp.status } };
            const newItem = unwrapResp(body);
            if (!newItem) return { ok: false, error: body };
            return { ok: true, item: newItem };
        } catch (err) {
            return { ok: false, error: err };
        }
    }

    async function createGrammar(payload) {
        try {
            const resp = await fetch(`${BASE_URL}/jlpt-grammar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const body = await resp.json().catch(() => null);
            if (!resp.ok) return { ok: false, error: body || { status: resp.status } };
            const newItem = unwrapResp(body);
            if (!newItem) return { ok: false, error: body };
            return { ok: true, item: newItem };
        } catch (err) {
            return { ok: false, error: err };
        }
    }

    async function createKanji(payload) {
        try {
            const resp = await fetch(`${BASE_URL}/jlpt-kanji`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const body = await resp.json().catch(() => null);
            if (!resp.ok) return { ok: false, error: body || { status: resp.status } };
            const newItem = unwrapResp(body);
            if (!newItem) return { ok: false, error: body };
            return { ok: true, item: newItem };
        } catch (err) {
            return { ok: false, error: err };
        }
    }

    const filteredItems = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();

        if (activeTab === "words") {
            return words.filter((w) => {
                if (!w || w.isDeleted) return false;
                const matchLevel = levelFilter === "all" || w.level === levelFilter;
                const meaningsTxt = (w.meanings || []).map((m) => m.meaning || "").join(" ");
                const phoneticTxt = (w.phonetic || []).join(" ");
                const matchSearch =
                    !q ||
                    (w.word || "").toLowerCase().includes(q) ||
                    meaningsTxt.toLowerCase().includes(q) ||
                    phoneticTxt.toLowerCase().includes(q) ||
                    (w.type || "").toLowerCase().includes(q);

                return matchLevel && matchSearch;
            });
        }

        if (activeTab === "grammar") {
            return grammar.filter((g) => {
                if (!g || g.isDeleted) return false;
                const matchLevel = levelFilter === "all" || g.level === levelFilter;
                const matchSearch =
                    !q ||
                    (g.title || "").toLowerCase().includes(q) ||
                    (g.mean || "").toLowerCase().includes(q);

                return matchLevel && matchSearch;
            });
        }

        return kanji.filter((k) => {
            if (!k || k.isDeleted) return false;
            const matchLevel = levelFilter === "all" || k.level === levelFilter;
            const matchSearch =
                !q ||
                (k.kanji || "").toLowerCase().includes(q) ||
                (k.mean || "").toLowerCase().includes(q) ||
                (k.kun || "").toLowerCase().includes(q) ||
                (k.on || "").toLowerCase().includes(q);

            return matchLevel && matchSearch;
        });
    }, [activeTab, searchQuery, levelFilter, words, grammar, kanji]);

    const totalCount = useMemo(() => {
        if (activeTab === "words") return words.length;
        if (activeTab === "grammar") return grammar.length;
        return kanji.length;
    }, [activeTab, words, grammar, kanji]);

    async function handleSubmitAdd(e) {
        e.preventDefault();

        if (editingItem) return handleUpdateItem();

        if (activeTab === "words") {
            if (!formState.word || !formState.level || !formState.type) {
                alert("Vui lòng điền đầy đủ: Từ, Loại từ, Level");
                return;
            }

            const payload = {
                word: formState.word,
                phonetic: formState.phonetic ? formState.phonetic.split(",").map((s) => s.trim()) : [],
                type: formState.type,
                meanings: formState.meanings
                    ? formState.meanings.split(",").map((m) => ({ meaning: m.trim() }))
                    : [],
                level: formState.level,
                isJlpt: !!formState.isJlpt,
            };

            const { ok, item, error } = await createWord(payload);
            if (ok) {
                setWords((prev) => [item, ...prev]);
                setShowAddForm(false);
            } else {
                const msg = error?.message || error?.errors || "Thêm thất bại";
                alert(Array.isArray(msg) ? msg.join(", ") : JSON.stringify(msg));
            }
        } else if (activeTab === "grammar") {
            if (!formState.title || !formState.mean || !formState.level) {
                alert("Vui lòng điền đầy đủ: Tiêu đề, Ý nghĩa, Level");
                return;
            }

            const payload = {
                title: formState.title,
                mean: formState.mean,
                level: formState.level,
                usages: [],
                isJlpt: !!formState.isJlpt,
            };

            const { ok, item, error } = await createGrammar(payload);
            if (ok) {
                setGrammar((prev) => [item, ...prev]);
                setShowAddForm(false);
            } else {
                const msg = error?.message || error?.errors || "Thêm thất bại";
                alert(Array.isArray(msg) ? msg.join(", ") : JSON.stringify(msg));
            }
        } else {
            if (!formState.kanji || !formState.mean || !formState.level) {
                alert("Vui lòng điền đầy đủ: Kanji, Nghĩa, Level");
                return;
            }

            const payload = {
                kanji: formState.kanji,
                mean: formState.mean,
                detail: formState.detail || "",
                kun: formState.kun || "",
                on: formState.on || "",
                stroke_count: formState.stroke_count || "",
                level: formState.level,
                isJlpt: !!formState.isJlpt,
            };

            const { ok, item, error } = await createKanji(payload);
            if (ok) {
                setKanji((prev) => [item, ...prev]);
                setShowAddForm(false);
            } else {
                const msg = error?.message || error?.errors || "Thêm thất bại";
                alert(Array.isArray(msg) ? msg.join(", ") : JSON.stringify(msg));
            }
        }
    }

    async function handleUpdateItem() {
        if (!editingItem) return;

        if (activeTab === "words") {
            const payload = {
                word: formState.word,
                phonetic: formState.phonetic ? formState.phonetic.split(",").map((s) => s.trim()) : [],
                type: formState.type,
                meanings: formState.meanings
                    ? formState.meanings.split(",").map((m) => ({ meaning: m.trim() }))
                    : [],
                level: formState.level,
            };

            const updated = await updateJlptWord(editingItem._id, payload);
            setWords((prev) => prev.map((w) => (w._id === editingItem._id ? updated.data : w)));
        } else if (activeTab === "grammar") {
            const payload = {
                title: formState.title,
                mean: formState.mean,
                level: formState.level,
                usages: editingItem?.usages || [],
            };

            const updated = await updateJlptGrammar(editingItem._id, payload);
            setGrammar((prev) => prev.map((g) => (g._id === editingItem._id ? updated.data : g)));
        } else {
            const payload = {
                kanji: formState.kanji,
                mean: formState.mean,
                detail: formState.detail,
                kun: formState.kun,
                on: formState.on,
                stroke_count: formState.stroke_count,
                level: formState.level,
            };

            const updated = await updateJlptKanji(editingItem._id, payload);
            setKanji((prev) => prev.map((k) => (k._id === editingItem._id ? updated.data : k)));
        }

        setEditingItem(null);
        setShowAddForm(false);
    }

    async function handleDelete(id) {
        if (activeTab === "words") {
            await deleteJlptWord(id);
            setWords((prev) => prev.filter((w) => w._id !== id));
        } else if (activeTab === "grammar") {
            await deleteJlptGrammar(id);
            setGrammar((prev) => prev.filter((g) => g._id !== id));
        } else {
            await deleteJlptKanji(id);
            setKanji((prev) => prev.filter((k) => k._id !== id));
        }
    }

    function openEditForm(item) {
        setEditingItem(item);
        setShowAddForm(true);

        if (activeTab === "words") {
            setFormState({
                word: item.word,
                phonetic: (item.phonetic || []).join(", "),
                type: item.type || TYPE_OPTIONS[0],
                meanings: (item.meanings || []).map((m) => m.meaning).join(", "),
                level: item.level,
                isJlpt: item.isJlpt,
            });
        } else if (activeTab === "grammar") {
            setFormState({
                title: item.title,
                mean: item.mean,
                level: item.level,
                isJlpt: item.isJlpt,
            });
        } else {
            setFormState({
                kanji: item.kanji,
                mean: item.mean,
                detail: item.detail,
                kun: item.kun,
                on: item.on,
                stroke_count: item.stroke_count,
                level: item.level,
                isJlpt: item.isJlpt,
            });
        }
    }

    const tabLabel =
        activeTab === "words" ? "từ vựng" : activeTab === "grammar" ? "ngữ pháp" : "kanji";

    return (
        <div className={cx("wrapper")}>
            <motion.div
                className={cx("blob1")}
                animate={{ y: [0, -22, 0], x: [0, 12, 0] }}
                transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className={cx("blob2")}
                animate={{ y: [0, 18, 0], x: [0, -14, 0] }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            />

            <main className={cx("main")}>
                <div className={cx("inner")}>
                    {/* HEADER */}
                    <motion.div
                        className={cx("header")}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: easeOut }}
                    >
                        <div className={cx("headerMain")}>
                            <div className={cx("titleBlock")}>
                                <span className={cx("eyebrow")}>Quản trị</span>
                                <h1 className={cx("title")}>
                                    Quản lý <span className={cx("titleAccent")}>từ điển</span>
                                </h1>
                                <p className={cx("subtitle")}>
                                    <strong>{totalCount}</strong> mục {tabLabel}
                                    {filteredItems.length !== totalCount &&
                                        ` · hiển thị ${filteredItems.length} kết quả`}
                                </p>
                            </div>

                            <div className={cx("headerRight")}>
                                <div className={cx("tabs")}>
                                    <button
                                        className={cx("tabBtn", { active: activeTab === "words" })}
                                        onClick={() => {
                                            setActiveTab("words");
                                            setEditingItem(null);
                                            setShowAddForm(false);
                                        }}
                                    >
                                        Từ vựng
                                    </button>

                                    <button
                                        className={cx("tabBtn", { active: activeTab === "grammar" })}
                                        onClick={() => {
                                            setActiveTab("grammar");
                                            setEditingItem(null);
                                            setShowAddForm(false);
                                        }}
                                    >
                                        Ngữ pháp
                                    </button>

                                    <button
                                        className={cx("tabBtn", { active: activeTab === "kanji" })}
                                        onClick={() => {
                                            setActiveTab("kanji");
                                            setEditingItem(null);
                                            setShowAddForm(false);
                                        }}
                                    >
                                        Kanji
                                    </button>
                                </div>

                                <motion.button
                                    type="button"
                                    className={cx("primaryBtn")}
                                    onClick={() => {
                                        setEditingItem(null);
                                        resetFormForTab(activeTab);
                                        setShowAddForm((s) => !s);
                                    }}
                                    whileHover={{ y: -1 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <FontAwesomeIcon icon={faPlus} />
                                    <span>Thêm</span>
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>

                    {/* FORM */}
                    <AnimatePresence>
                        {showAddForm && (
                            <motion.div
                                className={cx("formCard")}
                                initial={{ opacity: 0, height: 0, y: -8 }}
                                animate={{ opacity: 1, height: "auto", y: 0 }}
                                exit={{ opacity: 0, height: 0, y: -8 }}
                                transition={{ duration: 0.4, ease: easeOut }}
                            >
                                <div className={cx("formInner")}>
                                    <div className={cx("formHeader")}>
                                        <div className={cx("formHeaderLeft")}>
                                            <span className={cx("formBadge")}>
                                                {editingItem ? "Chỉnh sửa" : "Mới"}
                                            </span>
                                            <h3 className={cx("formTitle")}>
                                                {editingItem
                                                    ? `Cập nhật ${tabLabel}`
                                                    : `Thêm mới ${tabLabel}`}
                                            </h3>
                                        </div>
                                        <button
                                            type="button"
                                            className={cx("formClose")}
                                            onClick={() => {
                                                setShowAddForm(false);
                                                setEditingItem(null);
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faXmark} />
                                        </button>
                                    </div>

                                    <form onSubmit={handleSubmitAdd}>
                                        <div className={cx("formGrid")}>
                                            {/* WORD FORM */}
                                            {activeTab === "words" && (
                                                <>
                                                    <div className={cx("formField")}>
                                                        <label className={cx("label")}>Từ</label>
                                                        <Input
                                                            value={formState.word}
                                                            onChange={(e) =>
                                                                setFormState((s) => ({
                                                                    ...s,
                                                                    word: e.target.value,
                                                                }))
                                                            }
                                                        />
                                                    </div>

                                                    <div className={cx("formField")}>
                                                        <label className={cx("label")}>
                                                            Phonetic (phân tách bằng , )
                                                        </label>
                                                        <Input
                                                            value={formState.phonetic}
                                                            onChange={(e) =>
                                                                setFormState((s) => ({
                                                                    ...s,
                                                                    phonetic: e.target.value,
                                                                }))
                                                            }
                                                        />
                                                    </div>

                                                    <div className={cx("formField")}>
                                                        <label className={cx("label")}>Loại từ</label>
                                                        <select
                                                            className={cx("select")}
                                                            value={formState.type}
                                                            onChange={(e) =>
                                                                setFormState((s) => ({
                                                                    ...s,
                                                                    type: e.target.value,
                                                                }))
                                                            }
                                                        >
                                                            <option value="">-- Chọn loại từ --</option>
                                                            {TYPE_OPTIONS.map((t) => (
                                                                <option key={t} value={t}>
                                                                    {t}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className={cx("formField")}>
                                                        <label className={cx("label")}>
                                                            Nghĩa (phân tách bằng , )
                                                        </label>
                                                        <Input
                                                            value={formState.meanings}
                                                            onChange={(e) =>
                                                                setFormState((s) => ({
                                                                    ...s,
                                                                    meanings: e.target.value,
                                                                }))
                                                            }
                                                        />
                                                    </div>

                                                    <div className={cx("formField")}>
                                                        <label className={cx("label")}>Level</label>
                                                        <select
                                                            className={cx("select")}
                                                            value={formState.level}
                                                            onChange={(e) =>
                                                                setFormState((s) => ({
                                                                    ...s,
                                                                    level: e.target.value,
                                                                }))
                                                            }
                                                        >
                                                            <option value="N5">N5</option>
                                                            <option value="N4">N4</option>
                                                            <option value="N3">N3</option>
                                                            <option value="N2">N2</option>
                                                            <option value="N1">N1</option>
                                                        </select>
                                                    </div>
                                                </>
                                            )}

                                            {/* GRAMMAR FORM */}
                                            {activeTab === "grammar" && (
                                                <>
                                                    <div className={cx("formField")}>
                                                        <label className={cx("label")}>Tiêu đề</label>
                                                        <Input
                                                            value={formState.title}
                                                            onChange={(e) =>
                                                                setFormState((s) => ({
                                                                    ...s,
                                                                    title: e.target.value,
                                                                }))
                                                            }
                                                        />
                                                    </div>

                                                    <div className={cx("formField")}>
                                                        <label className={cx("label")}>
                                                            Ý nghĩa (tóm tắt)
                                                        </label>
                                                        <Input
                                                            value={formState.mean}
                                                            onChange={(e) =>
                                                                setFormState((s) => ({
                                                                    ...s,
                                                                    mean: e.target.value,
                                                                }))
                                                            }
                                                        />
                                                    </div>

                                                    <div className={cx("formField")}>
                                                        <label className={cx("label")}>Level</label>
                                                        <select
                                                            className={cx("select")}
                                                            value={formState.level}
                                                            onChange={(e) =>
                                                                setFormState((s) => ({
                                                                    ...s,
                                                                    level: e.target.value,
                                                                }))
                                                            }
                                                        >
                                                            <option value="N5">N5</option>
                                                            <option value="N4">N4</option>
                                                            <option value="N3">N3</option>
                                                            <option value="N2">N2</option>
                                                            <option value="N1">N1</option>
                                                        </select>
                                                    </div>
                                                </>
                                            )}

                                            {/* KANJI FORM */}
                                            {activeTab === "kanji" && (
                                                <>
                                                    <div className={cx("formField")}>
                                                        <label className={cx("label")}>Kanji</label>
                                                        <Input
                                                            value={formState.kanji}
                                                            onChange={(e) =>
                                                                setFormState((s) => ({
                                                                    ...s,
                                                                    kanji: e.target.value,
                                                                }))
                                                            }
                                                        />
                                                    </div>

                                                    <div className={cx("formField")}>
                                                        <label className={cx("label")}>Nghĩa</label>
                                                        <Input
                                                            value={formState.mean}
                                                            onChange={(e) =>
                                                                setFormState((s) => ({
                                                                    ...s,
                                                                    mean: e.target.value,
                                                                }))
                                                            }
                                                        />
                                                    </div>

                                                    <div className={cx("formField")}>
                                                        <label className={cx("label")}>Detail</label>
                                                        <Input
                                                            value={formState.detail}
                                                            onChange={(e) =>
                                                                setFormState((s) => ({
                                                                    ...s,
                                                                    detail: e.target.value,
                                                                }))
                                                            }
                                                        />
                                                    </div>

                                                    <div className={cx("formField")}>
                                                        <label className={cx("label")}>Kun</label>
                                                        <Input
                                                            value={formState.kun}
                                                            onChange={(e) =>
                                                                setFormState((s) => ({
                                                                    ...s,
                                                                    kun: e.target.value,
                                                                }))
                                                            }
                                                        />
                                                    </div>

                                                    <div className={cx("formField")}>
                                                        <label className={cx("label")}>On</label>
                                                        <Input
                                                            value={formState.on}
                                                            onChange={(e) =>
                                                                setFormState((s) => ({
                                                                    ...s,
                                                                    on: e.target.value,
                                                                }))
                                                            }
                                                        />
                                                    </div>

                                                    <div className={cx("formField")}>
                                                        <label className={cx("label")}>Stroke Count</label>
                                                        <Input
                                                            value={formState.stroke_count}
                                                            onChange={(e) =>
                                                                setFormState((s) => ({
                                                                    ...s,
                                                                    stroke_count: e.target.value,
                                                                }))
                                                            }
                                                        />
                                                    </div>

                                                    <div className={cx("formField")}>
                                                        <label className={cx("label")}>Level</label>
                                                        <select
                                                            className={cx("select")}
                                                            value={formState.level}
                                                            onChange={(e) =>
                                                                setFormState((s) => ({
                                                                    ...s,
                                                                    level: e.target.value,
                                                                }))
                                                            }
                                                        >
                                                            <option value="N5">N5</option>
                                                            <option value="N4">N4</option>
                                                            <option value="N3">N3</option>
                                                            <option value="N2">N2</option>
                                                            <option value="N1">N1</option>
                                                        </select>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <div className={cx("formActions")}>
                                            <Button
                                                outline
                                                type="button"
                                                onClick={() => {
                                                    setShowAddForm(false);
                                                    setEditingItem(null);
                                                }}
                                            >
                                                Hủy
                                            </Button>
                                            <Button primary type="submit">
                                                {editingItem ? "Cập nhật" : "Thêm"}
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* SEARCH & FILTER */}
                    <motion.div
                        className={cx("filterCard")}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: easeOut, delay: 0.1 }}
                    >
                        <div className={cx("filterRow")}>
                            <div className={cx("searchWrapper")}>
                                <FontAwesomeIcon
                                    icon={faMagnifyingGlass}
                                    className={cx("searchIcon")}
                                />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={cx("searchInput")}
                                    placeholder={
                                        activeTab === "words"
                                            ? "Tìm từ / đọc / nghĩa..."
                                            : activeTab === "grammar"
                                                ? "Tìm tiêu đề / ý nghĩa..."
                                                : "Tìm kanji / nghĩa / âm đọc..."
                                    }
                                />
                            </div>

                            <select
                                className={cx("select")}
                                value={levelFilter}
                                onChange={(e) => setLevelFilter(e.target.value)}
                            >
                                <option value="all">Tất cả cấp độ</option>
                                <option value="N5">N5</option>
                                <option value="N4">N4</option>
                                <option value="N3">N3</option>
                                <option value="N2">N2</option>
                                <option value="N1">N1</option>
                            </select>
                        </div>
                    </motion.div>

                    {/* LIST */}
                    <motion.div
                        className={cx("list")}
                        initial="hidden"
                        animate={filteredItems.length > 0 ? "show" : "hidden"}
                        variants={{
                            hidden: {},
                            show: {
                                transition: { staggerChildren: 0.04, delayChildren: 0.05 },
                            },
                        }}
                        key={activeTab}
                    >
                        {filteredItems.map((item) => {
                            if (!item) return null;

                            const levelLower = (item.level || "n5").toLowerCase();

                            if (activeTab === "words") {
                                return (
                                    <motion.div
                                        key={item._id}
                                        className={cx("itemCard", levelLower)}
                                        variants={{
                                            hidden: { opacity: 0, y: 14 },
                                            show: {
                                                opacity: 1,
                                                y: 0,
                                                transition: { duration: 0.35, ease: easeOut },
                                            },
                                        }}
                                    >
                                        <div className={cx("itemHeader")}>
                                            <div className={cx("itemInfo")}>
                                                <div className={cx("itemTitleRow")}>
                                                    <h3 className={cx("itemTitle")}>{item.word}</h3>
                                                    <span
                                                        className={cx(
                                                            "badge",
                                                            "badgeLevel",
                                                            levelLower,
                                                        )}
                                                    >
                                                        {item.level}
                                                    </span>
                                                    {item.type && (
                                                        <span className={cx("badge", "badgeType")}>
                                                            {item.type}
                                                        </span>
                                                    )}
                                                </div>

                                                <p className={cx("romaji")}>
                                                    {(item.phonetic || []).join(" ・ ")}
                                                </p>

                                                <p className={cx("meaning")}>
                                                    {(item.meanings || [])
                                                        .map((m) => m.meaning)
                                                        .join(", ")}
                                                </p>
                                            </div>

                                            <div className={cx("actions")}>
                                                <button
                                                    type="button"
                                                    className={cx("editBtn")}
                                                    onClick={() => openEditForm(item)}
                                                >
                                                    <FontAwesomeIcon icon={faPenToSquare} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className={cx("deleteBtn")}
                                                    onClick={() => handleDelete(item._id)}
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            }

                            if (activeTab === "grammar") {
                                return (
                                    <motion.div
                                        key={item._id}
                                        className={cx("itemCard", levelLower)}
                                        variants={{
                                            hidden: { opacity: 0, y: 14 },
                                            show: {
                                                opacity: 1,
                                                y: 0,
                                                transition: { duration: 0.35, ease: easeOut },
                                            },
                                        }}
                                    >
                                        <div className={cx("itemHeader")}>
                                            <div className={cx("itemInfo")}>
                                                <div className={cx("itemTitleRow")}>
                                                    <h3 className={cx("itemTitle")}>{item.title}</h3>
                                                    <span
                                                        className={cx(
                                                            "badge",
                                                            "badgeLevel",
                                                            levelLower,
                                                        )}
                                                    >
                                                        {item.level}
                                                    </span>
                                                </div>

                                                <p className={cx("meaning")}>{item.mean}</p>
                                            </div>

                                            <div className={cx("actions")}>
                                                <button
                                                    type="button"
                                                    className={cx("editBtn")}
                                                    onClick={() => openEditForm(item)}
                                                >
                                                    <FontAwesomeIcon icon={faPenToSquare} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className={cx("deleteBtn")}
                                                    onClick={() => handleDelete(item._id)}
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            }

                            return (
                                <motion.div
                                    key={item._id}
                                    className={cx("itemCard", "kanjiCard", levelLower)}
                                    variants={{
                                        hidden: { opacity: 0, y: 14 },
                                        show: {
                                            opacity: 1,
                                            y: 0,
                                            transition: { duration: 0.35, ease: easeOut },
                                        },
                                    }}
                                >
                                    <div className={cx("itemHeader")}>
                                        <div className={cx("kanjiGlyph", levelLower)}>
                                            {item.kanji}
                                        </div>
                                        <div className={cx("itemInfo")}>
                                            <div className={cx("itemTitleRow")}>
                                                <h3 className={cx("itemTitle")}>{item.mean}</h3>
                                                <span
                                                    className={cx(
                                                        "badge",
                                                        "badgeLevel",
                                                        levelLower,
                                                    )}
                                                >
                                                    {item.level}
                                                </span>
                                            </div>
                                            <p className={cx("meaning")}>{item.detail}</p>
                                            <div className={cx("kanjiMeta")}>
                                                <span>
                                                    Kun: <strong>{item.kun || "—"}</strong>
                                                </span>
                                                <span>
                                                    On: <strong>{item.on || "—"}</strong>
                                                </span>
                                                <span>
                                                    Strokes:{" "}
                                                    <strong>{item.stroke_count || "—"}</strong>
                                                </span>
                                            </div>
                                        </div>

                                        <div className={cx("actions")}>
                                            <button
                                                type="button"
                                                className={cx("editBtn")}
                                                onClick={() => openEditForm(item)}
                                            >
                                                <FontAwesomeIcon icon={faPenToSquare} />
                                            </button>
                                            <button
                                                type="button"
                                                className={cx("deleteBtn")}
                                                onClick={() => handleDelete(item._id)}
                                            >
                                                <FontAwesomeIcon icon={faTrash} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}

                        {filteredItems.length === 0 && (
                            <Card className={cx("emptyCard")}>
                                <div className={cx("emptyIcon")}>
                                    <FontAwesomeIcon icon={faMagnifyingGlass} />
                                </div>
                                <p className={cx("emptyText")}>Không tìm thấy mục phù hợp</p>
                            </Card>
                        )}
                    </motion.div>
                </div>
            </main>
        </div>
    );
}

export default DictionaryAdmin;
