import { useState, useEffect, useRef } from "react";
import KanjiStrokeOrder from "~/components/KanjiStrokeOrder";
import Contribution from "../contribution/contribution";
import { faVolumeHigh } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { fetchKanjiDetail as getKanjiDetail } from "~/services/kanjiService";
import { logKanjiLookupActivity } from "~/services/userActivityService";

function normalizeDetailText(value) {
    return String(value || "")
        .replace(/\\n/g, "\n")
        .replace(/\r\n?/g, "\n")
        .replace(/\n{2,}/g, "\n")
        .trim();
}

const MainContent = ({ selectedKanji }) => {
    const [kanjiData, setKanjiData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const lastLoggedKanjiRef = useRef("");

    useEffect(() => {
        if (!selectedKanji) {
            setKanjiData(null);
            return;
        }

        const fetchKanjiDetail = async () => {
            setLoading(true);
            setError(null);
            try {
                const nextKanjiData = await getKanjiDetail(selectedKanji);

                if (nextKanjiData) {
                    setKanjiData(nextKanjiData);

                    const logKey = `${nextKanjiData.kanji || selectedKanji}:${nextKanjiData.mobileId || ""}`;
                    if (logKey !== lastLoggedKanjiRef.current) {
                        lastLoggedKanjiRef.current = logKey;
                        logKanjiLookupActivity({
                            kanji: nextKanjiData.kanji || selectedKanji,
                            keyword: selectedKanji,
                            mean: nextKanjiData.mean,
                            onyomi: nextKanjiData.on,
                            kunyomi: nextKanjiData.kun,
                            strokeCount: nextKanjiData.stroke_count,
                            mobileId: nextKanjiData.mobileId || nextKanjiData._id,
                            level: nextKanjiData.level,
                        });
                    }
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
            <div className="flex flex-col items-center justify-center py-20 px-6 bg-white border border-border rounded-2xl text-center text-grey gap-2 min-h-[360px]">
                <div className="w-8 h-8 border-[3px] border-primary/15 border-t-primary rounded-full animate-[spin_0.8s_linear_infinite] mb-2" />
                <div>Đang tải dữ liệu kanji...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-6 bg-white border border-border rounded-2xl text-center text-[#b71247] gap-2 min-h-[360px]">
                <div>Lỗi: {error}</div>
            </div>
        );
    }

    if (!kanjiData) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-6 bg-white border border-border rounded-2xl text-center text-grey gap-2 min-h-[360px]">
                <div>Tìm một kanji ở thanh trên để xem chi tiết</div>
            </div>
        );
    }

    const normalizedDetail = normalizeDetailText(kanjiData.detail);
    const meaningParts = normalizedDetail
        ? normalizedDetail.split('##').map((p) => p.replace('$', '').trim()).filter(Boolean)
        : [];

    return (
        <>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-7 items-start bg-white border border-border rounded-[18px] py-7 px-8 shadow-[0_4px_16px_rgba(15,23,42,0.04)] max-[720px]:grid-cols-1 max-[720px]:py-[22px] max-[720px]:px-5">
                <div className="min-w-0">
                    <h1 className="text-lg font-bold text-text-high mb-4">
                        Chi tiết chữ kanji <span className="text-[22px] font-bold text-primary">{kanjiData.kanji}</span>
                    </h1>
                    <div className="flex flex-col gap-2.5">
                        <div className="flex items-baseline gap-3 text-[15px] leading-normal">
                            <span className="shrink-0 w-24 text-grey text-[13px] max-[720px]:w-[88px]">Hán tự</span>
                            <span className="break-words text-[22px] font-bold text-primary">
                                {kanjiData.kanji} <span className="text-text-high font-semibold text-[15px]">— {kanjiData.mean}</span>
                            </span>
                        </div>
                        <div className="flex items-baseline gap-3 text-[15px] leading-normal">
                            <span className="shrink-0 w-24 text-grey text-[13px] max-[720px]:w-[88px]">Kunyomi</span>
                            <span className="break-words text-orange font-semibold">{kanjiData.kun || 'N/A'}</span>
                        </div>
                        <div className="flex items-baseline gap-3 text-[15px] leading-normal">
                            <span className="shrink-0 w-24 text-grey text-[13px] max-[720px]:w-[88px]">Onyomi</span>
                            <span className="break-words text-orange font-semibold">{kanjiData.on || 'N/A'}</span>
                        </div>
                        <div className="flex items-baseline gap-3 text-[15px] leading-normal">
                            <span className="shrink-0 w-24 text-grey text-[13px] max-[720px]:w-[88px]">Số nét</span>
                            <span className="break-words text-text-high font-medium">{kanjiData.stroke_count}</span>
                        </div>
                        {kanjiData.level && kanjiData.level.length > 0 && (
                            <div className="flex items-baseline gap-3 text-[15px] leading-normal">
                                <span className="shrink-0 w-24 text-grey text-[13px] max-[720px]:w-[88px]">JLPT</span>
                                <span className="break-words text-text-high font-medium">
                                    {kanjiData.level.map((lv) => (
                                        <span key={lv} className="inline-block py-0.5 px-2.5 rounded-full text-xs font-bold bg-primary/10 text-primary mr-1.5">{lv}</span>
                                    ))}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="shrink-0 w-[292px] max-w-full">
                    <KanjiStrokeOrder stroke={kanjiData.stroke} />
                </div>
            </div>

            {meaningParts.length > 0 && (
                <div className="bg-white border border-border rounded-[18px] py-6 px-7 shadow-[0_4px_16px_rgba(15,23,42,0.04)] max-[720px]:py-5 max-[720px]:px-[18px]">
                    <h2 className="flex items-center gap-2 text-base font-bold text-text-high mb-4 pl-2.5 border-l-[3px] border-primary">Nghĩa</h2>
                    <div className="text-sm leading-[1.85] text-text-high bg-[#f1fbfb] rounded-xl py-4 px-[18px] whitespace-pre-line">
                        {meaningParts.map((para, idx) => (
                            <p key={idx} className="mb-2.5 last:mb-0">{para}</p>
                        ))}
                    </div>
                </div>
            )}

            {kanjiData.examples && kanjiData.examples.length > 0 && (
                <div className="bg-white border border-border rounded-[18px] py-6 px-7 shadow-[0_4px_16px_rgba(15,23,42,0.04)] max-[720px]:py-5 max-[720px]:px-[18px]">
                    <h2 className="flex items-center gap-2 text-base font-bold text-text-high mb-4 pl-2.5 border-l-[3px] border-primary">
                        Ví dụ
                        <span className="text-xs font-semibold py-0.5 px-2.5 rounded-full bg-primary/10 text-primary">{kanjiData.examples.length}</span>
                    </h2>
                    <div className="flex flex-col gap-2.5">
                        {kanjiData.examples.slice(0, 10).map((ex, index) => (
                            <div key={index} className="flex items-center justify-between gap-4 bg-[#f1fbfb] border border-transparent border-l-[3px] border-l-primary rounded-xl py-3.5 px-[18px] transition-[border-color,transform] duration-[180ms] ease-out hover:border-primary/30 hover:border-l-primary-hover hover:translate-x-0.5">
                                <div className="flex-1 min-w-0">
                                    <div className="text-base font-bold text-text-high mb-1">
                                        {ex.w}
                                        {ex.p && (
                                            <span className="font-normal text-[13px] text-grey ml-1">({ex.p.trim()})</span>
                                        )}
                                    </div>
                                    {ex.h && <div className="text-[13px] text-primary mb-0.5">{ex.h}</div>}
                                    {ex.m && <div className="text-sm text-grey-low">{ex.m}</div>}
                                </div>
                                <button
                                    type="button"
                                    className="shrink-0 w-[38px] h-[38px] rounded-full bg-[linear-gradient(135deg,var(--primary)_0%,var(--primary-hover)_100%)] text-white inline-flex items-center justify-center cursor-pointer transition-[transform,filter,box-shadow] duration-[180ms] ease-out shadow-[0_4px_12px_rgba(0,135,154,0.25)] hover:scale-105 hover:brightness-105 hover:shadow-[0_6px_16px_rgba(0,135,154,0.35)] active:scale-95"
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

            <Contribution kanjiId={kanjiData.mobileId || kanjiData._id || kanjiData.kanji} kanjiChar={kanjiData.kanji} />
        </>
    );
};

export default MainContent;
