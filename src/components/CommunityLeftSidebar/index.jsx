import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faXmark } from "@fortawesome/free-solid-svg-icons";

function CommunityLeftSidebar({
  categories,
  selectedCategory,
  onCategoryClick,
  searchQuery,
  onSearchQueryChange,
  onSearchSubmit,
}) {
  const handleSubmit = (event) => {
    event.preventDefault();
    onSearchSubmit();
  };

  return (
    <aside className="w-64 lg:w-72 flex-shrink-0 bg-surface-container-lowest border-r border-outline-variant/30 h-[calc(100vh-64px)] sticky top-[64px] flex flex-col z-20">
      <div className="flex-1 overflow-y-auto pt-6 flex flex-col gap-6">
        <div className="px-4">
          <form className="relative" onSubmit={handleSubmit}>
            <span className="pointer-events-none absolute inset-y-0 left-3 flex w-4 items-center justify-center text-outline">
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="block h-3.5 w-3.5 -translate-y-px"
              />
            </span>
            <input
              className="w-full pl-10 pr-9 py-2 bg-surface-container hover:bg-surface-container-high focus:bg-surface-container-high focus:ring-2 focus:ring-primary/25 focus:outline-none border border-outline-variant/30 focus:border-primary rounded-lg text-xs text-on-surface transition-all placeholder:text-outline"
              placeholder="Tìm bài viết..."
              type="text"
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
            />
            {searchQuery && (
              <span className="absolute inset-y-0 right-2 flex items-center justify-center">
                <button
                  type="button"
                  className="flex h-[18px] w-[18px] cursor-pointer items-center justify-center rounded-full border-0 bg-surface-container-lowest/70 p-0 text-outline transition-colors hover:bg-surface-container-high hover:text-on-surface"
                  onClick={() => onSearchQueryChange("")}
                  aria-label="Xóa tìm kiếm"
                >
                  <FontAwesomeIcon icon={faXmark} className="block h-2 w-2" />
                </button>
              </span>
            )}
          </form>
        </div>

        <div className="px-4">
          <div className="mb-3 flex items-center justify-between px-2">
            <h3 className="m-0 text-xs font-bold text-outline uppercase tracking-wider">Danh mục</h3>
            <span className="rounded-full bg-surface-container px-2 py-0.5 text-[11px] font-bold text-on-surface-variant">
              {categories.length}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {categories.map((category) => {
              const isActive =
                selectedCategory === category.name ||
                selectedCategory === category._id;
              return (
                <button
                  key={category.name}
                  type="button"
                  className={`group flex min-h-10 items-center justify-between w-full px-3 py-2 rounded-lg text-left text-sm transition-all border-0 cursor-pointer ${
                    isActive
                      ? "bg-primary/10 text-primary font-bold shadow-[inset_3px_0_0_var(--primary)]"
                      : "bg-transparent text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  }`}
                  onClick={() => onCategoryClick(category._id || category.name)}
                >
                  <span className="truncate pr-3">{category.name}</span>
                  <span className={`text-xs py-0.5 px-2 rounded-full ${
                    isActive
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container text-on-surface-variant group-hover:bg-surface-container-highest"
                  }`}>
                    {category.count ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}

export default CommunityLeftSidebar;
