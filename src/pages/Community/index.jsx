import { useState, useEffect } from "react";
import classNames from "classnames/bind";
import styles from "./Community.module.scss";
import Tabs, { TabsList, TabsTrigger, TabsContent } from "~/components/Tabs";

import postService from "~/services/postService";
import CommunityHeader from "~/components/CommunityHeader";
import CommunityStats from "~/components/CommunityStats";
import CommunitySearch from "~/components/CommunitySearch";
import CommunitySidebar from "~/components/CommunitySidebar/CommunitySidebar";
import PostList from "~/components/PostList/PostList";

const cx = classNames.bind(styles);

function decodeToken(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
}

function Community() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [stats, setStats] = useState({
    totalPosts: 234,
    totalMembers: "1.2K",
    totalLikes: "3.4K",
    totalViews: "12K",
  });
  const [categories, setCategories] = useState([]);

  const getLoggedInUserId = () => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = decodeToken(token);
      return decoded?.sub;
    }
    return null;
  };

  const currentUserId = getLoggedInUserId();

  const fetchPosts = async (page, sort = "popular", category = null) => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (category && category !== "Tất cả") {
        data = await postService.getPostsByCategory(category, page, 5);
      } else {
        data = await postService.getPosts(page, 5, sort);
      }

      const postsData = data.posts || data.data || data;
      const mappedPosts = {
        ...postsData,
        data: postsData.data?.map((post) => {
          const likedArray = Array.isArray(post.liked) ? post.liked : [];
          return {
            ...post,
            likeCount: likedArray.length,
            isLiked: likedArray.includes(currentUserId),
          };
        }) || [],
      };

      setPosts(mappedPosts);
      setTotalPages(data.data.totalPage || 1);
      setCurrentPage(page);
    } catch (err) {
      setError("Không thể tải bài viết. Vui lòng thử lại sau.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await postService.getCommunityStats();
      setStats({
        totalPosts: data.data.totalPosts || 234,
        totalMembers: data.data.totalMembers || "6",
        totalLikes: data.data.totalLikes || "0",
        totalViews: data.data.totalViews || "16",
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await postService.getCategories();
      const allCategories = [
        { name: "Tất cả", count: data.reduce((sum, cat) => sum + (cat.count || 0), 0) },
        ...data,
      ];
      setCategories(allCategories);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setCategories([
        { name: "Tất cả", count: 234 },
        { name: "Ngữ pháp", count: 89 },
        { name: "Từ vựng", count: 67 },
        { name: "Kanji", count: 45 },
        { name: "Tài liệu", count: 23 },
        { name: "Kinh nghiệm", count: 10 },
      ]);
    }
  };

  useEffect(() => {
    fetchPosts(1, "popular");
    fetchStats();
    fetchCategories();
  }, []);

  const handleTabChange = (value) => {
    setActiveTab(value);
    setSelectedCategory(null);
    setSearchQuery("");
    fetchPosts(1, value === "all" ? "popular" : "recent");
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSelectedCategory(null);
      fetchPosts(1, activeTab === "all" ? "popular" : "recent");
      return;
    }

    setLoading(true);
    setError(null);
    setSelectedCategory(null);
    try {
      const data = await postService.searchPosts(searchQuery, 1, 5);
      const postsData = data.posts || data.data || data;
      const mappedPosts = {
        ...postsData,
        data: postsData.data?.map((post) => {
          const likedArray = Array.isArray(post.liked) ? post.liked : [];
          return {
            ...post,
            likeCount: likedArray.length,
            isLiked: likedArray.includes(currentUserId),
          };
        }) || [],
      };
      setPosts(mappedPosts);
      setTotalPages(data.data.totalPage || 1);
      setCurrentPage(1);
    } catch (err) {
      setError("Không thể tìm kiếm. Vui lòng thử lại sau.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryName) => {
    setSearchQuery("");
    setSelectedCategory(categoryName);
    const sort = activeTab === "all" ? "popular" : "recent";
    if (categoryName === "Tất cả") {
      fetchPosts(1, sort, null);
    } else {
      fetchPosts(1, sort, categoryName);
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      const sort = activeTab === "all" ? "popular" : "recent";
      fetchPosts(page, sort, selectedCategory);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleRetry = () => {
    fetchPosts(null, activeTab === "all" ? "popular" : "recent", selectedCategory);
  };

  return (
    <div className={cx("wrapper")}>
      <main className={cx("main")}>
        <div className={cx("container")}>
          <CommunityHeader />
          <CommunityStats stats={stats} />

          <div className={cx("content")}>
            <div className={cx("main-col")}>
              <CommunitySearch
                searchQuery={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onSearch={handleSearch}
              />

              <Tabs active={activeTab} onChange={handleTabChange}>
                <TabsList>
                  <TabsTrigger value="all">Phổ biến</TabsTrigger>
                  <TabsTrigger value="recent">Mới nhất</TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                  <div className={cx("tabs-content")}>
                    <PostList
                      posts={posts}
                      loading={loading}
                      error={error}
                      currentPage={currentPage}
                      totalPages={totalPages}
                      activeTab={activeTab}
                      selectedCategory={selectedCategory}
                      onPageChange={handlePageChange}
                      onRetry={handleRetry}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="recent">
                  <div className={cx("tabs-content")}>
                    <PostList
                      posts={posts}
                      loading={loading}
                      error={error}
                      currentPage={currentPage}
                      totalPages={totalPages}
                      activeTab={activeTab}
                      selectedCategory={selectedCategory}
                      onPageChange={handlePageChange}
                      onRetry={handleRetry}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <CommunitySidebar
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryClick={handleCategoryClick}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default Community;
