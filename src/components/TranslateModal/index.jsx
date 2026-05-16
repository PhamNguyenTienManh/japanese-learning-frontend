import { useEffect, useRef, useState } from "react";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowRight,
    faCheck,
    faCircleExclamation,
    faCopy,
    faLanguage,
    faSpinner,
    faVolumeHigh,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";

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
    const [copied, setCopied] = useState(false);
    const copyTimerRef = useRef(null);

    const sourceIsJapanese = sourceLang === "ja";
    const targetIsJapanese = targetLang === "ja";
    const furiganaText = sourceIsJapanese
        ? sourceText
        : targetIsJapanese
            ? translatedText
            : null;
    const japaneseText = sourceIsJapanese ? sourceText : targetIsJapanese ? translatedText : "";
    const furiganaActive = furiganaOn && !!furiganaSegments;
    const showFuriganaBtn = sourceIsJapanese || (targetIsJapanese && !loading && !error && !!translatedText);

    useEffect(() => {
        setFuriganaOn(false);
        setFuriganaSegments(null);
    }, [furiganaText]);

    useEffect(() => {
        setCopied(false);
    }, [translatedText, sourceText]);

    useEffect(() => {
        if (!isOpen) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    useEffect(() => {
        return () => {
            if (copyTimerRef.current) {
                window.clearTimeout(copyTimerRef.current);
            }
        };
    }, []);

    if (!isOpen) return null;

    const handleCopy = async (text) => {
        if (!text) return;

        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            if (copyTimerRef.current) {
                window.clearTimeout(copyTimerRef.current);
            }
            copyTimerRef.current = window.setTimeout(() => setCopied(false), 1400);
        } catch (copyError) {
            console.error("Copy error:", copyError);
        }
    };

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

    return (
        <div className={cx("overlay")} onMouseDown={onClose}>
            <section
                className={cx("modal")}
                role="dialog"
                aria-modal="true"
                aria-labelledby="quick-translate-title"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <header className={cx("header")}>
                    <span className={cx("brandIcon")} aria-hidden="true">
                        <FontAwesomeIcon icon={faLanguage} />
                    </span>
                    <div className={cx("titleWrap")}>
                        <p className={cx("eyebrow")}>Tra cứu nhanh</p>
                        <h3 id="quick-translate-title">Dịch nhanh</h3>
                    </div>
                    <button
                        type="button"
                        className={cx("close")}
                        onClick={onClose}
                        aria-label="Đóng"
                    >
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </header>

                <div className={cx("body")}>
                    <div className={cx("langRow")} aria-label="Cặp ngôn ngữ">
                        <span className={cx("langChip")}>
                            {LANG_LABEL[sourceLang] || sourceLang}
                        </span>
                        <span className={cx("arrow")} aria-hidden="true">
                            <FontAwesomeIcon icon={faArrowRight} />
                        </span>
                        <span className={cx("langChip", "targetChip")}>
                            {LANG_LABEL[targetLang] || targetLang}
                        </span>
                    </div>

                    <div className={cx("contentGrid")}>
                        <article className={cx("panel", "sourcePanel")}>
                            <div className={cx("panelHeader")}>
                                <span className={cx("panelTitle")}>Văn bản gốc</span>
                                <span className={cx("meta")}>{sourceText.length} ký tự</span>
                            </div>
                            <div className={cx("text", { furiganaText: furiganaActive && sourceIsJapanese })}>
                                {furiganaActive && sourceIsJapanese
                                    ? renderFuriganaSegments(furiganaSegments)
                                    : sourceText}
                            </div>
                        </article>

                        <article className={cx("panel", "targetPanel")}>
                            <div className={cx("panelHeader")}>
                                <span className={cx("panelTitle")}>Bản dịch</span>
                                {!loading && !error && translatedText && (
                                    <button
                                        type="button"
                                        className={cx("miniAction", { copied })}
                                        onClick={() => handleCopy(translatedText)}
                                    >
                                        <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
                                        <span>{copied ? "Đã chép" : "Chép"}</span>
                                    </button>
                                )}
                            </div>
                            {loading ? (
                                <div className={cx("loading")}>
                                    <span className={cx("spinner")}>
                                        <FontAwesomeIcon icon={faSpinner} spin />
                                    </span>
                                    <span>Đang dịch...</span>
                                </div>
                            ) : error ? (
                                <div className={cx("error")}>
                                    <FontAwesomeIcon icon={faCircleExclamation} />
                                    <span>{error}</span>
                                </div>
                            ) : (
                                <div className={cx("text", { furiganaText: furiganaActive && targetIsJapanese })}>
                                    {furiganaActive && targetIsJapanese
                                        ? renderFuriganaSegments(furiganaSegments)
                                        : translatedText}
                                </div>
                            )}
                        </article>
                    </div>
                </div>

                <footer className={cx("toolbar")}>
                    <div className={cx("tools")}>
                        {showFuriganaBtn && (
                            <button
                                type="button"
                                className={cx("toolButton", { active: furiganaOn })}
                                onClick={handleToggleFurigana}
                                disabled={furiganaLoading || loading}
                                title="Hiện/tắt furigana"
                            >
                                {furiganaLoading ? (
                                    <FontAwesomeIcon icon={faSpinner} spin />
                                ) : (
                                    <FontAwesomeIcon icon={faLanguage} />
                                )}
                                <span>{furiganaLoading ? "Đang tải" : "Furigana"}</span>
                            </button>
                        )}
                        <button
                            type="button"
                            className={cx("toolButton", "iconOnly")}
                            onClick={handleSpeakJapanese}
                            disabled={!japaneseText || loading}
                            title="Phát âm tiếng Nhật"
                            aria-label="Phát âm tiếng Nhật"
                        >
                            <FontAwesomeIcon icon={faVolumeHigh} />
                        </button>
                        <button
                            type="button"
                            className={cx("toolButton")}
                            onClick={() => handleCopy(translatedText)}
                            disabled={!translatedText || loading}
                        >
                            <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
                            <span>{copied ? "Đã chép" : "Sao chép"}</span>
                        </button>
                    </div>
                    <button type="button" className={cx("primaryAction")} onClick={onClose}>
                        Đóng
                    </button>
                </footer>
            </section>
        </div>
    );
}

export default TranslateModal;
