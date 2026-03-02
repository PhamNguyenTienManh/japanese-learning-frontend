import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import classNames from "classnames/bind";
import styles from "./AdminPostsFilters.module.scss";
import Card from "~/components/Card";
import Input from "~/components/Input";

const cx = classNames.bind(styles);

function AdminPostsFilters({ searchQuery, categoryFilter, categories, onSearchChange, onCategoryChange }) {
  return (
    <Card className={cx("filterCard")}>
      <div className={cx("filterRow")}>
        <div className={cx("searchWrapper")}>
          <FontAwesomeIcon icon={faMagnifyingGlass} className={cx("searchIcon")} />
          <Input
            placeholder="Tìm kiếm bài viết..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={cx("searchInput")}
          />
        </div>
        <div className={cx("selectGroup")}>
          <select
            className={cx("select")}
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Card>
  );
}

export default AdminPostsFilters;
