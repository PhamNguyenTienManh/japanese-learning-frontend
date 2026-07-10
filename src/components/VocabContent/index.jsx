import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faVolumeHigh } from "@fortawesome/free-solid-svg-icons";
import { fetchVocabDetail } from "~/services/vocabService";

const VocabContent = ({ selectedVocab }) => {
  const [vocabData, setVocabData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedVocab) {
      setVocabData(null);
      return;
    }

    const loadDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchVocabDetail(selectedVocab);
        if (data) {
          setVocabData(data);
        } else {
          throw new Error("Không tìm thấy dữ liệu từ vựng");
        }
      } catch (err) {
        console.error("Error fetching vocab detail:", err);
        setError(err.message);
        setVocabData(null);
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [selectedVocab]);

  const handlePlayAudio = (text) => {
    if (!text) return;
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ja-JP";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } else {
      alert(`Phát âm: ${text}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 bg-white border-[1.5px] border-[#dce8e8] rounded-[18px] text-center text-grey gap-2 min-h-[360px]">
        <div className="w-8 h-8 border-[3px] border-primary/15 border-t-primary rounded-full animate-[spin_0.8s_linear_infinite] mb-2" />
        <div>Đang tải dữ liệu từ vựng...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 bg-white border-[1.5px] border-[#dce8e8] rounded-[18px] text-center text-[#b71247] gap-2 min-h-[360px]">
        <div>Lỗi: {error}</div>
      </div>
    );
  }

  if (!vocabData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 bg-white border-[1.5px] border-[#dce8e8] rounded-[18px] text-center text-grey gap-2 min-h-[360px]">
        <div>Tìm một từ vựng ở thanh trên để xem chi tiết</div>
      </div>
    );
  }

  const phonetic = (vocabData.phonetic || []).join(" ");
  const meanings = vocabData.meanings || [];

  return (
    <>
      <div className="bg-white border-[1.5px] border-[#dce8e8] rounded-[18px] py-7 px-8 shadow-[0_4px_16px_rgba(15,23,42,0.04)] max-[720px]:py-[22px] max-[720px]:px-5">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-[28px] font-bold text-primary leading-tight">{vocabData.word}</h1>
          <button
            type="button"
            className="shrink-0 w-[38px] h-[38px] rounded-full bg-[linear-gradient(135deg,var(--primary)_0%,var(--primary-hover)_100%)] text-white inline-flex items-center justify-center cursor-pointer transition-[transform,filter,box-shadow] duration-[180ms] ease-out shadow-[0_4px_12px_rgba(0,135,154,0.25)] hover:scale-105 hover:brightness-105 hover:shadow-[0_6px_16px_rgba(0,135,154,0.35)] active:scale-95"
            onClick={() => handlePlayAudio(vocabData.word)}
            aria-label="Phát âm"
          >
            <FontAwesomeIcon icon={faVolumeHigh} />
          </button>
        </div>

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {phonetic && <span className="text-base text-orange font-semibold">{phonetic}</span>}
          {vocabData.type && (
            <span className="inline-block py-0.5 px-2.5 rounded-full text-xs font-bold bg-orange/10 text-orange">
              {vocabData.type}
            </span>
          )}
          {vocabData.level && (
            <span className="inline-block py-0.5 px-2.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
              {vocabData.level}
            </span>
          )}
        </div>
      </div>

      {meanings.length > 0 && (
        <div className="bg-white border-[1.5px] border-[#dce8e8] rounded-[18px] py-6 px-7 shadow-[0_4px_16px_rgba(15,23,42,0.04)] max-[720px]:py-5 max-[720px]:px-[18px]">
          <h2 className="flex items-center gap-2 text-base font-bold text-text-high mb-4 pl-2.5 border-l-[3px] border-primary">
            Nghĩa
            <span className="text-xs font-semibold py-0.5 px-2.5 rounded-full bg-primary/10 text-primary">{meanings.length}</span>
          </h2>
          <div className="flex flex-col gap-3">
            {meanings.map((m, idx) => (
              <div key={idx} className="bg-[#f1fbfb] rounded-xl py-4 px-[18px]">
                <div className="flex items-baseline gap-2.5">
                  <span className="shrink-0 w-6 h-6 inline-flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {idx + 1}
                  </span>
                  <p className="text-[15px] font-semibold text-text-high">{m.meaning}</p>
                </div>

                {Array.isArray(m.examples) && m.examples.length > 0 && (
                  <div className="flex flex-col gap-2 mt-3 pl-[34px]">
                    {m.examples.map((ex, exIdx) => (
                      <div
                        key={exIdx}
                        className="flex items-center justify-between gap-4 bg-white border border-transparent border-l-[3px] border-l-primary rounded-lg py-2.5 px-3.5 transition-[border-color,transform] duration-[180ms] ease-out hover:border-primary/30 hover:border-l-primary-hover hover:translate-x-0.5"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-[15px] font-semibold text-text-high">{ex.jp}</div>
                          {ex.vi && <div className="text-[13px] text-grey mt-0.5">{ex.vi}</div>}
                        </div>
                        <button
                          type="button"
                          className="shrink-0 w-[34px] h-[34px] rounded-full bg-[linear-gradient(135deg,var(--primary)_0%,var(--primary-hover)_100%)] text-white inline-flex items-center justify-center cursor-pointer transition-[transform,filter,box-shadow] duration-[180ms] ease-out shadow-[0_4px_12px_rgba(0,135,154,0.25)] hover:scale-105 hover:brightness-105 active:scale-95"
                          onClick={() => handlePlayAudio(ex.jp)}
                          aria-label="Phát âm ví dụ"
                        >
                          <FontAwesomeIcon icon={faVolumeHigh} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default VocabContent;
