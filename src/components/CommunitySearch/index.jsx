import Card from "~/components/Card";
import Button from "~/components/Button";
import Input from "~/components/Input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import classNames from "classnames/bind";
import styles from "./CommunitySearch.module.scss";

const cx = classNames.bind(styles);

function CommunitySearch({ searchQuery, onChange, onSearch }) {
  const handleKeyPress = (e) => {
    if (e.key === "Enter") onSearch();
  };

  return (
    <Card className={cx("search-card")}>
      <div className={cx("search-row")}>
        <div className={cx("search-input-wrap")}>
          <FontAwesomeIcon icon={faSearch} className={cx("search-icon")} />
          <Input
            placeholder="Tìm kiếm bài viết..."
            className="community-search-input"
            value={searchQuery}
            onChange={onChange}
            onKeyPress={handleKeyPress}
          />
        </div>
        <Button outline className="orange" onClick={onSearch}>
          Tìm kiếm
        </Button>
      </div>
    </Card>
  );
}

export default CommunitySearch;
