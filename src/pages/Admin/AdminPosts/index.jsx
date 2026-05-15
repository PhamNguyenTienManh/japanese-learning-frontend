import { useState, useEffect } from "react";
import classNames from "classnames/bind";
import { motion } from "framer-motion";
import styles from "./AdminPosts.module.scss";

import Card from "~/components/Card";
import postService from "~/services/postService";
import notificationService from "~/services/notificationService";
import UserHeader from "~/components/UserHeader/UserHeader";
import AdminPostsFilters from "~/components/AdminPostFilter/AdminPostsFilters";
import AdminPostCard from "~/components/AdminPostCard/AdminPostCard";

const cx = classNames.bind(styles);

const easeOut = [0.22, 1, 0.36, 1];

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
          data = await postService.getPosts(page, 50);
        }
        setPosts(data.data.data || []);
        setCountComment(data.data.countComment);
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
      <motion.div
        className={cx("blob1")}
        animate={{ y: [0, -22, 0], x: [0, 12, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className={cx("blob2")}
        animate={{ y: [0, 18, 0], x: [0, -14, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />

      <main className={cx("main")}>
        <div className={cx("inner")}>
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOut }}
          >
            <UserHeader
              filteredCount={filteredPosts.length}
              total={totalPosts}
              page="bài viết"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOut, delay: 0.1 }}
          >
            <AdminPostsFilters
              searchQuery={searchQuery}
              categoryFilter={categoryFilter}
              categories={categories}
              onSearchChange={setSearchQuery}
              onCategoryChange={setCategoryFilter}
            />
          </motion.div>

          {loading && (
            <Card className={cx("loadingCard")}>
              <div className={cx("loadingRing")} />
              <p className={cx("emptyText")}>Đang tải dữ liệu...</p>
            </Card>
          )}

          {!loading && (
            <motion.div
              className={cx("list")}
              initial="hidden"
              animate={filteredPosts.length > 0 ? "show" : "hidden"}
              variants={{
                hidden: {},
                show: {
                  transition: { staggerChildren: 0.06, delayChildren: 0.05 },
                },
              }}
            >
              {filteredPosts.map((post) => (
                <motion.div
                  key={post._id}
                  variants={{
                    hidden: { opacity: 0, y: 18 },
                    show: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.45, ease: easeOut },
                    },
                  }}
                >
                  <AdminPostCard
                    post={post}
                    commentCount={
                      countComment.find((x) => x._id === post._id)
                        ?.totalComment || 0
                    }
                    onDelete={handleDeletePost}
                  />
                </motion.div>
              ))}

              {filteredPosts.length === 0 && (
                <Card className={cx("emptyCard")}>
                  <p className={cx("emptyText")}>
                    Không tìm thấy bài viết nào phù hợp
                  </p>
                </Card>
              )}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminPosts;
