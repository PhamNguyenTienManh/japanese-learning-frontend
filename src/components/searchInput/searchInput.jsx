import { useState, useEffect } from "react";
import classNames from "classnames/bind";
import styles from "./searchInput.module.scss";

const cx = classNames.bind(styles);

const SearchInput = ({ value, onSearch, placeholder = "日本、nihon, Nhật Bản" }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showHandwriting, setShowHandwriting] = useState(false);
  const [recognizedResults, setRecognizedResults] = useState([]);

  useEffect(() => {
    if (value) setSearchQuery(value);
  }, [value]);

  useEffect(() => {
    if (!showHandwriting) return;

    const canvas = document.getElementById('handwriting-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1f2937';
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let timeoutId = null;

    const getMousePos = (e) => {
      const r = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - r.left) * scaleX,
        y: (e.clientY - r.top) * scaleY,
      };
    };

    const startDrawing = (e) => {
      isDrawing = true;
      const pos = getMousePos(e);
      lastX = pos.x;
      lastY = pos.y;
    };

    const draw = (e) => {
      if (!isDrawing) return;
      const pos = getMousePos(e);
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastX = pos.x;
      lastY = pos.y;

      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(handleRecognize, 500);
    };

    const stopDrawing = () => {
      isDrawing = false;
    };

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseout', stopDrawing);
    };
  }, [showHandwriting]);

  const handleSearch = () => {
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
      setShowHandwriting(false);
    }
  };

  const handleClear = () => {
    const canvas = document.getElementById('handwriting-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setRecognizedResults([]);
  };

  const handleRecognize = async () => {
    const canvas = document.getElementById('handwriting-canvas');
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');

    try {
      const res = await fetch(process.env.REACT_APP_OCR_RECOGNIZE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      });
      const results = await res.json();
      setRecognizedResults(results);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectKanji = (kanji) => {
    setSearchQuery(kanji);
    setRecognizedResults([]);
  };

  return (
    <div className={cx("search-wrap")}>
      <div className={cx("search-bar", { focused: isFocused })}>
        <svg
          className={cx("search-icon")}
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          onClick={handleSearch}
        >
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className={cx("search-input")}
        />

        <button
          type="button"
          onClick={() => setShowHandwriting(!showHandwriting)}
          className={cx("handwriting-toggle", { active: showHandwriting })}
          title="Viết tay"
        >
          手
        </button>

        <button type="button" className={cx("submit-btn")} onClick={handleSearch}>
          Tìm kiếm
        </button>
      </div>

      {showHandwriting && (
        <div className={cx("handwriting-drawer")}>
          <div className={cx("drawer-head")}>
            <h3 className={cx("drawer-title")}>Viết kanji vào ô bên dưới</h3>
            <button
              type="button"
              className={cx("drawer-close")}
              onClick={() => {
                setShowHandwriting(false);
                setRecognizedResults([]);
              }}
            >
              ×
            </button>
          </div>

          <div className={cx("canvas-row")}>
            <div className={cx("canvas-box")}>
              <canvas
                id="handwriting-canvas"
                width={500}
                height={100}
                className={cx("canvas")}
              />
            </div>

            <button type="button" onClick={handleClear} className={cx("clear-btn")}>
              Xoá
            </button>
          </div>

          {recognizedResults.length > 0 && (
            <div>
              <h4 className={cx("results-title")}>Kết quả nhận dạng</h4>
              <div className={cx("results-grid")}>
                {recognizedResults.map((result, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectKanji(result.kanji)}
                    className={cx("result-btn")}
                  >
                    {result.kanji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchInput;
