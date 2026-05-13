import { useState, useEffect } from "react";
import classNames from "classnames/bind";
import kantanService from "../../services/kantanService";
import styles from "./sidebarItem.module.scss";

const cx = classNames.bind(styles);

const SidebarItem = ({ kanji, hanviet, isActive, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cx("sidebar-item", { active: isActive })}
  >
    <span className={cx("kanji-char")}>{kanji}</span>
    <span className={cx("meaning")}>{hanviet}</span>
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
        const response = await kantanService.searchKanji({
          keyword: keyword,
          pageIndex: 1,
          level: 0,
          strokeNumber: 0
        });

        if (response.success && response.data && response.data.success && response.data.data) {
          const simplifiedList = response.data.data.map(item => ({
            kanji: item.character,
            hanviet: item.meaning
          }));
          setKanjiList(simplifiedList);

          if (simplifiedList.length > 0 && onSelectKanji) {
            onSelectKanji(simplifiedList[0].kanji);
          }
        } else {
          setKanjiList([]);
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
    <aside className={cx("sidebar")}>
      <header className={cx("sidebar-head")}>
        <h2 className={cx("sidebar-title")}>Kết quả</h2>
        {kanjiList.length > 0 && (
          <span className={cx("count-pill")}>{kanjiList.length}</span>
        )}
      </header>

      {loading ? (
        <div className={cx("empty-state")}>Đang tải...</div>
      ) : !keyword ? (
        <div className={cx("empty-state")}>
          Nhập từ khoá ở trên để bắt đầu tra cứu.
        </div>
      ) : kanjiList.length === 0 ? (
        <div className={cx("empty-state")}>Không tìm thấy kết quả</div>
      ) : (
        <div className={cx("list")}>
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
