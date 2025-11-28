import classNames from "classnames/bind";
import styles from "./categorySelection.module.scss";

const cx = classNames.bind(styles);

function CategorySelector({ categories, value, onChange, disabled }) {
  return (
    <div className={cx("field")}>
      <span className={cx("label")}>
        Danh mục <span className={cx("required")}>*</span>
      </span>

      <div className={cx("category-list")}>
        {categories.map((cat) => (
          <button
            key={cat._id}
            type="button"
            onClick={() => onChange(cat._id)}
            className={cx("category-item", {
              active: value === cat._id,
            })}
            disabled={disabled}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default CategorySelector;
