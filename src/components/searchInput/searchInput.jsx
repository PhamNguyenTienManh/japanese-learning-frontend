import { useState, useEffect } from "react";

const SearchInput = ({ onSearch, placeholder = "日本、nihon, Nhật Bản" }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showHandwriting, setShowHandwriting] = useState(false);
  const [recognizedResults, setRecognizedResults] = useState([]);

  useEffect(() => {
    if (!showHandwriting) return;

    const canvas = document.getElementById('handwriting-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    ctx.lineWidth = 3;
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
    setShowHandwriting(false);
    setRecognizedResults([]);
    if (onSearch) {
      onSearch(kanji);
    }
  };

  return (
    <div style={{ marginBottom: '24px' }}>
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
          onClick={() => setShowHandwriting(true)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
            fontSize: '20px',
            flexShrink: 0
          }}
        >
          ✏️
        </button>
      </div>

      {showHandwriting && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Viết kanji tại đây</h3>
              <button
                onClick={() => {
                  setShowHandwriting(false);
                  setRecognizedResults([]);
                }}
                style={{ background: 'none', border: 'none', fontSize: '32px', cursor: 'pointer', color: '#666' }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'center' }}>
              <div style={{ flex: 1, border: '2px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
                <canvas id="handwriting-canvas" width={400} height={200} style={{ display: 'block', width: '100%', cursor: 'crosshair' }} />
              </div>
              <button onClick={handleClear} style={{
                padding: '12px 24px',
                backgroundColor: '#f5f5f5',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}>
                Xóa
              </button>
            </div>

            {recognizedResults.length > 0 && (
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Kết quả nhận dạng:</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {recognizedResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectKanji(result.kanji)}
                      style={{
                        padding: '16px 24px',
                        fontSize: '32px',
                        backgroundColor: '#f5f5f5',
                        border: '2px solid #e0e0e0',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      {result.kanji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchInput;
