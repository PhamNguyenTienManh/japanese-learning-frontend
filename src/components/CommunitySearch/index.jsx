import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faXmark } from "@fortawesome/free-solid-svg-icons";
import classNames from "classnames/bind";
import styles from "./CommunitySearch.module.scss";

const cx = classNames.bind(styles);

function CommunitySearch({ searchQuery, onChange, onSearch }) {
  const handleKeyPress = (e) => {
    if (e.key === "Enter") onSearch();
  };

  const handleClear = () => {
    onChange({ target: { value: "" } });
  };

  return (
    <div className={cx("search-bar")} id="feed">
      <FontAwesomeIcon icon={faSearch} className={cx("search-icon")} />
      <input
        type="text"
        className={cx("search-input")}
        placeholder="Tìm bài viết, chủ đề, từ vựng..."
        value={searchQuery}
        onChange={onChange}
        onKeyPress={handleKeyPress}
      />
      {searchQuery && (
        <button
          type="button"
          className={cx("clear-btn")}
          onClick={handleClear}
          aria-label="Xoá tìm kiếm"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      )}
      <button type="button" className={cx("submit-btn")} onClick={onSearch}>
        Tìm kiếm
      </button>
    </div>
  );
}

export default CommunitySearch;
