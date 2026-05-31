import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";

import Button from "~/components/Button";
import Input from "~/components/Input";
import { useToast } from "~/context/ToastContext";
import {
    createJlptGrammar,
    createJlptKanji,
    createJlptWord,
    getJlptGrammarAdminById,
    getJlptKanjiAdminById,
    getJlptWordAdminById,
    updateJlptGrammar,
    updateJlptKanji,
    updateJlptWord,
} from "~/services/jlptService";
import styles from "../DictionaryAdmin.module.scss";

const cx = classNames.bind(styles);

const LEVEL_OPTIONS = ["N5", "N4", "N3", "N2", "N1"];
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

const RESOURCE_META = {
    jlpt_word: { tab: "words", label: "Từ vựng" },
    jlpt_grammar: { tab: "grammar", label: "Ngữ pháp" },
    jlpt_kanji: { tab: "kanji", label: "Kanji" },
};

function unwrapResponse(response) {
    return response?.data?.data || response?.data || response || null;
}

function blankMeaning() {
    return { meaning: "", examples: [] };
}

function blankWordExample() {
    return { jp: "", vi: "" };
}

function blankUsage() {
    return { explain: "", synopsis: "", examples: [] };
}

function blankGrammarExample() {
    return { content: "", transcription: "", meaning: "" };
}

function blankKanjiExample() {
    return { w: "", m: "", p: "", h: "" };
}

function normalizeMeanings(meanings) {
    if (!Array.isArray(meanings) || meanings.length === 0) return [blankMeaning()];
    return meanings.map((item) => ({
        meaning: item?.meaning || "",
        examples: Array.isArray(item?.examples)
            ? item.examples.map((example) => ({
                jp: example?.jp || "",
                vi: example?.vi || "",
            }))
            : [],
    }));
}

function normalizeUsages(usages) {
    if (!Array.isArray(usages)) return [];
    return usages.map((usage) => ({
        explain: usage?.explain || "",
        synopsis: usage?.synopsis || "",
        examples: Array.isArray(usage?.examples)
            ? usage.examples.map((example) => ({
                content: example?.content || "",
                transcription: example?.transcription || "",
                meaning: example?.meaning || "",
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

function normalizeDetailText(value) {
    return String(value || "")
        .replace(/\\n/g, "\n")
        .replace(/\r\n?/g, "\n")
        .replace(/\n{2,}/g, "\n")
        .trim();
}

function defaultForm(resource) {
    if (resource === "jlpt_word") {
        return {
            word: "",
            phonetic: "",
            type: "",
            meanings: [blankMeaning()],
            level: "N5",
            isJlpt: true,
        };
    }

    if (resource === "jlpt_grammar") {
        return {
            title: "",
            mean: "",
            usages: [],
            level: "N5",
            isJlpt: true,
        };
    }

    return {
        kanji: "",
        mean: "",
        detail: "",
        kun: "",
        on: "",
        stroke_count: "",
        examples: [],
        level: "N5",
        isJlpt: true,
    };
}

function DictionaryForm() {
    const { resource, id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const meta = RESOURCE_META[resource];
    const isUpdate = Boolean(id);
    const backTab = searchParams.get("tab") || meta?.tab || "words";
    const backUrl = `/admin/dictionary?tab=${backTab}`;
    const [formState, setFormState] = useState(() => defaultForm(resource));
    const [formError, setFormError] = useState("");
    const [isLoading, setIsLoading] = useState(isUpdate);
    const [isSaving, setIsSaving] = useState(false);

    const title = useMemo(() => {
        if (!meta) return "Dictionary";
        return `${isUpdate ? "Cập nhật" : "Thêm mới"} ${meta.label}`;
    }, [isUpdate, meta]);

    useEffect(() => {
        if (!meta) {
            navigate("/admin/dictionary", { replace: true });
            return;
        }

        setFormState(defaultForm(resource));
        setFormError("");

        if (!isUpdate) {
            setIsLoading(false);
            return;
        }

        let isActive = true;
        async function loadDetail() {
            try {
                setIsLoading(true);
                let response;
                if (resource === "jlpt_word") response = await getJlptWordAdminById(id);
                if (resource === "jlpt_grammar") response = await getJlptGrammarAdminById(id);
                if (resource === "jlpt_kanji") response = await getJlptKanjiAdminById(id);
                if (!isActive) return;

                const item = unwrapResponse(response);
                if (!item) throw new Error("Empty detail response");
                fillForm(item);
            } catch (error) {
                console.error("Load dictionary item error:", error);
                if (isActive) setFormError("Không tải được dữ liệu để chỉnh sửa.");
            } finally {
                if (isActive) setIsLoading(false);
            }
        }

        loadDetail();
        return () => {
            isActive = false;
        };
    // fillForm is intentionally kept as a local mapper for the active resource.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resource, id, isUpdate, meta, navigate]);

    function fillForm(item) {
        if (resource === "jlpt_word") {
            setFormState({
                word: item.word || "",
                phonetic: Array.isArray(item.phonetic) ? item.phonetic.join(", ") : item.phonetic || "",
                type: item.type || "",
                meanings: normalizeMeanings(item.meanings),
                level: item.level || "N5",
                isJlpt: item.isJlpt ?? true,
            });
            return;
        }

        if (resource === "jlpt_grammar") {
            setFormState({
                title: item.title || "",
                mean: item.mean || "",
                usages: normalizeUsages(item.usages),
                level: item.level || "N5",
                isJlpt: item.isJlpt ?? true,
            });
            return;
        }

        setFormState({
            kanji: item.kanji || "",
            mean: item.mean || "",
            detail: normalizeDetailText(item.detail),
            kun: item.kun || "",
            on: item.on || "",
            stroke_count: item.stroke_count || "",
            examples: normalizeKanjiExamples(item.examples),
            level: item.level || "N5",
            isJlpt: item.isJlpt ?? true,
        });
    }

    function buildWordPayload() {
        const phonetic = formState.phonetic
            ? formState.phonetic.split(",").map((value) => value.trim()).filter(Boolean)
            : [];
        const meanings = normalizeMeanings(formState.meanings)
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
            return { ok: false, error: "Vui lòng điền đầy đủ: Từ, Level." };
        }
        if (phonetic.length === 0) return { ok: false, error: "Vui lòng nhập ít nhất một phiên âm." };
        if (meanings.length === 0) return { ok: false, error: "Vui lòng nhập ít nhất một nghĩa." };

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

    function buildGrammarPayload() {
        if (!formState.title?.trim() || !formState.mean?.trim() || !formState.level) {
            return { ok: false, error: "Vui lòng điền đầy đủ: Mẫu ngữ pháp, Nghĩa, Level." };
        }

        const usages = normalizeUsages(formState.usages)
            .map((usage) => {
                const examples = (usage.examples || [])
                    .map((example) => ({
                        content: (example.content || "").trim(),
                        transcription: (example.transcription || "").trim(),
                        meaning: (example.meaning || "").trim(),
                    }))
                    .filter((example) => example.content);
                const nextUsage = {
                    explain: (usage.explain || "").trim(),
                    synopsis: (usage.synopsis || "").trim(),
                };
                if (examples.length > 0) nextUsage.examples = examples;
                return nextUsage;
            })
            .filter((usage) => usage.explain || usage.synopsis || usage.examples?.length > 0);

        return {
            ok: true,
            payload: {
                title: formState.title.trim(),
                mean: formState.mean.trim(),
                level: formState.level,
                usages,
                isJlpt: !!formState.isJlpt,
            },
        };
    }

    function buildKanjiPayload() {
        if (!formState.kanji?.trim() || !formState.mean?.trim() || !formState.level) {
            return { ok: false, error: "Vui lòng điền đầy đủ: Kanji, Nghĩa, Level." };
        }

        const examples = normalizeKanjiExamples(formState.examples)
            .map((example) => ({
                w: (example.w || "").trim(),
                m: (example.m || "").trim(),
                p: (example.p || "").trim(),
                h: (example.h || "").trim(),
            }))
            .filter((example) => example.w || example.m || example.p || example.h);
        if (examples.some((example) => !example.w || !example.m || !example.p)) {
            return { ok: false, error: "Mỗi ví dụ Kanji cần có đủ Từ ví dụ, Nghĩa và Phát âm." };
        }

        return {
            ok: true,
            payload: {
                kanji: formState.kanji.trim(),
                mean: formState.mean.trim(),
                detail: normalizeDetailText(formState.detail),
                kun: formState.kun || "",
                on: formState.on || "",
                stroke_count: formState.stroke_count || "",
                examples,
                level: formState.level,
                isJlpt: !!formState.isJlpt,
            },
        };
    }

    function buildPayload() {
        if (resource === "jlpt_word") return buildWordPayload();
        if (resource === "jlpt_grammar") return buildGrammarPayload();
        return buildKanjiPayload();
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setFormError("");

        const built = buildPayload();
        if (!built.ok) {
            setFormError(built.error);
            return;
        }

        try {
            setIsSaving(true);
            if (resource === "jlpt_word") {
                isUpdate ? await updateJlptWord(id, built.payload) : await createJlptWord(built.payload);
            } else if (resource === "jlpt_grammar") {
                isUpdate ? await updateJlptGrammar(id, built.payload) : await createJlptGrammar(built.payload);
            } else {
                isUpdate ? await updateJlptKanji(id, built.payload) : await createJlptKanji(built.payload);
            }
            addToast(
                isUpdate ? `Đã cập nhật ${meta.label}.` : `Đã thêm mới ${meta.label}.`,
                "success",
            );
            navigate(backUrl);
        } catch (error) {
            console.error("Save dictionary item error:", error);
            setFormError(isUpdate ? "Cập nhật thất bại." : "Thêm mới thất bại.");
        } finally {
            setIsSaving(false);
        }
    }

    function renderLevelAndJlpt() {
        return (
            <>
                <div className={cx("formField")}>
                    <label className={cx("label")}>Level</label>
                    <select
                        className={cx("select")}
                        value={formState.level || "N5"}
                        onChange={(event) => setFormState((state) => ({ ...state, level: event.target.value }))}
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
                        onChange={(event) => setFormState((state) => ({ ...state, isJlpt: event.target.checked }))}
                    />
                    <span>JLPT item</span>
                </label>
            </>
        );
    }

    function renderWordForm() {
        const meanings = normalizeMeanings(formState.meanings);
        return (
            <>
                <div className={cx("formField")}>
                    <label className={cx("label")}>Từ</label>
                    <Input value={formState.word || ""} onChange={(event) => setFormState((state) => ({ ...state, word: event.target.value }))} />
                </div>
                <div className={cx("formField")}>
                    <label className={cx("label")}>Phonetic (phân tách bằng ,)</label>
                    <Input value={formState.phonetic || ""} onChange={(event) => setFormState((state) => ({ ...state, phonetic: event.target.value }))} />
                </div>
                <div className={cx("formField")}>
                    <label className={cx("label")}>Loại từ</label>
                    <select className={cx("select")} value={formState.type || ""} onChange={(event) => setFormState((state) => ({ ...state, type: event.target.value }))}>
                        <option value="">-- Chọn loại từ --</option>
                        {TYPE_OPTIONS.map((type) => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>
                {renderLevelAndJlpt()}
                <div className={cx("formField", "formFieldFull")}>
                    <div className={cx("nestedHeader")}>
                        <label className={cx("label")}>Nghĩa và ví dụ</label>
                        <button type="button" className={cx("smallBtn")} onClick={() => setFormState((state) => ({ ...state, meanings: [...meanings, blankMeaning()] }))}>
                            <FontAwesomeIcon icon={faPlus} /> Thêm nghĩa
                        </button>
                    </div>
                    <div className={cx("nestedEditor")}>
                        {meanings.map((meaning, meaningIndex) => (
                            <div className={cx("nestedCard")} key={meaningIndex}>
                                <div className={cx("nestedHeader")}>
                                    <span className={cx("nestedTitle")}>Nghĩa {meaningIndex + 1}</span>
                                    <button type="button" className={cx("dangerTextBtn")} onClick={() => setFormState((state) => ({ ...state, meanings: meanings.length > 1 ? meanings.filter((_, index) => index !== meaningIndex) : [blankMeaning()] }))}>
                                        <FontAwesomeIcon icon={faTrash} /> Xóa
                                    </button>
                                </div>
                                <Input
                                    value={meaning.meaning || ""}
                                    placeholder="Nghĩa"
                                    onChange={(event) => {
                                        const next = [...meanings];
                                        next[meaningIndex] = { ...next[meaningIndex], meaning: event.target.value };
                                        setFormState((state) => ({ ...state, meanings: next }));
                                    }}
                                />
                                <div className={cx("nestedSubHeader")}>
                                    <span>Ví dụ</span>
                                    <button type="button" className={cx("smallBtn")} onClick={() => {
                                        const next = [...meanings];
                                        next[meaningIndex] = { ...next[meaningIndex], examples: [...(next[meaningIndex].examples || []), blankWordExample()] };
                                        setFormState((state) => ({ ...state, meanings: next }));
                                    }}>
                                        Thêm ví dụ
                                    </button>
                                </div>
                                {(meaning.examples || []).map((example, exampleIndex) => (
                                    <div className={cx("inlineGrid")} key={exampleIndex}>
                                        <Input value={example.jp || ""} placeholder="Câu tiếng Nhật" onChange={(event) => updateWordExample(meaningIndex, exampleIndex, "jp", event.target.value)} />
                                        <Input value={example.vi || ""} placeholder="Nghĩa tiếng Việt" onChange={(event) => updateWordExample(meaningIndex, exampleIndex, "vi", event.target.value)} />
                                        <button type="button" className={cx("dangerTextBtn")} onClick={() => removeWordExample(meaningIndex, exampleIndex)}>Xóa</button>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </>
        );
    }

    function updateWordExample(meaningIndex, exampleIndex, field, value) {
        const meanings = normalizeMeanings(formState.meanings);
        const examples = [...(meanings[meaningIndex].examples || [])];
        examples[exampleIndex] = { ...examples[exampleIndex], [field]: value };
        meanings[meaningIndex] = { ...meanings[meaningIndex], examples };
        setFormState((state) => ({ ...state, meanings }));
    }

    function removeWordExample(meaningIndex, exampleIndex) {
        const meanings = normalizeMeanings(formState.meanings);
        meanings[meaningIndex] = {
            ...meanings[meaningIndex],
            examples: (meanings[meaningIndex].examples || []).filter((_, index) => index !== exampleIndex),
        };
        setFormState((state) => ({ ...state, meanings }));
    }

    function renderGrammarForm() {
        const usages = normalizeUsages(formState.usages);
        return (
            <>
                <div className={cx("formField")}>
                    <label className={cx("label")}>Mẫu ngữ pháp</label>
                    <Input value={formState.title || ""} onChange={(event) => setFormState((state) => ({ ...state, title: event.target.value }))} />
                </div>
                <div className={cx("formField")}>
                    <label className={cx("label")}>Nghĩa</label>
                    <Input value={formState.mean || ""} onChange={(event) => setFormState((state) => ({ ...state, mean: event.target.value }))} />
                </div>
                {renderLevelAndJlpt()}
                <div className={cx("formField", "formFieldFull")}>
                    <div className={cx("nestedHeader")}>
                        <label className={cx("label")}>Cách dùng và ví dụ</label>
                        <button type="button" className={cx("smallBtn")} onClick={() => setFormState((state) => ({ ...state, usages: [...usages, blankUsage()] }))}>
                            <FontAwesomeIcon icon={faPlus} /> Thêm cách dùng
                        </button>
                    </div>
                    <div className={cx("nestedEditor")}>
                        {usages.map((usage, usageIndex) => (
                            <div className={cx("nestedCard")} key={usageIndex}>
                                <div className={cx("nestedHeader")}>
                                    <span className={cx("nestedTitle")}>Cách dùng {usageIndex + 1}</span>
                                    <button type="button" className={cx("dangerTextBtn")} onClick={() => setFormState((state) => ({ ...state, usages: usages.filter((_, index) => index !== usageIndex) }))}>
                                        <FontAwesomeIcon icon={faTrash} /> Xóa
                                    </button>
                                </div>
                                <Input value={usage.explain || ""} placeholder="Giải thích" onChange={(event) => updateUsage(usageIndex, "explain", event.target.value)} />
                                <Input value={usage.synopsis || ""} placeholder="Công thức / tóm tắt" onChange={(event) => updateUsage(usageIndex, "synopsis", event.target.value)} />
                                <div className={cx("nestedSubHeader")}>
                                    <span>Ví dụ</span>
                                    <button type="button" className={cx("smallBtn")} onClick={() => addGrammarExample(usageIndex)}>Thêm ví dụ</button>
                                </div>
                                {(usage.examples || []).map((example, exampleIndex) => (
                                    <div className={cx("inlineGrid", "grammarExampleGrid")} key={exampleIndex}>
                                        <Input value={example.content || ""} placeholder="Câu ví dụ" onChange={(event) => updateGrammarExample(usageIndex, exampleIndex, "content", event.target.value)} />
                                        <Input value={example.transcription || ""} placeholder="Phiên âm" onChange={(event) => updateGrammarExample(usageIndex, exampleIndex, "transcription", event.target.value)} />
                                        <Input value={example.meaning || ""} placeholder="Nghĩa" onChange={(event) => updateGrammarExample(usageIndex, exampleIndex, "meaning", event.target.value)} />
                                        <button type="button" className={cx("dangerTextBtn")} onClick={() => removeGrammarExample(usageIndex, exampleIndex)}>Xóa</button>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </>
        );
    }

    function updateUsage(usageIndex, field, value) {
        const usages = normalizeUsages(formState.usages);
        usages[usageIndex] = { ...usages[usageIndex], [field]: value };
        setFormState((state) => ({ ...state, usages }));
    }

    function addGrammarExample(usageIndex) {
        const usages = normalizeUsages(formState.usages);
        usages[usageIndex] = { ...usages[usageIndex], examples: [...(usages[usageIndex].examples || []), blankGrammarExample()] };
        setFormState((state) => ({ ...state, usages }));
    }

    function updateGrammarExample(usageIndex, exampleIndex, field, value) {
        const usages = normalizeUsages(formState.usages);
        const examples = [...(usages[usageIndex].examples || [])];
        examples[exampleIndex] = { ...examples[exampleIndex], [field]: value };
        usages[usageIndex] = { ...usages[usageIndex], examples };
        setFormState((state) => ({ ...state, usages }));
    }

    function removeGrammarExample(usageIndex, exampleIndex) {
        const usages = normalizeUsages(formState.usages);
        usages[usageIndex] = {
            ...usages[usageIndex],
            examples: (usages[usageIndex].examples || []).filter((_, index) => index !== exampleIndex),
        };
        setFormState((state) => ({ ...state, usages }));
    }

    function renderKanjiForm() {
        const examples = normalizeKanjiExamples(formState.examples);
        return (
            <>
                <div className={cx("formField")}>
                    <label className={cx("label")}>Kanji</label>
                    <Input value={formState.kanji || ""} onChange={(event) => setFormState((state) => ({ ...state, kanji: event.target.value }))} />
                </div>
                <div className={cx("formField")}>
                    <label className={cx("label")}>Nghĩa</label>
                    <Input value={formState.mean || ""} onChange={(event) => setFormState((state) => ({ ...state, mean: event.target.value }))} />
                </div>
                <div className={cx("formField", "formFieldFull")}>
                    <label className={cx("label")}>Detail</label>
                    <textarea
                        className={cx("textarea", "detailTextarea")}
                        value={formState.detail || ""}
                        onChange={(event) => setFormState((state) => ({ ...state, detail: event.target.value }))}
                    />
                </div>
                <div className={cx("formField")}>
                    <label className={cx("label")}>Kun</label>
                    <Input value={formState.kun || ""} onChange={(event) => setFormState((state) => ({ ...state, kun: event.target.value }))} />
                </div>
                <div className={cx("formField")}>
                    <label className={cx("label")}>On</label>
                    <Input value={formState.on || ""} onChange={(event) => setFormState((state) => ({ ...state, on: event.target.value }))} />
                </div>
                <div className={cx("formField")}>
                    <label className={cx("label")}>Stroke Count</label>
                    <Input value={formState.stroke_count || ""} onChange={(event) => setFormState((state) => ({ ...state, stroke_count: event.target.value }))} />
                </div>
                {renderLevelAndJlpt()}
                <div className={cx("formField", "formFieldFull")}>
                    <div className={cx("nestedHeader")}>
                        <label className={cx("label")}>Ví dụ Kanji</label>
                        <button type="button" className={cx("smallBtn")} onClick={() => setFormState((state) => ({ ...state, examples: [...examples, blankKanjiExample()] }))}>
                            <FontAwesomeIcon icon={faPlus} /> Thêm ví dụ
                        </button>
                    </div>
                    <div className={cx("nestedEditor")}>
                        {examples.map((example, exampleIndex) => (
                            <div className={cx("nestedCard")} key={exampleIndex}>
                                <div className={cx("inlineGrid", "kanjiExampleGrid")}>
                                    {["w", "m", "p", "h"].map((field) => (
                                        <Input
                                            key={field}
                                            value={example[field] || ""}
                                            placeholder={{ w: "Từ ví dụ", m: "Nghĩa", p: "Phát âm", h: "Hán Việt" }[field]}
                                            onChange={(event) => updateKanjiExample(exampleIndex, field, event.target.value)}
                                        />
                                    ))}
                                    <button type="button" className={cx("dangerTextBtn")} onClick={() => setFormState((state) => ({ ...state, examples: examples.filter((_, index) => index !== exampleIndex) }))}>
                                        Xóa
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </>
        );
    }

    function updateKanjiExample(exampleIndex, field, value) {
        const examples = normalizeKanjiExamples(formState.examples);
        examples[exampleIndex] = { ...examples[exampleIndex], [field]: value };
        setFormState((state) => ({ ...state, examples }));
    }

    function renderFields() {
        if (resource === "jlpt_word") return renderWordForm();
        if (resource === "jlpt_grammar") return renderGrammarForm();
        return renderKanjiForm();
    }

    if (!meta) return null;

    return (
        <div className={cx("wrapper")}>
            <main className={cx("main")}>
                <div className={cx("inner")}>
                    <div className={cx("header")}>
                        <div className={cx("headerMain")}>
                            <div className={cx("titleBlock")}>
                                <button type="button" className={cx("backBtn")} onClick={() => navigate(backUrl)}>
                                    <FontAwesomeIcon icon={faArrowLeft} />
                                    <span>Quay lại</span>
                                </button>
                                <h1 className={cx("title")}>{title}</h1>
                                <p className={cx("subtitle")}>Quản lý dữ liệu {meta.label.toLowerCase()} trong từ điển admin.</p>
                            </div>
                        </div>
                    </div>

                    <div className={cx("formCard")}>
                        <div className={cx("formInner")}>
                            {isLoading ? (
                                <div className={cx("tableState")}>Đang tải dữ liệu...</div>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    {formError && <div className={cx("formError")}>{formError}</div>}
                                    <div className={cx("formGrid")}>{renderFields()}</div>
                                    <div className={cx("formActions")}>
                                        <Button outline type="button" onClick={() => navigate(backUrl)}>
                                            Hủy
                                        </Button>
                                        <Button
                                            primary
                                            type="submit"
                                            disabled={isSaving}
                                            className={cx("blackSubmitBtn")}
                                        >
                                            {isSaving ? "Đang lưu..." : isUpdate ? "Cập nhật" : "Thêm mới"}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default DictionaryForm;
