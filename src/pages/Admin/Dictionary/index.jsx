// DictionaryAdmin.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeft,
    faMagnifyingGlass,
    faPlus,
    faPenToSquare,
    faTrash,
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

const BASE_URL = "http://localhost:9090/api";

const cx = classNames.bind(styles);

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

    // POST helpers (return created item or error)
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

    // ADD/UPDATE
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

            // usages optional now. send empty array to be safe.
            const payload = {
                title: formState.title,
                mean: formState.mean,
                level: formState.level,
                usages: [], // optional, backend accepts empty
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
                usages: editingItem?.usages || [], // keep existing usages if any, otherwise empty
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

    return (
        <div className={cx("wrapper")}>
            <main className={cx("main")}>
                <div className={cx("inner")}>
                    {/* HEADER */}
                    <div className={cx("header")}>
                        <Link to="/admin" className={cx("backLink")}>
                            <FontAwesomeIcon icon={faArrowLeft} className={cx("backIcon")} />
                            <span>Quay lại bảng quản trị</span>
                        </Link>

                        <div className={cx("headerMain")}>
                            <div>
                                <h1 className={cx("title")}>Quản lý từ điển</h1>
                                <p className={cx("subtitle")}>
                                    <strong>{totalCount}</strong> mục ·{" "}
                                    {filteredItems.length !== totalCount && `${filteredItems.length} kết quả`}
                                </p>
                            </div>

                            <div style={{ display: "flex", gap: 8 }}>
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

                                <Button
                                    primary
                                    leftIcon={<FontAwesomeIcon icon={faPlus} />}
                                    onClick={() => {
                                        setEditingItem(null);
                                        resetFormForTab(activeTab);
                                        setShowAddForm((s) => !s);
                                    }}
                                >
                                    Thêm
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* FORM */}
                    {showAddForm && (
                        <Card className={cx("formCard")}>
                            <h3 className={cx("formTitle")}>
                                {editingItem ? `Cập nhật — ${activeTab}` : `Thêm mới — ${activeTab}`}
                            </h3>

                            <form onSubmit={handleSubmitAdd}>
                                <div className={cx("formGrid")}>
                                    {/* WORD FORM */}
                                    {activeTab === "words" && (
                                        <>
                                            <div className={cx("formField")}>
                                                <label className={cx("label")}>Từ</label>
                                                <Input
                                                    value={formState.word}
                                                    onChange={(e) => setFormState((s) => ({ ...s, word: e.target.value }))}
                                                />
                                            </div>

                                            <div className={cx("formField")}>
                                                <label className={cx("label")}>Phonetic (phân tách bằng , )</label>
                                                <Input
                                                    value={formState.phonetic}
                                                    onChange={(e) => setFormState((s) => ({ ...s, phonetic: e.target.value }))}
                                                />
                                            </div>

                                            <div className={cx("formField")}>
                                                <label className={cx("label")}>Loại từ</label>
                                                <select
                                                    className={cx("select")}
                                                    value={formState.type}
                                                    onChange={(e) => setFormState((s) => ({ ...s, type: e.target.value }))}
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
                                                <label className={cx("label")}>Nghĩa (phân tách bằng , )</label>
                                                <Input
                                                    value={formState.meanings}
                                                    onChange={(e) => setFormState((s) => ({ ...s, meanings: e.target.value }))}
                                                />
                                            </div>

                                            <div className={cx("formField")}>
                                                <label className={cx("label")}>Level</label>
                                                <select
                                                    className={cx("select")}
                                                    value={formState.level}
                                                    onChange={(e) => setFormState((s) => ({ ...s, level: e.target.value }))}
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
                                                    onChange={(e) => setFormState((s) => ({ ...s, title: e.target.value }))}
                                                />
                                            </div>

                                            <div className={cx("formField")}>
                                                <label className={cx("label")}>Ý nghĩa (tóm tắt)</label>
                                                <Input
                                                    value={formState.mean}
                                                    onChange={(e) => setFormState((s) => ({ ...s, mean: e.target.value }))}
                                                />
                                            </div>

                                            <div className={cx("formField")}>
                                                <label className={cx("label")}>Level</label>
                                                <select
                                                    className={cx("select")}
                                                    value={formState.level}
                                                    onChange={(e) => setFormState((s) => ({ ...s, level: e.target.value }))}
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
                                                    onChange={(e) => setFormState((s) => ({ ...s, kanji: e.target.value }))}
                                                />
                                            </div>

                                            <div className={cx("formField")}>
                                                <label className={cx("label")}>Nghĩa</label>
                                                <Input
                                                    value={formState.mean}
                                                    onChange={(e) => setFormState((s) => ({ ...s, mean: e.target.value }))}
                                                />
                                            </div>

                                            <div className={cx("formField")}>
                                                <label className={cx("label")}>Detail</label>
                                                <Input
                                                    value={formState.detail}
                                                    onChange={(e) => setFormState((s) => ({ ...s, detail: e.target.value }))}
                                                />
                                            </div>

                                            <div className={cx("formField")}>
                                                <label className={cx("label")}>Kun</label>
                                                <Input
                                                    value={formState.kun}
                                                    onChange={(e) => setFormState((s) => ({ ...s, kun: e.target.value }))}
                                                />
                                            </div>

                                            <div className={cx("formField")}>
                                                <label className={cx("label")}>On</label>
                                                <Input
                                                    value={formState.on}
                                                    onChange={(e) => setFormState((s) => ({ ...s, on: e.target.value }))}
                                                />
                                            </div>

                                            <div className={cx("formField")}>
                                                <label className={cx("label")}>Stroke Count</label>
                                                <Input
                                                    value={formState.stroke_count}
                                                    onChange={(e) => setFormState((s) => ({ ...s, stroke_count: e.target.value }))}
                                                />
                                            </div>

                                            <div className={cx("formField")}>
                                                <label className={cx("label")}>Level</label>
                                                <select
                                                    className={cx("select")}
                                                    value={formState.level}
                                                    onChange={(e) => setFormState((s) => ({ ...s, level: e.target.value }))}
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
                                    <Button primary type="submit">
                                        {editingItem ? "Cập nhật" : "Thêm"}
                                    </Button>
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
                                </div>
                            </form>
                        </Card>
                    )}

                    {/* SEARCH & FILTER */}
                    <Card className={cx("filterCard")}>
                        <div className={cx("filterRow")}>
                            <div className={cx("searchWrapper")}>
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
                    </Card>

                    {/* LIST */}
                    <div className={cx("list")}>
                        {filteredItems.map((item) => {
                            if (!item) return null;

                            if (activeTab === "words") {
                                return (
                                    <Card key={item._id} className={cx("wordCard")}>
                                        <div className={cx("wordHeader")}>
                                            <div className={cx("wordInfo")}>
                                                <div className={cx("wordTitleRow")}>
                                                    <h3 className={cx("wordTitle")}>{item.word}</h3>
                                                    <span className={cx("badge", "badgeLevel")}>{item.level}</span>
                                                    <span className={cx("badge")}>{item.type}</span>
                                                </div>

                                                <p className={cx("romaji")}>{(item.phonetic || []).join(" ・ ")}</p>

                                                <p className={cx("meaning")}>
                                                    {(item.meanings || []).map((m) => m.meaning).join(", ")}
                                                </p>
                                            </div>

                                            <div className={cx("actions")}>
                                                <Button
                                                    outline
                                                    rounded
                                                    leftIcon={<FontAwesomeIcon icon={faPenToSquare} />}
                                                    onClick={() => openEditForm(item)}
                                                />

                                                <Button
                                                    outline
                                                    rounded
                                                    className={cx("dangerBtn")}
                                                    leftIcon={<FontAwesomeIcon icon={faTrash} />}
                                                    onClick={() => handleDelete(item._id)}
                                                />
                                            </div>
                                        </div>
                                    </Card>
                                );
                            }

                            if (activeTab === "grammar") {
                                return (
                                    <Card key={item._id} className={cx("wordCard")}>
                                        <div className={cx("wordHeader")}>
                                            <div className={cx("wordInfo")}>
                                                <div className={cx("wordTitleRow")}>
                                                    <h3 className={cx("wordTitle")}>{item.title}</h3>
                                                    <span className={cx("badge", "badgeLevel")}>{item.level}</span>
                                                </div>

                                                <p className={cx("meaning")}>{item.mean}</p>
                                            </div>

                                            <div className={cx("actions")}>
                                                <Button
                                                    outline
                                                    rounded
                                                    leftIcon={<FontAwesomeIcon icon={faPenToSquare} />}
                                                    onClick={() => openEditForm(item)}
                                                />

                                                <Button
                                                    outline
                                                    rounded
                                                    className={cx("dangerBtn")}
                                                    leftIcon={<FontAwesomeIcon icon={faTrash} />}
                                                    onClick={() => handleDelete(item._id)}
                                                />
                                            </div>
                                        </div>
                                    </Card>
                                );
                            }

                            return (
                                <Card key={item._id} className={cx("wordCard")}>
                                    <div className={cx("wordHeader")}>
                                        <div className={cx("wordInfo")}>
                                            <div className={cx("wordTitleRow")}>
                                                <h3 className={cx("wordTitle")}>{item.kanji}</h3>
                                                <span className={cx("badge", "badgeLevel")}>{item.level}</span>
                                            </div>

                                            <p className={cx("romaji")}>{item.mean}</p>
                                            <p className={cx("meaning")}>{item.detail}</p>

                                            <p className={cx("romaji")}>
                                                Kun: {item.kun} · On: {item.on} · Strokes: {item.stroke_count}
                                            </p>
                                        </div>

                                        <div className={cx("actions")}>
                                            <Button
                                                outline
                                                rounded
                                                leftIcon={<FontAwesomeIcon icon={faPenToSquare} />}
                                                onClick={() => openEditForm(item)}
                                            />

                                            <Button
                                                outline
                                                rounded
                                                className={cx("dangerBtn")}
                                                leftIcon={<FontAwesomeIcon icon={faTrash} />}
                                                onClick={() => handleDelete(item._id)}
                                            />
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}

                        {filteredItems.length === 0 && (
                            <Card className={cx("emptyCard")}>
                                <p className={cx("emptyText")}>Không tìm thấy mục phù hợp</p>
                            </Card>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default DictionaryAdmin;
