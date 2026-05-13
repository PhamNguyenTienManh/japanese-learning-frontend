import { useState, useEffect } from "react";
import classNames from "classnames/bind";
import HanziWriter from "../hanzi_writer/hanzi_writer";
import Contribution from "../contribution/contribution";
import { faVolumeHigh } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "./mainContent.module.scss";

const cx = classNames.bind(styles);

const MainContent = ({ selectedKanji }) => {
    const [kanjiData, setKanjiData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!selectedKanji) {
            setKanjiData(null);
            return;
        }

        const fetchKanjiDetail = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch('https://mazii.net/api/search/kanji', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        dict: 'javi',
                        type: 'kanji',
                        query: selectedKanji,
                        page: 1,
                    }),
                });

                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

                const data = await res.json();

                if (data && data.results && data.results.length > 0) {
                    setKanjiData(data.results[0]);
                } else {
                    throw new Error('Không tìm thấy dữ liệu kanji');
                }
            } catch (err) {
                console.error('Error fetching kanji:', err);
                setError(err.message);
                setKanjiData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchKanjiDetail();
    }, [selectedKanji]);

    const handlePlayAudio = (text) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ja-JP';
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
        } else {
            alert(`Phát âm: ${text}`);
        }
    };

    if (loading) {
        return (
            <div className={cx("loading-state")}>
                <div className={cx("spinner")} />
                <div>Đang tải dữ liệu kanji...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={cx("error-state")}>
                <div>Lỗi: {error}</div>
            </div>
        );
    }

    if (!kanjiData) {
        return (
            <div className={cx("empty-state")}>
                <div>Tìm một kanji ở thanh trên để xem chi tiết</div>
            </div>
        );
    }

    const meaningParts = kanjiData.detail
        ? kanjiData.detail.split('##').map((p) => p.replace('$', '').trim()).filter(Boolean)
        : [];

    return (
        <>
            <div className={cx("top-card")}>
                <div className={cx("info-block")}>
                    <h1 className={cx("kanji-title")}>
                        Chi tiết chữ kanji <span className={cx("kanji-big")}>{kanjiData.kanji}</span>
                    </h1>
                    <div className={cx("info-list")}>
                        <div className={cx("info-row")}>
                            <span className={cx("info-label")}>Hán tự</span>
                            <span className={cx("info-value", "kanji-big")}>
                                {kanjiData.kanji} <span style={{ color: "var(--text-high)", fontWeight: 600, fontSize: 15 }}>— {kanjiData.mean}</span>
                            </span>
                        </div>
                        <div className={cx("info-row")}>
                            <span className={cx("info-label")}>Kunyomi</span>
                            <span className={cx("info-value", "reading")}>{kanjiData.kun || 'N/A'}</span>
                        </div>
                        <div className={cx("info-row")}>
                            <span className={cx("info-label")}>Onyomi</span>
                            <span className={cx("info-value", "reading")}>{kanjiData.on || 'N/A'}</span>
                        </div>
                        <div className={cx("info-row")}>
                            <span className={cx("info-label")}>Số nét</span>
                            <span className={cx("info-value")}>{kanjiData.stroke_count}</span>
                        </div>
                        {kanjiData.level && kanjiData.level.length > 0 && (
                            <div className={cx("info-row")}>
                                <span className={cx("info-label")}>JLPT</span>
                                <span className={cx("info-value")}>
                                    {kanjiData.level.map((lv) => (
                                        <span key={lv} className={cx("level-pill")}>{lv}</span>
                                    ))}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className={cx("writer-block")}>
                    <HanziWriter kanji={kanjiData.kanji} />
                </div>
            </div>

            {meaningParts.length > 0 && (
                <div className={cx("section")}>
                    <h2 className={cx("section-title")}>Nghĩa</h2>
                    <div className={cx("meaning-body")}>
                        {meaningParts.map((para, idx) => (
                            <p key={idx}>{para}</p>
                        ))}
                    </div>
                </div>
            )}

            {kanjiData.examples && kanjiData.examples.length > 0 && (
                <div className={cx("section")}>
                    <h2 className={cx("section-title")}>
                        Ví dụ
                        <span className={cx("section-count")}>{kanjiData.examples.length}</span>
                    </h2>
                    <div className={cx("examples-list")}>
                        {kanjiData.examples.slice(0, 10).map((ex, index) => (
                            <div key={index} className={cx("example-item")}>
                                <div className={cx("example-body")}>
                                    <div className={cx("example-word")}>
                                        {ex.w}
                                        {ex.p && (
                                            <span className={cx("example-pron")}>({ex.p.trim()})</span>
                                        )}
                                    </div>
                                    {ex.h && <div className={cx("example-hanviet")}>{ex.h}</div>}
                                    {ex.m && <div className={cx("example-meaning")}>{ex.m}</div>}
                                </div>
                                <button
                                    type="button"
                                    className={cx("audio-btn")}
                                    onClick={() =>
                                        handlePlayAudio(
                                            (ex.p || ex.w || '').trim().replace(/\[[A-Za-zÀ-ỹ\s]+\]/g, '').trim()
                                        )
                                    }
                                    aria-label="Phát âm"
                                >
                                    <FontAwesomeIcon icon={faVolumeHigh} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <Contribution kanjiId={kanjiData.mobileId} kanjiChar={kanjiData.kanji} />
        </>
    );
};

export default MainContent;
