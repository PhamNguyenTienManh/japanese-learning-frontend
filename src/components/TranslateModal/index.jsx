import { useState, useEffect } from "react";
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
import { getFurigana } from "~/services/furiganaService";
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

const KANJI_RE = /[㐀-鿿豈-﫿]/;

function renderFuriganaSegments(segments) {
    if (!segments) return null;
    return segments.map((seg, i) => {
        const orig = seg.orig || "";
        const hira = seg.hira || "";
        const needsRuby = hira && hira !== orig && KANJI_RE.test(orig);
        if (!needsRuby) return <span key={i}>{orig}</span>;
        return (
            <ruby key={i}>
                {orig}
                <rt>{hira}</rt>
            </ruby>
        );
    });
}

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
    const [furiganaOn, setFuriganaOn] = useState(false);
    const [furiganaSegments, setFuriganaSegments] = useState(null);
    const [furiganaLoading, setFuriganaLoading] = useState(false);

    // Text tiếng Nhật cần gắn furigana: nguồn nếu ja→vi, bản dịch nếu vi→ja
    const furiganaText = sourceLang === "ja" ? sourceText : (targetLang === "ja" ? translatedText : null);

    useEffect(() => {
        setFuriganaOn(false);
        setFuriganaSegments(null);
    }, [furiganaText]);

    if (!isOpen) return null;

    const handleCopy = (text) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
    };

    const japaneseText = sourceLang === "ja" ? sourceText : (targetLang === "ja" ? translatedText : "");

    const handleSpeakJapanese = () => {
        if (!japaneseText) return;
        const utter = new SpeechSynthesisUtterance(japaneseText);
        utter.lang = SPEECH_LANG.ja;
        speechSynthesis.cancel();
        speechSynthesis.speak(utter);
    };

    const handleToggleFurigana = async () => {
        if (!furiganaText) return;
        const next = !furiganaOn;
        setFuriganaOn(next);
        if (next && !furiganaSegments) {
            try {
                setFuriganaLoading(true);
                const segs = await getFurigana(furiganaText);
                setFuriganaSegments(segs);
            } catch (e) {
                console.error("Furigana error:", e);
                setFuriganaOn(false);
            } finally {
                setFuriganaLoading(false);
            }
        }
    };

    const furiganaActive = furiganaOn && !!furiganaSegments;
    // Nút furigana chỉ hiện khi có text tiếng Nhật (và bản dịch đã xong nếu là vi→ja)
    const showFuriganaBtn = sourceLang === "ja" || (targetLang === "ja" && !loading && !error && !!translatedText);

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

                <div className={cx("block", { withFurigana: furiganaActive && sourceLang === "ja" })}>
                    <div className={cx("label")}>Văn bản gốc</div>
                    <div className={cx("text")}>
                        {furiganaActive && sourceLang === "ja"
                            ? renderFuriganaSegments(furiganaSegments)
                            : sourceText}
                    </div>
                </div>

                <div className={cx("block", "target", { withFurigana: furiganaActive && targetLang === "ja" })}>
                    <div className={cx("label")}>Bản dịch</div>
                    {loading ? (
                        <div className={cx("loading")}>
                            <FontAwesomeIcon icon={faSpinner} spin />
                            Đang dịch...
                        </div>
                    ) : error ? (
                        <div className={cx("error")}>{error}</div>
                    ) : (
                        <div className={cx("text")}>
                            {furiganaActive && targetLang === "ja"
                                ? renderFuriganaSegments(furiganaSegments)
                                : translatedText}
                        </div>
                    )}
                </div>

                <div className={cx("actions")}>
                    {showFuriganaBtn && (
                        <Button
                            primary={furiganaOn}
                            outline={!furiganaOn}
                            className={"no-margin"}
                            onClick={handleToggleFurigana}
                            disabled={furiganaLoading || loading}
                            title="Hiện/tắt furigana"
                        >
                            {furiganaLoading
                                ? <><FontAwesomeIcon icon={faSpinner} spin />&nbsp;Đang tải...</>
                                : furiganaOn ? "Tắt furigana" : "Furigana"}
                        </Button>
                    )}
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
