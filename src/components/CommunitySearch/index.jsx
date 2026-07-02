function CommunitySearch({ searchQuery, onChange, onSearch }) {
  const handleKeyPress = (e) => {
    if (e.key === "Enter") onSearch();
  };

  const handleClear = () => {
    onChange({ target: { value: "" } });
  };

  return (
    <div className="relative w-full">
      <span className="material-symbols-outlined text-outline absolute left-3 top-1/2 -translate-y-1/2">search</span>
      <input
        className="w-full pl-10 pr-4 py-2 bg-surface-container hover:bg-surface-container-high focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:outline-none border border-transparent focus:border-primary rounded-lg text-base text-on-surface transition-all"
        placeholder="Tìm bài viết, chủ đề, từ vựng..."
        type="text"
        value={searchQuery}
        onChange={onChange}
        onKeyPress={handleKeyPress}
      />
      {searchQuery && (
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-1 rounded-full transition-colors"
          onClick={handleClear}
          aria-label="Xoá tìm kiếm"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
      )}
    </div>
  );
}

export default CommunitySearch;
