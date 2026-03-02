import Card from "~/components/Card";
import Button from "~/components/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import classNames from "classnames/bind";
import styles from "./PostList.module.scss";

import PostCard from "../PostCard/PostCard";
import Pagination from "../Pagination/Pagination";

const cx = classNames.bind(styles);

function PostList({ posts, loading, error, currentPage, totalPages, activeTab, selectedCategory, onPageChange, onRetry }) {
  if (loading) {
    return (
      <div className={cx("loading")}>
        <FontAwesomeIcon icon={faSpinner} spin size="2x" />
        <p>Đang tải...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={cx("error-card")}>
        <p className={cx("error-message")}>{error}</p>
        <Button outline onClick={onRetry}>Thử lại</Button>
      </Card>
    );
  }

  if (!posts.data || posts.data.length === 0) {
    return (
      <Card className={cx("empty-card")}>
        <p className={cx("empty-message")}>Không tìm thấy bài viết nào</p>
      </Card>
    );
  }

  return (
    <>
      {posts.data.map((post) => (
        <PostCard
          key={post._id || post.id}
          post={post}
          commentCount={posts.countComment?.find((x) => x._id === post._id)?.totalComment || 0}
        />
      ))}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </>
  );
}

export default PostList;
