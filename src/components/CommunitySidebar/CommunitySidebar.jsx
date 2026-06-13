const TRENDING_TAGS = ["#N3", "#Kanji", "#Mẹo học", "#JLPT", "#Ngữ pháp", "#Hội thoại"];

const GUIDELINES = [
  "Tôn trọng mọi thành viên",
  "Không spam hoặc quảng cáo",
  "Chia sẻ nội dung hữu ích, đúng chủ đề",
  "Sử dụng ngôn ngữ lịch sự, thân thiện",
];

const sideCardClass =
  "rounded-[18px] border border-border bg-white p-5 shadow-[0_4px_14px_rgba(15,23,42,0.04)]";

function CommunitySidebar({ categories, selectedCategory, onCategoryClick }) {
  return (
    <aside className="sticky top-[88px] flex flex-col gap-4 max-lg:static">
      <section className={sideCardClass}>
        <h3 className="m-0 mb-3.5 text-[15px] font-bold text-text-high">Danh mục</h3>
        <div className="flex flex-col gap-1">
          {categories.map((category) => {
            const isActive = selectedCategory === category.name;
            return (
              <button
                key={category.name}
                type="button"
                className={[
                  "group flex w-full cursor-pointer items-center justify-between rounded-xl border-0 px-3 py-2.5 text-left text-text-high transition hover:translate-x-0.5 hover:bg-primary/[0.06]",
                  isActive
                    ? "bg-[linear-gradient(90deg,rgba(0,135,154,0.14),rgba(0,135,154,0.04))] font-semibold text-primary"
                    : "bg-transparent",
                ].join(" ")}
                onClick={() => onCategoryClick(category._id || category.name)}
              >
                <span className="text-sm">{category.name}</span>
                <span
                  className={[
                    "rounded-full px-2.5 py-0.5 text-xs font-semibold transition",
                    isActive ? "bg-primary text-white" : "bg-black/[0.05] text-grey",
                  ].join(" ")}
                >
                  {category.count ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className={sideCardClass}>
        <h3 className="m-0 mb-3.5 text-[15px] font-bold text-text-high">Thẻ thịnh hành</h3>
        <div className="flex flex-wrap gap-2">
          {TRENDING_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              className="cursor-pointer rounded-full border-0 bg-primary/[0.08] px-3 py-1.5 text-[13px] font-medium text-primary transition hover:-translate-y-px hover:bg-primary hover:text-white"
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      <section className={sideCardClass}>
        <h3 className="m-0 mb-3.5 text-[15px] font-bold text-text-high">Quy tắc cộng đồng</h3>
        <ul className="m-0 flex list-disc flex-col gap-2 pl-[18px] text-grey-low marker:text-primary">
          {GUIDELINES.map((rule) => (
            <li key={rule} className="text-[13px] leading-[1.55]">
              {rule}
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}

export default CommunitySidebar;
