import { useState, useEffect } from "react";
import classNames from "classnames";
import { searchKanjiList } from "~/services/kanjiService";

const SidebarItem = ({ kanji, hanviet, isActive, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={classNames(
      "group flex items-center gap-3 py-2.5 px-3 rounded-xl border-none cursor-pointer text-left transition-[background,transform] duration-200 ease-out",
      isActive
        ? "bg-gradient-to-r from-primary/[0.16] to-primary/[0.04]"
        : "bg-transparent hover:bg-primary/[0.06] hover:translate-x-0.5"
    )}
  >
    <span
      className={classNames(
        "text-[26px] font-bold min-w-[32px] leading-none transition-colors duration-200",
        isActive ? "text-primary" : "text-text-high"
      )}
    >
      {kanji}
    </span>
    <span
      className={classNames(
        "text-sm flex-1 min-w-0",
        isActive ? "text-primary font-semibold" : "text-text-high"
      )}
    >
      {hanviet}
    </span>
  </button>
);

const Sidebar = ({ keyword, onSelectKanji, selectedKanji }) => {
  const [kanjiList, setKanjiList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!keyword) return;

    const fetchKanji = async () => {
      setLoading(true);
      try {
        const response = await searchKanjiList(keyword);
        const simplifiedList = (response.data || [])
          .map((item) => ({
            kanji: item.kanji,
            hanviet: item.mean || item.hanviet || item.meaning || "",
          }))
          .filter((item) => item.kanji);

        setKanjiList(simplifiedList);

        if (simplifiedList.length > 0 && onSelectKanji) {
          onSelectKanji(simplifiedList[0].kanji);
        }
      } catch (err) {
        console.error('Error fetching kanji:', err);
        setKanjiList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchKanji();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  return (
    <aside className="sticky top-6 w-full bg-white border border-border rounded-2xl shadow-[0_4px_14px_rgba(15,23,42,0.04)] p-4 max-h-[calc(100vh-48px)] flex flex-col max-[900px]:static max-[900px]:max-h-[360px]">
      <header className="flex items-center justify-between px-1.5 pb-3 mb-1.5">
        <h2 className="text-sm font-bold text-text-high m-0">Kết quả</h2>
        {kanjiList.length > 0 && (
          <span className="text-xs font-semibold py-0.5 px-2.5 rounded-full bg-primary/10 text-primary">
            {kanjiList.length}
          </span>
        )}
      </header>

      {loading ? (
        <div className="py-7 px-3.5 text-[13px] text-grey text-center">Đang tải...</div>
      ) : !keyword ? (
        <div className="py-7 px-3.5 text-[13px] text-grey text-center">
          Nhập từ khoá ở trên để bắt đầu tra cứu.
        </div>
      ) : kanjiList.length === 0 ? (
        <div className="py-7 px-3.5 text-[13px] text-grey text-center">Không tìm thấy kết quả</div>
      ) : (
        <div className="flex flex-col gap-1 overflow-y-auto pr-1">
          {kanjiList.map((item, index) => (
            <SidebarItem
              key={index}
              kanji={item.kanji}
              hanviet={item.hanviet}
              isActive={item.kanji === selectedKanji}
              onClick={() => onSelectKanji && onSelectKanji(item.kanji)}
            />
          ))}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
