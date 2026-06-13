import { useState, useEffect, useRef } from "react";
import HandwritingOverlay from "~/components/HandwritingOverlay";
import { searchKanjiList } from "~/services/kanjiService";
import { searchVocabList } from "~/services/vocabService";

const getSuggestionKeyword = (item, suggestionType) => suggestionType === 'vocab' ? item.word : item.kanji;

const getSuggestionTitle = (item, suggestionType) => suggestionType === 'vocab' ? item.word : item.kanji;

const getSuggestionDescription = (item, suggestionType) => {
  if (suggestionType === 'vocab') {
    return (item.meanings || [])
      .map((meaning) => meaning.meaning)
      .filter(Boolean)
      .join(', ') || 'Chưa có nghĩa';
  }

  return item.mean || 'Chưa có nghĩa';
};

const getSuggestionMeta = (item, suggestionType) => {
  if (suggestionType === 'vocab') {
    return [item.level, ...(item.phonetic || [])].filter(Boolean).join(' · ');
  }

  return [item.level, item.on, item.kun].filter(Boolean).join(' · ');
};

const SearchInput = ({ value, onSearch, placeholder = "日本、nihon, Nhật Bản", suggestionType = 'kanji' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showHandwriting, setShowHandwriting] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [submittedQuery, setSubmittedQuery] = useState('');
  const suggestionRefs = useRef([]);
  const trimmedQuery = searchQuery.trim();
  const shouldShowSuggestions = isFocused && trimmedQuery && trimmedQuery !== submittedQuery && (suggestionLoading || suggestions.length > 0);

  useEffect(() => {
    setSearchQuery(value || '');
  }, [value]);

  useEffect(() => {
    setSuggestions([]);
    setSuggestionLoading(false);
    setActiveSuggestionIndex(-1);
    setSubmittedQuery('');
  }, [suggestionType]);

  useEffect(() => {
    const keyword = searchQuery.trim();
    setActiveSuggestionIndex(-1);

    if (!keyword || keyword === submittedQuery) {
      setSuggestions([]);
      setSuggestionLoading(false);
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setSuggestionLoading(true);
      try {
        const response = suggestionType === 'vocab'
          ? await searchVocabList(keyword, 6)
          : await searchKanjiList(keyword, 6);
        if (cancelled) return;

        setSuggestions((response.data || []).filter((item) => getSuggestionKeyword(item, suggestionType)));
      } catch (error) {
        if (!cancelled) {
          setSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setSuggestionLoading(false);
        }
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, suggestionType, submittedQuery]);

  useEffect(() => {
    if (activeSuggestionIndex < 0) return;

    suggestionRefs.current[activeSuggestionIndex]?.scrollIntoView({
      block: 'nearest',
    });
  }, [activeSuggestionIndex]);

  const handleSearch = (nextQuery = searchQuery) => {
    const value = String(nextQuery || '').trim();
    if (onSearch && value) {
      setSubmittedQuery(value);
      onSearch(value);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown' && suggestions.length > 0) {
      e.preventDefault();
      setActiveSuggestionIndex((currentIndex) => currentIndex < suggestions.length - 1 ? currentIndex + 1 : 0);
      return;
    }

    if (e.key === 'ArrowUp' && suggestions.length > 0) {
      e.preventDefault();
      setActiveSuggestionIndex((currentIndex) => currentIndex > 0 ? currentIndex - 1 : suggestions.length - 1);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) {
        handleSelectSuggestion(suggestions[activeSuggestionIndex]);
      } else {
        handleSearch();
        setShowHandwriting(false);
        setSuggestions([]);
      }
    }
  };

  const handleApplyHandwriting = (text) => {
    const value = String(text || '').trim();
    if (!value) return;

    setSearchQuery(value);
    handleSearch(value);
    setShowHandwriting(false);
    setSuggestions([]);
    setActiveSuggestionIndex(-1);
  };

  const handleSelectSuggestion = (item) => {
    const nextKeyword = getSuggestionKeyword(item, suggestionType);
    setSearchQuery(nextKeyword);
    setSuggestions([]);
    setActiveSuggestionIndex(-1);
    setShowHandwriting(false);
    handleSearch(nextKeyword);
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
          onChange={(e) => {
            setSubmittedQuery('');
            setSearchQuery(e.target.value);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 120)}
          onKeyDown={handleKeyDown}
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

      {shouldShowSuggestions && (
        <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-30 overflow-hidden rounded-2xl border border-border bg-white shadow-[0_14px_36px_rgba(15,23,42,0.14)]">
          {suggestionLoading ? (
            <div className="px-4 py-3 text-sm text-grey">Đang tìm gợi ý...</div>
          ) : (
            <div className="max-h-[320px] overflow-y-auto py-2">
              {suggestions.map((item, index) => {
                const title = getSuggestionTitle(item, suggestionType);
                const meta = getSuggestionMeta(item, suggestionType);
                const isActive = index === activeSuggestionIndex;

                return (
                  <button
                    key={item.mobileId || item._id || title}
                    ref={(element) => { suggestionRefs.current[index] = element; }}
                    type="button"
                    className={`flex w-full cursor-pointer items-center gap-3 border-0 px-4 py-3 text-left transition-colors duration-150 ${isActive ? 'bg-primary/[0.10]' : 'bg-transparent hover:bg-primary/[0.06]'}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setActiveSuggestionIndex(index)}
                    onClick={() => handleSelectSuggestion(item)}
                  >
                    <span className={suggestionType === 'vocab'
                      ? `min-w-[80px] max-w-[180px] truncate text-base font-bold leading-tight ${isActive ? 'text-primary' : 'text-text-high'}`
                      : `min-w-[36px] text-2xl font-bold leading-none ${isActive ? 'text-primary' : 'text-text-high'}`
                    }>
                      {title}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-sm font-semibold ${isActive ? 'text-primary' : 'text-text-high'}`}>{getSuggestionDescription(item, suggestionType)}</span>
                      {meta && <span className="mt-1 block truncate text-xs text-grey">{meta}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

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
