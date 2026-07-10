import { useState, useEffect } from "react";
import classNames from "classnames";
import { searchVocabList } from "~/services/vocabService";

const VocabItem = ({ word, phonetic, meaning, isActive, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={classNames(
      "group flex flex-col gap-0.5 py-2.5 px-3 rounded-xl border-none cursor-pointer text-left transition-[background,transform] duration-200 ease-out",
      isActive
        ? "bg-[linear-gradient(90deg,rgba(0,135,154,0.16),rgba(0,135,154,0.04))]"
        : "bg-transparent hover:bg-primary/[0.06] hover:translate-x-0.5"
    )}
  >
    <span className="flex items-baseline gap-2 min-w-0">
      <span
        className={classNames(
          "text-lg font-bold leading-tight transition-colors duration-200",
          isActive ? "text-primary" : "text-text-high"
        )}
      >
        {word}
      </span>
      {phonetic && (
        <span className="text-[13px] text-orange font-semibold truncate">
          {phonetic}
        </span>
      )}
    </span>
    {meaning && (
      <span
        className={classNames(
          "text-[13px] truncate",
          isActive ? "text-primary/80" : "text-grey"
        )}
      >
        {meaning}
      </span>
    )}
  </button>
);

const VocabSidebar = ({ keyword, onSelectVocab, selectedVocab }) => {
  const [vocabList, setVocabList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!keyword) {
      setVocabList([]);
      return;
    }

    const fetchVocab = async () => {
      setLoading(true);
      try {
        const response = await searchVocabList(keyword);
        const simplifiedList = (response.data || [])
          .map((item) => ({
            word: item.word,
            phonetic: (item.phonetic || []).join(" "),
            meaning: (item.meanings || [])
              .map((m) => m.meaning)
              .filter(Boolean)
              .join(", "),
          }))
          .filter((item) => item.word);

        setVocabList(simplifiedList);

        if (simplifiedList.length > 0 && onSelectVocab) {
          onSelectVocab(simplifiedList[0].word);
        }
      } catch (err) {
        console.error("Error fetching vocab:", err);
        setVocabList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVocab();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  return (
    <aside className="w-full bg-white border-[1.5px] border-[#dce8e8] rounded-[18px] shadow-[0_4px_14px_rgba(15,23,42,0.04)] p-4 max-h-[calc(100vh-48px)] flex flex-col max-[900px]:max-h-[360px]">
      <header className="flex items-center justify-between px-1.5 pb-3 mb-1.5">
        <h2 className="text-sm font-bold text-text-high m-0">Kết quả</h2>
        {vocabList.length > 0 && (
          <span className="text-xs font-semibold py-0.5 px-2.5 rounded-full bg-primary/10 text-primary">
            {vocabList.length}
          </span>
        )}
      </header>

      {loading ? (
        <div className="py-7 px-3.5 text-[13px] text-grey text-center">Đang tải...</div>
      ) : !keyword ? (
        <div className="py-7 px-3.5 text-[13px] text-grey text-center">
          Nhập từ khoá ở trên để bắt đầu tra cứu.
        </div>
      ) : vocabList.length === 0 ? (
        <div className="py-7 px-3.5 text-[13px] text-grey text-center">Không tìm thấy kết quả</div>
      ) : (
        <div className="flex flex-col gap-1 overflow-y-auto pr-1">
          {vocabList.map((item, index) => (
            <VocabItem
              key={index}
              word={item.word}
              phonetic={item.phonetic}
              meaning={item.meaning}
              isActive={item.word === selectedVocab}
              onClick={() => onSelectVocab && onSelectVocab(item.word)}
            />
          ))}
        </div>
      )}
    </aside>
  );
};

export default VocabSidebar;
