import { useState, useEffect } from "react";
import HandwritingOverlay from "~/components/HandwritingOverlay";

const SearchInput = ({ value, onSearch, placeholder = "日本、nihon, Nhật Bản" }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showHandwriting, setShowHandwriting] = useState(false);

  useEffect(() => {
    setSearchQuery(value || '');
  }, [value]);

  const handleSearch = (nextQuery = searchQuery) => {
    const value = String(nextQuery || '').trim();
    if (onSearch && value) {
      onSearch(value);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
      setShowHandwriting(false);
    }
  };

  const handleApplyHandwriting = (text) => {
    const value = String(text || '').trim();
    if (!value) return;

    setSearchQuery(value);
    handleSearch(value);
    setShowHandwriting(false);
  };

  return (
    <div className="relative w-full">
      <div className={`flex items-center gap-2.5 rounded-full border bg-white py-2 pr-2 pl-[18px] shadow-[0_4px_14px_rgba(15,23,42,0.04)] transition-[border-color,box-shadow] duration-200 ${isFocused
        ? "border-primary shadow-[0_0_0_4px_rgba(0,135,154,0.12)]"
        : "border-border"
        }`}>
        <svg
          className="shrink-0 cursor-pointer text-grey transition-colors duration-200 hover:text-primary"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          onClick={() => handleSearch()}
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
          className="min-w-0 flex-1 border-0 bg-transparent px-1 py-2 text-[15px] text-text-high outline-none placeholder:text-grey"
        />

        <button
          type="button"
          onClick={() => setShowHandwriting(true)}
          className={`inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-sm font-semibold transition-colors duration-200 hover:bg-primary/10 hover:text-primary ${showHandwriting
            ? "bg-primary text-white hover:bg-primary hover:text-white"
            : "bg-transparent text-grey"
            }`}
          title="Viết tay"
          aria-label="Viết tay"
        >
          手
        </button>

        <button
          type="button"
          className="shrink-0 cursor-pointer rounded-full bg-[linear-gradient(135deg,var(--primary)_0%,var(--primary-hover)_100%)] px-[22px] py-2.5 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(0,135,154,0.25)] transition-[transform,filter,box-shadow] duration-200 hover:-translate-y-px hover:brightness-105 hover:shadow-[0_6px_16px_rgba(0,135,154,0.35)]"
          onClick={() => handleSearch()}
        >
          Tìm kiếm
        </button>
      </div>

      <HandwritingOverlay
        open={showHandwriting}
        onClose={() => setShowHandwriting(false)}
        onApply={handleApplyHandwriting}
        primaryLabel="Tìm kiếm"
      />
    </div>
  );
};

export default SearchInput;
