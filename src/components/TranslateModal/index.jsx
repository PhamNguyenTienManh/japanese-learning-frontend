import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faLanguage,
    faXmark,
    faCopy,
    faVolumeHigh,
    faSpinner,
} from "@fortawesome/free-solid-svg-icons";

import Button from "~/components/Button";
import styles from "./TranslateModal.module.scss";

const cx = classNames.bind(styles);

const LANG_LABEL = {
    ja: "Tiếng Nhật",
    vi: "Tiếng Việt",
    en: "Tiếng Anh",
};

const SPEECH_LANG = {
    ja: "ja-JP",
    vi: "vi-VN",
    en: "en-US",
};

function TranslateModal({
    isOpen,
    onClose,
    sourceText,
    translatedText,
    sourceLang,
    targetLang,
    loading,
    error,
}) {
    if (!isOpen) return null;

    const handleCopy = (text) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
    };

    const japaneseText =
        sourceLang === "ja" ? sourceText : targetLang === "ja" ? translatedText : "";

    const handleSpeakJapanese = () => {
        if (!japaneseText) return;
        const utter = new SpeechSynthesisUtterance(japaneseText);
        utter.lang = SPEECH_LANG.ja;
        speechSynthesis.cancel();
        speechSynthesis.speak(utter);
    };

    return (
        <div className={cx("overlay")} onMouseDown={onClose}>
            <div
                className={cx("modal")}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className={cx("header")}>
                    <h3>
                        <FontAwesomeIcon
                            icon={faLanguage}
                            className={cx("icon")}
                        />
                        Dịch nhanh
                    </h3>
                    <button
                        className={cx("close")}
                        onClick={onClose}
                        aria-label="Đóng"
                    >
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>

                <div className={cx("langRow")}>
                    <span className={cx("lang")}>
                        {LANG_LABEL[sourceLang] || sourceLang}
                    </span>
                    <span className={cx("arrow")}>→</span>
                    <span className={cx("lang")}>
                        {LANG_LABEL[targetLang] || targetLang}
                    </span>
                </div>

                <div className={cx("block")}>
                    <div className={cx("label")}>Văn bản gốc</div>
                    <div className={cx("text")}>{sourceText}</div>
                </div>

                <div className={cx("block", "target")}>
                    <div className={cx("label")}>Bản dịch</div>
                    {loading ? (
                        <div className={cx("loading")}>
                            <FontAwesomeIcon icon={faSpinner} spin />
                            Đang dịch...
                        </div>
                    ) : error ? (
                        <div className={cx("error")}>{error}</div>
                    ) : (
                        <div className={cx("text")}>{translatedText}</div>
                    )}
                </div>

                <div className={cx("actions")}>
                    <Button
                        outline
                        className={"no-margin"}
                        onClick={handleSpeakJapanese}
                        disabled={!japaneseText || loading}
                        title="Phát âm tiếng Nhật"
                    >
                        <FontAwesomeIcon icon={faVolumeHigh} />
                    </Button>
                    <Button
                        outline
                        className={"no-margin"}
                        onClick={() => handleCopy(translatedText)}
                        disabled={!translatedText || loading}
                    >
                        <FontAwesomeIcon icon={faCopy} />
                        &nbsp; Sao chép
                    </Button>
                    <Button
                        primary
                        className={"no-margin"}
                        onClick={onClose}
                    >
                        Đóng
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default TranslateModal;
