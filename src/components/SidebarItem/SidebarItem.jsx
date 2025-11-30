import { useState, useEffect } from "react";

const SidebarItem = ({ kanji, hanviet, isActive, onClick }) => (
  <div
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      padding: '12px 16px',
      cursor: 'pointer',
      borderRadius: '8px',
      marginBottom: '4px',
      backgroundColor: isActive ? '#e3f2fd' : 'transparent',
      transition: 'background-color 0.2s'
    }}
  >
    <span style={{ fontSize: '24px', color: '#1976d2', fontWeight: 'bold', marginRight: '12px', minWidth: '30px' }}>
      {kanji}
    </span>
    <span style={{ fontSize: '15px', color: '#333', fontWeight: isActive ? '600' : '400' }}>
      {hanviet}
    </span>
  </div>
);

const Sidebar = ({ keyword, onSelectKanji, selectedKanji }) => {
  const [kanjiList, setKanjiList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!keyword) return;

    const fetchKanji = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://api.jdict.net/api/v1/search?keyword=${encodeURIComponent(keyword)}&keyword_position=start&page=1&type=kanji`
        );
        const data = await res.json();
        const simplifiedList = data.list.map(item => ({
          kanji: item.kanji,
          hanviet: item.hanviet
        }));
        setKanjiList(simplifiedList);

        if (simplifiedList.length > 0 && onSelectKanji) {
          onSelectKanji(simplifiedList[0].kanji);
        }
      } catch (err) {
        console.error(err);
        setKanjiList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchKanji();
  }, [keyword]);

  return (
    <div style={{
      width: '280px',
      backgroundColor: '#fff',
      borderRight: '1px solid #e0e0e0',
      overflowY: 'auto',
      padding: '20px 16px'
    }}>
      <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '16px', padding: '0 8px' }}>
        Kết quả tra kanji
      </h2>

      {loading ? (
        <div style={{ padding: '10px' }}>Đang tải...</div>
      ) : (
        <div>
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
    </div>
  );
};
export default Sidebar;
