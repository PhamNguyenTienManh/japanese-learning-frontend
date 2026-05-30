import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faXmark } from "@fortawesome/free-solid-svg-icons";

function CommunitySearch({ searchQuery, onChange, onSearch }) {
  const handleKeyPress = (e) => {
    if (e.key === "Enter") onSearch();
  };

  const handleClear = () => {
    onChange({ target: { value: "" } });
  };

  return (
    <div
      className="relative flex items-center gap-2 rounded-full border border-border bg-white py-2 pl-[18px] pr-2 shadow-[0_4px_14px_rgba(15,23,42,0.04)] transition focus-within:border-primary focus-within:shadow-[0_0_0_4px_rgba(0,135,154,0.12)] max-[520px]:pl-3.5"
      id="feed"
    >
      <FontAwesomeIcon icon={faSearch} className="shrink-0 text-base text-grey" />
      <input
        type="text"
        className="min-w-0 flex-1 border-0 bg-transparent px-1 py-2.5 text-[15px] text-text-high outline-none placeholder:text-grey"
        placeholder="Tìm bài viết, chủ đề, từ vựng..."
        value={searchQuery}
        onChange={onChange}
        onKeyPress={handleKeyPress}
      />
      {searchQuery && (
        <button
          type="button"
          className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-black/[0.04] text-grey transition hover:bg-black/[0.08] hover:text-text-high"
          onClick={handleClear}
          aria-label="Xoá tìm kiếm"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      )}
      <button
        type="button"
        className="shrink-0 cursor-pointer rounded-full border-0 bg-[linear-gradient(135deg,var(--primary)_0%,var(--primary-hover)_100%)] px-[22px] py-2.5 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(0,135,154,0.25)] transition hover:-translate-y-px hover:brightness-105 hover:shadow-[0_6px_16px_rgba(0,135,154,0.35)] max-[520px]:px-3.5 max-[520px]:text-[13px]"
        onClick={onSearch}
      >
        Tìm kiếm
      </button>
    </div>
  );
}

export default CommunitySearch;
