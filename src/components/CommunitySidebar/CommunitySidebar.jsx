import Card from "~/components/Card";
import classNames from "classnames/bind";
import styles from "./CommunitySidebar.module.scss";

const cx = classNames.bind(styles);

function CommunitySidebar({ categories, selectedCategory, onCategoryClick }) {
  return (
    <aside className={cx("sidebar")}>
      <Card className={cx("side-card")}>
        <h3 className={cx("side-title")}>Danh mục</h3>
        <div className={cx("categories-list")}>
          {categories.map((category) => (
            <button
              key={category.name}
              type="button"
              className={cx("category-item", {
                active: selectedCategory === category.name,
              })}
              onClick={() => onCategoryClick(category._id)}
            >
              <span className={cx("category-name")}>{category.name}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card className={cx("side-card")}>
        <h3 className={cx("side-title")}>Quy tắc cộng đồng</h3>
        <ul className={cx("guidelines")}>
          <li>• Tôn trọng mọi thành viên</li>
          <li>• Không spam hoặc quảng cáo</li>
          <li>• Chia sẻ nội dung hữu ích</li>
          <li>• Sử dụng ngôn ngữ lịch sự</li>
        </ul>
      </Card>
    </aside>
  );
}

export default CommunitySidebar;
