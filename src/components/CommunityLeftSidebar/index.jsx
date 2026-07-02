function CommunityLeftSidebar({ categories, selectedCategory, onCategoryClick }) {
  return (
    <aside className="w-64 lg:w-72 flex-shrink-0 bg-surface-container-lowest border-r border-outline-variant/30 h-[calc(100vh-64px)] sticky top-[64px] flex flex-col z-20">
      <div className="flex-1 overflow-y-auto pt-6 flex flex-col gap-6">
        <div className="px-4">
          <div className="relative">
            <input
              className="w-full pl-9 pr-3 py-2 bg-surface-container hover:bg-surface-container-high focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary border border-outline-variant/30 focus:border-primary rounded-lg text-xs text-on-surface transition-all"
              placeholder="Tìm bài viết..."
              type="text"
            />
          </div>
        </div>

        <div className="px-4">
          <h3 className="text-xs font-medium text-outline px-3 mb-3 uppercase tracking-wider">Danh mục</h3>
          <div className="flex flex-col gap-1">
            {categories.map((category) => {
              const isActive =
                selectedCategory === category.name ||
                selectedCategory === category._id;
              return (
                <button
                  key={category.name}
                  type="button"
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-left text-sm transition-colors border-0 bg-transparent cursor-pointer ${
                    isActive
                      ? "bg-surface-container-high text-on-surface font-semibold"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                  onClick={() => onCategoryClick(category._id || category.name)}
                >
                  <span>{category.name}</span>
                  <span className={`text-xs py-0.5 px-2 rounded-full ${
                    isActive
                      ? "bg-surface-container-highest text-on-surface-variant"
                      : "bg-surface-container text-on-surface-variant"
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
