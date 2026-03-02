import { useState, useEffect } from "react";
import classNames from "classnames/bind";
import styles from "./AdminPosts.module.scss";

import Card from "~/components/Card";
import postService from "~/services/postService";
import notificationService from "~/services/notificationService";
import UserHeader from "~/components/UserHeader/UserHeader";
import AdminPostsFilters from "~/components/AdminPostFilter/AdminPostsFilters";
import AdminPostCard from "~/components/AdminPostCard/AdminPostCard";


const cx = classNames.bind(styles);

function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [countComment, setCountComment] = useState([]);


  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await postService.getCategories();
        setCategories(data || []);
      } catch (err) {
        console.error("Error loading categories:", err);
      }
    };
    fetchCategories();
  }, []);


  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        let data;
        if (searchQuery.trim()) {
          data = await postService.searchPosts(searchQuery, page, 50);
        } else if (categoryFilter !== "all") {
          data = await postService.getPostsByCategory(categoryFilter, page, 50);
        } else {
            console.log("cccccccc", categoryFilter);
            
          data = await postService.getPosts(page, 50);
        }
        setPosts(data.data.data || []);
        setCountComment(data.data.countComment);
        console.log("cccccccccc", data);
        
        setTotalPosts(data.data?.total || 0);
      } catch (err) {
        console.error("Error loading posts:", err);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchPosts, searchQuery ? 500 : 0);
    return () => clearTimeout(timer);
  }, [searchQuery, categoryFilter, page]);


  const handleDeletePost = async (postId, title, targetUserId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này?")) return;
    try {
      await postService.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setTotalPosts((prev) => prev - 1);
      alert("Xóa bài viết thành công!");
      try {
        await notificationService.pushNotification({
          userId: targetUserId,
          targetId: postId,
          title: "Bài viết vi phạm",
          message: "Admin đã xoá bài viết vì vi phạm tiêu chuẩn cộng đồng: " + title,
        });
      } catch (err) {
        console.error("Error pushing notification:", err);
      }
    } catch (err) {
      console.error("Error deleting post:", err);
      alert("Có lỗi xảy ra khi xóa bài viết!");
    }
  };


  const filteredPosts = posts;


  return (
    <div className={cx("wrapper")}>
      <main className={cx("main")}>
        <div className={cx("inner")}>
          <UserHeader
            filteredCount={filteredPosts.length}
            total={totalPosts}
            page='bài viết'
          />

          <AdminPostsFilters
            searchQuery={searchQuery}
            categoryFilter={categoryFilter}
            categories={categories}
            onSearchChange={setSearchQuery}
            onCategoryChange={setCategoryFilter}
          />

          {loading && (
            <Card className={cx("emptyCard")}>
              <p className={cx("emptyText")}>Đang tải dữ liệu...</p>
            </Card>
          )}

          {!loading && (
            <div className={cx("list")}>
              {filteredPosts.map((post) => (
                <AdminPostCard
                  key={post._id}
                  post={post}
                  commentCount={countComment.find((x) => x._id === post._id)?.totalComment || 0}
                  onDelete={handleDeletePost}
                />
              ))}

              {filteredPosts.length === 0 && (
                <Card className={cx("emptyCard")}>
                  <p className={cx("emptyText")}>Không tìm thấy bài viết nào phù hợp</p>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminPosts;