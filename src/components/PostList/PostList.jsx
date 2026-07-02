import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

import PostCard from "../PostCard/PostCard";
import Pagination from "../Pagination/Pagination";

function PostList({ posts, loading, error, currentPage, totalPages, onPageChange, onRetry, onCommentClick }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-5 py-14 text-primary">
        <FontAwesomeIcon icon={faSpinner} spin size="2x" />
        <p className="m-0 text-sm text-on-surface-variant">Đang tải bài viết...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-6 py-12 text-center">
        <p className="m-0 text-sm text-error">{error}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 border border-outline-variant rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!posts.data || posts.data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-6 py-12 text-center">
        <p className="m-0 text-sm text-on-surface-variant">
          Chưa có bài viết nào ở đây, hãy là người đầu tiên chia sẻ nhé!
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
          onCommentClick={onCommentClick}
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
