import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import classNames from "classnames/bind";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faChevronDown,
    faChevronLeft,
    faChevronRight,
    faMagnifyingGlass,
    faPenToSquare,
    faPlus,
    faRotateRight,
    faTrash,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";

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

const LEVEL_OPTIONS = ["N5", "N4", "N3", "N2", "N1"];
const PAGE_SIZE_OPTIONS = [25, 50, 100];
const LEVEL_FILTER_OPTIONS = [
    { value: "all", label: "Tất cả cấp độ" },
    ...LEVEL_OPTIONS.map((level) => ({ value: level, label: level })),
];
const PAGE_SIZE_FILTER_OPTIONS = PAGE_SIZE_OPTIONS.map((size) => ({
    value: size,
    label: `${size} / trang`,
}));
const RESOURCE_BY_TAB = {
    words: "jlpt_word",
    grammar: "jlpt_grammar",
    kanji: "jlpt_kanji",
};
const VALID_TABS = ["words", "grammar", "kanji"];

const TAB_META = {
    words: {
        label: "Từ vựng",
        noun: "từ vựng",
        placeholder: "Tìm từ / phiên âm / nghĩa / loại từ...",
    },
    grammar: {
        label: "Ngữ pháp",
        noun: "ngữ pháp",
        placeholder: "Tìm mẫu ngữ pháp / ý nghĩa...",
    },
    kanji: {
        label: "Kanji",
        noun: "kanji",
        placeholder: "Tìm kanji / nghĩa / âm đọc...",
    },
};

function unwrapCreateResponse(resJson) {
    if (!resJson) return null;
    return resJson?.data?.data || resJson?.data || resJson || null;
}

function unwrapAdminResponse(resJson) {
    const payload =
        resJson?.data && Array.isArray(resJson.data)
            ? resJson
            : resJson?.data?.data && Array.isArray(resJson.data.data)
                ? resJson.data
                : resJson || {};

    const data = Array.isArray(payload.data) ? payload.data : [];
    const total = Number(payload.total) || data.length;
    const totalPages = Math.max(Number(payload.totalPages) || 1, 1);
    const currentPage = Math.max(Number(payload.currentPage) || 1, 1);

    return { data, total, totalPages, currentPage };
}

function listText(value, separator = ", ") {
    if (Array.isArray(value)) {
        return value.filter(Boolean).join(separator) || "-";
    }
    return value || "-";
}

function meaningsText(meanings) {
    if (!Array.isArray(meanings) || meanings.length === 0) return "-";
    return meanings
        .map((item) => item?.meaning || item)
        .filter(Boolean)
        .join(", ") || "-";
}

function formatDate(value) {
    if (!value) return "-";
    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

function getItemId(item) {
    return item?._id || item?.id;
}

function createBlankMeaning() {
    return { meaning: "", examples: [] };
}

function createBlankWordExample() {
    return { jp: "", vi: "" };
}

function createBlankKanjiExample() {
    return { w: "", m: "", p: "", h: "" };
}

function normalizeWordMeanings(meanings) {
    if (!Array.isArray(meanings) || meanings.length === 0) return [createBlankMeaning()];

    return meanings.map((meaning) => ({
        meaning: meaning?.meaning || "",
        examples: Array.isArray(meaning?.examples)
            ? meaning.examples.map((example) => ({
                jp: example?.jp || "",
                vi: example?.vi || "",
            }))
            : [],
    }));
}

function normalizeKanjiExamples(examples) {
    if (!Array.isArray(examples)) return [];

    return examples.map((example) => ({
        w: example?.w || "",
        m: example?.m || "",
        p: example?.p || "",
        h: example?.h || "",
    }));
}

function toJsonEditorValue(value) {
    if (!value || (typeof value === "object" && Object.keys(value).length === 0)) {
        return "";
    }

    return JSON.stringify(value, null, 2);
}

function AdminSelect({ className, options, value, onChange, ariaLabel }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const selectedOption =
        options.find((option) => option.value === value) || options[0];

    useEffect(() => {
        function handlePointerDown(event) {
            if (ref.current && !ref.current.contains(event.target)) {
                setOpen(false);
            }
        }

        function handleKeyDown(event) {
            if (event.key === "Escape") {
                setOpen(false);
            }
        }

        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    return (
        <div className={cx("adminSelect", className, { open })} ref={ref}>
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
                            className={cx("adminSelectOption", {
                                selected: option.value === value,
                            })}
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

function DictionaryAdmin() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const tabFromUrl = searchParams.get("tab");
    const [activeTab, setActiveTab] = useState(
        VALID_TABS.includes(tabFromUrl) ? tabFromUrl : "words",
    );
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [levelFilter, setLevelFilter] = useState("all");
    const [pageSize, setPageSize] = useState(25);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({
        total: 0,
        totalPages: 1,
        currentPage: 1,
    });
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [formState, setFormState] = useState({});
    const [formError, setFormError] = useState("");

    const tabLabel = TAB_META[activeTab].noun;
    const activeResource = RESOURCE_BY_TAB[activeTab];

    // eslint-disable-next-line no-unused-vars
    function resetFormForTab(tab) {
        if (tab === "words") {
            setFormState({
                word: "",
                phonetic: "",
                type: "",
                meanings: [createBlankMeaning()],
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
                examples: [],
                example_kun: "",
                example_on: "",
                level: "N5",
                isJlpt: true,
            });
        }
    }

    useEffect(() => {
        const nextTab = searchParams.get("tab");
        if (VALID_TABS.includes(nextTab) && nextTab !== activeTab) {
            setActiveTab(nextTab);
            setCurrentPage(1);
            setEditingItem(null);
            setDeleteTarget(null);
            setShowAddForm(false);
            setItems([]);
        }
    }, [searchParams, activeTab]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setDebouncedSearch(searchQuery.trim());
        }, 350);

        return () => window.clearTimeout(timeoutId);
    }, [searchQuery]);

    useEffect(() => {
        let isActive = true;

        async function loadItems() {
            try {
                setIsLoading(true);
                setLoadError("");

                const level = levelFilter === "all" ? "" : levelFilter;
                const args = [currentPage, pageSize, level, debouncedSearch, false];
                let response;

                if (activeTab === "words") {
                    response = await getJlptWordsAdmin(...args);
                } else if (activeTab === "grammar") {
                    response = await getJlptGrammarAdmin(...args);
                } else {
                    response = await getJlptKanjiAdmin(...args);
                }

                if (!isActive) return;

                const next = unwrapAdminResponse(response);
                setItems(next.data);
                setPagination({
                    total: next.total,
                    totalPages: next.totalPages,
                    currentPage: next.currentPage,
                });
            } catch (err) {
                if (!isActive) return;
                console.error("Load dictionary admin error:", err);
                setItems([]);
                setPagination({ total: 0, totalPages: 1, currentPage: 1 });
                setLoadError("Không tải được dữ liệu. Vui lòng thử lại.");
            } finally {
                if (isActive) setIsLoading(false);
            }
        }

        loadItems();

        return () => {
            isActive = false;
        };
    }, [activeTab, currentPage, pageSize, levelFilter, debouncedSearch, refreshKey]);

    function requestReload() {
        setRefreshKey((key) => key + 1);
    }

    function handleTabChange(tab) {
        setActiveTab(tab);
        navigate(`/admin/dictionary?tab=${tab}`, { replace: true });
        setSearchQuery("");
        setDebouncedSearch("");
        setLevelFilter("all");
        setCurrentPage(1);
        setEditingItem(null);
        setDeleteTarget(null);
        setFormError("");
        setShowAddForm(false);
        setItems([]);
    }

    async function createWord(payload) {
        try {
            const resp = await fetch(`${BASE_URL}/jlpt-word`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const body = await resp.json().catch(() => null);
            if (!resp.ok) return { ok: false, error: body || { status: resp.status } };
            const newItem = unwrapCreateResponse(body);
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
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const body = await resp.json().catch(() => null);
            if (!resp.ok) return { ok: false, error: body || { status: resp.status } };
            const newItem = unwrapCreateResponse(body);
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
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const body = await resp.json().catch(() => null);
            if (!resp.ok) return { ok: false, error: body || { status: resp.status } };
            const newItem = unwrapCreateResponse(body);
            if (!newItem) return { ok: false, error: body };
            return { ok: true, item: newItem };
        } catch (err) {
            return { ok: false, error: err };
        }
    }

    function parseOptionalRecordJson(label, value) {
        const raw = (value || "").trim();
        if (!raw) return { ok: true, value: {} };

        try {
            const parsed = JSON.parse(raw);
            if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
                return { ok: false, error: `${label} phải là JSON object.` };
            }

            return { ok: true, value: parsed };
        } catch {
            return { ok: false, error: `${label} không phải JSON hợp lệ.` };
        }
    }

    function buildWordPayload() {
        const phonetic = formState.phonetic
            ? formState.phonetic.split(",").map((s) => s.trim()).filter(Boolean)
            : [];
        const meanings = normalizeWordMeanings(formState.meanings)
            .map((meaning) => ({
                meaning: (meaning.meaning || "").trim(),
                examples: (meaning.examples || [])
                    .map((example) => ({
                        jp: (example.jp || "").trim(),
                        vi: (example.vi || "").trim(),
                    }))
                    .filter((example) => example.jp),
            }))
            .filter((meaning) => meaning.meaning);

        if (!formState.word?.trim() || !formState.level) {
            return { ok: false, error: "Vui lòng điền đầy đủ: Từ, Level" };
        }
        if (phonetic.length === 0) {
            return { ok: false, error: "Vui lòng nhập ít nhất một phiên âm." };
        }
        if (meanings.length === 0) {
            return { ok: false, error: "Vui lòng nhập ít nhất một nghĩa." };
        }

        return {
            ok: true,
            payload: {
                word: formState.word.trim(),
                phonetic,
                type: formState.type || null,
                meanings,
                level: formState.level,
                isJlpt: !!formState.isJlpt,
            },
        };
    }

    function buildKanjiPayload() {
        if (!formState.kanji?.trim() || !formState.mean?.trim() || !formState.level) {
            return { ok: false, error: "Vui lòng điền đầy đủ: Kanji, Nghĩa, Level" };
        }

        const examples = normalizeKanjiExamples(formState.examples)
            .map((example) => ({
                w: (example.w || "").trim(),
                m: (example.m || "").trim(),
                p: (example.p || "").trim(),
                h: (example.h || "").trim(),
            }))
            .filter((example) => example.w || example.m || example.p || example.h);
        const invalidExample = examples.find((example) => !example.w || !example.m || !example.p);
        if (invalidExample) {
            return {
                ok: false,
                error: "Mỗi ví dụ Kanji cần có đủ Từ ví dụ, Nghĩa và Phát âm.",
            };
        }

        const exampleKun = parseOptionalRecordJson("Example Kun", formState.example_kun);
        if (!exampleKun.ok) return exampleKun;
        const exampleOn = parseOptionalRecordJson("Example On", formState.example_on);
        if (!exampleOn.ok) return exampleOn;

        const payload = {
            kanji: formState.kanji.trim(),
            mean: formState.mean.trim(),
            detail: formState.detail || "",
            kun: formState.kun || "",
            on: formState.on || "",
            stroke_count: formState.stroke_count || "",
            examples,
            level: formState.level,
            isJlpt: !!formState.isJlpt,
        };
        if (exampleKun.value) payload.example_kun = exampleKun.value;
        if (exampleOn.value) payload.example_on = exampleOn.value;

        return { ok: true, payload };
    }

    async function handleSubmitAdd(e) {
        e.preventDefault();
        setFormError("");

        if (editingItem) {
            await handleUpdateItem();
            return;
        }

        if (activeTab === "words") {
            const built = buildWordPayload();
            if (!built.ok) {
                setFormError(built.error);
                return;
            }

            const { ok, error } = await createWord(built.payload);
            if (!ok) {
                const msg = error?.message || error?.errors || "Thêm thất bại";
                alert(Array.isArray(msg) ? msg.join(", ") : JSON.stringify(msg));
                return;
            }
        } else if (activeTab === "grammar") {
            if (!formState.title || !formState.mean || !formState.level) {
                alert("Vui lòng điền đầy đủ: Tiêu đề, Ý nghĩa, Level");
                return;
            }

            const { ok, error } = await createGrammar({
                title: formState.title,
                mean: formState.mean,
                level: formState.level,
                usages: [],
                isJlpt: !!formState.isJlpt,
            });
            if (!ok) {
                const msg = error?.message || error?.errors || "Thêm thất bại";
                alert(Array.isArray(msg) ? msg.join(", ") : JSON.stringify(msg));
                return;
            }
        } else {
            const built = buildKanjiPayload();
            if (!built.ok) {
                setFormError(built.error);
                return;
            }

            const { ok, error } = await createKanji(built.payload);
            if (!ok) {
                const msg = error?.message || error?.errors || "Thêm thất bại";
                alert(Array.isArray(msg) ? msg.join(", ") : JSON.stringify(msg));
                return;
            }
        }

        setShowAddForm(false);
        setEditingItem(null);
        setCurrentPage(1);
        requestReload();
    }

    async function handleUpdateItem() {
        if (!editingItem) return;
        setFormError("");

        try {
            if (activeTab === "words") {
                const built = buildWordPayload();
                if (!built.ok) {
                    setFormError(built.error);
                    return;
                }

                await updateJlptWord(getItemId(editingItem), built.payload);
            } else if (activeTab === "grammar") {
                await updateJlptGrammar(getItemId(editingItem), {
                    title: formState.title,
                    mean: formState.mean,
                    level: formState.level,
                    usages: editingItem?.usages || [],
                });
            } else {
                const built = buildKanjiPayload();
                if (!built.ok) {
                    setFormError(built.error);
                    return;
                }

                await updateJlptKanji(getItemId(editingItem), built.payload);
            }

            setEditingItem(null);
            setShowAddForm(false);
            requestReload();
        } catch (err) {
            console.error("Update dictionary item error:", err);
            alert("Cập nhật thất bại");
        }
    }

    async function confirmDelete() {
        if (!deleteTarget) return;

        try {
            setIsDeleting(true);
            const id = getItemId(deleteTarget);

            if (activeTab === "words") {
                await deleteJlptWord(id);
            } else if (activeTab === "grammar") {
                await deleteJlptGrammar(id);
            } else {
                await deleteJlptKanji(id);
            }

            if (items.length === 1 && currentPage > 1) {
                setCurrentPage((page) => page - 1);
            } else {
                requestReload();
            }

            setDeleteTarget(null);
        } catch (err) {
            console.error("Delete dictionary item error:", err);
            setLoadError("Xóa thất bại. Vui lòng thử lại.");
        } finally {
            setIsDeleting(false);
        }
    }

    // eslint-disable-next-line no-unused-vars
    function openEditForm(item) {
        setEditingItem(item);
        setShowAddForm(true);
        setFormError("");

        if (activeTab === "words") {
            setFormState({
                word: item.word || "",
                phonetic: listText(item.phonetic, ", ").replace(/^-$/, ""),
                type: item.type || "",
                meanings: normalizeWordMeanings(item.meanings),
                level: item.level || "N5",
                isJlpt: item.isJlpt ?? true,
            });
        } else if (activeTab === "grammar") {
            setFormState({
                title: item.title || "",
                mean: item.mean || "",
                level: item.level || "N5",
                isJlpt: item.isJlpt,
            });
        } else {
            setFormState({
                kanji: item.kanji || "",
                mean: item.mean || "",
                detail: item.detail || "",
                kun: listText(item.kun, ", ").replace(/^-$/, ""),
                on: listText(item.on, ", ").replace(/^-$/, ""),
                stroke_count: item.stroke_count || "",
                examples: normalizeKanjiExamples(item.examples),
                example_kun: toJsonEditorValue(item.example_kun),
                example_on: toJsonEditorValue(item.example_on),
                level: item.level || "N5",
                isJlpt: item.isJlpt ?? true,
            });
        }
    }

    function renderTableHead() {
        if (activeTab === "words") {
            return (
                <tr>
                    <th>Từ</th>
                    <th>Phiên âm</th>
                    <th>Nghĩa</th>
                    <th>Loại từ</th>
                    <th>Level</th>
                    <th>Cập nhật</th>
                    <th>Action</th>
                </tr>
            );
        }

        if (activeTab === "grammar") {
            return (
                <tr>
                    <th>Mẫu ngữ pháp</th>
                    <th>Nghĩa</th>
                    <th>Level</th>
                    <th>Cập nhật</th>
                    <th>Action</th>
                </tr>
            );
        }

        return (
            <tr>
                <th>Kanji</th>
                <th>Nghĩa</th>
                <th>Kun</th>
                <th>On</th>
                <th>Số nét</th>
                <th>Level</th>
                <th>Action</th>
            </tr>
        );
    }

    function renderActions(item) {
        const id = getItemId(item);

        return (
            <div className={cx("tableActions")}>
                <button
                    type="button"
                    className={cx("iconAction")}
                    onClick={() =>
                        navigate(
                            `/admin/dictionary/${activeResource}/update/${id}?tab=${activeTab}`,
                        )
                    }
                    title="Sửa"
                >
                    <FontAwesomeIcon icon={faPenToSquare} />
                </button>
                <button
                    type="button"
                    className={cx("iconAction", "dangerAction")}
                    onClick={() => setDeleteTarget(item)}
                    title="Xóa mềm"
                >
                    <FontAwesomeIcon icon={faTrash} />
                </button>
            </div>
        );
    }

    function renderTableRows() {
        if (isLoading) {
            return (
                <tr>
                    <td colSpan={activeTab === "grammar" ? 5 : 7}>
                        <div className={cx("tableState")}>Đang tải dữ liệu...</div>
                    </td>
                </tr>
            );
        }

        if (!items.length) {
            return (
                <tr>
                    <td colSpan={activeTab === "grammar" ? 5 : 7}>
                        <div className={cx("tableState", "emptyState")}>
                            {loadError || "Không có dữ liệu phù hợp."}
                        </div>
                    </td>
                </tr>
            );
        }

        if (activeTab === "words") {
            return items.map((item) => (
                <tr key={getItemId(item)}>
                    <td>
                        <div className={cx("cellMain")}>{item.word || "-"}</div>
                    </td>
                    <td className={cx("mutedCell")}>{listText(item.phonetic, " ・ ")}</td>
                    <td className={cx("wideCell")}>{meaningsText(item.meanings)}</td>
                    <td>
                        <span className={cx("badge", "badgeType")}>
                            {item.type || "Chưa phân loại"}
                        </span>
                    </td>
                    <td>
                        <span className={cx("badge", "badgeLevel", (item.level || "N5").toLowerCase())}>
                            {item.level || "-"}
                        </span>
                    </td>
                    <td className={cx("mutedCell")}>{formatDate(item.updatedAt || item.createdAt)}</td>
                    <td>{renderActions(item)}</td>
                </tr>
            ));
        }

        if (activeTab === "grammar") {
            return items.map((item) => (
                <tr key={getItemId(item)}>
                    <td>
                        <div className={cx("cellMain")}>{item.title || "-"}</div>
                    </td>
                    <td className={cx("wideCell")}>{item.mean || "-"}</td>
                    <td>
                        <span className={cx("badge", "badgeLevel", (item.level || "N5").toLowerCase())}>
                            {item.level || "-"}
                        </span>
                    </td>
                    <td className={cx("mutedCell")}>{formatDate(item.updatedAt || item.createdAt)}</td>
                    <td>{renderActions(item)}</td>
                </tr>
            ));
        }

        return items.map((item) => (
            <tr key={getItemId(item)}>
                <td>
                    <div className={cx("kanjiCell")}>{item.kanji || "-"}</div>
                </td>
                <td className={cx("wideCell")}>{item.mean || "-"}</td>
                <td className={cx("mutedCell")}>{listText(item.kun, " ・ ")}</td>
                <td className={cx("mutedCell")}>{listText(item.on, " ・ ")}</td>
                <td>{item.stroke_count || "-"}</td>
                <td>
                    <span className={cx("badge", "badgeLevel", (item.level || "N5").toLowerCase())}>
                        {item.level || "-"}
                    </span>
                </td>
                <td>{renderActions(item)}</td>
            </tr>
        ));
    }

    const showingFrom = pagination.total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const showingTo = Math.min(currentPage * pageSize, pagination.total);
    const deleteTargetName =
        activeTab === "words"
            ? deleteTarget?.word
            : activeTab === "grammar"
                ? deleteTarget?.title
                : deleteTarget?.kanji;

    return (
        <div className={cx("wrapper")}>
            <main className={cx("main")}>
                <div className={cx("inner")}>
                    <motion.div
                        className={cx("header")}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: easeOut }}
                    >
                        <div className={cx("headerMain")}>
                            <div className={cx("titleBlock")}>
                                <h1 className={cx("title")}>Quản lý từ điển</h1>
                                <p className={cx("subtitle")}>
                                    <strong>{pagination.total}</strong> mục {tabLabel}
                                    {debouncedSearch ? ` · tìm "${debouncedSearch}"` : ""}
                                </p>
                            </div>

                            <div className={cx("headerRight")}>
                                <div className={cx("tabs")}>
                                    {Object.entries(TAB_META).map(([tab, meta]) => (
                                        <button
                                            key={tab}
                                            type="button"
                                            className={cx("tabBtn", { active: activeTab === tab })}
                                            onClick={() => handleTabChange(tab)}
                                        >
                                            {meta.label}
                                        </button>
                                    ))}
                                </div>

                                <motion.button
                                    type="button"
                                    className={cx("primaryBtn")}
                                    style={{
                                        backgroundColor: "#2563eb",
                                        color: "#fff",
                                        borderColor: "transparent",
                                    }}
                                    onClick={() => {
                                        navigate(
                                            `/admin/dictionary/${activeResource}/add?tab=${activeTab}`,
                                        );
                                    }}
                                    whileHover={{ y: -1, backgroundColor: "#3b82f6" }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <FontAwesomeIcon icon={faPlus} />
                                    <span>Thêm</span>
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>

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
                                                setFormError("");
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faXmark} />
                                        </button>
                                    </div>

                                    {formError && (
                                        <div className={cx("formError")}>
                                            {formError}
                                        </div>
                                    )}

                                    <form onSubmit={handleSubmitAdd}>
                                        <div className={cx("formGrid")}>
                                            {activeTab === "words" && (
                                                <>
                                                    <div className={cx("formField")}>
                                                        <label className={cx("label")}>Từ</label>
                                                        <Input
                                                            value={formState.word || ""}
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
                                                            value={formState.phonetic || ""}
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
                                                            value={formState.type || ""}
                                                            onChange={(e) =>
                                                                setFormState((s) => ({
                                                                    ...s,
                                                                    type: e.target.value,
                                                                }))
                                                            }
                                                        >
                                                            <option value="">-- Chọn loại từ --</option>
                                                            {TYPE_OPTIONS.map((type) => (
                                                                <option key={type} value={type}>
                                                                    {type}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className={cx("formField", "formFieldFull")}>
                                                        <div className={cx("nestedHeader")}>
                                                            <label className={cx("label")}>Nghĩa và ví dụ</label>
                                                            <button
                                                                type="button"
                                                                className={cx("smallBtn")}
                                                                onClick={() =>
                                                                    setFormState((s) => ({
                                                                        ...s,
                                                                        meanings: [
                                                                            ...normalizeWordMeanings(s.meanings),
                                                                            createBlankMeaning(),
                                                                        ],
                                                                    }))
                                                                }
                                                            >
                                                                Thêm nghĩa
                                                            </button>
                                                        </div>

                                                        <div className={cx("nestedEditor")}>
                                                            {normalizeWordMeanings(formState.meanings).map((meaning, meaningIndex) => (
                                                                <div className={cx("nestedCard")} key={meaningIndex}>
                                                                    <div className={cx("nestedHeader")}>
                                                                        <span className={cx("nestedTitle")}>
                                                                            Nghĩa {meaningIndex + 1}
                                                                        </span>
                                                                        <button
                                                                            type="button"
                                                                            className={cx("dangerTextBtn")}
                                                                            onClick={() =>
                                                                                setFormState((s) => {
                                                                                    const meanings = normalizeWordMeanings(s.meanings);
                                                                                    return {
                                                                                        ...s,
                                                                                        meanings:
                                                                                            meanings.length > 1
                                                                                                ? meanings.filter((_, index) => index !== meaningIndex)
                                                                                                : [createBlankMeaning()],
                                                                                    };
                                                                                })
                                                                            }
                                                                        >
                                                                            Xóa
                                                                        </button>
                                                                    </div>

                                                                    <Input
                                                                        value={meaning.meaning || ""}
                                                                        placeholder="Nghĩa"
                                                                        onChange={(e) =>
                                                                            setFormState((s) => {
                                                                                const meanings = normalizeWordMeanings(s.meanings);
                                                                                meanings[meaningIndex] = {
                                                                                    ...meanings[meaningIndex],
                                                                                    meaning: e.target.value,
                                                                                };
                                                                                return { ...s, meanings };
                                                                            })
                                                                        }
                                                                    />

                                                                    <div className={cx("nestedSubHeader")}>
                                                                        <span>Ví dụ</span>
                                                                        <button
                                                                            type="button"
                                                                            className={cx("smallBtn")}
                                                                            onClick={() =>
                                                                                setFormState((s) => {
                                                                                    const meanings = normalizeWordMeanings(s.meanings);
                                                                                    meanings[meaningIndex] = {
                                                                                        ...meanings[meaningIndex],
                                                                                        examples: [
                                                                                            ...(meanings[meaningIndex].examples || []),
                                                                                            createBlankWordExample(),
                                                                                        ],
                                                                                    };
                                                                                    return { ...s, meanings };
                                                                                })
                                                                            }
                                                                        >
                                                                            Thêm ví dụ
                                                                        </button>
                                                                    </div>

                                                                    {(meaning.examples || []).map((example, exampleIndex) => (
                                                                        <div className={cx("inlineGrid")} key={exampleIndex}>
                                                                            <Input
                                                                                value={example.jp || ""}
                                                                                placeholder="Câu tiếng Nhật"
                                                                                onChange={(e) =>
                                                                                    setFormState((s) => {
                                                                                        const meanings = normalizeWordMeanings(s.meanings);
                                                                                        const examples = [...(meanings[meaningIndex].examples || [])];
                                                                                        examples[exampleIndex] = {
                                                                                            ...examples[exampleIndex],
                                                                                            jp: e.target.value,
                                                                                        };
                                                                                        meanings[meaningIndex] = {
                                                                                            ...meanings[meaningIndex],
                                                                                            examples,
                                                                                        };
                                                                                        return { ...s, meanings };
                                                                                    })
                                                                                }
                                                                            />
                                                                            <Input
                                                                                value={example.vi || ""}
                                                                                placeholder="Nghĩa tiếng Việt"
                                                                                onChange={(e) =>
                                                                                    setFormState((s) => {
                                                                                        const meanings = normalizeWordMeanings(s.meanings);
                                                                                        const examples = [...(meanings[meaningIndex].examples || [])];
                                                                                        examples[exampleIndex] = {
                                                                                            ...examples[exampleIndex],
                                                                                            vi: e.target.value,
                                                                                        };
                                                                                        meanings[meaningIndex] = {
                                                                                            ...meanings[meaningIndex],
                                                                                            examples,
                                                                                        };
                                                                                        return { ...s, meanings };
                                                                                    })
                                                                                }
                                                                            />
                                                                            <button
                                                                                type="button"
                                                                                className={cx("dangerTextBtn")}
                                                                                onClick={() =>
                                                                                    setFormState((s) => {
                                                                                        const meanings = normalizeWordMeanings(s.meanings);
                                                                                        meanings[meaningIndex] = {
                                                                                            ...meanings[meaningIndex],
                                                                                            examples: (meanings[meaningIndex].examples || []).filter(
                                                                                                (_, index) => index !== exampleIndex,
                                                                                            ),
                                                                                        };
                                                                                        return { ...s, meanings };
                                                                                    })
                                                                                }
                                                                            >
                                                                                Xóa
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className={cx("formField")}>
                                                        <label className={cx("label")}>Level</label>
                                                        <select
                                                            className={cx("select")}
                                                            value={formState.level || "N5"}
                                                            onChange={(e) =>
                                                                setFormState((s) => ({
                                                                    ...s,
                                                                    level: e.target.value,
                                                                }))
                                                            }
                                                        >
                                                            {LEVEL_OPTIONS.map((level) => (
                                                                <option key={level} value={level}>
                                                                    {level}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <label className={cx("checkboxField")}>
                                                        <input
                                                            type="checkbox"
                                                            checked={!!formState.isJlpt}
                                                            onChange={(e) =>
                                                                setFormState((s) => ({
                                                                    ...s,
                                                                    isJlpt: e.target.checked,
                                                                }))
                                                            }
                                                        />
                                                        <span>JLPT item</span>
                                                    </label>
                                                </>
                                            )}

                                            {activeTab === "grammar" && (
                                                <>
                                                    <div className={cx("formField")}>
                                                        <label className={cx("label")}>Tiêu đề</label>
                                                        <Input
                                                            value={formState.title || ""}
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
                                                            value={formState.mean || ""}
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
                                                            value={formState.level || "N5"}
                                                            onChange={(e) =>
                                                                setFormState((s) => ({
                                                                    ...s,
                                                                    level: e.target.value,
                                                                }))
                                                            }
                                                        >
                                                            {LEVEL_OPTIONS.map((level) => (
                                                                <option key={level} value={level}>
                                                                    {level}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </>
                                            )}

                                            {activeTab === "kanji" && (
                                                <>
                                                    <div className={cx("formField")}>
                                                        <label className={cx("label")}>Kanji</label>
                                                        <Input
                                                            value={formState.kanji || ""}
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
                                                            value={formState.mean || ""}
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
                                                        <textarea
                                                            className={cx("textarea")}
                                                            value={formState.detail || ""}
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
                                                            value={formState.kun || ""}
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
                                                            value={formState.on || ""}
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
                                                            value={formState.stroke_count || ""}
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
                                                            value={formState.level || "N5"}
                                                            onChange={(e) =>
                                                                setFormState((s) => ({
                                                                    ...s,
                                                                    level: e.target.value,
                                                                }))
                                                            }
                                                        >
                                                            {LEVEL_OPTIONS.map((level) => (
                                                                <option key={level} value={level}>
                                                                    {level}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <label className={cx("checkboxField")}>
                                                        <input
                                                            type="checkbox"
                                                            checked={!!formState.isJlpt}
                                                            onChange={(e) =>
                                                                setFormState((s) => ({
                                                                    ...s,
                                                                    isJlpt: e.target.checked,
                                                                }))
                                                            }
                                                        />
                                                        <span>JLPT item</span>
                                                    </label>

                                                    <div className={cx("formField", "formFieldFull")}>
                                                        <div className={cx("nestedHeader")}>
                                                            <label className={cx("label")}>Ví dụ Kanji</label>
                                                            <button
                                                                type="button"
                                                                className={cx("smallBtn")}
                                                                onClick={() =>
                                                                    setFormState((s) => ({
                                                                        ...s,
                                                                        examples: [
                                                                            ...normalizeKanjiExamples(s.examples),
                                                                            createBlankKanjiExample(),
                                                                        ],
                                                                    }))
                                                                }
                                                            >
                                                                Thêm ví dụ
                                                            </button>
                                                        </div>

                                                        <div className={cx("nestedEditor")}>
                                                            {normalizeKanjiExamples(formState.examples).map((example, exampleIndex) => (
                                                                <div className={cx("nestedCard")} key={exampleIndex}>
                                                                    <div className={cx("inlineGrid", "kanjiExampleGrid")}>
                                                                        <Input
                                                                            value={example.w || ""}
                                                                            placeholder="Từ ví dụ"
                                                                            onChange={(e) =>
                                                                                setFormState((s) => {
                                                                                    const examples = normalizeKanjiExamples(s.examples);
                                                                                    examples[exampleIndex] = {
                                                                                        ...examples[exampleIndex],
                                                                                        w: e.target.value,
                                                                                    };
                                                                                    return { ...s, examples };
                                                                                })
                                                                            }
                                                                        />
                                                                        <Input
                                                                            value={example.m || ""}
                                                                            placeholder="Nghĩa"
                                                                            onChange={(e) =>
                                                                                setFormState((s) => {
                                                                                    const examples = normalizeKanjiExamples(s.examples);
                                                                                    examples[exampleIndex] = {
                                                                                        ...examples[exampleIndex],
                                                                                        m: e.target.value,
                                                                                    };
                                                                                    return { ...s, examples };
                                                                                })
                                                                            }
                                                                        />
                                                                        <Input
                                                                            value={example.p || ""}
                                                                            placeholder="Phát âm"
                                                                            onChange={(e) =>
                                                                                setFormState((s) => {
                                                                                    const examples = normalizeKanjiExamples(s.examples);
                                                                                    examples[exampleIndex] = {
                                                                                        ...examples[exampleIndex],
                                                                                        p: e.target.value,
                                                                                    };
                                                                                    return { ...s, examples };
                                                                                })
                                                                            }
                                                                        />
                                                                        <Input
                                                                            value={example.h || ""}
                                                                            placeholder="Hán Việt"
                                                                            onChange={(e) =>
                                                                                setFormState((s) => {
                                                                                    const examples = normalizeKanjiExamples(s.examples);
                                                                                    examples[exampleIndex] = {
                                                                                        ...examples[exampleIndex],
                                                                                        h: e.target.value,
                                                                                    };
                                                                                    return { ...s, examples };
                                                                                })
                                                                            }
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            className={cx("dangerTextBtn")}
                                                                            onClick={() =>
                                                                                setFormState((s) => ({
                                                                                    ...s,
                                                                                    examples: normalizeKanjiExamples(s.examples).filter(
                                                                                        (_, index) => index !== exampleIndex,
                                                                                    ),
                                                                                }))
                                                                            }
                                                                        >
                                                                            Xóa
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className={cx("formField")}>
                                                        <label className={cx("label")}>Example Kun (JSON)</label>
                                                        <textarea
                                                            className={cx("textarea", "jsonTextarea")}
                                                            value={formState.example_kun || ""}
                                                            placeholder={'{"ひ": [{"w": "日", "m": "mặt trời", "p": "ひ"}]}'}
                                                            onChange={(e) =>
                                                                setFormState((s) => ({
                                                                    ...s,
                                                                    example_kun: e.target.value,
                                                                }))
                                                            }
                                                        />
                                                    </div>

                                                    <div className={cx("formField")}>
                                                        <label className={cx("label")}>Example On (JSON)</label>
                                                        <textarea
                                                            className={cx("textarea", "jsonTextarea")}
                                                            value={formState.example_on || ""}
                                                            placeholder={'{"ニチ": [{"w": "日曜日", "m": "Chủ nhật", "p": "にちようび"}]}'}
                                                            onChange={(e) =>
                                                                setFormState((s) => ({
                                                                    ...s,
                                                                    example_on: e.target.value,
                                                                }))
                                                            }
                                                        />
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
                                                    setFormError("");
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

                    <motion.div
                        className={cx("filterCard")}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: easeOut, delay: 0.1 }}
                    >
                        <div className={cx("filterRow")}>
                            <div className={cx("searchWrapper")}>
                                <FontAwesomeIcon icon={faMagnifyingGlass} className={cx("searchIcon")} />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className={cx("searchInput")}
                                    placeholder={TAB_META[activeTab].placeholder}
                                />
                            </div>

                            <AdminSelect
                                className="filterSelect"
                                options={LEVEL_FILTER_OPTIONS}
                                value={levelFilter}
                                ariaLabel="Lọc theo cấp độ"
                                onChange={(nextLevel) => {
                                    setLevelFilter(nextLevel);
                                    setCurrentPage(1);
                                }}
                            />

                            <AdminSelect
                                className="pageSizeSelect"
                                options={PAGE_SIZE_FILTER_OPTIONS}
                                value={pageSize}
                                ariaLabel="Số mục mỗi trang"
                                onChange={(nextPageSize) => {
                                    setPageSize(Number(nextPageSize));
                                    setCurrentPage(1);
                                }}
                            />

                            <button
                                type="button"
                                className={cx("refreshBtn")}
                                onClick={requestReload}
                                disabled={isLoading}
                            >
                                <FontAwesomeIcon icon={faRotateRight} />
                                <span>Làm mới</span>
                            </button>
                        </div>
                    </motion.div>

                    <motion.section
                        className={cx("tablePanel")}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: easeOut, delay: 0.12 }}
                    >
                        <div className={cx("tableHeader")}>
                            <div>
                                <h2>{TAB_META[activeTab].label}</h2>
                                <p>
                                    Hiển thị {showingFrom}-{showingTo} trên {pagination.total} mục
                                </p>
                            </div>
                        </div>

                        <div className={cx("tableWrap")}>
                            <table className={cx("dictionaryTable")}>
                                <thead>{renderTableHead()}</thead>
                                <tbody>{renderTableRows()}</tbody>
                            </table>
                        </div>

                        <div className={cx("paginationBar")}>
                            <span className={cx("pageInfo")}>
                                Trang {Math.min(currentPage, pagination.totalPages)} / {pagination.totalPages}
                            </span>
                            <div className={cx("pageControls")}>
                                <button
                                    type="button"
                                    className={cx("pageButton")}
                                    disabled={currentPage <= 1 || isLoading}
                                    onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                                >
                                    <FontAwesomeIcon icon={faChevronLeft} />
                                </button>
                                <button
                                    type="button"
                                    className={cx("pageButton")}
                                    disabled={currentPage >= pagination.totalPages || isLoading}
                                    onClick={() =>
                                        setCurrentPage((page) => Math.min(page + 1, pagination.totalPages))
                                    }
                                >
                                    <FontAwesomeIcon icon={faChevronRight} />
                                </button>
                            </div>
                        </div>
                    </motion.section>
                </div>
            </main>

            <AnimatePresence>
                {deleteTarget && (
                    <motion.div
                        className={cx("modalBackdrop")}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onMouseDown={() => {
                            if (!isDeleting) setDeleteTarget(null);
                        }}
                    >
                        <motion.div
                            className={cx("confirmDialog")}
                            initial={{ opacity: 0, y: 16, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 16, scale: 0.98 }}
                            transition={{ duration: 0.2, ease: easeOut }}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <div className={cx("confirmIcon")}>
                                <FontAwesomeIcon icon={faTrash} />
                            </div>
                            <div className={cx("confirmContent")}>
                                <h3>Xác nhận xóa mềm</h3>
                                <p>
                                    Bạn có chắc muốn xóa mềm{" "}
                                    <strong>{deleteTargetName || "mục này"}</strong> khỏi danh sách?
                                </p>
                            </div>
                            <div className={cx("confirmActions")}>
                                <button
                                    type="button"
                                    className={cx("secondaryDialogBtn")}
                                    disabled={isDeleting}
                                    onClick={() => setDeleteTarget(null)}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    className={cx("dangerDialogBtn")}
                                    disabled={isDeleting}
                                    onClick={confirmDelete}
                                >
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

export default DictionaryAdmin;
