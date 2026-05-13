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
        <p>Đang tải bài viết...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cx("error-card")}>
        <p className={cx("error-message")}>{error}</p>
        <Button outline onClick={onRetry}>Thử lại</Button>
      </div>
    );
  }

  if (!posts.data || posts.data.length === 0) {
    return (
      <div className={cx("empty-card")}>
        <p className={cx("empty-message")}>
          Chưa có bài viết nào ở đây — hãy là người đầu tiên chia sẻ nhé!
        </p>
      </div>
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
