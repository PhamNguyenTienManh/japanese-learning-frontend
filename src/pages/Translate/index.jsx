import { useState } from "react";
import classNames from "classnames/bind";
import styles from "./Translate.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faVolumeHigh,
    faCopy,
    faRepeat,
    faXmark,
    faRightLeft,
} from "@fortawesome/free-solid-svg-icons";

import Button from "~/components/Button";
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

function Translate() {
    const [sourceText, setSourceText] = useState("");
    const [translatedText, setTranslatedText] = useState("");
    const [sourceLang, setSourceLang] = useState("ja");
    const [targetLang, setTargetLang] = useState("vi");
    const { addToast } = useToast();

    // ===== TRANSLATE =====
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
            const res = await translateText(
                sourceText,
                sourceLang,
                targetLang
            );

            setTranslatedText(res.data.translatedText);
        } catch (error) {
            addToast("Lỗi dịch văn bản", "error");
        }
    };

    // ===== SWAP LANGUAGE =====
    const handleSwapLanguages = () => {
        setSourceLang(targetLang);
        setTargetLang(sourceLang);
        setSourceText(translatedText);
        setTranslatedText(sourceText);
    };

    // ===== COPY =====
    const handleCopy = (text) => {
        if (!text.trim()) return;
        navigator.clipboard.writeText(text);
        addToast("Đã sao chép!", "success");
    };

    // ===== CLEAR =====
    const handleClear = () => {
        setSourceText("");
        setTranslatedText("");
    };

    // ===== TEXT TO SPEECH (FIX ĐÚNG LANG) =====
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
        speechSynthesis.cancel(); // tránh đọc chồng
        speechSynthesis.speak(utter);
    };

    return (
        <div className={cx("wrapper")}>
            <div className={cx("container")}>
                <h1 className={cx("title")}>Dịch Văn Bản</h1>
                <p className={cx("subtitle")}>
                    Dịch giữa tiếng Nhật và các ngôn ngữ khác
                </p>

                {/* Language Selector */}
                <div className={cx("lang-row")}>
                    <CustomSelect
                        label="Từ"
                        value={sourceLang}
                        onChange={(v) => setSourceLang(v)}
                        options={languages.map((l) => ({
                            value: l.code,
                            label: l.name,
                        }))}
                    />

                    <Button
                        outline
                        onClick={handleSwapLanguages}
                        className={cx("swap-btn")}
                    >
                        <FontAwesomeIcon icon={faRightLeft} />
                    </Button>

                    <CustomSelect
                        label="Sang"
                        value={targetLang}
                        onChange={(v) => setTargetLang(v)}
                        options={languages.map((l) => ({
                            value: l.code,
                            label: l.name,
                        }))}
                    />
                </div>

                {/* Translation Boxes */}
                <div className={cx("grid")}>
                    {/* SOURCE */}
                    <div className={cx("box")}>
                        <textarea
                            value={sourceText}
                            onChange={(e) => setSourceText(e.target.value)}
                            placeholder="Nhập văn bản để dịch..."
                            className={cx("textarea")}
                        />

                        <div className={cx("tools")}>
                            <Button
                                outline
                                onClick={() =>
                                    handleSpeak(sourceText, sourceLang)
                                }
                                disabled={!sourceText.trim()}
                            >
                                <FontAwesomeIcon icon={faVolumeHigh} />
                            </Button>

                            <Button
                                outline
                                onClick={() => handleCopy(sourceText)}
                                disabled={!sourceText.trim()}
                            >
                                <FontAwesomeIcon icon={faCopy} />
                            </Button>
                        </div>

                        <span className={cx("length")}>
                            {sourceText.length} ký tự
                        </span>
                    </div>

                    {/* TARGET */}
                    <div className={cx("box")}>
                        <textarea
                            value={translatedText}
                            readOnly
                            placeholder="Kết quả dịch sẽ xuất hiện ở đây..."
                            className={cx("textarea")}
                        />

                        <div className={cx("tools")}>
                            <Button
                                outline
                                onClick={() =>
                                    handleSpeak(translatedText, targetLang)
                                }
                                disabled={!translatedText.trim()}
                            >
                                <FontAwesomeIcon icon={faVolumeHigh} />
                            </Button>

                            <Button
                                outline
                                onClick={() =>
                                    handleCopy(translatedText)
                                }
                                disabled={!translatedText.trim()}
                            >
                                <FontAwesomeIcon icon={faCopy} />
                            </Button>
                        </div>

                        <span className={cx("length")}>
                            {translatedText.length} ký tự
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className={cx("actions")}>
                    <Button primary onClick={handleTranslate}>
                        Dịch
                    </Button>

                    <Button outline onClick={handleClear}>
                        <FontAwesomeIcon icon={faXmark} />
                        &nbsp; Xóa
                    </Button>

                    <Button outline onClick={handleSwapLanguages}>
                        <FontAwesomeIcon icon={faRepeat} />
                        &nbsp; Làm lại
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default Translate;
