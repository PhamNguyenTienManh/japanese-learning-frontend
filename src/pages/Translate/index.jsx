import { useEffect, useRef, useState } from "react";
import classNames from "classnames/bind";
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
import styles from "./Translate.module.scss";

const cx = classNames.bind(styles);

const languages = [
    { code: "ja", name: "Tiếng Nhật" },
    { code: "vi", name: "Tiếng Việt" },
];

const langOptions = languages.map((l) => ({ value: l.code, label: l.name }));
const MAX_TRANSLATE_LENGTH = 5000;
const getOppositeLang = (lang) => (lang === "ja" ? "vi" : "ja");
const getLangName = (lang) =>
    languages.find((item) => item.code === lang)?.name || "";

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
        <div className={cx("langSelect")} ref={selectRef}>
            <button
                type="button"
                className={cx("langTrigger", { isOpen: open })}
                onClick={() => setOpen((current) => !current)}
                aria-label={label}
                aria-expanded={open}
            >
                <span>{selected?.label || "Chọn"}</span>
                <FontAwesomeIcon
                    className={cx("langChevron", { isOpen: open })}
                    icon={faChevronDown}
                />
            </button>

            {open && (
                <div className={cx("langDropdown")}>
                    {langOptions.map((option) => {
                        const isActive = option.value === value;

                        return (
                            <button
                                key={option.value}
                                type="button"
                                className={cx("langOption", { isActive })}
                                onClick={() => {
                                    onChange(option.value);
                                    setOpen(false);
                                }}
                            >
                                <span>{option.label}</span>
                                {isActive && (
                                    <FontAwesomeIcon className={cx("langCheck")} icon={faCheck} />
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
        <div className={cx("root")}>
            <div className={cx("container")}>
                <div className={cx("header")}>
                    <div className={cx("headerLeft")}>
                        <span className={cx("eyebrow")}>JAVI Translator</span>
                        <h1 className={cx("title")}>Dịch Nhật - Việt</h1>
                    </div>
                </div>

                <div className={cx("grid")}>
                    <section className={cx("card")}>
                        <div className={cx("cardHead")}>
                            <div className={cx("langSelectWrap")}>
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
                            className={cx("textarea")}
                            maxLength={MAX_TRANSLATE_LENGTH}
                        />

                        <div className={cx("cardFoot")}>
                            <div className={cx("toolbar")}>
                                {sourceLang === "ja" && (
                                    <button
                                        type="button"
                                        className={cx("iconBtn")}
                                        onClick={() => setShowHandwritingModal(true)}
                                        aria-label="Viết tay tiếng Nhật"
                                    >
                                        <FontAwesomeIcon icon={faPen} />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className={cx("iconBtn")}
                                    onClick={() => handleSpeak(sourceText, sourceLang)}
                                    disabled={!sourceText.trim()}
                                    aria-label="Phát âm"
                                >
                                    <FontAwesomeIcon icon={faVolumeHigh} />
                                </button>
                                <button
                                    type="button"
                                    className={cx("iconBtn")}
                                    onClick={() => handleCopy(sourceText)}
                                    disabled={!sourceText.trim()}
                                    aria-label="Sao chép"
                                >
                                    <FontAwesomeIcon icon={faCopy} />
                                </button>
                                <button
                                    type="button"
                                    className={cx("iconBtn")}
                                    onClick={handleClear}
                                    disabled={!sourceText.trim() && !translatedText.trim()}
                                    aria-label="Xóa"
                                >
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </div>

                            <div className={cx("toolbarRight")}>
                                <span className={cx("charCount")}>
                                    {sourceText.length}/{MAX_TRANSLATE_LENGTH}
                                </span>
                                <button
                                    type="button"
                                    className={cx("translateBtn")}
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
                        className={cx("swapBtn")}
                        onClick={handleSwapLanguages}
                        aria-label="Đảo ngôn ngữ"
                    >
                        <FontAwesomeIcon icon={faRightLeft} />
                    </button>

                    <section className={cx("card")}>
                        <div className={cx("cardHead")}>
                            <div className={cx("langSelectWrap")}>
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
                            className={cx("textarea")}
                        />

                        <div className={cx("cardFoot")}>
                            <div className={cx("toolbar")}>
                                <button
                                    type="button"
                                    className={cx("iconBtn")}
                                    onClick={() => handleSpeak(translatedText, targetLang)}
                                    disabled={!translatedText.trim()}
                                    aria-label="Phát âm"
                                >
                                    <FontAwesomeIcon icon={faVolumeHigh} />
                                </button>
                                <button
                                    type="button"
                                    className={cx("iconBtn")}
                                    onClick={() => handleCopy(translatedText)}
                                    disabled={!translatedText.trim()}
                                    aria-label="Sao chép"
                                >
                                    <FontAwesomeIcon icon={faCopy} />
                                </button>
                            </div>
                            <span className={cx("charCount")}>
                                {translatedText.length} ký tự
                            </span>
                        </div>
                    </section>
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
