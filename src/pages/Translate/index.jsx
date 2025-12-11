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

const cx = classNames.bind(styles);

const languages = [
    { code: "ja", name: "Tiếng Nhật" },
    { code: "vi", name: "Tiếng Việt" },
    { code: "en", name: "Tiếng Anh" },
    { code: "ko", name: "Tiếng Hàn" },
    { code: "zh", name: "Tiếng Trung" },
];

const mockTranslate = (text, fromLang, toLang) => {
    const translations = {
        ja_vi: {
            こんにちは: "Xin chào",
            ありがとう: "Cảm ơn",
            一人: "Một người",
            水産物: "Sản phẩm thuỷ sản",
        },
        vi_ja: {
            "Xin chào": "こんにちは",
            "Cảm ơn": "ありがとう",
            "Một người": "一人",
        },
    };
    const key = `${fromLang}_${toLang}`;
    return translations[key]?.[text] || `Dịch: ${text}`;
};

function Translate() {
    const [sourceText, setSourceText] = useState("");
    const [translatedText, setTranslatedText] = useState("");
    const [sourceLang, setSourceLang] = useState("ja");
    const [targetLang, setTargetLang] = useState("vi");
    const { addToast } = useToast();

    const handleTranslate = () => {
        if (!sourceText.trim()) {
            addToast("Vui lòng nhập văn bản", "info");
            return;
        }
        const result = mockTranslate(sourceText, sourceLang, targetLang);
        setTranslatedText(result);
    };

    const handleSwapLanguages = () => {
        setSourceLang(targetLang);
        setTargetLang(sourceLang);
        setSourceText(translatedText);
        setTranslatedText(sourceText);
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        addToast("Đã sao chép!", "success");
    };

    const handleClear = () => {
        setSourceText("");
        setTranslatedText("");
    };

    const handleSpeak = (text) => {
        if (!text.trim()) return;
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang =
            sourceLang === "ja"
                ? "ja-JP"
                : sourceLang === "vi"
                    ? "vi-VN"
                    : "en-US";
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
                            label: l.name
                        }))}
                    />

                    <Button outline onClick={handleSwapLanguages} className={cx("swap-btn")}>
                        <FontAwesomeIcon icon={faRightLeft} />
                    </Button>

                    <CustomSelect
                        label="Sang"
                        value={targetLang}
                        onChange={(v) => setTargetLang(v)}
                        options={languages.map((l) => ({
                            value: l.code,
                            label: l.name
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
                                onClick={() => handleSpeak(sourceText)}
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

                        <span className={cx("length")}>{sourceText.length} ký tự</span>
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
                                onClick={() => handleSpeak(translatedText)}
                                disabled={!translatedText.trim()}
                            >
                                <FontAwesomeIcon icon={faVolumeHigh} />
                            </Button>

                            <Button
                                outline
                                onClick={() => handleCopy(translatedText)}
                                disabled={!translatedText.trim()}
                            >
                                <FontAwesomeIcon icon={faCopy} />
                            </Button>
                        </div>

                        <span className={cx("length")}>{translatedText.length} ký tự</span>
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
