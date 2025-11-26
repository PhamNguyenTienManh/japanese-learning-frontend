import { useState, useEffect } from "react";

const SearchInput = ({ value,onSearch, placeholder = "日本、nihon, Nhật Bản" }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showHandwriting, setShowHandwriting] = useState(false);
  const [recognizedResults, setRecognizedResults] = useState([]);
  console.log("value", value);
  useEffect(() => {
    if(value) setSearchQuery(value)
  })
  useEffect(() => {
    if (!showHandwriting) return;

    const canvas = document.getElementById('handwriting-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'black';
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let timeoutId = null;

    const getMousePos = (e) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
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
      const res = await fetch('http://127.0.0.1:5000/recognize', {
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
    <div style={{ marginBottom: '24px', position: 'relative' }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        border: `2px solid ${isFocused ? '#1976d2' : '#e0e0e0'}`,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        transition: 'border-color 0.2s',
        boxShadow: isFocused ? '0 4px 12px rgba(25, 118, 210, 0.15)' : '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, cursor: 'pointer' }} onClick={handleSearch}>
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
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: '16px',
            color: '#333',
            backgroundColor: 'transparent'
          }}
        />

        <button
          type="button"
          onClick={() => setShowHandwriting(!showHandwriting)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
            fontSize: '20px',
            flexShrink: 0,
            opacity: showHandwriting ? 1 : 0.7
          }}
        >
          ✏️
        </button>
      </div>

      {showHandwriting && (
  <div
    style={{
      backgroundColor: '#fff',
      borderRadius: '6px',
      padding: '10px',
      marginTop: '6px',
      boxShadow: '0 1px 6px rgba(0,0,0,0.1)',
      border: '1px solid #e0e0e0'
    }}
  >
    {/* Header */}
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: '12px',
          fontWeight: '600',
          color: '#333'
        }}
      >
      </h3>

      <button
        onClick={() => {
          setShowHandwriting(false);
          setRecognizedResults([]);
        }}
        style={{
          background: 'none',
          border: 'none',
          fontSize: '16px',
          cursor: 'pointer',
          color: '#999',
          padding: 0,
          lineHeight: 1
        }}
      >
        ×
      </button>
    </div>

    {/* Canvas + Xóa */}
    <div
      style={{
        display: 'flex',
        gap: '6px',
        marginBottom: '8px',
        alignItems: 'flex-start'
      }}
    >
      <div
        style={{
          flex: 1,
          border: '1px solid #ddd',
          borderRadius: '4px',
          overflow: 'hidden',
          backgroundColor: '#fff'
        }}
      >
        {/* HEIGHT GIẢM XUỐNG 100 */}
        <canvas
          id="handwriting-canvas"
          width={300}
          height={50}
          style={{
            display: 'block',
            width: '100%',
            cursor: 'crosshair'
          }}
        />
      </div>

      <button
        onClick={handleClear}
        style={{
          padding: '6px 10px',
          backgroundColor: '#fff',
          border: '1px solid #ddd',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
          color: '#666',
          whiteSpace: 'nowrap'
        }}
      >
        Xóa
      </button>
    </div>

    {/* Kết quả nhận dạng */}
    {recognizedResults.length > 0 && (
      <div>
        <h4
          style={{
            fontSize: '11px',
            fontWeight: '600',
            marginBottom: '6px',
            color: '#666'
          }}
        >
          Kết quả nhận dạng:
        </h4>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {recognizedResults.map((result, index) => (
            <button
              key={index}
              onClick={() => handleSelectKanji(result.kanji)}
              style={{
                padding: '6px 8px',
                fontSize: '18px',
                backgroundColor: '#f9f9f9',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.2s',
                minWidth: '40px'
              }}
            >
              {result.kanji}
            </button>
          ))}
        </div>
      </div>
    )}

    <div style={{ marginTop: '6px', fontSize: '11px', color: '#999' }}>
    </div>
  </div>
)}

    </div>
  );
};

export default SearchInput;