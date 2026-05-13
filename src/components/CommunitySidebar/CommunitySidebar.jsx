import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLayerGroup,
  faFire,
  faShieldHeart,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import classNames from "classnames/bind";
import styles from "./CommunitySidebar.module.scss";

const cx = classNames.bind(styles);

const TRENDING_TAGS = ["#N3", "#Kanji", "#Mẹo học", "#JLPT", "#Ngữ pháp", "#Hội thoại"];

const GUIDELINES = [
  "Tôn trọng mọi thành viên",
  "Không spam hoặc quảng cáo",
  "Chia sẻ nội dung hữu ích, đúng chủ đề",
  "Sử dụng ngôn ngữ lịch sự, thân thiện",
];

function CommunitySidebar({ categories, selectedCategory, onCategoryClick }) {
  return (
    <aside className={cx("sidebar")}>
      <section className={cx("side-card")}>
        <div className={cx("side-head")}>
          <span className={cx("side-icon", "teal")}>
            <FontAwesomeIcon icon={faLayerGroup} />
          </span>
          <h3 className={cx("side-title")}>Danh mục</h3>
        </div>
        <div className={cx("categories-list")}>
          {categories.map((category) => {
            const isActive = selectedCategory === category.name;
            return (
              <button
                key={category.name}
                type="button"
                className={cx("category-item", { active: isActive })}
                onClick={() => onCategoryClick(category._id || category.name)}
              >
                <span className={cx("category-name")}>{category.name}</span>
                <span className={cx("category-count")}>{category.count ?? 0}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className={cx("side-card")}>
        <div className={cx("side-head")}>
          <span className={cx("side-icon", "orange")}>
            <FontAwesomeIcon icon={faFire} />
          </span>
          <h3 className={cx("side-title")}>Thẻ thịnh hành</h3>
        </div>
        <div className={cx("tags-wrap")}>
          {TRENDING_TAGS.map((tag) => (
            <button key={tag} type="button" className={cx("tag-chip")}>
              {tag}
            </button>
          ))}
        </div>
      </section>

      <section className={cx("side-card", "rules-card")}>
        <div className={cx("side-head")}>
          <span className={cx("side-icon", "rose")}>
            <FontAwesomeIcon icon={faShieldHeart} />
          </span>
          <h3 className={cx("side-title")}>Quy tắc cộng đồng</h3>
        </div>
        <ul className={cx("guidelines")}>
          {GUIDELINES.map((rule) => (
            <li key={rule}>
              <FontAwesomeIcon icon={faCheck} className={cx("rule-icon")} />
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}

export default CommunitySidebar;
