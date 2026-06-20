import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faVolumeHigh,
    faCopy,
    faRightLeft,
    faPen,
    faTrash,
    faChevronDown,
    faCheck,
} from "@fortawesome/free-solid-svg-icons";

import { useToast } from "~/context/ToastContext";
import { translateText } from "~/services/traslate";
import HandwritingOverlay from "~/components/HandwritingOverlay";

const languages = [
    { code: "ja", name: "Tiếng Nhật" },
    { code: "vi", name: "Tiếng Việt" },
];

const langOptions = languages.map((l) => ({ value: l.code, label: l.name }));
const MAX_TRANSLATE_LENGTH = 5000;
const getOppositeLang = (lang) => (lang === "ja" ? "vi" : "ja");
const getLangName = (lang) =>
    languages.find((item) => item.code === lang)?.name || "";

const iconButtonClass =
    "inline-flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-[10px] border border-[#dfe7ed] bg-[#f9fbfc] text-sm text-[#667985] transition-all duration-150 hover:not-disabled:-translate-y-px hover:not-disabled:border-primary/35 hover:not-disabled:bg-[#eefaf7] hover:not-disabled:text-primary disabled:cursor-not-allowed disabled:opacity-45";

function TranslateLangSelect({ value, onChange, label }) {
    const [open, setOpen] = useState(false);
    const selectRef = useRef(null);
    const selected = langOptions.find((option) => option.value === value);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (selectRef.current && !selectRef.current.contains(event.target)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative w-full" ref={selectRef}>
            <button
                type="button"
                className={`flex min-h-[38px] w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-transparent bg-[#eaf3ff] py-0 pr-3 pl-3.5 text-[15px] font-semibold text-[#0b63d8] transition-all duration-150 hover:bg-[#dfeeff] ${open ? "bg-[#dfeeff]" : ""}`}
                onClick={() => setOpen((current) => !current)}
                aria-label={label}
                aria-expanded={open}
            >
                <span>{selected?.label || "Chọn"}</span>
                <FontAwesomeIcon
                    className={`text-xs text-[#0b63d8] transition-transform duration-150 ${open ? "rotate-180" : ""}`}
                    icon={faChevronDown}
                />
            </button>

            {open && (
                <div className="absolute left-0 top-[calc(100%+8px)] z-10 w-full rounded-xl border border-[#d7e5f0] bg-white p-1.5 shadow-[0_14px_30px_rgba(15,42,42,0.12)]">
                    {langOptions.map((option) => {
                        const isActive = option.value === value;

                        return (
                            <button
                                key={option.value}
                                type="button"
                                className={`flex min-h-[38px] w-full cursor-pointer items-center justify-between gap-3 rounded-[9px] bg-transparent py-0 pr-2.5 pl-3 text-[15px] font-semibold text-[#1f3f4d] transition-all duration-150 hover:bg-[#f2f7fb] hover:text-[#0b63d8] ${isActive ? "bg-[#eaf3ff] text-[#0b63d8]" : ""}`}
                                onClick={() => {
                                    onChange(option.value);
                                    setOpen(false);
                                }}
                            >
                                <span>{option.label}</span>
                                {isActive && (
                                    <FontAwesomeIcon className="shrink-0 text-[13px]" icon={faCheck} />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function Translate() {
    const [sourceText, setSourceText] = useState("");
    const [translatedText, setTranslatedText] = useState("");
    const [sourceLang, setSourceLang] = useState("ja");
    const [targetLang, setTargetLang] = useState("vi");
    const [isTranslating, setIsTranslating] = useState(false);
    const [showHandwritingModal, setShowHandwritingModal] = useState(false);
    const { addToast } = useToast();

    const applyRecognizedText = (text) => {
        const value = String(text || "").trim();
        if (!value) return;
        setSourceText(value);
        setSourceLang("ja");
        setTargetLang("vi");
        setTranslatedText("");
    };

    const translateWithText = async (text, source = sourceLang, target = targetLang) => {
        const value = String(text || "").trim();
        if (!value) {
            addToast("Vui lòng nhập văn bản", "info");
            return false;
        }

        if (source === target) {
            addToast("Hai ngôn ngữ giống nhau", "warning");
            return false;
        }

        try {
            setIsTranslating(true);
            const res = await translateText(value, source, target);
            setTranslatedText(res.data.translatedText);
            return true;
        } catch (error) {
            addToast("Lỗi dịch văn bản", "error");
            return false;
        } finally {
            setIsTranslating(false);
        }
    };

    const handleTranslate = async () => {
        await translateWithText(sourceText, sourceLang, targetLang);
    };

    const handleTranslateHandwriting = async (text) => {
        applyRecognizedText(text);

        const translated = await translateWithText(text, "ja", targetLang);
        if (translated) {
            setShowHandwritingModal(false);
        }
    };

    const handleSwapLanguages = () => {
        setSourceLang(targetLang);
        setTargetLang(sourceLang);
        setSourceText(translatedText);
        setTranslatedText(sourceText);
    };

    const handleSourceLangChange = (value) => {
        setSourceLang(value);
        setTargetLang(getOppositeLang(value));
        setTranslatedText("");
    };

    const handleTargetLangChange = (value) => {
        setTargetLang(value);
        setSourceLang(getOppositeLang(value));
        setTranslatedText("");
    };

    const handleCopy = (text) => {
        if (!text.trim()) return;
        navigator.clipboard.writeText(text);
        addToast("Đã sao chép!", "success");
    };

    const handleClear = () => {
        setSourceText("");
        setTranslatedText("");
    };

    const handleSpeak = (text, lang) => {
        if (!text.trim()) return;

        const utter = new SpeechSynthesisUtterance(text);

        const langMap = {
            ja: "ja-JP",
            vi: "vi-VN",
            en: "en-US",
            ko: "ko-KR",
            zh: "zh-CN",
        };

        utter.lang = langMap[lang] || "en-US";
        speechSynthesis.cancel();
        speechSynthesis.speak(utter);
    };

    return (
        <div className="relative min-h-screen bg-[#eef3f6] py-6 pb-14 text-[#0f2a2a] max-md:pt-[18px]">
            <div className="relative z-[1] mx-auto max-w-[1180px] px-6 max-md:px-3.5">
                <div className="mb-[18px] flex items-end justify-between gap-6 max-md:block">
                    <div>
                        <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-[1.2px] text-primary">
                            JAVI Translator
                        </span>
                        <h1 className="m-0 text-3xl font-extrabold tracking-normal text-[#0f2a2a] max-md:text-[26px]">
                            Dịch Nhật - Việt
                        </h1>
                    </div>
                </div>

                <div className="relative">
                    <div className="grid grid-cols-2 items-stretch gap-4 max-md:grid-cols-1 max-md:gap-[52px]">
                        <section className="flex min-h-[420px] min-w-0 flex-col rounded-2xl border border-[#e3eaf0] bg-white py-[22px] pr-7 pl-6 shadow-[0_14px_34px_rgba(15,42,42,0.07)] max-md:min-h-[340px] max-md:p-[18px]">
                            <div className="mb-2.5 flex min-h-[42px] items-center">
                                <div className="w-[190px] max-w-full">
                                    <TranslateLangSelect
                                        label="Ngôn ngữ nguồn"
                                        value={sourceLang}
                                        onChange={handleSourceLangChange}
                                    />
                                </div>
                            </div>

                            <textarea
                                value={sourceText}
                                onChange={(e) => {
                                    setSourceText(e.target.value.slice(0, MAX_TRANSLATE_LENGTH));
                                    setTranslatedText("");
                                }}
                                placeholder={`Nhập ${getLangName(sourceLang).toLowerCase()} để dịch...`}
                                className="min-h-[260px] w-full flex-1 resize-none border-0 bg-transparent p-0 text-[22px] leading-[1.6] text-[#0f2a2a] outline-none placeholder:font-semibold placeholder:text-[#9aa8b3] max-md:min-h-[190px] max-md:text-[19px]"
                                maxLength={MAX_TRANSLATE_LENGTH}
                            />

                            <div className="mt-[18px] flex min-h-[46px] items-center justify-between gap-4 max-md:flex-col max-md:items-start">
                                <div className="flex flex-wrap gap-2.5">
                                    {sourceLang === "ja" && (
                                        <button
                                            type="button"
                                            className={iconButtonClass}
                                            onClick={() => setShowHandwritingModal(true)}
                                            aria-label="Viết tay tiếng Nhật"
                                        >
                                            <FontAwesomeIcon icon={faPen} />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className={iconButtonClass}
                                        onClick={() => handleSpeak(sourceText, sourceLang)}
                                        disabled={!sourceText.trim()}
                                        aria-label="Phát âm"
                                    >
                                        <FontAwesomeIcon icon={faVolumeHigh} />
                                    </button>
                                    <button
                                        type="button"
                                        className={iconButtonClass}
                                        onClick={() => handleCopy(sourceText)}
                                        disabled={!sourceText.trim()}
                                        aria-label="Sao chép"
                                    >
                                        <FontAwesomeIcon icon={faCopy} />
                                    </button>
                                    <button
                                        type="button"
                                        className={iconButtonClass}
                                        onClick={handleClear}
                                        disabled={!sourceText.trim() && !translatedText.trim()}
                                        aria-label="Xóa"
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-4 max-md:w-full max-md:justify-between">
                                    <span className="whitespace-nowrap text-xs font-bold tabular-nums text-[#94a3ad]">
                                        {sourceText.length}/{MAX_TRANSLATE_LENGTH}
                                    </span>
                                    <button
                                        type="button"
                                        className="inline-flex min-h-[42px] min-w-[118px] cursor-pointer items-center justify-center rounded-[10px] bg-primary px-[22px] text-sm font-extrabold text-white shadow-[0_4px_0_var(--primary-hover)] transition-all duration-150 hover:not-disabled:-translate-y-px hover:not-disabled:bg-primary-hover hover:not-disabled:shadow-[0_5px_0_#006170] active:not-disabled:translate-y-0.5 active:not-disabled:shadow-[0_1px_0_#006170] disabled:cursor-not-allowed disabled:bg-[#d8e1e7] disabled:text-[#8ea0aa] disabled:shadow-none max-md:min-w-[120px]"
                                        onClick={handleTranslate}
                                        disabled={isTranslating || !sourceText.trim()}
                                    >
                                        {isTranslating ? "Đang dịch..." : "Dịch"}
                                    </button>
                                </div>
                            </div>
                        </section>

                        <button
                            type="button"
                            className="absolute left-[calc(50%-24px)] top-[calc(50%-24px)] z-[2] inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-[6px] border-[#eef3f6] bg-white text-base text-[#0f2a2a] shadow-[0_10px_24px_rgba(15,42,42,0.12)] transition-all duration-150 hover:scale-105 hover:text-primary hover:shadow-[0_14px_28px_rgba(15,42,42,0.16)] active:scale-95 max-md:rotate-90 max-md:hover:rotate-90 max-md:hover:scale-105 max-md:active:rotate-90 max-md:active:scale-95"
                            onClick={handleSwapLanguages}
                            aria-label="Đảo ngôn ngữ"
                        >
                            <FontAwesomeIcon icon={faRightLeft} />
                        </button>

                        <section className="flex min-h-[420px] min-w-0 flex-col rounded-2xl border border-[#e3eaf0] bg-white py-[22px] pr-6 pl-7 shadow-[0_14px_34px_rgba(15,42,42,0.07)] max-md:min-h-[340px] max-md:p-[18px]">
                            <div className="mb-2.5 flex min-h-[42px] items-center">
                                <div className="w-[190px] max-w-full">
                                    <TranslateLangSelect
                                        label="Ngôn ngữ đích"
                                        value={targetLang}
                                        onChange={handleTargetLangChange}
                                    />
                                </div>
                            </div>

                            <textarea
                                value={translatedText}
                                readOnly
                                placeholder={`Bản dịch ${getLangName(targetLang).toLowerCase()}...`}
                                className="min-h-[260px] w-full flex-1 resize-none border-0 bg-transparent p-0 text-[22px] leading-[1.6] text-[#0f2a2a] outline-none placeholder:font-semibold placeholder:text-[#9aa8b3] max-md:min-h-[190px] max-md:text-[19px]"
                            />

                            <div className="mt-[18px] flex min-h-[46px] items-center justify-between gap-4 max-md:flex-col max-md:items-start">
                                <div className="flex flex-wrap gap-2.5">
                                    <button
                                        type="button"
                                        className={iconButtonClass}
                                        onClick={() => handleSpeak(translatedText, targetLang)}
                                        disabled={!translatedText.trim()}
                                        aria-label="Phát âm"
                                    >
                                        <FontAwesomeIcon icon={faVolumeHigh} />
                                    </button>
                                    <button
                                        type="button"
                                        className={iconButtonClass}
                                        onClick={() => handleCopy(translatedText)}
                                        disabled={!translatedText.trim()}
                                        aria-label="Sao chép"
                                    >
                                        <FontAwesomeIcon icon={faCopy} />
                                    </button>
                                </div>
                                <span className="whitespace-nowrap text-xs font-bold tabular-nums text-[#94a3ad]">
                                    {translatedText.length} ký tự
                                </span>
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            <HandwritingOverlay
                open={showHandwritingModal}
                onClose={() => setShowHandwritingModal(false)}
                onApply={handleTranslateHandwriting}
                primaryLabel="Dịch"
                primaryLoading={isTranslating}
                loadingLabel="Đang dịch..."
            />
        </div>
    );
}

export default Translate;
