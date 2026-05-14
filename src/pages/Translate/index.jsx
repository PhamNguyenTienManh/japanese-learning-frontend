import { useState } from "react";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faVolumeHigh,
    faCopy,
    faRightLeft,
} from "@fortawesome/free-solid-svg-icons";

import styles from "./Translate.module.scss";
import { useToast } from "~/context/ToastContext";
import CustomSelect from "~/components/CustomSelect";
import { translateText } from "~/services/traslate";

const cx = classNames.bind(styles);

const languages = [
    { code: "ja", name: "Tiếng Nhật" },
    { code: "vi", name: "Tiếng Việt" },
    { code: "en", name: "Tiếng Anh" },
    { code: "ko", name: "Tiếng Hàn" },
    { code: "zh", name: "Tiếng Trung" },
];

const langOptions = languages.map((l) => ({ value: l.code, label: l.name }));

function Translate() {
    const [sourceText, setSourceText] = useState("");
    const [translatedText, setTranslatedText] = useState("");
    const [sourceLang, setSourceLang] = useState("ja");
    const [targetLang, setTargetLang] = useState("vi");
    const [isTranslating, setIsTranslating] = useState(false);
    const { addToast } = useToast();

    const handleTranslate = async () => {
        if (!sourceText.trim()) {
            addToast("Vui lòng nhập văn bản", "info");
            return;
        }

        if (sourceLang === targetLang) {
            addToast("Hai ngôn ngữ giống nhau", "warning");
            return;
        }

        try {
            setIsTranslating(true);
            const res = await translateText(sourceText, sourceLang, targetLang);
            setTranslatedText(res.data.translatedText);
        } catch (error) {
            addToast("Lỗi dịch văn bản", "error");
        } finally {
            setIsTranslating(false);
        }
    };

    const handleSwapLanguages = () => {
        setSourceLang(targetLang);
        setTargetLang(sourceLang);
        setSourceText(translatedText);
        setTranslatedText(sourceText);
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
        <div className={cx("wrapper")}>
            <div className={cx("blob1")} />
            <div className={cx("blob2")} />

            <div className={cx("container")}>
                {/* Hero */}
                <div className={cx("hero")}>
                    <h1 className={cx("title")}>Dịch văn bản</h1>
                </div>

                {/* Translator card */}
                <div className={cx("translatorCard")}>
                    {/* Language bar */}
                    <div className={cx("langBar")}>
                        <div className={cx("langSide")}>
                            <span className={cx("langLabel")}>Từ</span>
                            <div className={cx("langSelect")}>
                                <CustomSelect
                                    value={sourceLang}
                                    onChange={(v) => setSourceLang(v)}
                                    options={langOptions}
                                />
                            </div>
                        </div>

                        <button
                            type="button"
                            className={cx("swapBtn")}
                            onClick={handleSwapLanguages}
                            aria-label="Đảo ngôn ngữ"
                        >
                            <FontAwesomeIcon icon={faRightLeft} />
                        </button>

                        <div className={cx("langSide")}>
                            <span className={cx("langLabel")}>Sang</span>
                            <div className={cx("langSelect")}>
                                <CustomSelect
                                    value={targetLang}
                                    onChange={(v) => setTargetLang(v)}
                                    options={langOptions}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Panes */}
                    <div className={cx("panes")}>
                        <div className={cx("pane")}>
                            <textarea
                                value={sourceText}
                                onChange={(e) => setSourceText(e.target.value)}
                                placeholder="Nhập văn bản để dịch..."
                                className={cx("textarea")}
                            />
                            <div className={cx("paneFoot")}>
                                <div className={cx("tools")}>
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
                                </div>
                                <span className={cx("length")}>
                                    {sourceText.length} ký tự
                                </span>
                            </div>
                        </div>

                        <div className={cx("pane")}>
                            <textarea
                                value={translatedText}
                                readOnly
                                placeholder="Kết quả dịch sẽ xuất hiện ở đây..."
                                className={cx("textarea")}
                            />
                            <div className={cx("paneFoot")}>
                                <div className={cx("tools")}>
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
                                <span className={cx("length")}>
                                    {translatedText.length} ký tự
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action row */}
                <div className={cx("actions")}>
                    <button
                        type="button"
                        className={cx("actionBtn", "actionPrimary")}
                        onClick={handleTranslate}
                        disabled={isTranslating}
                    >
                        {isTranslating ? "Đang dịch..." : "Dịch"}
                    </button>
                    <button
                        type="button"
                        className={cx("actionBtn")}
                        onClick={handleClear}
                    >
                        Xoá
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Translate;
